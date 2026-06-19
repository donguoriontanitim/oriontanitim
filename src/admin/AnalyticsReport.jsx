import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
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
    const eventLabel = ctaClick.eventName ? ` · ${ctaClick.eventName}` : ''

    return `${ctaClick.buttonLabel || ctaLabelByType[ctaClick.type] || ctaClick.type}${targetLabel} (${sourceLabel})${eventLabel}`
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

const whatsappCtaTypes = ['whatsapp', 'cta_whatsapp_click', 'faq_whatsapp_click']
const phoneCtaTypes = ['phone', 'cta_phone_click']

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
        .some((nextEvent) => whatsappCtaTypes.includes(getCtaClick(nextEvent)?.type))

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

  if (warnings.length === 0) {
    warnings.push({
      tone: 'info',
      title: sessions.length > 0 ? 'Kritik uyarı yok' : 'Veri bekleniyor',
      text:
        sessions.length > 0
          ? 'Ana metriklerde acil müdahale gerektiren bir sinyal görünmüyor; kampanya akışı izlenmeye devam edebilir.'
          : 'Panel, canlı site trafiği ve takip olayları oluştukça otomatik dolacak.',
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

const getActiveFilterCount = (filters) =>
  Object.entries(filters).filter(([key, value]) => value && value !== defaultFilters[key]).length

const getKpiToneClassName = (tone = 'orange') => {
  if (tone === 'green') {
    return {
      icon: 'bg-[#ecfdf5] text-[#047857]',
      ring: 'from-[#ecfdf5] to-white',
    }
  }

  if (tone === 'blue') {
    return {
      icon: 'bg-[#eff6ff] text-[#1d4ed8]',
      ring: 'from-[#eff6ff] to-white',
    }
  }

  if (tone === 'dark') {
    return {
      icon: 'bg-[#f4f4f5] text-[#222222]',
      ring: 'from-[#f8fafc] to-white',
    }
  }

  return {
    icon: 'bg-[#fff1e8] text-[#FF6A2A]',
    ring: 'from-[#fff7ed] to-white',
  }
}

const getWarningVisual = (tone = 'info') => {
  if (tone === 'danger' || tone === 'critical') {
    return {
      badge: 'Kritik',
      className: 'border-[#fecdd3] bg-[#fff1f2] text-[#9f1239]',
      iconClassName: 'bg-white/75 text-[#e11d48]',
    }
  }

  if (tone === 'warning') {
    return {
      badge: 'Orta',
      className: 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]',
      iconClassName: 'bg-white/75 text-[#f97316]',
    }
  }

  return {
    badge: 'Bilgi',
    className: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
    iconClassName: 'bg-white/75 text-[#2563eb]',
  }
}

const getProgressToneClassName = (tone = 'orange') => {
  if (tone === 'green') {
    return 'bg-[#10b981]'
  }

  if (tone === 'red') {
    return 'bg-[#e11d48]'
  }

  if (tone === 'blue') {
    return 'bg-[#2563eb]'
  }

  return 'bg-[#FF6A2A]'
}

const KpiCard = ({ detail, icon: Icon, label, tone, value }) => {
  const toneClass = getKpiToneClassName(tone)
  const valueClassName = String(value).length > 16 ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'

  return (
    <article
      className={`admin-card overflow-hidden p-4 sm:p-5 bg-gradient-to-br ${toneClass.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${valueClassName} break-words font-black leading-tight text-[#222222]`}>
            {value}
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.08em] text-[#222222]/46">
            {label}
          </p>
          {detail && <p className="mt-2 text-xs font-bold leading-5 text-[#222222]/52">{detail}</p>}
        </div>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-2xl ${toneClass.icon}`}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

const EmptyState = ({ action, text, title }) => (
  <div className="rounded-[18px] border border-dashed border-[#F2C4AA] bg-[#FFFCF8] p-5">
    <p className="text-sm font-black text-[#222222]">{title}</p>
    <p className="mt-1 text-sm font-bold leading-6 text-[#222222]/58">{text}</p>
    {action && (
      <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black text-[#FF6A2A]">
        {action}
      </p>
    )}
  </div>
)

const MetricBar = ({ max = 0, tone, value = 0 }) => {
  const percent = max > 0 ? (Number(value || 0) / max) * 100 : 0

  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f2f4f7]">
      <div
        className={`h-full rounded-full ${getProgressToneClassName(tone)}`}
        style={{ width: `${clampPercent(percent)}%` }}
      />
    </div>
  )
}

const WarningCard = ({ warning }) => {
  const visual = getWarningVisual(warning.tone)

  return (
    <article className={`rounded-[18px] border p-4 shadow-sm ${visual.className}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-2xl ${visual.iconClassName}`}>
          <AlertTriangle size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/75 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em]">
              {visual.badge}
            </span>
            <p className="text-sm font-black">{warning.title}</p>
          </div>
          <p className="mt-2 text-sm font-bold leading-6 opacity-80">{warning.text}</p>
        </div>
      </div>
    </article>
  )
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

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
    const whatsappClicks = ctaClicks.filter((event) =>
      whatsappCtaTypes.includes(getCtaClick(event)?.type),
    )
    const phoneClicks = ctaClicks.filter((event) =>
      phoneCtaTypes.includes(getCtaClick(event)?.type),
    )
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

  const activeFilterCount = getActiveFilterCount(filters)
  const maxSectionViews = Math.max(1, ...report.sectionPerformance.map((section) => section.views))
  const maxAverageDuration = Math.max(
    1,
    ...report.sectionPerformance.map((section) => section.averageDuration),
  )
  const maxSectionCta = Math.max(1, ...report.sectionPerformance.map((section) => section.ctaClicks))
  const totalFaqOpenCount = report.faqStats.reduce((sum, faq) => sum + faq.openCount, 0)
  const hasDeviceData = report.uniqueVisitors > 0
  const hasSectionData = report.sectionPerformance.some(
    (section) => section.views > 0 || section.totalDuration > 0 || section.ctaClicks > 0,
  )

  const kpiCards = [
    {
      detail: 'Filtrelere göre tekil ziyaretçi yolculuğu',
      icon: UsersRound,
      label: 'Tekil oturum',
      tone: 'dark',
      value: report.uniqueVisitors,
    },
    {
      detail: 'Toplam sayfa açılışı ve bölüm girişleri',
      icon: BarChart3,
      label: 'Sayfa görüntüleme',
      tone: 'orange',
      value: report.pageViews.length,
    },
    {
      detail: 'Bölüm bazlı ölçülen ortalama kalış',
      icon: Clock3,
      label: 'Ortalama süre',
      tone: 'blue',
      value: formatDuration(report.averageSectionDuration),
    },
    {
      detail: 'Doğrudan kayıt niyeti için en sıcak sinyal',
      icon: MessageCircle,
      label: 'WhatsApp tıklaması',
      tone: 'green',
      value: report.whatsappClicks.length,
    },
    {
      detail: 'Arama aksiyonları ve hızlı iletişim niyeti',
      icon: Phone,
      label: 'Telefon tıklaması',
      tone: 'orange',
      value: report.phoneClicks.length,
    },
    {
      detail: 'Dönüşüm yapan oturumların tahmini oranı',
      icon: TrendingUp,
      label: 'Dönüşüm oranı',
      tone: 'green',
      value: formatPercent(report.conversionRate),
    },
    {
      detail: 'Süre ve CTA ağırlığına göre öne çıkan alan',
      icon: CheckCircle2,
      label: 'En çok ilgi gören bölüm',
      tone: 'dark',
      value: report.topSection?.label || 'Henüz ölçülmedi',
    },
  ]

  const stickyKpis = [
    ['Oturum', report.uniqueVisitors],
    ['Görüntüleme', report.pageViews.length],
    ['WhatsApp', report.whatsappClicks.length],
    ['Dönüşüm', formatPercent(report.conversionRate)],
    ['En iyi bölüm', report.topSection?.label || 'Henüz ölçülmedi'],
  ]

  return (
    <div className="pb-10">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="admin-eyebrow">Satış Analitiği</p>
          <h1 className="admin-title mt-2">Ziyaretçi ve dönüşüm paneli</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#222222]/56">
            Orion Kamp reklam, kayıt ve iletişim sürecini daha hızlı okumak için tekil oturum,
            CTA, SSS, cihaz ve yolculuk metrikleri.
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

      {errorMessage && <div className="contact-status contact-status-error mb-5">{errorMessage}</div>}
      {statusMessage && <div className="contact-status contact-status-success mb-5">{statusMessage}</div>}

      <div className="sticky top-3 z-30 mb-6 -mx-2 px-2">
        <div className="admin-card border-[#FFE0CC]/75 bg-white/95 p-2 shadow-[0_18px_55px_rgba(34,34,34,0.08)] backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stickyKpis.map(([label, value]) => (
              <div
                key={label}
                className="min-w-[7rem] rounded-2xl bg-[#F8FAFC] px-3 py-2 sm:min-w-[8.5rem]"
              >
                <p className="truncate text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#222222]/42">
                  {label}
                </p>
                <p className="mt-1 truncate text-sm font-black text-[#222222]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </section>

      <section className="mt-6 grid gap-3 lg:grid-cols-3">
        {report.warnings.map((warning) => (
          <WarningCard key={`${warning.tone}-${warning.title}`} warning={warning} />
        ))}
      </section>

      <section className="admin-card mt-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFiltersOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
          aria-controls="analytics-filters"
          aria-expanded={isFiltersOpen}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#fff1e8] text-[#FF6A2A]">
              <Filter size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black text-[#222222]">Filtreler</span>
              <span className="mt-0.5 block text-xs font-bold text-[#222222]/52">
                {activeFilterCount > 0
                  ? `${activeFilterCount} aktif filtre uygulanıyor`
                  : 'Tüm kayıtlar gösteriliyor'}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="admin-pill hidden sm:inline-flex">
              {isFiltersOpen ? 'Gizle' : 'Göster'}
            </span>
            <ChevronDown
              className={`text-[#FF6A2A] transition ${isFiltersOpen ? 'rotate-180' : ''}`}
              size={20}
              aria-hidden="true"
            />
          </span>
        </button>
        {isFiltersOpen && (
          <div id="analytics-filters" className="border-t border-[#FFE0CC] bg-[#FFFCF8] p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="admin-label">
                Başlangıç
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => updateFilter('dateFrom', event.target.value)}
                  className="admin-input bg-white"
                />
              </label>
              <label className="admin-label">
                Bitiş
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => updateFilter('dateTo', event.target.value)}
                  className="admin-input bg-white"
                />
              </label>
              <label className="admin-label">
                Cihaz
                <select
                  value={filters.device}
                  onChange={(event) => updateFilter('device', event.target.value)}
                  className="admin-input bg-white"
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
                  className="admin-input bg-white"
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
                  className="admin-input bg-white"
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
                  className="admin-input bg-white"
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
                  className="admin-input bg-white"
                  placeholder="Oturum ID"
                />
              </label>
              <button type="button" onClick={resetFilters} className="admin-secondary-button self-end">
                Filtreleri temizle
              </button>
            </div>
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="admin-card mt-6 grid min-h-56 place-items-center p-6 text-center font-black text-[#222222]/62">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin text-[#FF6A2A]" size={19} aria-hidden="true" />
            Satış analitiği yükleniyor...
          </span>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="admin-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-[#222222]">
                    <MonitorSmartphone size={22} className="text-[#FF6A2A]" aria-hidden="true" />
                    Cihaz dağılımı
                  </h2>
                  <p className="mt-1 text-sm font-bold text-[#222222]/52">
                    Oturumların cihaz kırılımı ve yüzdesi.
                  </p>
                </div>
                <span className="admin-pill">{report.uniqueVisitors} oturum</span>
              </div>
              <div className="mt-5 grid gap-3">
                {report.deviceStats.map((device) => (
                  <div key={device.id} className="rounded-[18px] border border-[#E8ECF2] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-[#222222]">{device.label}</span>
                      <span className="admin-pill bg-white text-[#222222]/72">
                        {formatCountPercent(device.count, report.uniqueVisitors)}
                      </span>
                    </div>
                    <MetricBar value={device.percent} max={100} />
                  </div>
                ))}
                {!hasDeviceData && (
                  <EmptyState
                    title="Cihaz verisi henüz yok"
                    text="Tekil oturum oluşmadığı için mobil, masaüstü ve tablet oranları hesaplanamıyor."
                    action="Canlı site ziyaretleri başladığında bu alan otomatik dolacak."
                  />
                )}
              </div>
            </section>

            <section className="admin-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#222222]">CTA ve dönüşüm sinyalleri</h2>
                  <p className="mt-1 text-sm font-bold text-[#222222]/52">
                    WhatsApp, telefon ve kayıt niyeti taşıyan aksiyonlar.
                  </p>
                </div>
                <span className="admin-pill">{report.ctaClicks.length} tıklama</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {report.ctaStats.length > 0 ? (
                  report.ctaStats.map((cta) => (
                    <div
                      key={cta.id}
                      className="rounded-[18px] border border-[#E8ECF2] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-[#222222]">{cta.label}</span>
                        <span className="admin-pill bg-white text-[#222222]">{cta.count}</span>
                      </div>
                      <MetricBar value={cta.count} max={Math.max(1, report.ctaClicks.length)} tone="green" />
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-2">
                    <EmptyState
                      title="CTA tıklaması ölçülmedi"
                      text="WhatsApp, telefon veya form aksiyonu henüz veri üretmedi. Buton takip kodları ve canlı CTA görünürlüğü kontrol edilmeli."
                      action="İlk tıklama geldiğinde bu alan tıklama türüne göre ayrışacak."
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="admin-card mt-6 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#222222]">Bölüm performansı</h2>
                <p className="mt-1 text-sm font-bold text-[#222222]/52">
                  Her bölümün görüntülenme, süre, CTA ve çıkış davranışı.
                </p>
              </div>
              <span className="admin-pill">{report.sectionPerformance.length} bölüm</span>
            </div>
            {!hasSectionData && (
              <div className="mt-4">
                <EmptyState
                  title="Bölüm performansı için veri bekleniyor"
                  text="Henüz bölüm süresi veya CTA sinyali yok. Kullanıcılar sayfada gezindikçe ilgi düzeyleri hesaplanacak."
                  action="Bu alan takip kodu çalıştığında otomatik olarak renkli etiketlerle dolacak."
                />
              </div>
            )}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.08em] text-[#222222]/46">
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
                    <tr key={section.id} className="bg-[#F8FAFC] font-bold text-[#222222]/72">
                      <td className="rounded-l-[18px] px-3 py-3">
                        <p className="font-black text-[#222222]">{section.label}</p>
                        <span className="admin-pill mt-2 inline-flex bg-white text-[#222222]/58">
                          {section.sessionCount} oturum
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-black text-[#222222]">{section.views}</span>
                        <MetricBar value={section.views} max={maxSectionViews} />
                      </td>
                      <td className="px-3 py-3">
                        <span>{formatDuration(section.averageDuration)}</span>
                        <MetricBar value={section.averageDuration} max={maxAverageDuration} tone="blue" />
                      </td>
                      <td className="px-3 py-3">{formatDuration(section.totalDuration)}</td>
                      <td className="px-3 py-3">
                        <span className="font-black text-[#222222]">{section.ctaClicks}</span>
                        <MetricBar value={section.ctaClicks} max={maxSectionCta} tone="green" />
                      </td>
                      <td className="px-3 py-3">
                        <span>{formatPercent(section.exitRate)}</span>
                        <MetricBar
                          value={section.exitRate}
                          max={100}
                          tone={section.exitRate >= 65 ? 'red' : 'orange'}
                        />
                      </td>
                      <td className="rounded-r-[18px] px-3 py-3">
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#222222]">SSS raporu</h2>
                  <p className="mt-1 text-sm font-bold text-[#222222]/52">
                    Hangi soru açıldı, kapandı ve sonrasında WhatsApp geldi mi?
                  </p>
                </div>
                <span className="admin-pill">{totalFaqOpenCount} açılma</span>
              </div>
              {totalFaqOpenCount === 0 && (
                <div className="mt-4">
                  <EmptyState
                    title="SSS açılımı yok"
                    text="SSS alanı henüz kullanılmamış görünüyor. Alan görünür değil, ilgi çekmiyor veya takip kodu yeni devreye alınmış olabilir."
                    action="SSS bloğu mobilde daha yukarı taşınabilir ya da başlıklar güçlendirilebilir."
                  />
                </div>
              )}
              <div className="mt-4 grid gap-3">
                {report.faqStats.map((faq) => (
                  <div
                    key={faq.id}
                    className="grid gap-3 rounded-[18px] border border-[#E8ECF2] bg-[#F8FAFC] p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
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
                        faq.afterWhatsappCount > 0 ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-white text-[#222222]/58'
                      }`}
                    >
                      WhatsApp sonrası: {faq.afterWhatsappCount > 0 ? `Var (${faq.afterWhatsappCount})` : 'Yok'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#222222]">Logo / Instagram performansı</h2>
                  <p className="mt-1 text-sm font-bold text-[#222222]/52">
                    Logo ve anlaşmalı kurum tıklamalarının satış yorumu.
                  </p>
                </div>
                <span className="admin-pill">{report.partnerClicks.length} tıklama</span>
              </div>
              <div className="mt-4 grid gap-3">
                {report.partnerClickStats.length > 0 ? (
                  report.partnerClickStats.map((partner) => (
                    <div
                      key={partner.id}
                      className="rounded-[18px] border border-[#E8ECF2] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-[#222222]">{partner.label}</span>
                        <span className="admin-pill bg-white text-[#222222]">{partner.count}</span>
                      </div>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#222222]/52">{partner.priority}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Logo/Instagram tıklaması yok"
                    text="Bu alan sosyal medya yönelimi için veri üretmedi. Instagram’a giden logolara tıklanınca burada görünmeli."
                    action="Canlı sitede logo tıklaması yaptıktan sonra raporu yenileyerek kontrol edebilirsin."
                  />
                )}
              </div>
            </section>
          </div>

          <section className="admin-card mt-6 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#222222]">Ziyaretçi yolculuğu</h2>
                <p className="mt-1 text-sm font-bold text-[#222222]/52">
                  {report.sessions.length} oturum · Sayfa {safeJourneyPage}/{journeyPageCount}
                </p>
                {report.hiddenDesktopDuplicatePageViews > 0 && (
                  <p className="mt-1 text-xs font-bold text-[#222222]/45">
                    {report.hiddenDesktopDuplicatePageViews} masaüstü aynı oturum tekrarı rapordan çıkarıldı.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {paginatedJourneys.length > 0 ? (
                paginatedJourneys.map((session) => (
                  <article
                    key={session.sessionId}
                    className="rounded-[18px] border border-[#E8ECF2] bg-[#F8FAFC] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="admin-pill bg-white text-[#222222]">{session.source}</span>
                      <span className="admin-pill bg-white text-[#222222]/72">
                        {deviceLabels[session.device] || session.device}
                      </span>
                      <span className="admin-pill bg-white text-[#222222]/72">{formatDuration(session.totalDuration)}</span>
                      <span
                        className={`admin-pill ${
                          session.converted ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-white text-[#222222]/52'
                        }`}
                      >
                        Dönüşüm: {session.converted ? 'Var' : 'Yok'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {session.sectionLabels.length > 0 ? (
                        session.sectionLabels.slice(0, 7).map((sectionLabel, index) => (
                          <span
                            key={`${session.sessionId}-${sectionLabel}-${index}`}
                            className="rounded-full border border-[#FFE0CC] bg-white px-2.5 py-1 text-xs font-black text-[#222222]/70"
                          >
                            {sectionLabel}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-[#FFE0CC] bg-white px-2.5 py-1 text-xs font-black text-[#222222]/52">
                          Gezilen bölüm bulunamadı
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid gap-1 text-xs font-bold leading-5 text-[#222222]/52">
                      <span className="break-all">Oturum: {session.sessionId}</span>
                      <span>
                        Giriş: {formatDateTime(session.firstAt)} · Son kayıt: {formatDateTime(session.lastAt)}
                      </span>
                      <span>
                        Ekran: {session.screen} · Son işlem: {session.lastAction}
                      </span>
                      <span className="break-words">Detay: {session.lastDetail}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="xl:col-span-2">
                  <EmptyState
                    title="Filtreye uygun oturum yok"
                    text="Seçili filtreler hiçbir ziyaretçi yolculuğu döndürmedi. Tarih, cihaz veya olay türü filtreleri dar kalmış olabilir."
                    action="Filtreleri temizleyerek tüm oturumları tekrar görebilirsin."
                  />
                </div>
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
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-black text-[#222222]">Pazarlama yorumu</h2>
              <p className="text-sm font-bold text-[#222222]/52">
                Mevcut verilere göre yöneticinin hızlı aksiyon alması için öneriler.
              </p>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {report.recommendations.map((recommendation) => (
                <p
                  key={recommendation}
                  className="rounded-[18px] border border-[#E8ECF2] bg-[#F8FAFC] p-4 text-sm font-bold leading-6 text-[#222222]/72"
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
