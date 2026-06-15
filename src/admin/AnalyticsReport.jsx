import {
  BarChart3,
  Clock3,
  Download,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  RotateCcw,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getFaqInteraction,
  isFaqInteractionEvent,
  getPartnerClickId,
  isPartnerClickEvent,
  partnerLabelById,
  sectionLabelById,
} from '../lib/analytics.js'
import { fallbackContent } from '../fallbackContent.js'
import { downloadHtmlFile, escapeHtml } from '../lib/htmlExport.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const analyticsSelect =
  'id,session_id,event_type,section_id,path,referrer,device_type,viewport_width,viewport_height,duration_ms,user_agent,created_at'
const faqItemsSelect = 'id,question,sort_order,is_active'

const deviceLabels = {
  desktop: 'Masaüstü',
  mobile: 'Mobil',
  tablet: 'Tablet',
  unknown: 'Bilinmiyor',
}

const eventTypeLabels = {
  faq_close: 'SSS kapandı',
  faq_open: 'SSS açıldı',
  page_view: 'Sayfa görüntüleme',
  partner_click: 'Logo tıklaması',
  section_view: 'Bölüm süresi',
}

const visitorLogsPageSize = 12
const analyticsFetchPageSize = 1000

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

const formatDuration = (durationMs = 0) => {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds} sn`
  }

  return `${minutes} dk ${seconds} sn`
}

const formatDateTime = (dateValue) =>
  new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateValue))

const getEventTypeLabel = (event) =>
  getFaqInteraction(event)
    ? eventTypeLabels[getFaqInteraction(event).action === 'close' ? 'faq_close' : 'faq_open']
    : isPartnerClickEvent(event)
    ? eventTypeLabels.partner_click
    : eventTypeLabels[event.event_type] || event.event_type || 'Bilinmiyor'

const getEventDetailLabel = (event, faqLabelById = {}) => {
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

  return event.section_id ? sectionLabelById[event.section_id] || event.section_id : '-'
}

const createAnalyticsReportHtml = (report) => {
  const sectionRows = report.sectionStats
    .map(
      (section) => `
        <tr>
          <td>${escapeHtml(section.label)}</td>
          <td>${section.views}</td>
          <td>${escapeHtml(formatDuration(section.totalDuration))}</td>
          <td>${escapeHtml(formatDuration(section.totalDuration / section.views))}</td>
        </tr>
      `,
    )
    .join('')
  const deviceRows = report.deviceStats
    .map(
      (device) => `
        <tr>
          <td>${escapeHtml(device.label)}</td>
          <td>${device.count}</td>
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
        </tr>
      `,
    )
    .join('')
  const faqRows = report.faqStats
    .map(
      (faq) => `
        <tr>
          <td>${escapeHtml(faq.question)}</td>
          <td>${faq.opened ? 'Açıldı' : 'Açılmadı'}</td>
          <td>${faq.openCount}</td>
          <td>${faq.closeCount}</td>
          <td>${faq.lastOpenedAt ? escapeHtml(formatDateTime(faq.lastOpenedAt)) : '-'}</td>
        </tr>
      `,
    )
    .join('')
  const visitorLogRows = report.visitorLogs
    .map(
      (event) => `
        <tr>
          <td>${escapeHtml(formatDateTime(event.created_at))}</td>
          <td>${escapeHtml(getEventTypeLabel(event))}</td>
          <td>${escapeHtml(getEventDetailLabel(event, report.faqLabelById))}</td>
          <td>${escapeHtml(event.path || '#/')}</td>
          <td>${escapeHtml(deviceLabels[event.device_type] || event.device_type || 'Bilinmiyor')}</td>
          <td>${escapeHtml(`${event.viewport_width || '-'}x${event.viewport_height || '-'}`)}</td>
          <td>${escapeHtml(event.duration_ms ? formatDuration(event.duration_ms) : '-')}</td>
          <td>${escapeHtml(event.session_id || '-')}</td>
        </tr>
      `,
    )
    .join('')

  return `
    <h1>ORION Kamp Ziyaretçi Raporu</h1>
    <p class="meta">Oluşturulma tarihi: ${escapeHtml(formatDateTime(new Date().toISOString()))} · Kapsam: Tüm kayıtlar</p>
    <div class="cards">
      <div class="card"><strong>${report.uniqueVisitors}</strong>Tekil oturum</div>
      <div class="card"><strong>${report.pageViews.length}</strong>Sayfa görüntüleme</div>
      <div class="card"><strong>${report.partnerClicks.length}</strong>Logo tıklaması</div>
      <div class="card"><strong>${report.openedFaqCount}/${report.faqStats.length}</strong>Açılan SSS</div>
      <div class="card"><strong>${escapeHtml(formatDuration(report.averageSectionDuration))}</strong>Ortalama bölüm süresi</div>
    </div>
    <h2>Bölümlerde Geçirilen Süre</h2>
    <table>
      <thead><tr><th>Bölüm</th><th>Ölçüm</th><th>Toplam süre</th><th>Ortalama</th></tr></thead>
      <tbody>${sectionRows || '<tr><td colspan="4">Kayıt yok</td></tr>'}</tbody>
    </table>
    <h2>Cihaz Dağılımı</h2>
    <table>
      <thead><tr><th>Cihaz</th><th>Görüntüleme</th></tr></thead>
      <tbody>${deviceRows || '<tr><td colspan="2">Kayıt yok</td></tr>'}</tbody>
    </table>
    <h2>Logo Tıklamaları</h2>
    <table>
      <thead><tr><th>Logo</th><th>Tıklama</th></tr></thead>
      <tbody>${partnerRows || '<tr><td colspan="2">Kayıt yok</td></tr>'}</tbody>
    </table>
    <h2>SSS Açılma Raporu</h2>
    <table>
      <thead><tr><th>Soru</th><th>Durum</th><th>Açılma</th><th>Kapanma</th><th>Son açılma</th></tr></thead>
      <tbody>${faqRows || '<tr><td colspan="5">Kayıt yok</td></tr>'}</tbody>
    </table>
    <h2>Tüm Ziyaret Logları</h2>
    <table class="log-table">
      <thead><tr><th>Tarih</th><th>Olay</th><th>Detay</th><th>Sayfa</th><th>Cihaz</th><th>Ekran</th><th>Süre</th><th>Oturum</th></tr></thead>
      <tbody>${visitorLogRows || '<tr><td colspan="8">Kayıt yok</td></tr>'}</tbody>
    </table>
  `
}

function AnalyticsReport() {
  const [events, setEvents] = useState([])
  const [faqItems, setFaqItems] = useState(fallbackContent.faqs)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isResetting, setIsResetting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [visitorPage, setVisitorPage] = useState(1)

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
      setVisitorPage(1)

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
      setVisitorPage(1)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(fetchAnalytics, 0)

    return () => window.clearTimeout(timerId)
  }, [fetchAnalytics])

  const report = useMemo(() => {
    const reportEvents = removeDuplicateDesktopPageViews(events)
    const pageViews = reportEvents.filter((event) => event.event_type === 'page_view')
    const partnerClicks = reportEvents.filter((event) => isPartnerClickEvent(event))
    const faqInteractions = reportEvents.filter((event) => isFaqInteractionEvent(event))
    const sectionViews = reportEvents.filter(
      (event) =>
        event.event_type === 'section_view' &&
        !isPartnerClickEvent(event) &&
        !isFaqInteractionEvent(event),
    )
    const uniqueSessions = new Set(reportEvents.map((event) => event.session_id).filter(Boolean))
    const activeFaqItems = [...(faqItems || [])]
      .filter((faq) => faq.is_active !== false)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    const faqLabelById = activeFaqItems.reduce(
      (labels, faq) => ({
        ...labels,
        [faq.id || faq.question]: faq.question,
      }),
      {},
    )

    const sectionStats = Object.values(
      sectionViews.reduce((stats, event) => {
        const sectionId = event.section_id || 'unknown'

        if (!stats[sectionId]) {
          stats[sectionId] = {
            id: sectionId,
            label: sectionLabelById[sectionId] || sectionId,
            totalDuration: 0,
            views: 0,
          }
        }

        stats[sectionId].totalDuration += Number(event.duration_ms || 0)
        stats[sectionId].views += 1

        return stats
      }, {}),
    ).sort((a, b) => b.totalDuration - a.totalDuration)

    const deviceSessionStats = pageViews.reduce(
      (state, event) => {
        const sessionKey = event.session_id || event.id
        const deviceType = event.device_type || 'unknown'

        if (state.seenSessions.has(sessionKey)) {
          return state
        }

        state.seenSessions.add(sessionKey)

        if (!state.stats[deviceType]) {
          state.stats[deviceType] = { id: deviceType, label: deviceLabels[deviceType] || deviceType, count: 0 }
        }

        state.stats[deviceType].count += 1

        return state
      },
      { seenSessions: new Set(), stats: {} },
    )
    const deviceStats = Object.values(deviceSessionStats.stats).sort((a, b) => b.count - a.count)

    const partnerClickStats = Object.values(
      partnerClicks.reduce((stats, event) => {
        const partnerId = getPartnerClickId(event) || 'unknown'

        if (!stats[partnerId]) {
          stats[partnerId] = {
            id: partnerId,
            label: partnerLabelById[partnerId] || partnerId,
            count: 0,
          }
        }

        stats[partnerId].count += 1

        return stats
      }, {}),
    ).sort((a, b) => b.count - a.count)

    const faqStatsById = activeFaqItems.reduce((stats, faq) => {
      const id = faq.id || faq.question
      stats[id] = {
        id,
        closeCount: 0,
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
          id: interaction.faqId,
          closeCount: 0,
          lastOpenedAt: '',
          openCount: 0,
          opened: false,
          question: faqLabelById[interaction.faqId] || interaction.faqId,
          sortOrder: 999,
        }
      }

      if (interaction.action === 'close') {
        faqStatsById[interaction.faqId].closeCount += 1
      } else {
        const currentLastOpened = Date.parse(faqStatsById[interaction.faqId].lastOpenedAt || '')
        const eventDate = Date.parse(event.created_at || '')

        faqStatsById[interaction.faqId].openCount += 1
        faqStatsById[interaction.faqId].opened = true

        if (!faqStatsById[interaction.faqId].lastOpenedAt || eventDate > currentLastOpened) {
          faqStatsById[interaction.faqId].lastOpenedAt = event.created_at
        }
      }
    })

    const faqStats = Object.values(faqStatsById).sort((a, b) => {
      if (a.opened !== b.opened) {
        return Number(b.opened) - Number(a.opened)
      }

      return a.sortOrder - b.sortOrder
    })

    const totalDuration = sectionStats.reduce((sum, section) => sum + section.totalDuration, 0)

    return {
      averageSectionDuration:
        sectionViews.length > 0 ? Math.round(totalDuration / sectionViews.length) : 0,
      deviceStats,
      faqInteractions,
      faqLabelById,
      faqStats,
      hiddenDesktopDuplicatePageViews: events.length - reportEvents.length,
      openedFaqCount: faqStats.filter((faq) => faq.opened).length,
      pageViews,
      partnerClicks,
      partnerClickStats,
      sectionStats,
      uniqueVisitors: uniqueSessions.size,
      visitorLogs: reportEvents,
    }
  }, [events, faqItems])

  const visitorPageCount = Math.max(1, Math.ceil(report.visitorLogs.length / visitorLogsPageSize))
  const safeVisitorPage = Math.min(visitorPage, visitorPageCount)
  const paginatedVisitorLogs = report.visitorLogs.slice(
    (safeVisitorPage - 1) * visitorLogsPageSize,
    safeVisitorPage * visitorLogsPageSize,
  )

  const downloadReport = () => {
    downloadHtmlFile({
      body: createAnalyticsReportHtml(report),
      filename: `orion-ziyaretci-raporu-${new Date().toISOString().slice(0, 10)}.html`,
      title: 'ORION Kamp Ziyaretçi Raporu',
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
      setVisitorPage(1)
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
      setVisitorPage(1)
      setStatusMessage('Rapor kayıtları sıfırlandı.')
    }

    setIsResetting(false)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">Raporlar</p>
          <h1 className="admin-title mt-2">Ziyaretçi analitiği</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#222222]/60">
            Sitedeki tüm ziyaret, cihaz, bölüm süresi ve logo tıklama kayıtları.
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

      {isLoading ? (
        <div className="admin-card grid min-h-56 place-items-center p-6 text-center font-black text-[#222222]/62">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin text-[#FF6A2A]" size={19} aria-hidden="true" />
            Raporlar yükleniyor...
          </span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="admin-card p-5">
              <UsersRound className="text-[#FF6A2A]" size={25} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{report.uniqueVisitors}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Tekil oturum</p>
            </div>
            <div className="admin-card p-5">
              <BarChart3 className="text-[#FF6A2A]" size={25} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{report.pageViews.length}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Sayfa görüntüleme</p>
            </div>
            <div className="admin-card p-5">
              <Clock3 className="text-[#FF6A2A]" size={25} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">
                {formatDuration(report.averageSectionDuration)}
              </p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Ortalama bölüm süresi</p>
            </div>
            <div className="admin-card p-5">
              <BarChart3 className="text-[#FF6A2A]" size={25} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">{report.partnerClicks.length}</p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Logo tıklaması</p>
            </div>
            <div className="admin-card p-5">
              <BarChart3 className="text-[#FF6A2A]" size={25} aria-hidden="true" />
              <p className="mt-4 text-3xl font-black text-[#222222]">
                {report.openedFaqCount}/{report.faqStats.length}
              </p>
              <p className="mt-1 text-sm font-bold text-[#222222]/58">Açılan SSS</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="admin-card p-5">
              <h2 className="text-xl font-black text-[#222222]">Bölümlerde geçirilen süre</h2>
              <div className="mt-4 grid gap-3">
                {report.sectionStats.length > 0 ? (
                  report.sectionStats.map((section) => (
                    <div key={section.id} className="rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-[#222222]">{section.label}</span>
                        <span className="text-sm font-black text-[#FF6A2A]">
                          {formatDuration(section.totalDuration)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#222222]/58">
                        {section.views} ölçüm · Ortalama {formatDuration(section.totalDuration / section.views)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58">
                    Henüz bölüm süresi verisi yok.
                  </p>
                )}
              </div>
            </section>

            <section className="admin-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-[#222222]">
                <MonitorSmartphone size={22} className="text-[#FF6A2A]" aria-hidden="true" />
                Cihaz dağılımı
              </h2>
              <div className="mt-4 grid gap-3">
                {report.deviceStats.length > 0 ? (
                  report.deviceStats.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4"
                    >
                      <span className="font-black text-[#222222]">{device.label}</span>
                      <span className="admin-pill">{device.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58">
                    Henüz cihaz verisi yok.
                  </p>
                )}
              </div>
            </section>

            <section className="admin-card p-5 xl:col-span-2">
              <h2 className="text-xl font-black text-[#222222]">Logo tıklamaları</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {report.partnerClickStats.length > 0 ? (
                  report.partnerClickStats.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4"
                    >
                      <span className="font-black text-[#222222]">{partner.label}</span>
                      <span className="admin-pill">{partner.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58 sm:col-span-3">
                    Henüz logo tıklaması yok.
                  </p>
                )}
              </div>
            </section>

            <section className="admin-card p-5 xl:col-span-2">
              <h2 className="text-xl font-black text-[#222222]">SSS açılma raporu</h2>
              <div className="mt-4 grid gap-3">
                {report.faqStats.length > 0 ? (
                  report.faqStats.map((faq) => (
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
                          faq.opened ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#fff1f2] text-[#be123c]'
                        }`}
                      >
                        {faq.opened ? 'Açıldı' : 'Açılmadı'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58">
                    SSS kaydı bulunamadı.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="admin-card mt-6 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#222222]">Son ziyaretler</h2>
                <p className="mt-1 text-sm font-bold text-[#222222]/58">
                  {report.visitorLogs.length} log kaydı · Sayfa {safeVisitorPage}/{visitorPageCount}
                </p>
                {report.hiddenDesktopDuplicatePageViews > 0 && (
                  <p className="mt-1 text-xs font-bold text-[#222222]/45">
                    {report.hiddenDesktopDuplicatePageViews} masaüstü aynı oturum tekrarı rapordan çıkarıldı.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {paginatedVisitorLogs.length > 0 ? (
                paginatedVisitorLogs.map((visit, index) => (
                  <div
                    key={visit.id || `${visit.session_id}-${visit.created_at}-${index}`}
                    className="grid gap-3 rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4 lg:grid-cols-[10rem_minmax(0,1fr)_12rem_auto]"
                  >
                    <div>
                      <span className="admin-pill">{getEventTypeLabel(visit)}</span>
                      <p className="mt-2 text-xs font-black text-[#FF6A2A]">
                        {formatDateTime(visit.created_at)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-[#222222]">
                        {getEventDetailLabel(visit, report.faqLabelById)}
                      </p>
                      <p className="break-words text-sm font-black text-[#222222]">
                        {visit.path || '#/'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#222222]/52">
                        Oturum: {visit.session_id || '-'}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-[#222222]/62">
                      <p>{deviceLabels[visit.device_type] || visit.device_type || 'Bilinmiyor'}</p>
                      <p>
                        {visit.viewport_width || '-'}x{visit.viewport_height || '-'}
                      </p>
                    </div>
                    <span className="text-sm font-black text-[#FF6A2A]">
                      {visit.duration_ms ? formatDuration(visit.duration_ms) : '-'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58">
                  Henüz ziyaret kaydı yok.
                </p>
              )}
            </div>

            {visitorPageCount > 1 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {Array.from({ length: visitorPageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setVisitorPage(pageNumber)}
                    className={`grid size-10 place-items-center rounded-2xl border text-sm font-black transition ${
                      pageNumber === safeVisitorPage
                        ? 'border-[#FF6A2A] bg-[#FF6A2A] text-white shadow-[0_12px_28px_rgba(255,106,42,0.22)]'
                        : 'border-[#FFE0CC] bg-white text-[#FF6A2A] hover:bg-[#FFF1E8]'
                    }`}
                    aria-current={pageNumber === safeVisitorPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default AnalyticsReport
