import { HelpCircle, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import SafeHtml from './SafeHtml.jsx'

function FaqSection({ faqs, backgroundImage }) {
  const [remoteFaqs, setRemoteFaqs] = useState(null)
  const backgroundStyle = createSectionBackgroundStyle(
    backgroundImage,
    'linear-gradient(180deg, rgba(255,251,245,0.9) 0%, rgba(255,255,255,0.9) 100%)',
  )

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true

    supabase
      .from('faq_items')
      .select('id,question,answer,is_html,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (isMounted && data?.length) {
          setRemoteFaqs(data)
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  const activeFaqs = useMemo(
    () =>
      [...(remoteFaqs || faqs)]
        .filter((faq) => faq.is_active !== false)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    [faqs, remoteFaqs],
  )
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

    return (
      <details
        key={faq.id || faq.question}
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
            <SafeHtml html={faq.answer} className="text-sm font-semibold leading-7 text-[#0B1026]/68" />
          ) : (
            <p className="text-sm font-semibold leading-7 text-[#0B1026]/68">
              {faq.answer}
            </p>
          )}
        </div>
      </details>
    )
  }

  return (
    <section
      id="sss"
      className="bg-[linear-gradient(180deg,#FFFBF5_0%,#FFFFFF_100%)] py-16 text-[#0B1026] sm:py-20 lg:py-24"
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
