import { AtSign, FileText, LayoutDashboard, Mail, MapPin, Phone, Rocket, ShieldCheck } from 'lucide-react'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'

const quickLinks = [
  { label: 'Ana Sayfa', href: '#/?section=hero' },
  { label: 'Kamp Özeti', href: '#/?section=ozet' },
  { label: 'Program', href: '#/?section=program' },
  { label: 'Neden Orion?', href: '#/?section=neden-orion' },
  { label: 'Günlük Akış', href: '#/?section=akis' },
  { label: 'Galeri', href: '#/?section=galeri' },
  { label: 'SSS', href: '#/?section=sss' },
  { label: 'İletişim', href: '#/?section=iletisim' },
]

const legalLinks = [
  { label: 'KVKK', href: '#/kvkk' },
  { label: 'Gizlilik Politikası', href: '#/gizlilik-politikasi' },
  { label: 'Kullanım Şartları', href: '#/kullanim-sartlari' },
]

const fallbackContactInfo = {
  phone1: '0 (532) 723 66 48',
  phone2: '0 (532) 603 66 48',
  mail: 'dongusoft@gmail.com',
  instagram: '@dongu.akademi',
  address: 'Gazipaşa Mah. Yavuz Selim Blv. Mustafa Köstereli İş Mrk. Kat:2 No:10 Ortahisar/Trabzon',
}

const phoneHref = (phone = '') => `tel:${phone.replace(/\D/g, '')}`

function Footer({ contactInfo = fallbackContactInfo, decorationImage, backgroundImage }) {
  const info = { ...fallbackContactInfo, ...contactInfo }
  const instagramHandle = info.instagram.replace('@', '')
  const instagramUrl = `https://www.instagram.com/${instagramHandle}`
  const whatsappUrl = `https://wa.me/${info.phone1.replace(/\D/g, '')}`
  const year = new Date().getFullYear()
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)

  return (
    <footer
      className="section-background-frame relative border-t border-[#FFE0CC] bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFBF5_100%)] text-[#0B1026]"
      style={backgroundStyle}
    >
      <div className="h-1 bg-[linear-gradient(90deg,#FF8A22_0%,#FF6A2A_55%,#EA5438_100%)]" />

      <div className="section-shell py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr_1.15fr_0.85fr]">
          <div className="min-w-0">
            <a href="#/?section=hero" className="inline-flex items-center gap-3">
              <span className="orion-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_16px_34px_rgba(255,106,42,0.22)]">
                <Rocket size={24} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xl font-black tracking-[0.08em]">ORION</span>
                <span className="block text-sm font-black text-[#FF6A2A]">KAMP 2026</span>
              </span>
            </a>

            <p className="mt-5 max-w-sm text-sm font-semibold leading-7 text-[#0B1026]/64">
              7-13 yaş çocuklar için teknoloji, spor, sanat ve oyunlaştırılmış öğrenme odaklı yaz
              kampı.
            </p>
          </div>

          <nav aria-label="Hızlı linkler" className="min-w-0">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#FF6A2A]">
              Hızlı Linkler
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-[#0B1026]/70 lg:grid-cols-1">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 transition hover:bg-[#FFF1E8] hover:text-[#FF6A2A]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <address className="min-w-0 not-italic">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#FF6A2A]">
              İletişim
            </h2>
            <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-[#0B1026]/72">
              <a className="flex min-w-0 items-center gap-3" href={phoneHref(info.phone1)}>
                <Phone className="shrink-0 text-[#FF6A2A]" size={18} aria-hidden="true" />
                <span className="min-w-0 break-words">{info.phone1}</span>
              </a>
              <a className="flex min-w-0 items-center gap-3" href={phoneHref(info.phone2)}>
                <Phone className="shrink-0 text-[#FF6A2A]" size={18} aria-hidden="true" />
                <span className="min-w-0 break-words">{info.phone2}</span>
              </a>
              <a className="flex min-w-0 items-center gap-3" href={`mailto:${info.mail}`}>
                <Mail className="shrink-0 text-[#FF6A2A]" size={18} aria-hidden="true" />
                <span className="min-w-0 break-words">{info.mail}</span>
              </a>
              <a
                className="flex min-w-0 items-center gap-3"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                <AtSign className="shrink-0 text-[#FF6A2A]" size={18} aria-hidden="true" />
                <span className="min-w-0 break-words">{info.instagram}</span>
              </a>
              <span className="flex min-w-0 gap-3">
                <MapPin className="mt-1 shrink-0 text-[#FF6A2A]" size={18} aria-hidden="true" />
                <span className="min-w-0 break-words">{info.address}</span>
              </span>
            </div>
          </address>

          <div className="min-w-0">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#FF6A2A]">
              Sosyal Medya
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram hesabını aç"
                className="orion-gradient grid size-11 place-items-center rounded-full text-white shadow-[0_14px_30px_rgba(255,106,42,0.24)] transition hover:-translate-y-0.5"
              >
                <AtSign size={20} aria-hidden="true" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp ile iletişime geç"
                className="grid size-11 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_14px_30px_rgba(37,211,102,0.22)] transition hover:-translate-y-0.5"
              >
                <WhatsAppIcon size={20} />
              </a>
              <a
                href={`mailto:${info.mail}`}
                aria-label="E-posta gönder"
                className="grid size-11 place-items-center rounded-full border border-[#FFE0CC] bg-white text-[#FF6A2A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF1E8]"
              >
                <Mail size={20} aria-hidden="true" />
              </a>
            </div>

            {decorationImage?.image_url && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#FFE0CC] bg-[#FFF8F0] p-1.5 shadow-sm">
                <img
                  src={decorationImage.image_url}
                  alt={decorationImage.alt_text || decorationImage.title || 'ORION KAMP 2026 dekor görseli'}
                  className="aspect-[16/9] w-full rounded-xl object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="mt-6 grid gap-2 text-sm font-bold text-[#0B1026]/64">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-[#FFF1E8] hover:text-[#FF6A2A]"
                >
                  {link.label === 'KVKK' ? (
                    <ShieldCheck size={16} aria-hidden="true" />
                  ) : (
                    <FileText size={16} aria-hidden="true" />
                  )}
                  {link.label}
                </a>
              ))}

              <a href="#/admin" className="admin-secondary-button mt-2 w-full">
                <LayoutDashboard size={17} aria-hidden="true" />
                Yönetim Paneli
              </a>
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-[#FFE0CC] pt-5 text-xs font-bold text-[#0B1026]/52 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ORION KAMP 2026. Tüm hakları saklıdır.</p>
          <p>Turuncu enerjili, çocuk odaklı yaz kampı deneyimi.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
