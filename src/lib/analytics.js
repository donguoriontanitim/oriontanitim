import { isSupabaseConfigured, supabase } from './supabaseClient.js'

const analyticsSessionKey = 'orion-analytics-session-id'

export const trackedSections = [
  { id: 'hero', label: 'Ana Sayfa' },
  { id: 'ozet', label: 'Kamp Özeti' },
  { id: 'program', label: 'Program İçerikleri' },
  { id: 'neden-orion', label: 'NEDEN ORION?' },
  { id: 'akis', label: 'Günlük Akış' },
  { id: 'galeri', label: 'Galeri' },
  { id: 'sss', label: 'SSS' },
  { id: 'iletisim', label: 'İletişim' },
]

export const sectionLabelById = trackedSections.reduce(
  (labels, section) => ({ ...labels, [section.id]: section.label }),
  {},
)

export const getDeviceType = () => {
  if (typeof window === 'undefined') {
    return 'unknown'
  }

  const width = window.innerWidth || 0
  const userAgent = navigator.userAgent || ''

  if (/ipad|tablet/i.test(userAgent) || (width >= 640 && width < 1024)) {
    return 'tablet'
  }

  if (/android|iphone|ipod|mobile/i.test(userAgent) || width < 640) {
    return 'mobile'
  }

  return 'desktop'
}

export const getAnalyticsSessionId = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  const existingSessionId = window.sessionStorage.getItem(analyticsSessionKey)

  if (existingSessionId) {
    return existingSessionId
  }

  const nextSessionId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  window.sessionStorage.setItem(analyticsSessionKey, nextSessionId)

  return nextSessionId
}

export const createAnalyticsPayload = (event) => ({
  session_id: getAnalyticsSessionId(),
  event_type: event.event_type,
  section_id: event.section_id || null,
  path: window.location.hash || window.location.pathname,
  referrer: document.referrer || null,
  device_type: getDeviceType(),
  viewport_width: window.innerWidth || null,
  viewport_height: window.innerHeight || null,
  duration_ms: Math.max(0, Math.round(event.duration_ms || 0)),
  user_agent: navigator.userAgent || null,
})

export const insertAnalyticsEvent = async (event) => {
  if (!isSupabaseConfigured || typeof window === 'undefined') {
    return
  }

  const payload = createAnalyticsPayload(event)
  const { error } = await supabase.from('site_analytics').insert(payload)

  if (error) {
    console.warn(`Analytics kaydı oluşturulamadı: ${error.message}`)
  }
}
