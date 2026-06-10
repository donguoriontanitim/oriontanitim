import { Cpu, Dumbbell, GraduationCap, Languages, ShieldCheck, Waves } from 'lucide-react'
import { getRelatedKeyForItem } from '../lib/siteImages.js'
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

function CampSummary({ content, stats = [], imagesByRelatedKey = {} }) {
  const ageStat = stats.find((stat) => stat.label?.toLocaleLowerCase('tr-TR').includes('yaş'))
  const cards = summaryCards.map((card) =>
    card.key === 'yas-araligi' && ageStat?.value ? { ...card, title: `${ageStat.value} Yaş` } : card,
  )

  return (
    <section id="ozet" className="relative bg-white/72 py-14 text-[#0B1026] sm:py-16 lg:py-20">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Kamp Özeti</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            {content.title}
          </h2>
          <SafeHtml html={content.html} className="mt-4 text-base leading-8 text-[#0B1026]/66 sm:text-lg" />
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
                className="soft-card-strong group flex min-h-[12rem] flex-col items-center justify-between p-5 text-center transition hover:-translate-y-1 hover:scale-[1.015] sm:min-h-[13.25rem] sm:p-6 lg:min-h-[14rem]"
              >
                {cardImage ? (
                  <span className="grid size-[7rem] place-items-center overflow-hidden rounded-[1.35rem] border border-[#FFE0CC] bg-white shadow-[0_16px_34px_rgba(11,16,38,0.1)] sm:size-[7.8rem]">
                    <img
                      src={cardImage.image_url}
                      alt={cardImage.alt_text || cardImage.title || card.title}
                      className="h-full w-full object-contain p-2"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span
                    className={`grid size-[7rem] place-items-center rounded-[1.35rem] shadow-[0_16px_34px_rgba(11,16,38,0.1)] sm:size-[7.8rem] ${
                      isBlue
                        ? 'bg-[#E9FAFE] text-[#22B8D6]'
                        : 'bg-[#FFF1E8] text-[#FF6A2A]'
                    }`}
                  >
                    <Icon size={57} aria-hidden="true" />
                  </span>
                )}
                <span>
                  <span className="block text-lg font-black leading-snug text-[#0B1026] sm:text-xl">
                    {card.title}
                  </span>
                  <span className="mt-2 block text-sm font-bold leading-6 text-[#0B1026]/58 sm:text-base">
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
