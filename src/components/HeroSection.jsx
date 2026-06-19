import {
  BookOpen,
  Cpu,
  Dumbbell,
  GraduationCap,
  Orbit,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { insertAnalyticsEvent } from '../lib/analytics.js'
import { getPhoneHref, getWhatsAppUrl, trackCtaClick } from '../lib/contactLinks.js'
import { createSectionBackgroundStyle, getRelatedKeyForItem } from '../lib/siteImages.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'

const salesHero = {
  eyebrow: 'Trabzon’da 7–13 Yaş Çocuklar İçin Tam Gün Yaz Kampı',
  title: 'Çocuğunuz Yaz Tatilinde Hem Eğlensin Hem Geleceğin Becerilerini Kazansın',
  description:
    'ORION Kamp; bilişim, yüzme, jimnastik, futbol, eğlenceli İngilizce, oyunlarla matematik ve sanat atölyelerini tek programda birleştiren 4 haftalık tam gün yaz kampıdır.',
}

const heroTrustItems = [
  '7–13 yaş grubu',
  'Hafta içi 5 gün',
  '09:00–17:00 tam gün',
  'Haftada 5 gün bilişim',
  '2 gün yüzme',
  '2 gün jimnastik',
  '1 gün futbol',
  'Profesyonel eğitmenler',
  'Kontenjan sınırlı',
  'Erken kayıt: 25 Haziran',
]

const salesReasonCards = [
  {
    title: 'Tam Gün Güvenli Program',
    text: 'Çocuklar gün boyunca planlı, takip edilen ve dengeli bir program içinde ilerler.',
    icon: ShieldCheck,
  },
  {
    title: 'Teknoloji + Spor Dengesi',
    text: 'Sadece ekran başında değil; yüzme, jimnastik ve futbol ile hareketli bir kamp deneyimi.',
    icon: Dumbbell,
  },
  {
    title: 'Geleceğe Hazırlayan İçerik',
    text: 'Robotik, oyun tasarımı, 3D tasarım, blok tabanlı programlama ve web temelleri.',
    icon: Cpu,
  },
  {
    title: 'Profesyonel Akademi İş Birlikleri',
    text: 'Yüzme, jimnastik ve futbol alanlarında uzman ekiplerle yürütülen program.',
    icon: GraduationCap,
  },
]

const partnerLogoImageClasses = [
  'h-full w-full scale-[1.38] object-contain sm:scale-[1.5]',
  'h-full w-full scale-[0.96] object-contain sm:scale-105',
  'h-full w-full scale-[0.96] object-contain sm:scale-105',
]

const normalizeInstagramUrl = (value) => {
  const trimmedValue = String(value || '').trim()

  if (!trimmedValue) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  const username = trimmedValue.replace(/^@/, '').replace(/^instagram\.com\//i, '')

  return username ? `https://www.instagram.com/${username}` : ''
}

const getHeroTitleClass = (titleValue) => {
  const titleLength = String(titleValue || '').length

  if (titleLength > 48) {
    return 'text-[1.9rem] leading-[1.14] min-[390px]:text-[2.1rem] sm:text-[2.75rem] sm:leading-[1.1] lg:text-[3.2rem] lg:leading-[1.08]'
  }

  if (titleLength > 32) {
    return 'text-[2.05rem] leading-[1.12] min-[390px]:text-[2.25rem] sm:text-[3rem] sm:leading-[1.08] lg:text-[3.55rem] lg:leading-[1.06]'
  }

  return 'text-[2.35rem] leading-[1.06] sm:text-[3.45rem] sm:leading-[1.02] lg:text-[4.4rem] lg:leading-[1]'
}

function HeroSection({ content, contactInfo, desktopImage, mobileImage, partnerLogosByKey = {}, backgroundImage }) {
  const title = salesHero.title
  const heroTitleClass = getHeroTitleClass(title)
  const primaryLabel = 'WhatsApp’tan Hemen Bilgi Al'
  const phoneLabel = 'Telefonla Ara'
  const secondaryLabel = 'Programı İncele'
  const desktopImageUrl = desktopImage?.image_url || content?.image
  const mobileImageUrl = mobileImage?.image_url || desktopImageUrl
  const whatsappUrl = getWhatsAppUrl(contactInfo?.phone1)
  const phoneUrl = getPhoneHref(contactInfo?.phone1)
  const heroImageAlt =
    mobileImage?.alt_text ||
    desktopImage?.alt_text ||
    'ORION KAMP 2026 teknoloji, robotik ve uzay temalı çocuk yaz kampı'
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)
  const trackHeroCta = ({ buttonLabel, ctaType, target = '' }) =>
    trackCtaClick({
      buttonLabel,
      ctaType,
      eventName: 'hero_cta_click',
      sectionName: 'hero',
      target,
    })

  const handlePartnerLogoClick = async (event, instagramUrl, partnerId) => {
    event.preventDefault()

    const nextWindow = window.open('about:blank', '_blank')

    if (nextWindow) {
      nextWindow.opener = null
    }

    await insertAnalyticsEvent({
      event_type: 'partner_click',
      section_id: partnerId,
    })

    if (nextWindow) {
      nextWindow.location.href = instagramUrl
      return
    }

    window.open(instagramUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section
      id="hero"
      className="section-background-frame soft-orbit-bg relative isolate overflow-hidden pt-[6.75rem] sm:pt-[8.5rem] lg:pt-[9.5rem]"
      style={backgroundStyle}
    >
      <div className="orbit-ring -left-20 top-36 hidden h-[19rem] w-[19rem] sm:block" />
      <div className="orbit-ring -right-24 top-28 hidden h-[26rem] w-[26rem] sm:block" />
      <div className="pointer-events-none absolute left-[8%] top-32 hidden rounded-full bg-[#FFD166]/45 p-2 text-[#FF6A2A] shadow-[0_12px_34px_rgba(255,106,42,0.16)] sm:block">
        <Sparkles size={18} aria-hidden="true" />
      </div>
      <div className="pointer-events-none absolute bottom-24 right-[10%] hidden rounded-full bg-white p-3 text-[#22B8D6] shadow-[0_16px_44px_rgba(34,184,214,0.14)] lg:block">
        <Orbit size={24} aria-hidden="true" />
      </div>

      <div className="section-shell relative z-10">
        <div className="grid min-h-[calc(100svh-7rem)] items-center gap-8 py-7 sm:gap-12 sm:py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-14">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-4 inline-flex max-w-full items-start gap-2 rounded-full border border-[#FFE0CC] bg-white/86 px-3.5 py-2 text-xs font-black leading-snug text-[#222222] shadow-sm backdrop-blur sm:mb-6 sm:px-4 sm:text-sm">
              <Rocket className="mt-0.5 shrink-0 text-[#FF6A2A]" size={17} aria-hidden="true" />
              <span className="min-w-0 break-words">{salesHero.eyebrow}</span>
            </div>

            <h1
              className={`max-w-3xl break-words font-black tracking-normal text-[#222222] [text-wrap:balance] ${heroTitleClass}`}
            >
              {title}
            </h1>

            <p className="mt-4 max-w-xl break-words text-base font-semibold leading-7 text-[#222222]/72 sm:mt-6 sm:text-xl sm:leading-8">
              {salesHero.description}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackHeroCta({
                    buttonLabel: primaryLabel,
                    ctaType: 'cta_whatsapp_click',
                    target: 'whatsapp',
                  })
                }
                className="orion-gradient orion-gradient-hover cta-orange inline-flex min-h-13 min-w-0 items-center justify-center gap-2 rounded-full px-6 py-4 text-center text-base font-black leading-snug text-white transition"
              >
                <WhatsAppIcon size={20} />
                <span className="min-w-0 break-words">{primaryLabel}</span>
              </a>
              <a
                href={phoneUrl}
                onClick={() =>
                  trackHeroCta({
                    buttonLabel: phoneLabel,
                    ctaType: 'cta_phone_click',
                    target: 'phone1',
                  })
                }
                className="inline-flex min-h-13 min-w-0 items-center justify-center gap-2 rounded-full border border-[#FFE0CC] bg-white px-6 py-4 text-center text-base font-black leading-snug text-[#222222] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF1E8] hover:text-[#FF6A2A]"
              >
                <Phone className="shrink-0 text-[#FF6A2A]" size={19} aria-hidden="true" />
                <span className="min-w-0 break-words">{phoneLabel}</span>
              </a>
              <a
                href="#/program"
                onClick={() =>
                  trackHeroCta({
                    buttonLabel: secondaryLabel,
                    ctaType: 'program_cta_click',
                    target: 'program',
                  })
                }
                className="landing-secondary-button min-w-0 text-center text-base leading-snug sm:min-h-13"
              >
                <BookOpen className="shrink-0" size={19} aria-hidden="true" />
                <span className="min-w-0 break-words">{secondaryLabel}</span>
              </a>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:mt-6 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {heroTrustItems.map((item) => (
                <span
                  key={item}
                  className="shrink-0 rounded-full border border-[#FFE0CC] bg-white/88 px-3 py-2 text-xs font-black text-[#222222]/74 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>

            {content?.partners?.length > 0 && (
              <div className="soft-card mt-7 max-w-xl p-3 sm:mt-8 sm:p-4">
                <p className="flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#FF6A2A] sm:text-xs sm:tracking-[0.18em]">
                  <Star size={14} aria-hidden="true" />
                  Anlaşmalı uzman eğitim kurumları
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                  {content.partners.slice(0, 3).map((partner, index) => {
                    const partnerLogo = partnerLogosByKey[getRelatedKeyForItem(partner, 'partner_logo')]
                    const logoUrl = partnerLogo?.image_url || partner.logo_url || partner.logo
                    const logoAlt = partnerLogo?.alt_text || partnerLogo?.title || partner.name
                    const instagramUrl = normalizeInstagramUrl(partner.instagram_url)
                    const logoContent = logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={logoAlt}
                        className={partnerLogoImageClasses[index] || 'h-full w-full object-contain'}
                      />
                    ) : (
                      <span className="text-center text-xs font-black tracking-[0.12em] text-[#222222]/48">
                        {partner.shortName || 'LOGO'}
                      </span>
                    )
                    const logoCardClass =
                      'flex h-20 items-center justify-center overflow-hidden rounded-2xl border border-[#FFE0CC] bg-white p-1.5 shadow-sm transition sm:h-24 sm:p-2'

                    if (instagramUrl) {
                      return (
                        <a
                          key={partner.id || partner.name}
                          href={instagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) =>
                            handlePartnerLogoClick(
                              event,
                              instagramUrl,
                              partner.id || `partner-${index + 1}`,
                            )
                          }
                          className={`${logoCardClass} hover:-translate-y-0.5 hover:border-[#FF6A2A]/45 hover:shadow-[0_18px_36px_rgba(255,106,42,0.14)]`}
                          title={`${partner.name} Instagram`}
                          aria-label={`${partner.name} Instagram hesabını aç`}
                        >
                          {logoContent}
                        </a>
                      )
                    }

                    return (
                      <div
                        key={partner.id || partner.name}
                        className={logoCardClass}
                        title={partner.name}
                      >
                        {logoContent}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="relative mx-auto min-w-0 w-full max-w-2xl lg:mx-0 lg:ml-auto">
            <div className="absolute -inset-2 rounded-[2rem] bg-[radial-gradient(circle_at_24%_20%,rgba(255,209,102,0.5),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(34,184,214,0.18),transparent_26%),linear-gradient(135deg,#FFF1E8,#FFFFFF)] sm:-inset-5 sm:rounded-[3rem]" />
            <div className="absolute -right-3 top-10 z-10 hidden rounded-full border border-[#FFE0CC] bg-white px-4 py-3 text-sm font-black text-[#222222] shadow-[0_18px_46px_rgba(255,106,42,0.16)] sm:flex sm:items-center sm:gap-2">
              <Orbit className="text-[#FF6A2A]" size={17} aria-hidden="true" />
              Robotik-Yüzme-Jimnastik
            </div>
            <div className="soft-card-strong relative overflow-hidden p-2 sm:p-3">
              <picture>
                {mobileImageUrl && mobileImageUrl !== desktopImageUrl && (
                  <source media="(max-width: 639px)" srcSet={mobileImageUrl} />
                )}
                <img
                  src={desktopImageUrl}
                  alt={heroImageAlt}
                  className="aspect-[4/3] w-full rounded-[1.35rem] bg-[#FFF8F0] object-contain sm:rounded-[1.7rem] sm:object-cover"
                />
              </picture>
            </div>
            <div className="absolute -bottom-4 left-4 rounded-2xl border border-[#FFE0CC] bg-white px-4 py-3 text-[#222222] shadow-[0_20px_54px_rgba(11,16,38,0.12)] sm:-bottom-5 sm:left-5 sm:rounded-3xl sm:px-5 sm:py-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF6A2A]">Yaş</p>
              <p className="text-2xl font-black sm:text-3xl">7–13</p>
            </div>
          </div>
        </div>

        <div className="pb-8 sm:pb-10">
          <div className="rounded-[1.75rem] border border-[#FFE0CC] bg-white/92 p-4 shadow-[0_22px_70px_rgba(255,106,42,0.1)] sm:rounded-[2.25rem] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-eyebrow">Hızlı Karar İçin</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-[#222222] sm:text-3xl">
                  Veliler ORION Kampı Neden Tercih Ediyor?
                </h2>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackHeroCta({
                    buttonLabel: 'Kontenjan Durumunu Sor',
                    ctaType: 'cta_whatsapp_click',
                    target: 'hero_reason_block',
                  })
                }
                className="orion-gradient cta-orange inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white"
              >
                <WhatsAppIcon size={18} />
                Kontenjan Durumunu Sor
              </a>
            </div>
            <div className="mt-5 grid gap-3 min-[390px]:grid-cols-2 lg:grid-cols-4">
              {salesReasonCards.map((item) => {
                const Icon = item.icon

                return (
                  <article key={item.title} className="rounded-[1.25rem] border border-[#FFE0CC] bg-[#FFFBF5] p-4">
                    <span className="icon-bubble grid size-11 shrink-0 place-items-center rounded-2xl">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-black leading-snug text-[#222222]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#222222]/62">
                      {item.text}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
