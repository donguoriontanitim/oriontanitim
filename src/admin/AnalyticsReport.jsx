import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  Loader2,
  MessageCircle,
  MonitorSmartphone,
  Phone,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fallbackContent } from '../fallbackContent.js'
import {
  ctaLabelByType,
  getCtaClick,
  getFaqInteraction,
  getPartnerClickId,
  isConversionEvent,
  isCtaClickEvent,
  isFaqInteractionEvent,
  isPartnerClickEvent,
  partnerLabelById,
  sectionLabelById,
  trackedSections,
} from '../lib/analytics.js'
import { downloadHtmlFile, escapeHtml } from '../lib/htmlExport.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const analyticsSelect =
  'id,session_id,event_type,section_id,path,referrer,device_type,viewport_width,viewport_height,duration_ms,user_agent,created_at'
const faqItemsSelect = 'id,question,sort_order,is_active'

const analyticsFetchPageSize = 1000
const journeyPageSize = 10

const defaultFilters = {
  conversion: 'all',
  dateFrom: '',
  dateTo: '',
  device: 'all',
  eventType: 'all',
  sessionSearch: '',
  source: 'all',
}

const deviceLabels = {
  desktop: 'Masaüstü',
  mobile: 'Mobil',
  tablet: 'Tablet',
  unknown: 'Bilinmiyor',
}

const eventFilterOptions = [
  { value: 'all', label: 'Tüm olaylar' },
  { value: 'page_view', label: 'Sayfa görüntüleme' },
  { value: 'section_view', label: 'Bölüm süresi' },
  { value: 'cta_click', label: 'CTA tıklaması' },
  { value: 'conversion', label: 'Dönüşüm olayı' },
  { value: 'partner_click', label: 'Logo/Instagram' },
  { value: 'faq', label: 'SSS' },
]

const sectionOrder = new Map(trackedSections.map((section, index) => [section.id, index]))

const clampPercent = (value) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

const formatPercent = (value = 0) =>
  `${clampPercent(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`

const formatCountPercent = (count = 0, total = 0) =>
  total > 0 ? `${count} - ${formatPercent((count / total) * 100)}` : `${count} - %0`

const formatDuration = (durationMs = 0) => {
  const totalSeconds = Math.max(0, Math.round(Number(durationMs || 0) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds} sn`
  }

  return `${minutes} dk ${seconds} sn`
}

const formatDateTime = (dateValue) => {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const getDateTimeValue = (dateValue) => {
  const parsedDate = Date.parse(dateValue || '')

  return Number.isNaN(parsedDate) ? 0 : parsedDate
}

const removeDuplicateDesktopPageViews = (analyticsEvents = []) => {
  const seenDesktopSessions = new Set()

  return analyticsEvents.filter((event) => {
    const isDesktopPageView =
      event.event_type === 'page_view' && event.device_type === 'desktop' && event.session_id

    if (!isDesktopPageView) {
      return true
    }

    if (seenDesktopSessions.has(event.session_id)) {
      return false
    }

    seenDesktopSessions.add(event.session_id)
    return true
  })
}

const getSourceLabel = (referrer = '') => {
  if (!referrer) {
    return 'Doğrudan'
  }

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')

    if (/google|bing|yandex|duckduckgo/i.test(host)) {
      return 'Arama motoru'
    }

    if (/instagram|facebook|tiktok|youtube/i.test(host)) {
      return 'Sosyal medya'
    }

    if (/github\.io|github\.com/i.test(host)) {
      return 'GitHub Pages'
    }

    return host
  } catch {
    return 'Bilinmiyor'
  }
}

const getSectionIdFromPath = (path = '') => {
  const normalizedPath = String(path || '').replace(/^#?\//, '').split(/[?#]/)[0]

  return sectionLabelById[normalizedPath] ? normalizedPath : ''
}

const getEventFilterKey = (event) => {
  if (isConversionEvent(event)) {
    return 'conversion'
  }

  if (isCtaClickEvent(event)) {
    return 'cta_click'
  }

  if (isPartnerClickEvent(event)) {
    return 'partner_click'
  }

  if (isFaqInteractionEvent(event)) {
    return 'faq'
  }

  return event.event_type || 'unknown'
}

const getEventTypeLabel = (event) => {
  const ctaClick = getCtaClick(event)

  if (ctaClick) {
    return ctaLabelByType[ctaClick.type] || 'CTA tıklaması'
  }

  const faqInteraction = getFaqInteraction(event)

  if (faqInteraction) {
    return faqInteraction.action === 'close' ? 'SSS kapandı' : 'SSS açıldı'
  }

  if (isPartnerClickEvent(event)) {
    return 'Logo/Instagram tıklaması'
  }

  if (event.event_type === 'page_view') {
    return 'Sayfa görüntüleme'
  }

  if (event.event_type === 'section_view') {
    return 'Bölüm süresi'
  }

  return event.event_type || 'Bilinmiyor'
}

const getEventDetailLabel = (event, faqLabelById = {}) => {
  const ctaClick = getCtaClick(event)

  if (ctaClick) {
    const sourceLabel = sectionLabelById[ctaClick.sourceSection] || ctaClick.sourceSection || 'Bilinmiyor'
    const targetLabel = ctaClick.target ? ` → ${ctaClick.target}` : ''

    return `${ctaLabelByType[ctaClick.type] || ctaClick.type}${targetLabel} (${sourceLabel})`
  }

  const faqInteraction = getFaqInteraction(event)

  if (faqInteraction) {
    return faqLabelById[faqInteraction.faqId] || faqInteraction.faqId
  }

  const partnerClickId = getPartnerClickId(event)

  if (partnerClickId) {
    return partnerLabelById[partnerClickId] || partnerClickId
  }

  if (event.event_type === 'section_view') {
    return sectionLabelById[event.section_id] || event.section_id || '-'
  }

  return event.section_id ? sectionLabelById[event.section_id] || event.section_id : event.path || '-'
}

const sortByCreatedAtAsc = (first, second) =>
  getDateTimeValue(first.created_at) - getDateTimeValue(second.created_at)

const sortByCreatedAtDesc = (first, second) =>
  getDateTimeValue(second.created_at) - getDateTimeValue(first.created_at)

const addSectionToSequence = (sequence, sectionId) => {
  if (!sectionId || !sectionLabelById[sectionId]) {
    return
  }

  if (sequence[sequence.length - 1] !== sectionId) {
    sequence.push(sectionId)
  }
}

const getSessionSections = (sessionEvents = []) => {
  const sequence = []

  sessionEvents.forEach((event) => {
    const ctaClick = getCtaClick(event)
    const faqInteraction = getFaqInteraction(event)

    if (event.event_type === 'page_view') {
      addSectionToSequence(sequence, getSectionIdFromPath(event.path) || 'hero')
    } else if (ctaClick) {
      addSectionToSequence(sequence, ctaClick.sourceSection)
    } else if (faqInteraction) {
      addSectionToSequence(sequence, 'sss')
    } else if (event.event_type === 'section_view' && !isPartnerClickEvent(event)) {
      addSectionToSequence(sequence, event.section_id)
    }
  })

  return sequence
}

const getInterestLabel = ({ averageDuration = 0, views = 0 }) => {
  if (views <= 0) {
    return 'Kritik düşük'
  }

  if (averageDuration >= 20000 || views >= 12) {
    return 'Yüksek ilgi'
  }

  if (averageDuration >= 9000 || views >= 5) {
    return 'Orta ilgi'
  }

  return 'Düşük ilgi'
}

const getInterestClassName = (label) => {
  if (label === 'Yüksek ilgi') {
    return 'bg-[#ecfdf5] text-[#047857]'
  }

  if (label === 'Orta ilgi') {
    return 'bg-[#eff6ff] text-[#1d4ed8]'
  }

  if (label === 'Kritik düşük') {
    return 'bg-[#fff1f2] text-[#be123c]'
  }

  return 'bg-[#fff7ed] text-[#c2410c]'
}

const isDateInFilter = (dateValue, filters) => {
  const eventDate = getDateTimeValue(dateValue)

  if (!eventDate) {
    return false
  }

  if (filters.dateFrom) {
    const fromDate = new Date(`${filters.dateFrom}T00:00:00`).getTime()

    if (eventDate < fromDate) {
      return false
    }
  }

  if (filters.dateTo) {
    const toDate = new Date(`${filters.dateTo}T23:59:59.999`).getTime()

    if (eventDate > toDate) {
      return false
    }
  }

  return true
}

const createSessionSummaries = (events = [], faqLabelById = {}) => {
  const groupedSessions = events.reduce((sessions, event) => {
    const sessionId = event.session_id || `log-${event.id || event.created_at}`

    if (!sessions[sessionId]) {
      sessions[sessionId] = []
    }

    sessions[sessionId].push(event)

    return sessions
  }, {})

  return Object.entries(groupedSessions)
    .map(([sessionId, sessionEvents]) => {
      const sortedEvents = [...sessionEvents].sort(sortByCreatedAtAsc)
      const firstEvent = sortedEvents[0] || {}
      const lastEvent = sortedEvents[sortedEvents.length - 1] || {}
      const sectionEvents = sortedEvents.filter(
        (event) =>
          event.event_type === 'section_view' &&
          !isPartnerClickEvent(event) &&
          !isFaqInteractionEvent(event) &&
          !isCtaClickEvent(event),
      )
      const totalDuration = sectionEvents.reduce(
        (sum, event) => sum + Number(event.duration_ms || 0),
        0,
      )
      const sections = getSessionSections(sortedEvents)
      const conversionEvents = sortedEvents.filter(isConversionEvent)
      const ctaEvents = sortedEvents.filter(isCtaClickEvent)

      return {
        converted: conversionEvents.length > 0,
        ctaCount: ctaEvents.length,
        device: firstEvent.device_type || 'unknown',
        events: sortedEvents,
        eventTypes: [...new Set(sortedEvents.map(getEventFilterKey))],
        firstAt: firstEvent.created_at || '',
        lastAction: getEventTypeLabel(lastEvent),
        lastAt: lastEvent.created_at || '',
        lastDetail: getEventDetailLabel(lastEvent, faqLabelById),
        screen: `${firstEvent.viewport_width || '-'}x${firstEvent.viewport_height || '-'}`,
        sectionLabels: sections.map((sectionId) => sectionLabelById[sectionId] || sectionId),
        sections,
        sessionId,
        source: getSourceLabel(firstEvent.referrer),
        totalDuration,
      }
    })
    .sort((first, second) => getDateTimeValue(second.lastAt) - getDateTimeValue(first.lastAt))
}

const filterSessions = (sessions = [], filters = defaultFilters) =>
  sessions.filter((session) => {
    if (
      (filters.dateFrom || filters.dateTo) &&
      !session.events.some((event) => isDateInFilter(event.created_at, filters))
    ) {
      return false
    }

    if (filters.device !== 'all' && session.device !== filters.device) {
      return false
    }

    if (filters.source !== 'all' && session.source !== filters.source) {
      return false
    }

    if (filters.eventType !== 'all') {
      const hasMatchingEvent =
        filters.eventType === 'conversion'
          ? session.converted
          : session.eventTypes.includes(filters.eventType)

      if (!hasMatchingEvent) {
        return false
      }
    }

    if (filters.conversion === 'converted' && !session.converted) {
      return false
    }

    if (filters.conversion === 'not_converted' && session.converted) {
      return false
    }

    if (
      filters.sessionSearch &&
      !session.sessionId.toLowerCase().includes(filters.sessionSearch.trim().toLowerCase())
    ) {
      return false
    }

    return true
  })

const createSectionPerformance = ({ ctaClicks, sectionViews, sessions }) => {
  const sectionStatsById = trackedSections.reduce((stats, section) => {
    stats[section.id] = {
      averageDuration: 0,
      ctaClicks: 0,
      exitCount: 0,
      exitRate: 0,
      id: section.id,
      interestLabel: 'Kritik düşük',
      label: section.label,
      sessionCount: 0,
      totalDuration: 0,
      views: 0,
    }

    return stats
  }, {})

  sectionViews.forEach((event) => {
    const sectionId = event.section_id || 'unknown'

    if (!sectionStatsById[sectionId]) {
      sectionStatsById[sectionId] = {
        averageDuration: 0,
        ctaClicks: 0,
        exitCount: 0,
        exitRate: 0,
        id: sectionId,
        interestLabel: 'Kritik düşük',
        label: sectionLabelById[sectionId] || sectionId,
        sessionCount: 0,
        totalDuration: 0,
        views: 0,
      }
    }

    sectionStatsById[sectionId].totalDuration += Number(event.duration_ms || 0)
    sectionStatsById[sectionId].views += 1
  })

  ctaClicks.forEach((event) => {
    const ctaClick = getCtaClick(event)

    if (ctaClick?.sourceSection && sectionStatsById[ctaClick.sourceSection]) {
      sectionStatsById[ctaClick.sourceSection].ctaClicks += 1
    }
  })

  sessions.forEach((session) => {
    const uniqueSessionSections = [...new Set(session.sections)]
    const lastSection = session.sections[session.sections.length - 1]

    uniqueSessionSections.forEach((sectionId) => {
      if (sectionStatsById[sectionId]) {
        sectionStatsById[sectionId].sessionCount += 1
      }
    })

    if (sectionStatsById[lastSection]) {
      sectionStatsById[lastSection].exitCount += 1
    }
  })

  return Object.values(sectionStatsById)
    .map((section) => {
      const averageDuration = section.views > 0 ? section.totalDuration / section.views : 0
      const exitRate =
        section.sessionCount > 0 ? (section.exitCount / section.sessionCount) * 100 : 0

      return {
        ...section,
        averageDuration,
        exitRate,
        interestLabel: getInterestLabel({ averageDuration, views: section.views }),
      }
    })
    .sort((first, second) => {
      const firstOrder = sectionOrder.get(first.id) ?? 999
      const secondOrder = sectionOrder.get(second.id) ?? 999

      return firstOrder - secondOrder
    })
}

const createDeviceStats = (sessions = []) => {
  const totalSessions = sessions.length
  const counts = sessions.reduce(
    (stats, session) => ({
      ...stats,
      [session.device]: (stats[session.device] || 0) + 1,
    }),
    { desktop: 0, mobile: 0, tablet: 0 },
  )

  return ['mobile', 'desktop', 'tablet'].map((deviceId) => ({
    count: counts[deviceId] || 0,
    id: deviceId,
    label: deviceLabels[deviceId] || deviceId,
    percent: totalSessions > 0 ? ((counts[deviceId] || 0) / totalSessions) * 100 : 0,
  }))
}

const createPartnerStats = (partnerClicks = []) =>
  Object.values(
    partnerClicks.reduce((stats, event) => {
      const partnerId = getPartnerClickId(event) || 'unknown'

      if (!stats[partnerId]) {
        stats[partnerId] = {
          count: 0,
          id: partnerId,
          label: partnerLabelById[partnerId] || partnerId,
          priority: partnerId === 'site-logo' ? 'Düşük öncelikli gezinme' : 'Sosyal medya yönelimi',
        }
      }

      stats[partnerId].count += 1

      return stats
    }, {}),
  ).sort((first, second) => second.count - first.count)

const createCtaStats = (ctaClicks = []) =>
  Object.values(
    ctaClicks.reduce((stats, event) => {
      const ctaClick = getCtaClick(event)
      const key = ctaClick?.type || 'unknown'

      if (!stats[key]) {
        stats[key] = {
          count: 0,
          id: key,
          label: ctaLabelByType[key] || key,
        }
      }

      stats[key].count += 1

      return stats
    }, {}),
  ).sort((first, second) => second.count - first.count)

const createFaqStats = ({ activeFaqItems, faqInteractions, sessions }) => {
  const faqStatsById = activeFaqItems.reduce((stats, faq) => {
    const id = faq.id || faq.question

    stats[id] = {
      afterWhatsappCount: 0,
      afterWhatsappSessionIds: new Set(),
      closeCount: 0,
      id,
      lastOpenedAt: '',
      openCount: 0,
      opened: false,
      question: faq.question,
      sortOrder: Number(faq.sort_order || 0),
    }

    return stats
  }, {})

  faqInteractions.forEach((event) => {
    const interaction = getFaqInteraction(event)

    if (!interaction) {
      return
    }

    if (!faqStatsById[interaction.faqId]) {
      faqStatsById[interaction.faqId] = {
        afterWhatsappCount: 0,
        afterWhatsappSessionIds: new Set(),
        closeCount: 0,
        id: interaction.faqId,
        lastOpenedAt: '',
        openCount: 0,
        opened: false,
        question: interaction.faqId,
        sortOrder: 999,
      }
    }

    if (interaction.action === 'close') {
      faqStatsById[interaction.faqId].closeCount += 1
      return
    }

    const currentLastOpened = getDateTimeValue(faqStatsById[interaction.faqId].lastOpenedAt)
    const eventDate = getDateTimeValue(event.created_at)

    faqStatsById[interaction.faqId].openCount += 1
    faqStatsById[interaction.faqId].opened = true

    if (!faqStatsById[interaction.faqId].lastOpenedAt || eventDate > currentLastOpened) {
      faqStatsById[interaction.faqId].lastOpenedAt = event.created_at
    }
  })

  sessions.forEach((session) => {
    session.events.forEach((event, index) => {
      const interaction = getFaqInteraction(event)

      if (!interaction || interaction.action !== 'open') {
        return
      }

      const hasWhatsappAfterOpen = session.events
        .slice(index + 1)
        .some((nextEvent) => getCtaClick(nextEvent)?.type === 'whatsapp')

      if (hasWhatsappAfterOpen && faqStatsById[interaction.faqId]) {
        faqStatsById[interaction.faqId].afterWhatsappSessionIds.add(session.sessionId)
      }
    })
  })

  return Object.values(faqStatsById)
    .map((faq) => ({
      ...faq,
      afterWhatsappCount: faq.afterWhatsappSessionIds.size,
      afterWhatsappSessionIds: undefined,
    }))
    .sort((first, second) => {
      if (first.opened !== second.opened) {
        return Number(second.opened) - Number(first.opened)
      }

      return first.sortOrder - second.sortOrder
    })
}

const createWarnings = ({ conversionRate, ctaClicks, faqStats, sectionPerformance, sessions }) => {
  const warnings = []
  const totalFaqOpenCount = faqStats.reduce((sum, faq) => sum + faq.openCount, 0)
  const highExitSection = sectionPerformance
    .filter((section) => section.sessionCount >= 2)
    .sort((first, second) => second.exitRate - first.exitRate)[0]

  if (faqStats.length > 0 && totalFaqOpenCount === 0) {
    warnings.push({
      tone: 'danger',
      title: 'SSS hiç açılmamış',
      text: 'SSS alanı görünür değil, ilgi çekmiyor veya takip kodu yeni devreye alındı olabilir.',
    })
  } else if (faqStats.length > 0 && faqStats.filter((faq) => faq.opened).length / faqStats.length < 0.25) {
    warnings.push({
      tone: 'warning',
      title: 'SSS açılımı düşük',
      text: 'Velilerin soru alanına ulaşması için SSS bloğu daha yukarı alınabilir veya görsel vurgu artırılabilir.',
    })
  }

  if (sessions.length >= 5 && ctaClicks.length / sessions.length < 0.08) {
    warnings.push({
      tone: 'warning',
      title: 'CTA tıklaması düşük',
      text: 'Bilgi Al, WhatsApp ve telefon butonları mobilde daha görünür hale getirilmeli.',
    })
  }

  if (highExitSection?.exitRate >= 65) {
    warnings.push({
      tone: 'danger',
      title: 'Çıkış oranı yüksek',
      text: `${highExitSection.label} bölümünde çıkış oranı ${formatPercent(
        highExitSection.exitRate,
      )}. Bu bölümden sonra daha güçlü bir yönlendirme eklenebilir.`,
    })
  }

  if (sessions.length >= 5 && conversionRate < 3) {
    warnings.push({
      tone: 'warning',
      title: 'Dönüşüm oranı düşük',
      text: 'WhatsApp/telefon/form aksiyonları ziyaretçi sayısına göre zayıf kalıyor.',
    })
  }

  return warnings
}

const createRecommendations = (report) => {
  const recommendations = []
  const mobileDevice = report.deviceStats.find((device) => device.id === 'mobile')
  const contactSection = report.sectionPerformance.find((section) => section.id === 'iletisim')
  const gallerySection = report.sectionPerformance.find((section) => section.id === 'galeri')
  const totalFaqOpenCount = report.faqStats.reduce((sum, faq) => sum + faq.openCount, 0)

  if ((mobileDevice?.percent || 0) >= 70) {
    recommendations.push('Mobil kullanıcı oranı yüksek olduğu için WhatsApp ve arama butonları mobilde ilk ekranda daha baskın kullanılmalı.')
  }

  if (totalFaqOpenCount === 0) {
    recommendations.push('SSS alanı hiç kullanılmamış; alan daha yukarı taşınmalı veya soru başlıkları daha dikkat çekici hale getirilmeli.')
  }

  if ((contactSection?.averageDuration || 0) >= 12000 && report.conversionCount === 0) {
    recommendations.push('İletişim bölümünde vakit geçiriliyor ama dönüşüm yok; WhatsApp ve telefon butonlarının metni güçlendirilmeli.')
  }

  if (gallerySection && gallerySection.averageDuration < 6000) {
    recommendations.push('Galeri süresi düşük; kamp atmosferini daha net gösteren görseller ve daha güçlü başlıklar denenmeli.')
  }

  if (report.partnerClicks.length > report.conversionCount && report.conversionCount === 0) {
    recommendations.push('Instagram/logo tıklamaları var ancak doğrudan başvuru aksiyonu zayıf; sosyal medya akışından tekrar WhatsApp’a yönlendirme kurgulanmalı.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Veriler dengeli görünüyor; kamp kayıt sürecini güçlendirmek için en çok ilgi gören bölüme ek CTA yerleştirilebilir.')
  }

  return recommendations
}

const createExecutiveSummary = (report) => {
  const mobileDevice = report.deviceStats.find((device) => device.id === 'mobile')
  const totalFaqOpenCount = report.faqStats.reduce((sum, faq) => sum + faq.openCount, 0)

  return {
    generalComment:
      report.uniqueVisitors > 0
        ? `${report.uniqueVisitors} tekil oturum içinde ${report.conversionCount} doğrudan dönüşüm sinyali ölçüldü.`
        : 'Henüz anlamlı ziyaret verisi oluşmadı.',
    logoComment:
      report.partnerClicks.length > 0
        ? `${report.partnerClicks.length} logo/Instagram tıklaması sosyal medya ilgisini gösteriyor.`
        : 'Logo/Instagram tıklaması henüz ölçülmedi.',
    mobileComment: `Mobil kullanım oranı ${formatPercent(mobileDevice?.percent || 0)}.`,
    strongestSection: report.topSection?.label || 'Henüz ölçülmedi',
    weakestSection: report.weakSection?.label || 'Henüz ölçülmedi',
    faqComment:
      totalFaqOpenCount > 0
        ? `SSS alanı ${totalFaqOpenCount} kez açıldı; velilerin soru davranışı takip ediliyor.`
        : 'SSS alanı henüz açılmamış görünüyor.',
  }
}

const createAnalyticsReportHtml = (report, filters) => {
  const summary = createExecutiveSummary(report)
  const generatedAt = formatDateTime(new Date().toISOString())
  const scopeLabel =
    filters.dateFrom || filters.dateTo
      ? `${filters.dateFrom || 'Başlangıç'} - ${filters.dateTo || 'Bugün'}`
      : 'Tüm kayıtlar'
  const hiddenDuplicateNote =
    report.hiddenDesktopDuplicatePageViews > 0
      ? `${report.hiddenDesktopDuplicatePageViews} aynı oturum masaüstü tekrarı rapordan çıkarıldı.`
      : 'Aynı oturum masaüstü tekrarı çıkarılmadı veya tekrar yok.'
  const totalDeviceCount = report.deviceStats.reduce((sum, device) => sum + device.count, 0)

  const cardRows = [
    ['Tekil oturum', report.uniqueVisitors],
    ['Sayfa görüntüleme', report.pageViews.length],
    ['Mobil oranı', formatPercent(report.deviceStats.find((device) => device.id === 'mobile')?.percent || 0)],
    ['Masaüstü oranı', formatPercent(report.deviceStats.find((device) => device.id === 'desktop')?.percent || 0)],
    ['Tablet oranı', formatPercent(report.deviceStats.find((device) => device.id === 'tablet')?.percent || 0)],
    ['WhatsApp tıklaması', report.whatsappClicks.length],
    ['Telefon tıklaması', report.phoneClicks.length],
    ['Tahmini dönüşüm oranı', formatPercent(report.conversionRate)],
    ['En çok süre geçirilen bölüm', report.topDurationSection?.label || 'Henüz ölçülmedi'],
    ['En çok ölçüm alan bölüm', report.topMeasuredSection?.label || 'Henüz ölçülmedi'],
    ['En düşük ilgi gören bölüm', report.weakSection?.label || 'Henüz ölçülmedi'],
  ]

  const deviceRows = report.deviceStats
    .map(
      (device) => `
        <tr>
          <td>${escapeHtml(device.label)}</td>
          <td>${device.count}</td>
          <td>${escapeHtml(formatPercent(device.percent))}</td>
          <td><span class="bar"><span style="width:${clampPercent(device.percent)}%"></span></span></td>
        </tr>
      `,
    )
    .join('')

  const sectionRows = report.sectionPerformance
    .map(
      (section) => `
        <tr>
          <td>${escapeHtml(section.label)}</td>
          <td>${section.views}</td>
          <td>${escapeHtml(formatDuration(section.totalDuration))}</td>
          <td>${escapeHtml(formatDuration(section.averageDuration))}</td>
          <td>${section.ctaClicks}</td>
          <td>${escapeHtml(formatPercent(section.exitRate))}</td>
          <td><span class="pill">${escapeHtml(section.interestLabel)}</span></td>
        </tr>
      `,
    )
    .join('')

  const partnerRows = report.partnerClickStats
    .map(
      (partner) => `
        <tr>
          <td>${escapeHtml(partner.label)}</td>
          <td>${partner.count}</td>
          <td>${escapeHtml(partner.priority)}</td>
        </tr>
      `,
    )
    .join('')

  const faqRows = report.faqStats
    .map(
      (faq) => `
        <tr>
          <td>${escapeHtml(faq.question)}</td>
          <td>${faq.openCount}</td>
          <td>${faq.closeCount}</td>
          <td>${faq.afterWhatsappCount > 0 ? `Var (${faq.afterWhatsappCount})` : 'Yok'}</td>
          <td>${faq.lastOpenedAt ? escapeHtml(formatDateTime(faq.lastOpenedAt)) : '-'}</td>
        </tr>
      `,
    )
    .join('')

  const journeyRows = report.sessions
    .map(
      (session) => `
        <tr>
          <td>${escapeHtml(session.sessionId)}</td>
          <td>${escapeHtml(session.source)}</td>
          <td>${escapeHtml(deviceLabels[session.device] || session.device)}</td>
          <td>${escapeHtml(session.sectionLabels.join(' → ') || 'Bilinmiyor')}</td>
          <td>${escapeHtml(formatDuration(session.totalDuration))}</td>
          <td>${escapeHtml(session.lastAction)}</td>
          <td>${session.converted ? 'Var' : 'Yok'}</td>
        </tr>
      `,
    )
    .join('')

  const logRows = report.visitorLogs
    .map((event) => {
      const ctaClick = getCtaClick(event)
      return `
        <tr
          data-date="${escapeHtml(String(event.created_at || '').slice(0, 10))}"
          data-device="${escapeHtml(event.device_type || 'unknown')}"
          data-event="${escapeHtml(getEventFilterKey(event))}"
          data-session="${escapeHtml(event.session_id || '-')}"
          data-conversion="${isConversionEvent(event) ? 'yes' : 'no'}"
        >
          <td>${escapeHtml(formatDateTime(event.created_at))}</td>
          <td>${escapeHtml(getEventTypeLabel(event))}</td>
          <td>${escapeHtml(getEventDetailLabel(event, report.faqLabelById))}</td>
          <td>${escapeHtml(deviceLabels[event.device_type] || event.device_type || 'Bilinmiyor')}</td>
          <td>${escapeHtml(event.session_id || '-')}</td>
          <td>${ctaClick ? (isConversionEvent(event) ? 'Dönüşüm' : 'CTA') : '-'}</td>
        </tr>
      `
    })
    .join('')

  const warningRows = report.warnings
    .map(
      (warning) => `
        <div class="notice notice-${warning.tone}">
          <strong>${escapeHtml(warning.title)}</strong>
          <span>${escapeHtml(warning.text)}</span>
        </div>
      `,
    )
    .join('')

  const recommendationRows = report.recommendations
    .map((recommendation) => `<li>${escapeHtml(recommendation)}</li>`)
    .join('')

  const cardHtml = cardRows
    .map(
      ([label, value]) => `
        <div class="card">
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `,
    )
    .join('')

  return `
    <header class="report-cover">
      <p class="eyebrow">ORION Kamp Analitik Raporu</p>
      <h1>Ziyaretçi ve Satış Performansı</h1>
      <div class="meta-grid">
        <span>Oluşturulma: <strong>${escapeHtml(generatedAt)}</strong></span>
        <span>Kapsam: <strong>${escapeHtml(scopeLabel)}</strong></span>
        <span>Toplam log: <strong>${report.visitorLogs.length}</strong></span>
        <span>Tekrar temizliği: <strong>${escapeHtml(hiddenDuplicateNote)}</strong></span>
      </div>
      <p class="data-note">Veri doğruluk notu: WhatsApp, telefon ve form dönüşümleri bu ölçüm sürümünden sonra net izlenir; eski kayıtlarda bu alanlar 0 veya henüz ölçülmedi görünebilir.</p>
    </header>

    <section class="section-block">
      <h2>Yönetici Özeti</h2>
      <div class="summary-grid">
        <p><strong>Toplam ziyaretçi durumu:</strong> ${escapeHtml(summary.generalComment)}</p>
        <p><strong>Mobil kullanım:</strong> ${escapeHtml(summary.mobileComment)}</p>
        <p><strong>En güçlü bölüm:</strong> ${escapeHtml(summary.strongestSection)}</p>
        <p><strong>En zayıf bölüm:</strong> ${escapeHtml(summary.weakestSection)}</p>
        <p><strong>SSS kullanımı:</strong> ${escapeHtml(summary.faqComment)}</p>
        <p><strong>Logo/Instagram:</strong> ${escapeHtml(summary.logoComment)}</p>
        <p><strong>Genel yorum:</strong> ${escapeHtml(report.recommendations[0] || 'Veri birikmeye devam ettikçe öneriler netleşir.')}</p>
      </div>
    </section>

    ${warningRows ? `<section class="section-block avoid-break"><h2>Renkli Uyarılar</h2>${warningRows}</section>` : ''}

    <section class="section-block avoid-break">
      <h2>Özet Kartları</h2>
      <div class="cards">${cardHtml}</div>
    </section>

    <section class="section-block">
      <h2>Cihaz Dağılımı</h2>
      <p class="meta">Toplam cihaz oturumu: ${totalDeviceCount}</p>
      <table>
        <thead><tr><th>Cihaz</th><th>Oturum</th><th>Oran</th><th>Grafik</th></tr></thead>
        <tbody>${deviceRows || '<tr><td colspan="4">Kayıt yok</td></tr>'}</tbody>
      </table>
    </section>

    <section class="section-block">
      <h2>Bölüm Performansı</h2>
      <table>
        <thead><tr><th>Bölüm</th><th>Görüntülenme</th><th>Toplam süre</th><th>Ortalama</th><th>CTA</th><th>Çıkış</th><th>İlgi</th></tr></thead>
        <tbody>${sectionRows || '<tr><td colspan="7">Kayıt yok</td></tr>'}</tbody>
      </table>
    </section>

    <section class="section-block">
      <h2>Logo ve Sosyal Medya Tıklamaları</h2>
      <table>
        <thead><tr><th>Alan</th><th>Tıklama</th><th>Satış yorumu</th></tr></thead>
        <tbody>${partnerRows || '<tr><td colspan="3">Logo/Instagram tıklaması yok</td></tr>'}</tbody>
      </table>
      <div class="empty-slots">
        <span>WhatsApp tıklaması: <strong>${report.whatsappClicks.length || 'Henüz ölçülmedi'}</strong></span>
        <span>Telefon tıklaması: <strong>${report.phoneClicks.length || 'Henüz ölçülmedi'}</strong></span>
      </div>
    </section>

    <section class="section-block">
      <h2>SSS Açılma Raporu</h2>
      ${report.faqStats.reduce((sum, faq) => sum + faq.openCount, 0) === 0 ? '<div class="notice notice-danger"><strong>SSS alanı hiç kullanılmamış.</strong><span>Bu alan görünür değil, ilgi çekmiyor veya takip kodu çalışmıyor olabilir.</span></div>' : ''}
      <table>
        <thead><tr><th>Soru</th><th>Açılma</th><th>Kapanma</th><th>Sonrasında WhatsApp</th><th>Son açılma</th></tr></thead>
        <tbody>${faqRows || '<tr><td colspan="5">Kayıt yok</td></tr>'}</tbody>
      </table>
    </section>

    <section class="section-block">
      <h2>Oturum Bazlı Ziyaretçi Yolculuğu</h2>
      <table>
        <thead><tr><th>Oturum</th><th>Kaynak</th><th>Cihaz</th><th>Gezilen bölümler</th><th>Süre</th><th>Son işlem</th><th>Dönüşüm</th></tr></thead>
        <tbody>${journeyRows || '<tr><td colspan="7">Kayıt yok</td></tr>'}</tbody>
      </table>
    </section>

    <section class="section-block">
      <h2>Tüm Ziyaret Logları</h2>
      <div class="report-controls no-print">
        <input id="log-search" placeholder="Oturum ID ara" />
        <select id="log-event">
          <option value="all">Tüm olaylar</option>
          <option value="page_view">Sayfa görüntüleme</option>
          <option value="section_view">Bölüm süresi</option>
          <option value="cta_click">CTA</option>
          <option value="conversion">Dönüşüm</option>
          <option value="partner_click">Logo</option>
          <option value="faq">SSS</option>
        </select>
        <select id="log-device">
          <option value="all">Tüm cihazlar</option>
          <option value="mobile">Mobil</option>
          <option value="desktop">Masaüstü</option>
          <option value="tablet">Tablet</option>
        </select>
        <input id="log-date" type="date" />
        <label><input id="log-conversion" type="checkbox" /> Sadece dönüşüm</label>
      </div>
      <table id="log-table" class="log-table">
        <thead><tr><th>Tarih</th><th>Olay</th><th>Detay</th><th>Cihaz</th><th>Oturum</th><th>Etiket</th></tr></thead>
        <tbody>${logRows || '<tr><td colspan="6">Kayıt yok</td></tr>'}</tbody>
      </table>
      <div id="log-pagination" class="report-pagination no-print"></div>
    </section>

    <section class="section-block avoid-break">
      <h2>Pazarlama Yorumu</h2>
      <ul>${recommendationRows}</ul>
    </section>

    <section class="section-block avoid-break">
      <h2>Sonuç</h2>
      <p><strong>Güçlü taraflar:</strong> ${escapeHtml(report.topSection?.label || 'Veri birikiyor')} bölümü en güçlü ilgi sinyalini veriyor.</p>
      <p><strong>Zayıf taraflar:</strong> ${escapeHtml(report.weakSection?.label || 'Henüz net değil')} alanı iyileştirme için izlenmeli.</p>
      <p><strong>Öncelikli aksiyonlar:</strong> ${escapeHtml(report.recommendations.slice(0, 2).join(' '))}</p>
    </section>

    <script>
      (() => {
        const rows = Array.from(document.querySelectorAll('#log-table tbody tr[data-session]'));
        const pageSize = 25;
        let page = 1;
        const controls = {
          search: document.getElementById('log-search'),
          event: document.getElementById('log-event'),
          device: document.getElementById('log-device'),
          date: document.getElementById('log-date'),
          conversion: document.getElementById('log-conversion'),
          pagination: document.getElementById('log-pagination'),
        };
        const render = () => {
          const filtered = rows.filter((row) => {
            const matchesSearch = !controls.search.value || row.dataset.session.toLowerCase().includes(controls.search.value.toLowerCase());
            const matchesEvent = controls.event.value === 'all' || row.dataset.event === controls.event.value || (controls.event.value === 'conversion' && row.dataset.conversion === 'yes');
            const matchesDevice = controls.device.value === 'all' || row.dataset.device === controls.device.value;
            const matchesDate = !controls.date.value || row.dataset.date === controls.date.value;
            const matchesConversion = !controls.conversion.checked || row.dataset.conversion === 'yes';
            return matchesSearch && matchesEvent && matchesDevice && matchesDate && matchesConversion;
          });
          const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
          page = Math.min(page, pageCount);
          rows.forEach((row) => { row.style.display = 'none'; });
          filtered.slice((page - 1) * pageSize, page * pageSize).forEach((row) => { row.style.display = ''; });
          controls.pagination.innerHTML = '';
          for (let index = 1; index <= pageCount; index += 1) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = index;
            button.className = index === page ? 'active' : '';
            button.addEventListener('click', () => { page = index; render(); });
            controls.pagination.appendChild(button);
          }
        };
        Object.values(controls).forEach((control) => {
          if (control && control !== controls.pagination) {
            control.addEventListener('input', () => { page = 1; render(); });
          }
        });
        render();
      })();
    </script>
  `
}

function AnalyticsReport() {
  const [events, setEvents] = useState([])
  const [faqItems, setFaqItems] = useState(fallbackContent.faqs)
  const [filters, setFilters] = useState(defaultFilters)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isResetting, setIsResetting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [journeyPage, setJourneyPage] = useState(1)

  const fetchAnalytics = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase bağlantısı yok. Raporlar gerçek veriye bağlanamıyor.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const allEvents = []
      let from = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('site_analytics')
          .select(analyticsSelect)
          .order('created_at', { ascending: false })
          .range(from, from + analyticsFetchPageSize - 1)

        if (error) {
          throw error
        }

        allEvents.push(...(data || []))
        hasMore = (data || []).length === analyticsFetchPageSize
        from += analyticsFetchPageSize
      }

      setEvents(allEvents)
      setJourneyPage(1)

      const { data: faqData, error: faqError } = await supabase
        .from('faq_items')
        .select(faqItemsSelect)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      setFaqItems(faqError || !faqData?.length ? fallbackContent.faqs : faqData)
    } catch (error) {
      setErrorMessage(`Rapor verileri alınamadı: ${error.message}`)
      setEvents([])
      setFaqItems(fallbackContent.faqs)
      setJourneyPage(1)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(fetchAnalytics, 0)

    return () => window.clearTimeout(timerId)
  }, [fetchAnalytics])

  const report = useMemo(() => {
    const deduplicatedEvents = removeDuplicateDesktopPageViews(events)
    const activeFaqItems = [...(faqItems || [])]
      .filter((faq) => faq.is_active !== false)
      .sort((first, second) => Number(first.sort_order || 0) - Number(second.sort_order || 0))
    const faqLabelById = activeFaqItems.reduce(
      (labels, faq) => ({
        ...labels,
        [faq.id || faq.question]: faq.question,
      }),
      {},
    )
    const allSessions = createSessionSummaries(deduplicatedEvents, faqLabelById)
    const sessions = filterSessions(allSessions, filters)
    const filteredEvents = sessions.flatMap((session) => session.events).sort(sortByCreatedAtDesc)
    const pageViews = filteredEvents.filter((event) => event.event_type === 'page_view')
    const ctaClicks = filteredEvents.filter(isCtaClickEvent)
    const conversionEvents = filteredEvents.filter(isConversionEvent)
    const partnerClicks = filteredEvents.filter(isPartnerClickEvent)
    const faqInteractions = filteredEvents.filter(isFaqInteractionEvent)
    const sectionViews = filteredEvents.filter(
      (event) =>
        event.event_type === 'section_view' &&
        !isPartnerClickEvent(event) &&
        !isFaqInteractionEvent(event) &&
        !isCtaClickEvent(event),
    )
    const sectionPerformance = createSectionPerformance({ ctaClicks, sectionViews, sessions })
    const totalDuration = sectionPerformance.reduce((sum, section) => sum + section.totalDuration, 0)
    const conversionSessions = sessions.filter((session) => session.converted)
    const conversionRate = sessions.length > 0 ? (conversionSessions.length / sessions.length) * 100 : 0
    const faqStats = createFaqStats({ activeFaqItems, faqInteractions, sessions })
    const deviceStats = createDeviceStats(sessions)
    const partnerClickStats = createPartnerStats(partnerClicks)
    const ctaStats = createCtaStats(ctaClicks)
    const topSection = [...sectionPerformance].sort(
      (first, second) => second.totalDuration + second.ctaClicks * 8000 - (first.totalDuration + first.ctaClicks * 8000),
    )[0]
    const topDurationSection = [...sectionPerformance].sort(
      (first, second) => second.totalDuration - first.totalDuration,
    )[0]
    const topMeasuredSection = [...sectionPerformance].sort(
      (first, second) => second.views - first.views,
    )[0]
    const weakSection = [...sectionPerformance].sort((first, second) => {
      const firstScore = first.views + first.ctaClicks * 2 + first.averageDuration / 10000
      const secondScore = second.views + second.ctaClicks * 2 + second.averageDuration / 10000

      return firstScore - secondScore
    })[0]
    const whatsappClicks = ctaClicks.filter((event) => getCtaClick(event)?.type === 'whatsapp')
    const phoneClicks = ctaClicks.filter((event) => getCtaClick(event)?.type === 'phone')
    const reportData = {
      allSessions,
      averageSectionDuration:
        sectionViews.length > 0 ? Math.round(totalDuration / sectionViews.length) : 0,
      conversionCount: conversionEvents.length,
      conversionEvents,
      conversionRate,
      conversionSessions,
      ctaClicks,
      ctaStats,
      deviceStats,
      faqInteractions,
      faqLabelById,
      faqStats,
      hiddenDesktopDuplicatePageViews: events.length - deduplicatedEvents.length,
      pageViews,
      partnerClicks,
      partnerClickStats,
      phoneClicks,
      sectionPerformance,
      sessions,
      topDurationSection,
      topMeasuredSection,
      topSection,
      uniqueVisitors: sessions.length,
      visitorLogs: filteredEvents,
      weakSection,
      whatsappClicks,
    }

    reportData.warnings = createWarnings(reportData)
    reportData.recommendations = createRecommendations(reportData)

    return reportData
  }, [events, faqItems, filters])

  const sourceOptions = useMemo(
    () => [...new Set(report.allSessions.map((session) => session.source))].sort((a, b) => a.localeCompare(b, 'tr')),
    [report.allSessions],
  )

  const journeyPageCount = Math.max(1, Math.ceil(report.sessions.length / journeyPageSize))
  const safeJourneyPage = Math.min(journeyPage, journeyPageCount)
  const paginatedJourneys = report.sessions.slice(
    (safeJourneyPage - 1) * journeyPageSize,
    safeJourneyPage * journeyPageSize,
  )

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setJourneyPage(1)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    setJourneyPage(1)
  }

  const downloadReport = () => {
    downloadHtmlFile({
      body: createAnalyticsReportHtml(report, filters),
      filename: `orion-satis-analitik-raporu-${new Date().toISOString().slice(0, 10)}.html`,
      title: 'ORION Kamp Satış Analitik Raporu',
    })
  }

  const resetAnalytics = async () => {
    if (!window.confirm('Rapor kayıtları sıfırlansın mı? Bu işlem geri alınamaz.')) {
      return
    }

    setErrorMessage('')
    setStatusMessage('')

    if (!isSupabaseConfigured) {
      setEvents([])
      setJourneyPage(1)
      setStatusMessage('Demo rapor verileri sıfırlandı.')
      return
    }

    setIsResetting(true)

    const { error } = await supabase
      .from('site_analytics')
      .delete()
      .gte('created_at', '1970-01-01T00:00:00.000Z')

    if (error) {
      setErrorMessage(`Rapor sıfırlanamadı: ${error.message}`)
    } else {
      setEvents([])
      setJourneyPage(1)
      setStatusMessage('Rapor kayıtları sıfırlandı.')
    }

    setIsResetting(false)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">Satış Analitiği</p>
          <h1 className="admin-title mt-2">Ziyaretçi ve dönüşüm paneli</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#222222]/60">
            Orion Kamp reklam, kayıt ve iletişim sürecini okumak için tekil oturum, CTA,
            SSS, cihaz ve yolculuk metrikleri.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadReport} className="admin-secondary-button">
            <Download size={17} aria-hidden="true" />
            HTML İndir
          </button>
          <button
            type="button"
            onClick={resetAnalytics}
            disabled={isResetting}
            className="admin-danger-button disabled:opacity-60"
          >
            {isResetting ? (
              <Loader2 className="animate-spin" size={17} aria-hidden="true" />
            ) : (
              <RotateCcw size={17} aria-hidden="true" />
            )}
            Raporu Sıfırla
          </button>
          <button type="button" onClick={fetchAnalytics} className="admin-secondary-button">
            <RefreshCw size={17} aria-hidden="true" />
            Yenile
          </button>
        </div>
      </div>

      {errorMessage && <div className="contact-status contact-status-error mb-6">{errorMessage}</div>}
      {statusMessage && <div className="contact-status contact-status-success mb-6">{statusMessage}</div>}

      <section className="admin-card mb-6 p-5">
        <div className="flex items-center gap-2">
          <Filter size={19} className="text-[#FF6A2A]" aria-hidden="true" />
          <h2 className="text-lg font-black text-[#222222]">Filtreler</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="admin-label">
            Başlangıç
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter('dateFrom', event.target.value)}
              className="admin-input"
            />
          </label>
          <label className="admin-label">
            Bitiş
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter('dateTo', event.target.value)}
              className="admin-input"
            />
          </label>
          <label className="admin-label">
            Cihaz
            <select
              value={filters.device}
              onChange={(event) => updateFilter('device', event.target.value)}
              className="admin-input"
            >
              <option value="all">Tüm cihazlar</option>
              <option value="mobile">Mobil</option>
              <option value="desktop">Masaüstü</option>
              <option value="tablet">Tablet</option>
            </select>
          </label>
          <label className="admin-label">
            Kaynak
            <select
              value={filters.source}
              onChange={(event) => updateFilter('source', event.target.value)}
              className="admin-input"
            >
              <option value="all">Tüm kaynaklar</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-label">
            Olay türü
            <select
              value={filters.eventType}
              onChange={(event) => updateFilter('eventType', event.target.value)}
              className="admin-input"
            >
              {eventFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-label">
            Dönüşüm
            <select
              value={filters.conversion}
              onChange={(event) => updateFilter('conversion', event.target.value)}
              className="admin-input"
            >
              <option value="all">Tümü</option>
              <option value="converted">Dönüşüm yapanlar</option>
              <option value="not_converted">Dönüşüm yapmayanlar</option>
            </select>
          </label>
          <label className="admin-label md:col-span-2 xl:col-span-2">
            Oturum ID ara
            <input
              value={filters.sessionSearch}
              onChange={(event) => updateFilter('sessionSearch', event.target.value)}
              className="admin-input"
              placeholder="Oturum ID"
            />
          </label>
          <button type="button" onClick={resetFilters} className="admin-secondary-button self-end">
            Filtreleri temizle
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="admin-card grid min-h-56 place-items-center p-6 text-center font-black text-[#222222]/62">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin text-[#FF6A2A]" size={19} aria-hidden="true" />
            Satış analitiği yükleniyor...
          </span>
        </div>
      ) : (
        <>
          {report.warnings.length > 0 && (
            <section className="mb-6 grid gap-3 lg:grid-cols-3">
              {report.warnings.map((warning) => (
                <article
                  key={warning.title}
                  className={`rounded-2xl border p-4 ${
                    warning.tone === 'danger'
                      ? 'border-[#fecdd3] bg-[#fff1f2] text-[#9f1239]'
                      : 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]'
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-black">
                    <AlertTriangle size={17} aria-hidden="true" />
                    {warning.title}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6">{warning.text}</p>
                </article>
              ))}
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            <div className="admin-card p-5">
              <UsersRound className="text-[#FF6A2A]" size={24} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{report.uniqueVisitors}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Tekil oturum</p>
            </div>
            <div className="admin-card p-5">
              <BarChart3 className="text-[#FF6A2A]" size={24} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{report.pageViews.length}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Sayfa görüntüleme</p>
            </div>
            <div className="admin-card p-5">
              <Clock3 className="text-[#FF6A2A]" size={24} aria-hidden="true" />
              <p className="mt-4 text-2xl font-black text-[#222222]">
                {formatDuration(report.averageSectionDuration)}
              </p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Ortalama süre</p>
            </div>
            <div className="admin-card p-5">
              <MessageCircle className="text-[#25D366]" size={24} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{report.whatsappClicks.length}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">WhatsApp tıklaması</p>
            </div>
            <div className="admin-card p-5">
              <Phone className="text-[#FF6A2A]" size={24} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{report.phoneClicks.length}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Telefon tıklaması</p>
            </div>
            <div className="admin-card p-5">
              <TrendingUp className="text-[#FF6A2A]" size={24} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{formatPercent(report.conversionRate)}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Dönüşüm oranı</p>
            </div>
            <div className="admin-card p-5">
              <CheckCircle2 className="text-[#FF6A2A]" size={24} aria-hidden="true" />
              <p className="mt-4 break-words text-lg font-black text-[#222222]">
                {report.topSection?.label || 'Henüz ölçülmedi'}
              </p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">En çok ilgi gören bölüm</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="admin-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-[#222222]">
                <MonitorSmartphone size={22} className="text-[#FF6A2A]" aria-hidden="true" />
                Cihaz dağılımı
              </h2>
              <div className="mt-4 grid gap-4">
                {report.deviceStats.map((device) => (
                  <div key={device.id} className="rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-[#222222]">{device.label}</span>
                      <span className="admin-pill">{formatCountPercent(device.count, report.uniqueVisitors)}</span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[#FF6A2A]"
                        style={{ width: `${clampPercent(device.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-card p-5">
              <h2 className="text-xl font-black text-[#222222]">CTA ve dönüşüm sinyalleri</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {report.ctaStats.length > 0 ? (
                  report.ctaStats.map((cta) => (
                    <div
                      key={cta.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4"
                    >
                      <span className="font-black text-[#222222]">{cta.label}</span>
                      <span className="admin-pill">{cta.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58 sm:col-span-2">
                    Henüz CTA tıklaması ölçülmedi.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="admin-card mt-6 p-5">
            <h2 className="text-xl font-black text-[#222222]">Bölüm performansı</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[860px] w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.08em] text-[#222222]/48">
                    <th className="px-3 py-2">Bölüm</th>
                    <th className="px-3 py-2">Görüntülenme</th>
                    <th className="px-3 py-2">Ortalama süre</th>
                    <th className="px-3 py-2">Toplam süre</th>
                    <th className="px-3 py-2">CTA</th>
                    <th className="px-3 py-2">Çıkış</th>
                    <th className="px-3 py-2">İlgi düzeyi</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sectionPerformance.map((section) => (
                    <tr key={section.id} className="rounded-2xl bg-[#FFFBF5] font-bold text-[#222222]/72">
                      <td className="rounded-l-2xl px-3 py-3 font-black text-[#222222]">{section.label}</td>
                      <td className="px-3 py-3">{section.views}</td>
                      <td className="px-3 py-3">{formatDuration(section.averageDuration)}</td>
                      <td className="px-3 py-3">{formatDuration(section.totalDuration)}</td>
                      <td className="px-3 py-3">{section.ctaClicks}</td>
                      <td className="px-3 py-3">{formatPercent(section.exitRate)}</td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <span className={`admin-pill ${getInterestClassName(section.interestLabel)}`}>
                          {section.interestLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="admin-card p-5">
              <h2 className="text-xl font-black text-[#222222]">SSS raporu</h2>
              <div className="mt-4 grid gap-3">
                {report.faqStats.map((faq) => (
                  <div
                    key={faq.id}
                    className="grid gap-3 rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-[#222222]">{faq.question}</p>
                      <p className="mt-1 text-xs font-bold text-[#222222]/52">
                        Açılma: {faq.openCount} · Kapanma: {faq.closeCount}
                        {faq.lastOpenedAt ? ` · Son açılma: ${formatDateTime(faq.lastOpenedAt)}` : ''}
                      </p>
                    </div>
                    <span
                      className={`admin-pill ${
                        faq.afterWhatsappCount > 0 ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#fff7ed] text-[#c2410c]'
                      }`}
                    >
                      WhatsApp sonrası: {faq.afterWhatsappCount > 0 ? `Var (${faq.afterWhatsappCount})` : 'Yok'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-card p-5">
              <h2 className="text-xl font-black text-[#222222]">Logo / Instagram performansı</h2>
              <div className="mt-4 grid gap-3">
                {report.partnerClickStats.length > 0 ? (
                  report.partnerClickStats.map((partner) => (
                    <div
                      key={partner.id}
                      className="rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-[#222222]">{partner.label}</span>
                        <span className="admin-pill">{partner.count}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-[#222222]/52">{partner.priority}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58">
                    Henüz logo/Instagram tıklaması yok.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="admin-card mt-6 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#222222]">Ziyaretçi yolculuğu</h2>
                <p className="mt-1 text-sm font-bold text-[#222222]/58">
                  {report.sessions.length} oturum · Sayfa {safeJourneyPage}/{journeyPageCount}
                </p>
                {report.hiddenDesktopDuplicatePageViews > 0 && (
                  <p className="mt-1 text-xs font-bold text-[#222222]/45">
                    {report.hiddenDesktopDuplicatePageViews} masaüstü aynı oturum tekrarı rapordan çıkarıldı.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {paginatedJourneys.length > 0 ? (
                paginatedJourneys.map((session) => (
                  <article
                    key={session.sessionId}
                    className="rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="break-all text-xs font-black uppercase tracking-[0.08em] text-[#FF6A2A]">
                          {session.source} → {deviceLabels[session.device] || session.device}
                        </p>
                        <p className="mt-2 break-words text-sm font-black leading-6 text-[#222222]">
                          {session.sectionLabels.join(' → ') || 'Gezilen bölüm bulunamadı'}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#222222]/52">
                          Oturum: {session.sessionId} · Ekran: {session.screen}
                        </p>
                      </div>
                      <div className="grid gap-2 text-sm font-black text-[#222222]/72 sm:grid-cols-3 lg:min-w-[24rem]">
                        <span className="admin-pill">{formatDuration(session.totalDuration)}</span>
                        <span className="admin-pill">{session.lastAction}</span>
                        <span
                          className={`admin-pill ${
                            session.converted ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#fff7ed] text-[#c2410c]'
                          }`}
                        >
                          Dönüşüm: {session.converted ? 'Var' : 'Yok'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58">
                  Filtreye uygun oturum yok.
                </p>
              )}
            </div>
            {journeyPageCount > 1 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {Array.from({ length: journeyPageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setJourneyPage(pageNumber)}
                    className={`grid size-10 place-items-center rounded-2xl border text-sm font-black transition ${
                      pageNumber === safeJourneyPage
                        ? 'border-[#FF6A2A] bg-[#FF6A2A] text-white shadow-[0_12px_28px_rgba(255,106,42,0.22)]'
                        : 'border-[#FFE0CC] bg-white text-[#FF6A2A] hover:bg-[#FFF1E8]'
                    }`}
                    aria-current={pageNumber === safeJourneyPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="admin-card mt-6 p-5">
            <h2 className="text-xl font-black text-[#222222]">Pazarlama yorumu</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {report.recommendations.map((recommendation) => (
                <p
                  key={recommendation}
                  className="rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4 text-sm font-bold leading-6 text-[#222222]/72"
                >
                  {recommendation}
                </p>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default AnalyticsReport
