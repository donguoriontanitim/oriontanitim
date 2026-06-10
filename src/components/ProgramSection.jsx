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
import { createSectionBackgroundStyle, getRelatedKeyForItem } from '../lib/siteImages.js'

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

function ProgramSection({ programs, imagesByRelatedKey = {}, backgroundImage }) {
  const activePrograms = programs.filter((program) => program.is_active !== false)
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)

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
            Teknoloji, spor ve sanat dolu atölyelerle geleceği keşfet!
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
                <p className="mx-auto mt-3 line-clamp-4 max-w-[13rem] text-center text-sm font-semibold leading-6 text-[#222222]/60">
                  {program.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ProgramSection
