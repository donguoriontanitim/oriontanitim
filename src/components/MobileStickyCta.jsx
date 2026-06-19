import { Phone, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getLandingSectionPath, scrollToLandingSection } from '../lib/sectionNavigation.js'
import { getPhoneHref, getWhatsAppUrl, trackCtaClick } from '../lib/contactLinks.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'

function MobileStickyCta({ contactInfo }) {
  const navigate = useNavigate()
  const phone = contactInfo?.phone1 || ''
  const whatsappUrl = getWhatsAppUrl(phone)

  const goToContact = (event) => {
    event.preventDefault()
    trackCtaClick({
      buttonLabel: 'Kayıt Bilgisi Al',
      ctaType: 'cta_form_click',
      eventName: 'sticky_mobile_cta_click',
      sectionName: 'sticky_mobile',
      target: 'iletisim',
    })
    navigate(getLandingSectionPath('iletisim'))
    window.requestAnimationFrame(() => scrollToLandingSection('iletisim'))
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#FFE0CC] bg-white/96 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_48px_rgba(34,34,34,0.12)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackCtaClick({
              buttonLabel: 'WhatsApp',
              ctaType: 'cta_whatsapp_click',
              eventName: 'sticky_mobile_cta_click',
              sectionName: 'sticky_mobile',
              target: 'whatsapp',
            })
          }
          className="grid min-h-14 place-items-center rounded-2xl bg-[#25D366] px-2 text-center text-xs font-black leading-tight text-white shadow-[0_12px_26px_rgba(37,211,102,0.24)]"
        >
          <WhatsAppIcon size={18} />
          WhatsApp
        </a>
        <a
          href={getPhoneHref(phone)}
          onClick={() =>
            trackCtaClick({
              buttonLabel: 'Ara',
              ctaType: 'cta_phone_click',
              eventName: 'sticky_mobile_cta_click',
              sectionName: 'sticky_mobile',
              target: 'phone1',
            })
          }
          className="grid min-h-14 place-items-center rounded-2xl border border-[#FFE0CC] bg-[#FFF8F0] px-2 text-center text-xs font-black leading-tight text-[#FF6A2A]"
        >
          <Phone size={18} aria-hidden="true" />
          Ara
        </a>
        <a
          href="#/iletisim"
          onClick={goToContact}
          className="grid min-h-14 place-items-center rounded-2xl bg-[#222222] px-2 text-center text-xs font-black leading-tight text-white shadow-[0_12px_26px_rgba(34,34,34,0.2)]"
        >
          <Send size={17} aria-hidden="true" />
          Kayıt Bilgisi Al
        </a>
      </div>
    </div>
  )
}

export default MobileStickyCta
