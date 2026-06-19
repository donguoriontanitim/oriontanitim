import { BadgeCheck, Rocket, ShieldCheck, SmilePlus, Sparkles, UsersRound } from 'lucide-react'
import { createSectionBackgroundStyle, getRelatedKeyForItem } from '../lib/siteImages.js'

const icons = [Rocket, UsersRound, ShieldCheck, SmilePlus, Sparkles, BadgeCheck]

const benefitItems = [
  {
    id: 'ureten-cocuk',
    title: 'Üreten çocuk',
    text: 'Robotik, tasarım ve programlama etkinliklerinde fikirlerini ürüne dönüştürmeyi dener.',
  },
  {
    id: 'hareket-eden-cocuk',
    title: 'Hareket eden çocuk',
    text: 'Yüzme, jimnastik ve futbol ile gün içinde enerjisini dengeli şekilde kullanır.',
  },
  {
    id: 'sosyallesen-cocuk',
    title: 'Sosyalleşen çocuk',
    text: 'Takım etkinlikleri ve oyunlarla yeni arkadaşlıklar kurar, iletişim becerisi gelişir.',
  },
  {
    id: 'ozguven-kazanan-cocuk',
    title: 'Özgüven kazanan çocuk',
    text: 'Yeni şeyler denedikçe, öğrendikçe ve başardıkça kendini daha güçlü hisseder.',
  },
  {
    id: 'teknolojiyi-dogru-kullanan-cocuk',
    title: 'Teknolojiyi doğru kullanan çocuk',
    text: 'Teknolojiyi sadece tüketmek yerine üretim, problem çözme ve keşif için kullanır.',
  },
  {
    id: 'ilgi-alanlarini-kesfeden-cocuk',
    title: 'Yeni ilgi alanları keşfeden çocuk',
    text: 'Spor, sanat, İngilizce ve bilişim atölyeleriyle kendine uygun alanları tanır.',
  },
]

const cardAccents = [
  {
    icon: 'bg-[#FF6A2A] text-white shadow-[0_16px_34px_rgba(255,106,42,0.24)]',
    mark: 'bg-[#FF6A2A]',
  },
  {
    icon: 'bg-[#22B8D6] text-white shadow-[0_16px_34px_rgba(34,184,214,0.2)]',
    mark: 'bg-[#22B8D6]',
  },
  {
    icon: 'bg-[#FF6A2A] text-white shadow-[0_16px_34px_rgba(255,106,42,0.22)]',
    mark: 'bg-[#FFD166]',
  },
  {
    icon: 'bg-[#FF6A2A] text-white shadow-[0_16px_34px_rgba(255,106,42,0.22)]',
    mark: 'bg-[#FF6A2A]',
  },
  {
    icon: 'bg-[#FFD166] text-[#222222] shadow-[0_16px_34px_rgba(255,209,102,0.24)]',
    mark: 'bg-[#FFD166]',
  },
  {
    icon: 'bg-[#22B8D6] text-white shadow-[0_16px_34px_rgba(34,184,214,0.2)]',
    mark: 'bg-[#FF6A2A]',
  },
]

function WhyOrionSection({ imagesByRelatedKey = {}, backgroundImage }) {
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)

  return (
    <section
      id="neden-orion"
      className="section-background-frame relative bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFBF5_100%)] py-12 text-[#222222] sm:py-14 lg:py-16"
      style={backgroundStyle}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#FFE0CC]" />

      <div className="section-shell relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">NEDEN ORION?</p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-[#222222] min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
            ORION Kamp Sadece Bir Yaz Kampı Değil
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#222222]/64 sm:text-lg sm:leading-8">
            Çocuğunuz yaz tatilini sadece vakit geçirerek değil; üreterek, hareket ederek,
            sosyalleşerek ve yeni beceriler kazanarak değerlendirir.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {benefitItems.map((item, index) => {
            const Icon = icons[index % icons.length]
            const accent = cardAccents[index % cardAccents.length]
            const relatedKey = getRelatedKeyForItem(item, 'why_orion_card')
            const cardImage = imagesByRelatedKey[relatedKey]

            return (
              <article
                key={item.id || item.title}
                className="soft-card-strong group relative flex min-h-44 flex-col items-center overflow-hidden rounded-[1.5rem] p-5 text-center transition hover:-translate-y-1 sm:min-h-52 sm:rounded-[1.75rem] sm:p-6"
              >
                <span
                  className={`absolute right-5 top-5 size-2.5 rounded-full ${accent.mark} shadow-[0_0_0_7px_rgba(255,224,204,0.55)]`}
                />
                {cardImage ? (
                  <div className="mx-auto aspect-[16/10] w-full overflow-hidden rounded-[1.15rem] border border-[#FFE0CC] bg-[#FFF8F0]">
                    <img
                      src={cardImage.image_url}
                      alt={cardImage.alt_text || cardImage.title || item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className={`grid size-[3.9rem] place-items-center rounded-2xl sm:size-[4.55rem] ${accent.icon}`}>
                    <Icon size={33} strokeWidth={2.4} aria-hidden="true" />
                  </div>
                )}

                <h3 className="mt-4 text-lg font-black leading-snug text-[#222222] sm:mt-5 sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-center text-sm font-semibold leading-7 text-[#222222]/64">
                  {item.text}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default WhyOrionSection
