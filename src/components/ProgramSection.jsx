import {
  Activity,
  Blocks,
  Bot,
  Box,
  CircleDot,
  Gamepad2,
  Languages,
  Palette,
  Sigma,
  Waves,
} from 'lucide-react'
import { getWhatsAppUrl, trackCtaClick } from '../lib/contactLinks.js'
import { createSectionBackgroundStyle, getRelatedKeyForItem } from '../lib/siteImages.js'
import WhatsAppIcon from './WhatsAppIcon.jsx'

const iconMap = {
  Activity,
  Blocks,
  Bot,
  Box,
  CircleDot,
  Gamepad2,
  Languages,
  Palette,
  Sigma,
  Waves,
}

const cardTones = [
  {
    shell: 'from-[#FFF7EC] via-white to-[#FFF1E8]',
    icon: 'bg-[#FFF1E8] text-[#FF6A2A]',
    dot: 'bg-[#FFD166]',
  },
  {
    shell: 'from-[#F0FCFF] via-white to-[#FFF8F0]',
    icon: 'bg-[#E9FAFE] text-[#22B8D6]',
    dot: 'bg-[#22B8D6]',
  },
  {
    shell: 'from-white via-[#FFF8F0] to-[#FFF1E8]',
    icon: 'bg-[#FFF1E8] text-[#FF6A2A]',
    dot: 'bg-[#FF6A2A]',
  },
]

const techProgramIds = ['game-design', 'arduino', '3d-design', 'block-coding']

const salesProgramDescriptions = {
  swimming:
    'Haftada 2 gün yüzme etkinliğiyle çocuklar hem serinler hem fiziksel gelişimlerini destekler.',
  gymnastics:
    'Haftada 2 gün jimnastik ve spor etkinlikleriyle denge, koordinasyon ve hareket becerileri gelişir.',
  football:
    'Haftada 1 gün futbol etkinliğiyle takım ruhu, iletişim ve özgüven desteklenir.',
  english:
    'Oyun temelli İngilizce etkinlikleriyle çocuklar dili daha doğal ve keyifli şekilde deneyimler.',
  math:
    'Matematik, sıkıcı defter çalışmaları yerine oyunlar ve etkinliklerle daha anlaşılır hale gelir.',
  painting:
    'Resim ve yaratıcı atölyelerle çocukların hayal gücü ve ifade becerileri desteklenir.',
}

const getProgramSalesDescription = (program) => {
  const title = String(program.title || '').toLocaleLowerCase('tr-TR')

  if (
    techProgramIds.includes(program.id) ||
    /bilişim|robotik|arduino|kodlama|tasarım|oyun/.test(title)
  ) {
    return 'Robotik, oyun tasarımı, 3D tasarım ve programlama temelleriyle çocuklar teknolojiyi sadece tüketen değil, üreten bireyler olmayı deneyimler.'
  }

  if (/yüzme/.test(title)) {
    return salesProgramDescriptions.swimming
  }

  if (/jimnastik|spor/.test(title)) {
    return salesProgramDescriptions.gymnastics
  }

  if (/futbol/.test(title)) {
    return salesProgramDescriptions.football
  }

  if (/ingilizce/.test(title)) {
    return salesProgramDescriptions.english
  }

  if (/matematik/.test(title)) {
    return salesProgramDescriptions.math
  }

  if (/sanat|resim/.test(title)) {
    return salesProgramDescriptions.painting
  }

  return salesProgramDescriptions[program.id] || program.description
}

function ProgramSection({ programs, contactInfo, imagesByRelatedKey = {}, backgroundImage }) {
  const activePrograms = programs.filter((program) => program.is_active !== false)
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)
  const whatsappUrl = getWhatsAppUrl(contactInfo?.phone1)

  return (
    <section
      id="program"
      className="section-background-frame bg-white/80 py-12 text-[#222222] sm:py-14 lg:py-16"
      style={backgroundStyle}
    >
      <div className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Program İçerikleri</p>
          <h2 className="mt-3 text-3xl font-black tracking-wide text-[#FF6A2A] sm:text-5xl">
            PROGRAM
          </h2>
          <p className="mt-4 text-base font-semibold leading-7 text-[#222222]/66 sm:text-lg sm:leading-8">
            Çocuğunuz teknoloji üretimini, hareketi, İngilizceyi, matematiği ve sanatı aynı
            kamp paketinde deneyimler.
          </p>
        </div>

        <div className="mt-8 grid gap-3 min-[390px]:grid-cols-2 sm:mt-10 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {activePrograms.map((program, index) => {
            const Icon = iconMap[program.icon_name || program.icon] || Gamepad2
            const tone = cardTones[index % cardTones.length]
            const relatedKey = getRelatedKeyForItem(program, 'program_card')
            const cardImage = imagesByRelatedKey[relatedKey]

            return (
              <article
                key={program.id}
                className={`soft-card-strong group relative flex min-h-[13.75rem] flex-col items-center overflow-hidden bg-gradient-to-br ${tone.shell} p-4 text-center transition hover:-translate-y-2 hover:scale-[1.015] sm:min-h-[15.5rem] sm:p-5`}
              >
                <span
                  className={`absolute right-4 top-4 size-3 rounded-full ${tone.dot} shadow-[0_0_0_7px_rgba(255,224,204,0.55)]`}
                />
                <div className="mx-auto mb-4 flex size-[6.5rem] items-center justify-center overflow-hidden rounded-[1.25rem] border border-[#FFE0CC] bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_34px_rgba(11,16,38,0.07)] sm:mb-5 sm:size-[9rem] sm:rounded-[1.5rem]">
                  {cardImage ? (
                    <img
                      src={cardImage.image_url}
                      alt={cardImage.alt_text || cardImage.title || program.title}
                      className="h-full w-full object-contain p-1 transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className={`grid size-[3.9rem] place-items-center rounded-2xl transition group-hover:rotate-[-6deg] group-hover:scale-110 sm:size-[4.55rem] ${tone.icon}`}
                    >
                      <Icon size={34} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  )}
                </div>
                <h3 className="text-center text-base font-black leading-snug text-[#222222] sm:text-lg">
                  {program.title}
                </h3>
                <p className="mx-auto mt-3 line-clamp-5 max-w-[14rem] text-center text-sm font-semibold leading-6 text-[#222222]/62">
                  {getProgramSalesDescription(program)}
                </p>
              </article>
            )
          })}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-3 rounded-[1.5rem] border border-[#FFE0CC] bg-[#FFFBF5] p-5 text-center sm:mt-10 sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-black text-[#222222]">Hangi grup size daha uygun?</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#222222]/62">
              Yaş ve kontenjan durumuna göre en doğru grubu birlikte netleştirebiliriz.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackCtaClick({
                buttonLabel: 'Kontenjan Durumunu Sor',
                ctaType: 'cta_whatsapp_click',
                eventName: 'program_cta_click',
                sectionName: 'program',
                target: 'program_section',
              })
            }
            className="orion-gradient cta-orange inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white"
          >
            <WhatsAppIcon size={18} />
            Kontenjan Durumunu Sor
          </a>
        </div>
      </div>
    </section>
  )
}

export default ProgramSection
