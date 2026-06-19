import { HelpCircle, Minus, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { insertAnalyticsEvent } from '../lib/analytics.js'
import { getWhatsAppUrl, trackCtaClick } from '../lib/contactLinks.js'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'
import SafeHtml from './SafeHtml.jsx'
import WhatsAppIcon from './WhatsAppIcon.jsx'

const salesFaqs = [
  {
    id: 'age',
    question: 'Kamp hangi yaş grubuna uygun?',
    answer: 'ORION Kamp, 7–13 yaş aralığındaki çocuklar için planlanmıştır. Gruplar yaş ve gelişim düzeyine göre dengeli şekilde yönlendirilir.',
    sort_order: 1,
  },
  {
    id: 'hours',
    question: 'Kamp saatleri nedir?',
    answer: 'Program hafta içi 5 gün, 09:00–17:00 saatleri arasında tam gün olarak uygulanır.',
    sort_order: 2,
  },
  {
    id: 'duration',
    question: 'Kamp kaç hafta sürüyor?',
    answer: 'ORION Kamp 4 haftalık tam gün yaz kampı olarak planlanmıştır. Kontenjan ve dönem bilgisi için hızlıca iletişime geçebilirsiniz.',
    sort_order: 3,
  },
  {
    id: 'swimming',
    question: 'Programda yüzme var mı?',
    answer: 'Evet. Programda haftada 2 gün yüzme etkinliği bulunur. Çocukların yaz enerjisini güvenli ve keyifli şekilde destekler.',
    sort_order: 4,
  },
  {
    id: 'coding-level',
    question: 'Çocuğum kodlama bilmiyorsa katılabilir mi?',
    answer: 'Evet. Atölyeler başlangıç seviyesine uygun ilerler. Çocuklar robotik, oyun tasarımı, 3D tasarım ve programlama temellerini adım adım deneyimler.',
    sort_order: 5,
  },
  {
    id: 'food',
    question: 'Yemek var mı?',
    answer: 'Öğle yemeği imkanı vardır. Detaylar ve günlük akış bilgisi kayıt görüşmesinde net şekilde paylaşılır.',
    sort_order: 6,
  },
  {
    id: 'transfer',
    question: 'Akademiler arası ulaşım nasıl sağlanıyor?',
    answer: 'Akademiler arası transfer kurum tarafından sağlanır. Çocuklar program akışına göre güvenli şekilde yönlendirilir.',
    sort_order: 7,
  },
  {
    id: 'registration',
    question: 'Kayıt için ne yapmam gerekiyor?',
    answer: 'WhatsApp, telefon veya iletişim formu üzerinden bize ulaşmanız yeterli. Size en uygun grup ve kayıt detayları için hızlıca dönüş yapılır.',
    sort_order: 8,
  },
  {
    id: 'quota',
    question: 'Kontenjan sınırlı mı?',
    answer: 'Evet, kontenjan sınırlıdır. Yaş grubu ve dönem uygunluğu için erken bilgi almanızı öneririz.',
    sort_order: 9,
  },
  {
    id: 'early-registration',
    question: 'Erken kayıt ne zamana kadar?',
    answer: 'Erken kayıt fırsatı 25 Haziran’a kadar geçerlidir. Güncel kontenjan ve fırsat bilgisi için WhatsApp’tan sorabilirsiniz.',
    sort_order: 10,
  },
]

function FaqSection({ contactInfo, backgroundImage }) {
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)
  const whatsappUrl = getWhatsAppUrl(contactInfo?.phone1)

  const activeFaqs = salesFaqs
  const faqColumns = useMemo(
    () =>
      activeFaqs.reduce(
        (columns, faq, index) => {
          columns[index % 2].push(faq)

          return columns
        },
        [[], []],
      ),
    [activeFaqs],
  )

  const renderFaq = (faq) => {
    const rendersHtml = faq.is_html !== false
    const faqId = faq.id || faq.question

    return (
      <details
        key={faqId}
        onToggle={(event) =>
          insertAnalyticsEvent({
            event_type: event.currentTarget.open ? 'faq_open' : 'faq_close',
            section_id: faqId,
          })
        }
        className="soft-card-strong group min-w-0 rounded-[1.35rem] border-[#FFE0CC] bg-white sm:rounded-[1.5rem]"
      >
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left text-base font-black leading-snug marker:hidden sm:min-h-18 sm:gap-4 sm:px-6 sm:text-lg">
          <span className="min-w-0 break-words">{faq.question}</span>
          <span className="orion-gradient grid size-9 shrink-0 place-items-center rounded-full text-white shadow-[0_12px_28px_rgba(255,106,42,0.2)]">
            <Plus className="group-open:hidden" size={18} strokeWidth={2.5} aria-hidden="true" />
            <Minus className="hidden group-open:block" size={18} strokeWidth={2.5} aria-hidden="true" />
          </span>
        </summary>
        <div className="mx-3 mb-3 rounded-[1.15rem] border border-[#FFE0CC]/70 bg-[#FFF8F0] px-4 py-4 sm:mx-5 sm:mb-4 sm:rounded-[1.25rem] sm:px-5">
          {rendersHtml ? (
            <SafeHtml html={faq.answer} className="text-sm font-semibold leading-7 text-[#222222]/68" />
          ) : (
            <p className="text-sm font-semibold leading-7 text-[#222222]/68">
              {faq.answer}
            </p>
          )}
          <div className="mt-4 rounded-2xl border border-[#FFE0CC] bg-white p-3">
            <p className="text-sm font-black text-[#222222]">
              Bu konu hakkında detaylı bilgi almak ister misiniz?
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackCtaClick({
                  buttonLabel: 'WhatsApp’tan Sor',
                  ctaType: 'faq_whatsapp_click',
                  eventName: 'faq_whatsapp_click',
                  sectionName: 'sss',
                  target: faqId,
                })
              }
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(37,211,102,0.22)]"
            >
              <WhatsAppIcon size={18} />
              WhatsApp’tan Sor
            </a>
          </div>
        </div>
      </details>
    )
  }

  return (
    <section
      id="sss"
      className="section-background-frame bg-[linear-gradient(180deg,#FFFBF5_0%,#FFFFFF_100%)] py-12 text-[#222222] sm:py-14 lg:py-16"
      style={backgroundStyle}
    >
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2">
            <HelpCircle size={16} aria-hidden="true" />
            SSS
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
            SIKÇA SORULAN SORULAR
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 lg:hidden">
          {activeFaqs.map(renderFaq)}
        </div>

        <div className="mt-10 hidden gap-4 lg:grid lg:grid-cols-2 lg:items-start">
          {faqColumns.map((column, index) => (
            <div key={index} className="grid content-start gap-4">
              {column.map(renderFaq)}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FaqSection
