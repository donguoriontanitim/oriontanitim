import { isSupabaseConfigured, supabase, supabaseRestConfig } from './supabaseClient.js'

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

export const partnerLabelById = {
  'site-logo': 'Site logosu',
  'partner-1': '1. Logo Instagram',
  'partner-2': '2. Logo Instagram',
  'partner-3': '3. Logo Instagram',
}

const partnerClickSectionPrefix = 'partner_click:'
const ctaClickSectionPrefix = 'cta_click:'
const faqOpenSectionPrefix = 'faq_open:'
const faqCloseSectionPrefix = 'faq_close:'

export const encodePartnerClickSectionId = (partnerId = 'unknown') =>
  `${partnerClickSectionPrefix}${partnerId || 'unknown'}`

export const decodePartnerClickSectionId = (sectionId = '') => {
  const normalizedSectionId = String(sectionId || '')

  return normalizedSectionId.startsWith(partnerClickSectionPrefix)
    ? normalizedSectionId.slice(partnerClickSectionPrefix.length)
    : ''
}

export const getPartnerClickId = (event = {}) => {
  if (event.event_type === 'partner_click') {
    return event.section_id || 'unknown'
  }

  return decodePartnerClickSectionId(event.section_id) || ''
}

export const isPartnerClickEvent = (event = {}) => Boolean(getPartnerClickId(event))

export const ctaLabelByType = {
  contact: 'İletişim CTA',
  email: 'E-posta tıklaması',
  form_submit: 'Form gönderimi',
  phone: 'Telefon tıklaması',
  program: 'Program CTA',
  whatsapp: 'WhatsApp tıklaması',
}

export const conversionCtaTypes = ['form_submit', 'phone', 'whatsapp']

export const encodeCtaClickSectionId = (type = 'unknown', sourceSection = 'unknown', target = '') =>
  `${ctaClickSectionPrefix}${type || 'unknown'}:${sourceSection || 'unknown'}:${target || ''}`

export const getCtaClick = (event = {}) => {
  const sectionId = String(event.section_id || '')

  if (event.event_type === 'cta_click') {
    return {
      sourceSection: event.source_section || 'unknown',
      target: event.target || '',
      type: event.cta_type || 'unknown',
    }
  }

  if (!sectionId.startsWith(ctaClickSectionPrefix)) {
    return null
  }

  const [type = 'unknown', sourceSection = 'unknown', ...targetParts] = sectionId
    .slice(ctaClickSectionPrefix.length)
    .split(':')

  return {
    sourceSection: sourceSection || 'unknown',
    target: targetParts.join(':') || '',
    type: type || 'unknown',
  }
}

export const isCtaClickEvent = (event = {}) => Boolean(getCtaClick(event))

export const isConversionEvent = (event = {}) => {
  const ctaClick = getCtaClick(event)

  return ctaClick ? conversionCtaTypes.includes(ctaClick.type) : false
}

export const encodeFaqInteractionSectionId = (action = 'open', faqId = 'unknown') =>
  `${action === 'close' ? faqCloseSectionPrefix : faqOpenSectionPrefix}${faqId || 'unknown'}`

export const getFaqInteraction = (event = {}) => {
  const sectionId = String(event.section_id || '')

  if (event.event_type === 'faq_open') {
    return { action: 'open', faqId: sectionId || 'unknown' }
  }

  if (event.event_type === 'faq_close') {
    return { action: 'close', faqId: sectionId || 'unknown' }
  }

  if (sectionId.startsWith(faqOpenSectionPrefix)) {
    return { action: 'open', faqId: sectionId.slice(faqOpenSectionPrefix.length) || 'unknown' }
  }

  if (sectionId.startsWith(faqCloseSectionPrefix)) {
    return { action: 'close', faqId: sectionId.slice(faqCloseSectionPrefix.length) || 'unknown' }
  }

  return null
}

export const isFaqInteractionEvent = (event = {}) => Boolean(getFaqInteraction(event))

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

export const createAnalyticsPayload = (event) => {
  const isPartnerClick = event.event_type === 'partner_click'
  const isCtaClick = event.event_type === 'cta_click'
  const isFaqInteraction = event.event_type === 'faq_open' || event.event_type === 'faq_close'

  return {
    session_id: getAnalyticsSessionId(),
    event_type: isPartnerClick || isCtaClick || isFaqInteraction ? 'section_view' : event.event_type,
    section_id: isPartnerClick
      ? encodePartnerClickSectionId(event.section_id || 'unknown')
      : isCtaClick
        ? encodeCtaClickSectionId(
            event.cta_type || event.section_id || 'unknown',
            event.source_section || 'unknown',
            event.target || '',
          )
      : isFaqInteraction
        ? encodeFaqInteractionSectionId(
            event.event_type === 'faq_close' ? 'close' : 'open',
            event.section_id || 'unknown',
          )
      : event.section_id || null,
    path: window.location.hash || window.location.pathname,
    referrer: document.referrer || null,
    device_type: getDeviceType(),
    viewport_width: window.innerWidth || null,
    viewport_height: window.innerHeight || null,
    duration_ms: Math.max(0, Math.round(event.duration_ms || 0)),
    user_agent: navigator.userAgent || null,
  }
}

const insertAnalyticsPayloadWithFetch = async (payload) => {
  if (!supabaseRestConfig.url || !supabaseRestConfig.anonKey || typeof fetch === 'undefined') {
    return false
  }

  const response = await fetch(`${supabaseRestConfig.url.replace(/\/$/, '')}/rest/v1/site_analytics`, {
    body: JSON.stringify(payload),
    headers: {
      apikey: supabaseRestConfig.anonKey,
      Authorization: `Bearer ${supabaseRestConfig.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    keepalive: true,
    method: 'POST',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || response.statusText)
  }

  return true
}

export const insertAnalyticsEvent = async (event) => {
  if (!isSupabaseConfigured || typeof window === 'undefined') {
    return false
  }

  const payload = createAnalyticsPayload(event)

  try {
    const insertedWithFetch = await insertAnalyticsPayloadWithFetch(payload)

    if (insertedWithFetch) {
      return true
    }
  } catch (error) {
    console.warn(`Analytics fetch kaydı oluşturulamadı: ${error.message}`)
  }

  const { error } = await supabase.from('site_analytics').insert(payload)

  if (error) {
    console.warn(`Analytics kaydı oluşturulamadı: ${error.message}`)
    return false
  }

  return true
}
