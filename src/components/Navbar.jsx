import {
  BookOpen,
  CalendarClock,
  CircleHelp,
  Home,
  Images,
  Menu,
  MessageCircle,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import WhatsAppIcon from './WhatsAppIcon.jsx'

const navItems = [
  { label: 'Ana Sayfa', href: '#/hero', icon: Home },
  { label: 'Program', href: '#/program', icon: BookOpen },
  { label: 'Neden Orion?', href: '#/neden-orion', icon: Sparkles },
  { label: 'Günlük Akış', href: '#/akis', icon: CalendarClock },
  { label: 'Galeri', href: '#/galeri', icon: Images },
  { label: 'SSS', href: '#/sss', icon: CircleHelp },
  { label: 'İletişim', href: '#/iletisim', icon: MessageCircle },
]

function Navbar({ contactInfo, logoImage }) {
  const [isOpen, setIsOpen] = useState(false)
  const ctaTitle = contactInfo?.phone1 ? `Bilgi almak için ${contactInfo.phone1}` : 'Bilgi Al'
  const logoUrl = logoImage?.image_url

  const closeMenu = () => setIsOpen(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <nav className="mx-auto w-full max-w-[1180px] rounded-[1.65rem] border border-[#FFE0CC] bg-white/88 shadow-[0_16px_54px_rgba(255,106,42,0.12)] backdrop-blur-xl sm:rounded-[2rem]">
        <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2.5 sm:min-h-18 sm:gap-3 sm:px-4 sm:py-3 lg:px-5">
          <a href="#/hero" className="flex min-w-0 items-center gap-3" onClick={closeMenu}>
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-2xl sm:size-14 ${
                logoUrl
                  ? 'overflow-hidden border border-[#FFE0CC] bg-white shadow-[0_10px_22px_rgba(255,106,42,0.12)]'
                  : 'icon-bubble'
              }`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoImage.alt_text || logoImage.title || 'ORION KAMP logosu'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Rocket size={26} aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black uppercase tracking-[0.18em] text-[#222222]">
                Orion
              </span>
              <span className="block truncate text-xs font-extrabold text-[#FF6A2A]">
                Kamp 2026
              </span>
            </span>
          </a>

          <div className="hidden items-center justify-center gap-1 xl:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-extrabold text-[#222222]/72 transition hover:-translate-y-0.5 hover:bg-[#FFF1E8] hover:text-[#FF6A2A]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#/iletisim"
              title={ctaTitle}
              className="orion-gradient orion-gradient-hover cta-orange inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-black text-white transition sm:px-5"
            >
              <WhatsAppIcon size={18} />
              <span className="hidden sm:inline">Bilgi Al</span>
              <span className="sm:hidden">Bilgi</span>
            </a>

            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#FFE0CC] bg-[#FFF8F0] text-[#FF6A2A] transition hover:-translate-y-0.5 hover:bg-[#FFF1E8] xl:hidden"
              onClick={() => setIsOpen((value) => !value)}
              aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#FF6A2A]/45 to-transparent" />

        {isOpen && (
          <div className="relative max-h-[calc(100dvh-5.75rem)] overflow-y-auto rounded-b-[1.65rem] border-t border-[#FFE0CC] bg-white/96 px-3 py-3 shadow-[0_24px_70px_rgba(11,16,38,0.08)] sm:rounded-b-[2rem] sm:px-4 sm:py-4 xl:hidden">
            <div className="relative grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-black text-[#222222]/78 transition hover:border-[#FFE0CC] hover:bg-[#FFF8F0] hover:text-[#FF6A2A]"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FFF1E8] text-[#FF6A2A]">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    {item.label}
                  </a>
                )
              })}

              <a
                href="#/iletisim"
                onClick={closeMenu}
                title={ctaTitle}
                className="orion-gradient cta-orange mt-2 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition"
              >
                <WhatsAppIcon size={18} />
                Bilgi Al
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
