import { Brush, Clock3, Coffee, Gamepad2, Laptop, MessageCircle, Sparkles } from 'lucide-react'
import { getRelatedKeyForItem } from '../lib/siteImages.js'

const flowIcons = [Clock3, Laptop, Gamepad2, Coffee, Brush, Sparkles, MessageCircle]

function DailyFlowSection({ items, imagesByRelatedKey = {} }) {
  const activeItems = items.filter((item) => item.is_active !== false)

  return (
    <section
      id="akis"
      className="bg-[linear-gradient(180deg,#FFFBF5_0%,#FFFFFF_100%)] py-16 text-[#0B1026] sm:py-20 lg:py-24"
    >
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">GÜNLÜK AKIŞ</p>
          <h2 className="mt-3 text-2xl font-black leading-tight min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
            Her gün dolu dolu, planlı ve eğlenceli!
          </h2>
        </div>

        <div className="relative mt-9 sm:mt-12">
          <div className="absolute bottom-8 left-6 top-6 w-0.5 bg-[#FF6A2A]/28 sm:left-7 sm:top-7 lg:hidden" />
          <div className="absolute left-8 right-8 top-7 hidden h-0.5 bg-[#FF6A2A]/28 lg:block" />

          <div className="relative z-10 grid gap-4 sm:gap-5 lg:grid-cols-7 lg:gap-4">
            {activeItems.map((item, index) => {
              const Icon = flowIcons[index % flowIcons.length]
              const relatedKey = getRelatedKeyForItem(item, 'daily_flow')
              const flowImage = imagesByRelatedKey[relatedKey]

              return (
                <article
                  key={item.id || `${item.time}-${item.title}`}
                  className="relative flex gap-3 sm:gap-4 lg:block"
                >
                  {flowImage ? (
                    <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#FFE0CC] bg-white shadow-[0_16px_34px_rgba(255,106,42,0.18)] sm:size-14 lg:mx-auto">
                      <img
                        src={flowImage.image_url}
                        alt={flowImage.alt_text || flowImage.title || item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="orion-gradient grid size-12 shrink-0 place-items-center rounded-full text-white shadow-[0_16px_34px_rgba(255,106,42,0.24)] sm:size-14 lg:mx-auto">
                      <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
                    </div>
                  )}

                  <div className="soft-card-strong min-w-0 flex-1 rounded-[1.35rem] p-4 lg:mt-6 lg:min-h-44 lg:rounded-[1.5rem]">
                    <p className="text-sm font-black text-[#FF6A2A]">{item.time}</p>
                    <h3 className="mt-2 text-base font-black leading-snug text-[#0B1026] sm:text-lg">
                      {item.title}
                    </h3>
                    {item.text && (
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#0B1026]/62">
                        {item.text}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DailyFlowSection
