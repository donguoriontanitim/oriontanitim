import { Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import SafeHtml from '../components/SafeHtml.jsx'
import { fallbackContent } from '../fallbackContent.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const emptyFaq = {
  id: '',
  question: '',
  answer: '',
  is_html: true,
  sort_order: 0,
  is_active: true,
}

const normalizeFaq = (faq, index = 0) => ({
  ...faq,
  is_html: faq.is_html ?? true,
  sort_order: faq.sort_order ?? faq.position ?? index + 1,
})

function FaqManager() {
  const [faqs, setFaqs] = useState(() => fallbackContent.faqs.map(normalizeFaq))
  const [draft, setDraft] = useState(emptyFaq)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    supabase
      .from('faq_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setFaqs(data)
        }
      })
  }, [])

  const resetDraft = () => {
    setDraft({ ...emptyFaq, sort_order: faqs.length + 1 })
    setMessage('')
  }

  const saveFaq = async (event) => {
    event.preventDefault()
    setMessage('')

    const payload = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      sort_order: Number(draft.sort_order || faqs.length + 1),
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('faq_items').upsert(payload)
      if (error) {
        setMessage(error.message)
        return
      }
    }

    setFaqs((current) => {
      const exists = current.some((faq) => faq.id === payload.id)
      const next = exists
        ? current.map((faq) => (faq.id === payload.id ? payload : faq))
        : [...current, payload]

      return [...next].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    })
    setDraft(emptyFaq)
    setMessage('SSS kaydedildi.')
  }

  const toggleActive = async (faq) => {
    const nextActive = !faq.is_active

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('faq_items').update({ is_active: nextActive }).eq('id', faq.id)
      if (error) {
        setMessage(error.message)
        return
      }
    }

    setFaqs((current) => current.map((item) => (item.id === faq.id ? { ...item, is_active: nextActive } : item)))
  }

  const deleteFaq = async (faqId) => {
    if (!window.confirm('Bu soru silinsin mi?')) {
      return
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('faq_items').delete().eq('id', faqId)
      if (error) {
        setMessage(error.message)
        return
      }
    }

    setFaqs((current) => current.filter((faq) => faq.id !== faqId))
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">Sık Sorulan Sorular</p>
          <h1 className="admin-title mt-2">SSS yönetimi</h1>
        </div>
        <button
          type="button"
          onClick={resetDraft}
          className="admin-primary-button"
        >
          <Plus size={18} aria-hidden="true" />
          Yeni Soru
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-3">
          {faqs.map((faq) => (
            <article key={faq.id} className="admin-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0B1026]/38">
                    Sıra {faq.sort_order || 0} · {faq.is_html ? 'HTML' : 'Text'}
                  </p>
                  <h2 className="mt-2 break-words text-xl font-black text-[#0B1026]">{faq.question}</h2>
                  {faq.is_html ? (
                    <SafeHtml html={faq.answer} className="mt-2 leading-7 text-[#0B1026]/64" />
                  ) : (
                    <p className="mt-2 break-words leading-7 text-[#0B1026]/64">{faq.answer}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleActive(faq)}
                    className={`admin-status-button ${
                      faq.is_active ? 'admin-status-button-active' : 'admin-status-button-muted'
                    }`}
                  >
                    {faq.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...emptyFaq, ...faq })}
                    className="admin-secondary-button min-h-9 rounded-full px-4 py-2 text-xs"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFaq(faq.id)}
                    className="admin-danger-button grid size-9 place-items-center rounded-full p-0"
                    aria-label={`${faq.question} sil`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <form onSubmit={saveFaq} className="admin-card h-fit p-5">
          <h2 className="text-xl font-black">{draft.id ? 'Soru Düzenle' : 'Yeni Soru'}</h2>

          <label className="admin-label mt-4">
            Soru
            <input
              required
              value={draft.question}
              onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
              className="admin-input"
            />
          </label>

          <label className="admin-label mt-4">
            Cevap
            <textarea
              required
              rows="5"
              value={draft.answer}
              onChange={(event) => setDraft((current) => ({ ...current, answer: event.target.value }))}
              className="admin-input"
            />
          </label>

          <label className="admin-label mt-4">
            Sıra
            <input
              type="number"
              value={draft.sort_order}
              onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))}
              className="admin-input"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="admin-checkbox-card">
              <input
                type="checkbox"
                checked={draft.is_html}
                onChange={(event) => setDraft((current) => ({ ...current, is_html: event.target.checked }))}
              />
              HTML cevap
            </label>

            <label className="admin-checkbox-card">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Aktif göster
            </label>
          </div>

          {message && (
            <div className="admin-message mt-4">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="admin-primary-button mt-5 w-full"
          >
            <Save size={18} aria-hidden="true" />
            Kaydet
          </button>
        </form>
      </div>
    </div>
  )
}

export default FaqManager
