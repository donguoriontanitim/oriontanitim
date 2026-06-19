import { whatsappMessage, whatsappNumber } from '../fallbackContent.js'
import { insertAnalyticsEvent } from './analytics.js'

export const normalizePhoneDigits = (phoneNumber = '') =>
  String(phoneNumber || '').replace(/\D/g, '') || whatsappNumber

export const getPhoneHref = (phoneNumber = '') => `tel:${normalizePhoneDigits(phoneNumber)}`

export const getWhatsAppUrl = (phoneNumber = whatsappNumber, message = whatsappMessage) =>
  `https://wa.me/${normalizePhoneDigits(phoneNumber)}?text=${encodeURIComponent(message)}`

export const trackCtaClick = ({
  buttonLabel,
  ctaType,
  eventName,
  sectionName,
  target = '',
}) =>
  insertAnalyticsEvent({
    button_label: buttonLabel,
    cta_type: ctaType,
    event_name: eventName || ctaType,
    event_type: 'cta_click',
    source_section: sectionName,
    target,
  })
