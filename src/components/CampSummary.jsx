import { Cpu, Dumbbell, GraduationCap, Languages, ShieldCheck, Waves } from 'lucide-react'
import { createSectionBackgroundStyle, getRelatedKeyForItem } from '../lib/siteImages.js'
import SafeHtml from './SafeHtml.jsx'

const summaryCards = [
  {
    key: 'yas-araligi',
    title: '7–13 Yaş',
    subtitle: 'Çocuklar için',
    icon: GraduationCap,
    tone: 'orange',
  },
  {
    key: 'teknoloji-atolyeleri',
    title: 'Teknoloji Atölyeleri',
    subtitle: 'Üretim ve keşif',
    icon: Cpu,
    tone: 'blue',
  },
  {
    key: 'spor-etkinlikleri',
    title: 'Spor Etkinlikleri',
    subtitle: 'Hareket ve eğlence',
    icon: Dumbbell,
    tone: 'orange',
  },
  {
    key: 'ingilizce-aktiviteler',
    title: 'İngilizce Aktiviteler',
    subtitle: 'Oyunla öğrenme',
    icon: Languages,
    tone: 'blue',
  },
  {
    key: 'yuzme',
    title: 'Yüzme',
    subtitle: 'Yazın enerjisi',
    icon: Waves,
    tone: 'blue',
  },
  {
    key: 'guvenli-kamp',
    title: 'Güvenli Kamp',
    subtitle: 'Tam güvence',
    icon: ShieldCheck,
    tone: 'orange',
  },
]

function CampSummary({ content, stats = [], imagesByRelatedKey = {}, backgroundImage }) {
  const ageStat = stats.find((stat) => stat.label?.toLocaleLowerCase('tr-TR').includes('yaş'))
  const cards = summaryCards.map((card) =>
    card.key === 'yas-araligi' && ageStat?.value ? { ...card, title: `${ageStat.value} Yaş` } : card,
  )
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)

  return (
    <section
      id="ozet"
      className="section-background-frame relative bg-white/72 py-10 text-[#222222] sm:py-12 lg:py-14"
      style={backgroundStyle}
    >
      <div className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Kamp Özeti</p>
          <h2 className="mt-3 break-words text-3xl font-black leading-tight [text-wrap:balance] sm:text-4xl lg:text-5xl">
            {content.title}
          </h2>
          <SafeHtml html={content.html} className="mt-4 break-words text-base leading-8 text-[#222222]/66 sm:text-lg" />
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 min-[390px]:grid-cols-2 sm:mt-10 sm:gap-5 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            const isBlue = card.tone === 'blue'
            const relatedKey = getRelatedKeyForItem(card, 'summary_card')
            const cardImage = imagesByRelatedKey[relatedKey]

            return (
              <article
                key={card.key || card.title}
                className="soft-card-strong group flex min-h-[17.5rem] flex-col items-center justify-start gap-5 p-5 text-center transition hover:-translate-y-1 hover:scale-[1.015] sm:min-h-[18.5rem] sm:p-6 lg:min-h-[20rem] lg:gap-6"
              >
                {cardImage ? (
                  <span className="grid size-[9rem] place-items-center overflow-hidden rounded-[1.75rem] border border-[#FFE0CC] bg-white shadow-[0_18px_38px_rgba(11,16,38,0.12)] sm:size-[10.5rem] lg:size-[12rem]">
                    <img
                      src={cardImage.image_url}
                      alt={cardImage.alt_text || cardImage.title || card.title}
                      className="h-full w-full object-contain p-1.5 sm:p-2"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span
                    className={`grid size-[9rem] place-items-center rounded-[1.75rem] shadow-[0_18px_38px_rgba(11,16,38,0.12)] sm:size-[10.5rem] lg:size-[12rem] ${
                      isBlue
                        ? 'bg-[#E9FAFE] text-[#22B8D6]'
                        : 'bg-[#FFF1E8] text-[#FF6A2A]'
                    }`}
                  >
                    <Icon className="size-[5.4rem] sm:size-[6rem] lg:size-[6.75rem]" aria-hidden="true" />
                  </span>
                )}
                <span>
                  <span className="block text-lg font-black leading-snug text-[#222222] sm:text-xl">
                    {card.title}
                  </span>
                  <span className="mt-2 block text-sm font-bold leading-6 text-[#222222]/58 sm:text-base">
                    {card.subtitle}
                  </span>
                </span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CampSummary
