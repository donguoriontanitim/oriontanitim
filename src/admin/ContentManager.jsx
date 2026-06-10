import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import SafeHtml from '../components/SafeHtml.jsx'
import { fallbackContent } from '../fallbackContent.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const seedContents = [
  {
    id: 'hero-title',
    section_key: 'hero',
    content_key: 'title',
    content_value: 'ORION KAMP 2026',
    content_type: 'text',
    is_html: false,
    is_active: true,
    sort_order: 10,
  },
  {
    id: 'hero-subtitle',
    section_key: 'hero',
    content_key: 'subtitle',
    content_value: '7-13 yaş çocuklar için teknoloji, spor ve eğlence dolu yaz kampı.',
    content_type: 'text',
    is_html: false,
    is_active: true,
    sort_order: 20,
  },
  {
    id: 'summary-body',
    section_key: 'summary',
    content_key: 'body',
    content_value: fallbackContent.summary.html,
    content_type: 'html',
    is_html: true,
    is_active: true,
    sort_order: 30,
  },
]

const getContentId = (content) => `${content.section_key}.${content.content_key}`

function ContentManager() {
  const [contents, setContents] = useState(seedContents)
  const [selectedKey, setSelectedKey] = useState(getContentId(seedContents[0]))
  const [draft, setDraft] = useState(seedContents[0])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    supabase
      .from('site_contents')
      .select(
        'id,section_key,content_key,content_value,content_type,is_html,is_active,sort_order,updated_at',
      )
      .order('section_key', { ascending: true })
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setContents(data)
          setSelectedKey(getContentId(data[0]))
          setDraft(data[0])
        }
      })
  }, [])

  const selectContent = (key) => {
    const next = contents.find((content) => getContentId(content) === key)
    setSelectedKey(key)
    setDraft(next)
    setMessage('')
  }

  const saveContent = async (event) => {
    event.preventDefault()
    setMessage('')

    const payload = {
      section_key: draft.section_key,
      content_key: draft.content_key,
      content_value: draft.content_value,
      content_type: draft.content_type || 'text',
      is_html: draft.is_html,
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order || 0),
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('site_contents')
        .upsert(payload, { onConflict: 'section_key,content_key' })

      if (error) {
        setMessage(error.message)
        return
      }
    }

    setContents((current) =>
      current.map((content) =>
        getContentId(content) === selectedKey ? { ...content, ...payload } : content,
      ),
    )
    setSelectedKey(`${payload.section_key}.${payload.content_key}`)
    setMessage('İçerik kaydedildi.')
  }

  return (
    <div>
      <div className="mb-6">
        <p className="admin-eyebrow">Site Yazıları</p>
        <h1 className="admin-title mt-2">HTML destekli içerik yönetimi</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <div className="admin-card p-4">
          <div className="grid gap-2">
            {contents.map((content) => {
              const key = getContentId(content)

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectContent(key)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-black ${
                    selectedKey === key
                      ? 'orion-gradient text-white shadow-[0_12px_26px_rgba(255,106,42,0.2)]'
                      : 'bg-[#FFFBF5] text-[#222222]/72 hover:bg-[#FFF1E8] hover:text-[#FF6A2A]'
                  }`}
                >
                  <span className="block">{key}</span>
                  <span className="mt-1 block text-xs font-bold opacity-70">
                    {content.is_html ? 'HTML' : 'Text'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={saveContent} className="admin-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="admin-label">
              Bölüm Anahtarı
              <input
                required
                value={draft.section_key}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, section_key: event.target.value }))
                }
                className="admin-input"
              />
            </label>

            <label className="admin-label">
              İçerik Anahtarı
              <input
                required
                value={draft.content_key}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, content_key: event.target.value }))
                }
                className="admin-input"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="admin-label">
              İçerik Tipi
              <input
                value={draft.content_type}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, content_type: event.target.value }))
                }
                className="admin-input"
              />
            </label>

            <label className="admin-label">
              Sıra
              <input
                type="number"
                value={draft.sort_order}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, sort_order: event.target.value }))
                }
                className="admin-input"
              />
            </label>
          </div>

          <label className="admin-label mt-4">
            İçerik
            <textarea
              rows="10"
              value={draft.content_value || ''}
              onChange={(event) =>
                setDraft((current) => ({ ...current, content_value: event.target.value }))
              }
              className="admin-input font-mono text-sm"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="admin-checkbox-card">
              <input
                type="checkbox"
                checked={draft.is_html}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, is_html: event.target.checked }))
                }
              />
              HTML olarak göster
            </label>

            <label className="admin-checkbox-card">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, is_active: event.target.checked }))
                }
              />
              Aktif
            </label>
          </div>

          <div className="admin-panel-soft mt-5 p-4">
            <p className="mb-2 text-sm font-black text-[#222222]/52">Temizlenmiş Önizleme</p>
            {draft.is_html ? (
              <SafeHtml html={draft.content_value} className="leading-7 text-[#222222]/70" />
            ) : (
              <p className="leading-7 text-[#222222]/70">{draft.content_value}</p>
            )}
          </div>

          {message && (
            <div className="admin-message mt-4">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="admin-primary-button mt-5"
          >
            <Save size={18} aria-hidden="true" />
            Kaydet
          </button>
        </form>
      </div>
    </div>
  )
}

export default ContentManager
