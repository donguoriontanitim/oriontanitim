import { Cpu, Dumbbell, GraduationCap, Languages, ShieldCheck, Waves } from 'lucide-react'
import SafeHtml from './SafeHtml.jsx'

const summaryCards = [
  {
    title: '7–13 Yaş',
    subtitle: 'Çocuklar için',
    icon: GraduationCap,
    tone: 'orange',
  },
  {
    title: 'Teknoloji Atölyeleri',
    subtitle: 'Üretim ve keşif',
    icon: Cpu,
    tone: 'blue',
  },
  {
    title: 'Spor Etkinlikleri',
    subtitle: 'Hareket ve eğlence',
    icon: Dumbbell,
    tone: 'orange',
  },
  {
    title: 'İngilizce Aktiviteler',
    subtitle: 'Oyunla öğrenme',
    icon: Languages,
    tone: 'blue',
  },
  {
    title: 'Yüzme',
    subtitle: 'Yazın enerjisi',
    icon: Waves,
    tone: 'blue',
  },
  {
    title: 'Güvenli Kamp',
    subtitle: 'Tam güvence',
    icon: ShieldCheck,
    tone: 'orange',
  },
]

function CampSummary({ content, stats = [] }) {
  const ageStat = stats.find((stat) => stat.label?.toLocaleLowerCase('tr-TR').includes('yaş'))
  const cards = summaryCards.map((card) =>
    card.title === '7–13 Yaş' && ageStat?.value ? { ...card, title: `${ageStat.value} Yaş` } : card,
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

        <div className="mt-8 grid gap-3 min-[390px]:grid-cols-2 sm:mt-10 sm:gap-4 lg:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon
            const isBlue = card.tone === 'blue'

            return (
              <article
                key={card.title}
                className="soft-card-strong group flex min-h-36 flex-col justify-between p-4 transition hover:-translate-y-1 hover:scale-[1.015] sm:min-h-40 sm:p-5"
              >
                <span
                  className={`grid size-12 place-items-center rounded-2xl shadow-[0_14px_30px_rgba(11,16,38,0.08)] ${
                    isBlue
                      ? 'bg-[#E9FAFE] text-[#22B8D6]'
                      : 'bg-[#FFF1E8] text-[#FF6A2A]'
                  }`}
                >
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-black leading-snug text-[#0B1026] sm:text-lg">
                    {card.title}
                  </span>
                  <span className="mt-1 block text-sm font-bold leading-5 text-[#0B1026]/58">
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
