import { Phone, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getLandingSectionPath, scrollToLandingSection } from '../lib/sectionNavigation.js'
import { getPhoneHref, getWhatsAppUrl, trackCtaClick } from '../lib/contactLinks.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'

const stickyButtonClass =
  'flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-[0.72rem] font-black leading-tight transition active:scale-[0.98]'

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
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#FFE0CC] bg-white/97 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_48px_rgba(34,34,34,0.12)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp ile bilgi al"
          onClick={() =>
            trackCtaClick({
              buttonLabel: 'WhatsApp',
              ctaType: 'cta_whatsapp_click',
              eventName: 'sticky_mobile_cta_click',
              sectionName: 'sticky_mobile',
              target: 'whatsapp',
            })
          }
          className={`${stickyButtonClass} bg-[#22C55E] !text-white shadow-[0_12px_26px_rgba(34,197,94,0.24)] hover:bg-[#16A34A]`}
        >
          <WhatsAppIcon className="text-white" size={18} />
          <span className="text-white">WhatsApp</span>
        </a>
        <a
          href={getPhoneHref(phone)}
          aria-label="Telefonla ara"
          onClick={() =>
            trackCtaClick({
              buttonLabel: 'Ara',
              ctaType: 'cta_phone_click',
              eventName: 'sticky_mobile_cta_click',
              sectionName: 'sticky_mobile',
              target: 'phone1',
            })
          }
          className={`${stickyButtonClass} border border-[#FFE0CC] bg-[#FFF8F0] text-[#222222] hover:bg-[#FFF1E8] hover:text-[#FF6A2A]`}
        >
          <Phone className="text-[#222222]" size={18} aria-hidden="true" />
          <span>Ara</span>
        </a>
        <a
          href="#/iletisim"
          aria-label="İletişim bölümüne git"
          onClick={goToContact}
          className={`${stickyButtonClass} bg-[#191919] !text-white shadow-[0_12px_26px_rgba(34,34,34,0.22)] hover:bg-[#2A2A2A]`}
        >
          <Send className="text-white" size={17} aria-hidden="true" />
          <span className="text-white">İletişim</span>
        </a>
      </div>
    </div>
  )
}

export default MobileStickyCta
