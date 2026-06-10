import { BarChart3, Clock3, Loader2, MonitorSmartphone, RefreshCw, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { sectionLabelById } from '../lib/analytics.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const analyticsSelect =
  'id,session_id,event_type,section_id,path,referrer,device_type,viewport_width,viewport_height,duration_ms,user_agent,created_at'

const deviceLabels = {
  desktop: 'Masaüstü',
  mobile: 'Mobil',
  tablet: 'Tablet',
  unknown: 'Bilinmiyor',
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

const getThirtyDaysAgo = () => {
  const date = new Date()
  date.setDate(date.getDate() - 30)

  return date.toISOString()
}

function AnalyticsReport() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchAnalytics = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase bağlantısı yok. Raporlar gerçek veriye bağlanamıyor.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('site_analytics')
      .select(analyticsSelect)
      .gte('created_at', getThirtyDaysAgo())
      .order('created_at', { ascending: false })
      .limit(3000)

    if (error) {
      setErrorMessage(`Rapor verileri alınamadı: ${error.message}`)
      setEvents([])
    } else {
      setEvents(data || [])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(fetchAnalytics, 0)

    return () => window.clearTimeout(timerId)
  }, [fetchAnalytics])

  const report = useMemo(() => {
    const pageViews = events.filter((event) => event.event_type === 'page_view')
    const sectionViews = events.filter((event) => event.event_type === 'section_view')
    const uniqueSessions = new Set(events.map((event) => event.session_id).filter(Boolean))

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

    const deviceStats = Object.values(
      pageViews.reduce((stats, event) => {
        const deviceType = event.device_type || 'unknown'

        if (!stats[deviceType]) {
          stats[deviceType] = { id: deviceType, label: deviceLabels[deviceType] || deviceType, count: 0 }
        }

        stats[deviceType].count += 1

        return stats
      }, {}),
    ).sort((a, b) => b.count - a.count)

    const recentVisitors = Object.values(
      pageViews.reduce((visitors, event) => {
        if (!event.session_id || visitors[event.session_id]) {
          return visitors
        }

        visitors[event.session_id] = event

        return visitors
      }, {}),
    ).slice(0, 8)

    const totalDuration = sectionStats.reduce((sum, section) => sum + section.totalDuration, 0)

    return {
      averageSectionDuration:
        sectionViews.length > 0 ? Math.round(totalDuration / sectionViews.length) : 0,
      deviceStats,
      pageViews,
      recentVisitors,
      sectionStats,
      uniqueVisitors: uniqueSessions.size,
    }
  }, [events])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">Raporlar</p>
          <h1 className="admin-title mt-2">Ziyaretçi analitiği</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#222222]/60">
            Son 30 gün içindeki ziyaret, cihaz ve bölümde geçirilen süre kayıtları.
          </p>
        </div>
        <button type="button" onClick={fetchAnalytics} className="admin-secondary-button">
          <RefreshCw size={17} aria-hidden="true" />
          Yenile
        </button>
      </div>

      {errorMessage && <div className="contact-status contact-status-error mb-6">{errorMessage}</div>}

      {isLoading ? (
        <div className="admin-card grid min-h-56 place-items-center p-6 text-center font-black text-[#222222]/62">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin text-[#FF6A2A]" size={19} aria-hidden="true" />
            Raporlar yükleniyor...
          </span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>

          <section className="admin-card mt-6 p-5">
            <h2 className="text-xl font-black text-[#222222]">Son ziyaretler</h2>
            <div className="mt-4 grid gap-3">
              {report.recentVisitors.length > 0 ? (
                report.recentVisitors.map((visit) => (
                  <div
                    key={visit.session_id}
                    className="grid gap-2 rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-[#222222]">
                        {visit.path || '#/'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#222222]/52">
                        {deviceLabels[visit.device_type] || visit.device_type || 'Bilinmiyor'} ·{' '}
                        {visit.viewport_width || '-'}x{visit.viewport_height || '-'}
                      </p>
                    </div>
                    <span className="text-sm font-black text-[#FF6A2A]">
                      {formatDateTime(visit.created_at)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-[#FFFBF5] p-4 text-sm font-bold text-[#222222]/58">
                  Henüz ziyaret kaydı yok.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default AnalyticsReport
