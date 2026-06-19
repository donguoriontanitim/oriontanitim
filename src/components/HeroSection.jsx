import {
  BookOpen,
  Cpu,
  Dumbbell,
  Orbit,
  Palette,
  Rocket,
  Sparkles,
  Waves,
} from 'lucide-react'
import { getWhatsAppUrl, trackCtaClick } from '../lib/contactLinks.js'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'

const salesHero = {
  eyebrow: 'Trabzon’da 7–13 Yaş Tam Gün Yaz Kampı',
  title: 'Yaz Tatilinde Eğlence, Spor ve Teknoloji Bir Arada',
  description:
    'ORION Kamp; bilişim, yüzme, jimnastik, futbol ve yaratıcı atölyeleri tek programda birleştiren 4 haftalık yaz kampıdır.',
}

const heroTrustItems = ['7–13 Yaş', 'Hafta İçi 5 Gün', '09:00–17:00', 'Kontenjan Sınırlı']

const programPreviewCards = [
  {
    title: '5 Gün Bilişim',
    text: 'Robotik, oyun tasarımı, 3D tasarım ve programlama temelleri.',
    icon: Cpu,
  },
  {
    title: '2 Gün Yüzme',
    text: 'Yaz enerjisini güvenli ve keyifli yüzme etkinliğiyle dengeler.',
    icon: Waves,
  },
  {
    title: '2 Gün Jimnastik',
    text: 'Denge, koordinasyon ve hareket becerilerini destekleyen çalışmalar.',
    icon: Dumbbell,
  },
  {
    title: '1 Gün Futbol',
    text: 'Takım ruhu, iletişim ve özgüveni geliştiren saha etkinlikleri.',
    icon: Sparkles,
  },
  {
    title: 'İngilizce & Matematik',
    text: 'Oyun temelli etkinliklerle öğrenmeyi daha canlı hale getirir.',
    icon: BookOpen,
  },
  {
    title: 'Sanat Atölyeleri',
    text: 'Resim ve yaratıcı üretim çalışmalarıyla ifade becerilerini güçlendirir.',
    icon: Palette,
  },
]

const getHeroTitleClass = (titleValue) => {
  const titleLength = String(titleValue || '').length

  if (titleLength > 48) {
    return 'text-[1.62rem] leading-[1.09] min-[390px]:text-[1.76rem] sm:text-[2.75rem] sm:leading-[1.1] lg:text-[3.2rem] lg:leading-[1.08]'
  }

  if (titleLength > 32) {
    return 'text-[1.95rem] leading-[1.1] min-[390px]:text-[2.15rem] sm:text-[3rem] sm:leading-[1.08] lg:text-[3.55rem] lg:leading-[1.06]'
  }

  return 'text-[2.35rem] leading-[1.06] sm:text-[3.45rem] sm:leading-[1.02] lg:text-[4.4rem] lg:leading-[1]'
}

function HeroSection({ content, contactInfo, desktopImage, mobileImage, backgroundImage }) {
  const title = salesHero.title
  const heroTitleClass = getHeroTitleClass(title)
  const primaryLabel = 'WhatsApp’tan Bilgi Al'
  const secondaryLabel = 'Programı İncele'
  const programCtaLabel = 'Kontenjan Durumunu Sor'
  const desktopImageUrl = desktopImage?.image_url || content?.image
  const mobileImageUrl = mobileImage?.image_url || desktopImageUrl
  const whatsappUrl = getWhatsAppUrl(contactInfo?.phone1)
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

  return (
    <>
      <section
        id="hero"
        className="section-background-frame soft-orbit-bg relative isolate overflow-hidden pt-[5.4rem] sm:pt-[8.5rem] lg:pt-[9.25rem]"
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
          <div className="grid items-start gap-6 pt-3 pb-7 sm:min-h-[calc(100svh-8.5rem)] sm:items-center sm:gap-12 sm:py-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:py-14">
            <div className="w-full min-w-0 max-w-[calc(100vw-1.5rem)] sm:max-w-2xl">
              <div className="mb-3 inline-flex max-w-full items-start gap-2 rounded-full border border-[#FFE0CC] bg-white/88 px-3 py-1.5 text-[0.72rem] font-black leading-snug text-[#222222] shadow-sm backdrop-blur sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
                <Rocket className="mt-0.5 shrink-0 text-[#FF6A2A]" size={16} aria-hidden="true" />
                <span className="min-w-0 break-words">{salesHero.eyebrow}</span>
              </div>

              <h1
                className={`max-w-[calc(100vw-1.5rem)] break-words font-black tracking-normal text-[#222222] [text-wrap:balance] sm:max-w-3xl ${heroTitleClass}`}
              >
                {title}
              </h1>

              <p className="mt-3 line-clamp-2 max-w-xl break-words text-[0.94rem] font-semibold leading-6 text-[#222222]/72 sm:mt-6 sm:line-clamp-none sm:text-xl sm:leading-8">
                {salesHero.description}
              </p>

              <div className="mt-4 grid w-full max-w-[calc(100vw-1.5rem)] grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap">
                {heroTrustItems.map((item) => (
                  <span
                    key={item}
                    className="min-w-0 rounded-full border border-[#FFE0CC] bg-white/88 px-3 py-2 text-center text-[0.73rem] font-black leading-tight text-[#222222]/76 shadow-sm sm:text-xs"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid w-full max-w-[calc(100vw-1.5rem)] gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
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
                  className="orion-gradient orion-gradient-hover cta-orange inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-center text-sm font-black leading-snug text-white transition sm:min-h-13 sm:px-6 sm:py-4 sm:text-base"
                >
                  <WhatsAppIcon size={19} />
                  <span className="min-w-0 break-words">{primaryLabel}</span>
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
                  className="landing-secondary-button min-h-12 min-w-0 px-5 py-3 text-center text-sm leading-snug sm:min-h-13 sm:px-6 sm:py-4 sm:text-base"
                >
                  <BookOpen className="shrink-0" size={18} aria-hidden="true" />
                  <span className="min-w-0 break-words">{secondaryLabel}</span>
                </a>
              </div>
            </div>

            {desktopImageUrl && (
              <div className="relative mx-auto hidden min-w-0 w-full max-w-2xl md:block lg:mx-0 lg:ml-auto">
                <div className="absolute -inset-2 rounded-[2rem] bg-[radial-gradient(circle_at_24%_20%,rgba(255,209,102,0.5),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(34,184,214,0.18),transparent_26%),linear-gradient(135deg,#FFF1E8,#FFFFFF)] sm:-inset-5 sm:rounded-[3rem]" />
                <div className="absolute -right-3 top-10 z-10 hidden rounded-full border border-[#FFE0CC] bg-white px-4 py-3 text-sm font-black text-[#222222] shadow-[0_18px_46px_rgba(255,106,42,0.16)] lg:flex lg:items-center lg:gap-2">
                  <Orbit className="text-[#FF6A2A]" size={17} aria-hidden="true" />
                  Bilişim-Spor-Sanat
                </div>
                <div className="soft-card-strong relative overflow-hidden p-2 sm:p-3">
                  <picture>
                    {mobileImageUrl && mobileImageUrl !== desktopImageUrl && (
                      <source media="(max-width: 767px)" srcSet={mobileImageUrl} />
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
            )}
          </div>
        </div>
      </section>

      <section className="section-background-frame relative isolate overflow-hidden bg-[#FFFBF5] py-7 sm:py-10">
        <div className="section-shell">
          <div className="rounded-[1.5rem] border border-[#FFE0CC] bg-white/94 p-4 shadow-[0_18px_58px_rgba(255,106,42,0.09)] sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="section-eyebrow">Kamp İçeriği</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-[#222222] sm:text-3xl">
                  Programda Neler Var?
                </h2>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackHeroCta({
                    buttonLabel: programCtaLabel,
                    ctaType: 'cta_whatsapp_click',
                    target: 'program_preview',
                  })
                }
                className="orion-gradient cta-orange inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white"
              >
                <WhatsAppIcon size={18} />
                {programCtaLabel}
              </a>
            </div>

            <div className="mt-5 grid gap-3 min-[430px]:grid-cols-2 lg:grid-cols-3">
              {programPreviewCards.map((item) => {
                const Icon = item.icon

                return (
                  <article
                    key={item.title}
                    className="flex min-w-0 gap-3 rounded-[1.1rem] border border-[#FFE0CC] bg-[#FFFBF5] p-3.5 sm:p-4"
                  >
                    <span className="icon-bubble grid size-10 shrink-0 place-items-center rounded-2xl">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-black leading-snug text-[#222222]">{item.title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-5 text-[#222222]/62">{item.text}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default HeroSection
