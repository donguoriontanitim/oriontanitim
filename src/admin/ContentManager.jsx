import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import SafeHtml from '../components/SafeHtml.jsx'
import { fallbackContent } from '../fallbackContent.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const defaultContactContent = {
  eyebrow: 'İletişim',
  title: 'Sizi Arayalım,',
  highlight: 'Detayları Birlikte Planlayalım',
  description: 'Formu doldurun, en kısa sürede size ulaşalım.',
  quickTitle: 'WhatsApp ile hemen yazın.',
  quickDescription:
    'Formu beklemeden sorularınızı iletebilir, kamp detayları için hızlı dönüş alabilirsiniz.',
}

const createField = ({
  contentKey,
  defaultValue = '',
  help,
  inputType = 'text',
  isHtml = false,
  label,
  multiline = false,
  rows = 4,
  sortOrder,
  type = 'text',
}) => ({
  content_key: contentKey,
  content_type: type,
  defaultValue,
  help,
  inputType,
  is_html: isHtml,
  label,
  multiline,
  rows,
  sort_order: sortOrder,
})

const contentSections = [
  {
    key: 'hero',
    title: 'Ana Sayfa / Hero',
    description: 'Sayfanın ilk ekranındaki başlık, açıklama ve buton yazıları.',
    fields: [
      createField({
        contentKey: 'title',
        defaultValue: fallbackContent.hero.title,
        label: 'Ana başlık',
        sortOrder: 10,
      }),
      createField({
        contentKey: 'eyebrow',
        defaultValue: fallbackContent.hero.eyebrow,
        label: 'Üst küçük başlık',
        sortOrder: 20,
      }),
      createField({
        contentKey: 'subtitle',
        defaultValue: '7-13 yaş çocuklar için teknoloji, spor ve eğlence dolu yaz kampı.',
        label: 'Açıklama metni',
        multiline: true,
        rows: 3,
        sortOrder: 30,
      }),
      createField({
        contentKey: 'primary_button',
        defaultValue: fallbackContent.hero.ctaLabel,
        label: 'Birincil buton yazısı',
        sortOrder: 40,
      }),
      createField({
        contentKey: 'secondary_button',
        defaultValue: fallbackContent.hero.secondaryCtaLabel,
        label: 'İkincil buton yazısı',
        sortOrder: 50,
      }),
    ],
  },
  {
    key: 'summary',
    title: 'Kamp Özeti',
    description: 'Kamp Özeti bölümünde görünen başlık ve açıklama.',
    fields: [
      createField({
        contentKey: 'title',
        defaultValue: fallbackContent.summary.title,
        label: 'Bölüm başlığı',
        sortOrder: 10,
      }),
      createField({
        contentKey: 'body',
        defaultValue: fallbackContent.summary.html,
        isHtml: true,
        label: 'Açıklama',
        multiline: true,
        rows: 6,
        sortOrder: 20,
        type: 'html',
      }),
    ],
  },
  {
    key: 'daily_flow',
    title: 'Günlük Akış',
    description: 'A/B grup isimleri, program başlıkları ve günlük akış notları.',
    fields: [
      createField({
        contentKey: 'eyebrow',
        defaultValue: fallbackContent.dailyFlowContent.eyebrow,
        label: 'Üst küçük başlık',
        sortOrder: 10,
      }),
      createField({
        contentKey: 'title',
        defaultValue: fallbackContent.dailyFlowContent.title,
        label: 'Ana başlık',
        sortOrder: 20,
      }),
      createField({
        contentKey: 'description',
        defaultValue: fallbackContent.dailyFlowContent.description,
        label: 'Açıklama',
        multiline: true,
        rows: 3,
        sortOrder: 30,
      }),
      createField({
        contentKey: 'group_a_label',
        defaultValue: fallbackContent.dailyFlowContent.groupALabel,
        label: 'A grubu üst etiketi',
        sortOrder: 40,
      }),
      createField({
        contentKey: 'group_a_title',
        defaultValue: fallbackContent.dailyFlowContent.groupATitle,
        label: 'A grubu adı',
        sortOrder: 50,
      }),
      createField({
        contentKey: 'group_b_label',
        defaultValue: fallbackContent.dailyFlowContent.groupBLabel,
        label: 'B grubu üst etiketi',
        sortOrder: 60,
      }),
      createField({
        contentKey: 'group_b_title',
        defaultValue: fallbackContent.dailyFlowContent.groupBTitle,
        label: 'B grubu adı',
        sortOrder: 70,
      }),
      createField({
        contentKey: 'morning_title',
        defaultValue: fallbackContent.dailyFlowContent.morningTitle,
        label: 'Sabah programı başlığı',
        sortOrder: 80,
      }),
      createField({
        contentKey: 'afternoon_title',
        defaultValue: fallbackContent.dailyFlowContent.afternoonTitle,
        label: 'Öğleden sonra programı başlığı',
        sortOrder: 90,
      }),
      createField({
        contentKey: 'switch_label',
        defaultValue: fallbackContent.dailyFlowContent.switchLabel,
        label: 'Grup değişimi etiketi',
        sortOrder: 100,
      }),
      createField({
        contentKey: 'footer_note',
        defaultValue: fallbackContent.dailyFlowContent.footerNote,
        label: 'Alt not',
        multiline: true,
        rows: 2,
        sortOrder: 110,
      }),
    ],
  },
  {
    key: 'contact',
    title: 'İletişim Bölümü',
    description: 'Form alanının başlıkları, açıklaması ve sol hızlı iletişim metinleri.',
    fields: [
      createField({
        contentKey: 'eyebrow',
        defaultValue: defaultContactContent.eyebrow,
        label: 'Üst küçük başlık',
        sortOrder: 10,
      }),
      createField({
        contentKey: 'title',
        defaultValue: defaultContactContent.title,
        label: 'Ana başlık',
        sortOrder: 20,
      }),
      createField({
        contentKey: 'highlight',
        defaultValue: defaultContactContent.highlight,
        label: 'Vurgulu başlık satırı',
        sortOrder: 30,
      }),
      createField({
        contentKey: 'description',
        defaultValue: defaultContactContent.description,
        label: 'Form açıklaması',
        multiline: true,
        rows: 3,
        sortOrder: 40,
      }),
      createField({
        contentKey: 'quick_title',
        defaultValue: defaultContactContent.quickTitle,
        label: 'Sol kart başlığı',
        sortOrder: 50,
      }),
      createField({
        contentKey: 'quick_description',
        defaultValue: defaultContactContent.quickDescription,
        label: 'Sol kart açıklaması',
        multiline: true,
        rows: 4,
        sortOrder: 60,
      }),
    ],
  },
  {
    key: 'footer',
    title: 'Alt Bilgi / İletişim Bilgileri',
    description: 'Footer ve hızlı iletişim alanlarında kullanılan iletişim bilgileri.',
    fields: [
      createField({
        contentKey: 'phone_1',
        defaultValue: fallbackContent.contactInfo.phone1,
        label: 'Telefon 1',
        inputType: 'tel',
        sortOrder: 10,
      }),
      createField({
        contentKey: 'phone_2',
        defaultValue: fallbackContent.contactInfo.phone2,
        label: 'Telefon 2',
        inputType: 'tel',
        sortOrder: 20,
      }),
      createField({
        contentKey: 'email',
        defaultValue: fallbackContent.contactInfo.mail,
        label: 'E-posta',
        inputType: 'email',
        sortOrder: 30,
      }),
      createField({
        contentKey: 'instagram',
        defaultValue: fallbackContent.contactInfo.instagram,
        label: 'Instagram kullanıcı adı',
        sortOrder: 40,
      }),
      createField({
        contentKey: 'address',
        defaultValue: fallbackContent.contactInfo.address,
        label: 'Adres',
        multiline: true,
        rows: 3,
        sortOrder: 50,
      }),
    ],
  },
  {
    key: 'partners',
    title: 'Logo Bağlantıları',
    description: 'Hero bölümündeki akademi logolarına bağlanacak Instagram adresleri.',
    fields: [
      createField({
        contentKey: 'partner_1_instagram',
        help: 'Örn: https://www.instagram.com/dongu.akademi',
        label: '1. logo Instagram bağlantısı',
        sortOrder: 10,
        type: 'url',
      }),
      createField({
        contentKey: 'partner_2_instagram',
        help: 'Örn: https://www.instagram.com/karadenizfirtina',
        label: '2. logo Instagram bağlantısı',
        sortOrder: 20,
        type: 'url',
      }),
      createField({
        contentKey: 'partner_3_instagram',
        help: 'Örn: https://www.instagram.com/tandem',
        label: '3. logo Instagram bağlantısı',
        sortOrder: 30,
        type: 'url',
      }),
    ],
  },
]

const sectionOrder = new Map(contentSections.map((section, index) => [section.key, index]))
const fieldDefinitions = new Map(
  contentSections.flatMap((section) =>
    section.fields.map((field) => [`${section.key}.${field.content_key}`, { ...field, section }]),
  ),
)
const seedContents = contentSections.flatMap((section) =>
  section.fields.map((field) => ({
    id: `${section.key}-${field.content_key}`,
    section_key: section.key,
    content_key: field.content_key,
    content_value: field.defaultValue,
    content_type: field.content_type,
    is_html: field.is_html,
    is_active: true,
    sort_order: field.sort_order,
  })),
)

const getContentId = (content) => `${content.section_key}.${content.content_key}`

const sortContents = (contentList) =>
  [...contentList].sort((first, second) => {
    const firstSectionOrder = sectionOrder.get(first.section_key) ?? 999
    const secondSectionOrder = sectionOrder.get(second.section_key) ?? 999

    if (firstSectionOrder !== secondSectionOrder) {
      return firstSectionOrder - secondSectionOrder
    }

    const sectionSort = first.section_key.localeCompare(second.section_key, 'tr')

    if (sectionSort !== 0) {
      return sectionSort
    }

    const orderSort = Number(first.sort_order || 0) - Number(second.sort_order || 0)

    if (orderSort !== 0) {
      return orderSort
    }

    return first.content_key.localeCompare(second.content_key, 'tr')
  })

const mergeSeedContents = (remoteContents = []) => {
  const merged = new Map(seedContents.map((content) => [getContentId(content), content]))

  remoteContents.forEach((content) => {
    const definition = fieldDefinitions.get(getContentId(content))

    merged.set(getContentId(content), {
      ...definition,
      ...content,
      content_type: content.content_type || definition?.content_type || 'text',
      is_html: Boolean(content.is_html ?? definition?.is_html),
      is_active: content.is_active !== false,
      sort_order: content.sort_order ?? definition?.sort_order ?? 0,
    })
  })

  return sortContents([...merged.values()])
}

function ContentManager() {
  const [contents, setContents] = useState(seedContents)
  const [selectedSectionKey, setSelectedSectionKey] = useState(contentSections[0].key)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
        const nextContents = mergeSeedContents(data || [])

        setContents(nextContents)
        setSelectedSectionKey(contentSections[0].key)
      })
  }, [])

  const sectionsWithContent = useMemo(
    () =>
      contentSections.map((section) => ({
        ...section,
        items: contents.filter((content) => content.section_key === section.key),
      })),
    [contents],
  )

  const selectedSection =
    sectionsWithContent.find((section) => section.key === selectedSectionKey) || sectionsWithContent[0]
  const selectedContents = selectedSection?.items || []

  const updateContent = (contentId, changes) => {
    setContents((current) =>
      current.map((content) => (getContentId(content) === contentId ? { ...content, ...changes } : content)),
    )
  }

  const saveSelectedSection = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsSaving(true)

    const payloads = selectedContents.map((content) => ({
      section_key: content.section_key,
      content_key: content.content_key,
      content_value: content.content_value,
      content_type: content.content_type || 'text',
      is_html: Boolean(content.is_html),
      is_active: content.is_active !== false,
      sort_order: Number(content.sort_order || 0),
      updated_at: new Date().toISOString(),
    }))

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('site_contents')
        .upsert(payloads, { onConflict: 'section_key,content_key' })

      if (error) {
        setMessage(error.message)
        setIsSaving(false)
        return
      }
    }

    setContents((current) => sortContents(current))
    setMessage(`${selectedSection.title} kaydedildi.`)
    setIsSaving(false)
  }

  return (
    <div>
      <div className="mb-6">
        <p className="admin-eyebrow">Site Yazıları</p>
        <h1 className="admin-title mt-2">Bölüm bölüm içerik yönetimi</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#222222]/60">
          Sol taraftan bir bölüm seçin; yalnızca o bölümde kullanılan mevcut metin ve bağlantı alanları açılır.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="admin-card p-4">
          <div className="grid gap-2">
            {sectionsWithContent.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => {
                  setSelectedSectionKey(section.key)
                  setMessage('')
                }}
                className={`rounded-2xl px-4 py-3 text-left transition ${
                  selectedSection?.key === section.key
                    ? 'orion-gradient text-white shadow-[0_12px_26px_rgba(255,106,42,0.2)]'
                    : 'bg-[#FFFBF5] text-[#222222]/72 hover:bg-[#FFF1E8] hover:text-[#FF6A2A]'
                }`}
              >
                <span className="block text-sm font-black">{section.title}</span>
                <span className="mt-1 block text-xs font-bold opacity-75">
                  {section.items.length} düzenlenebilir alan
                </span>
              </button>
            ))}
          </div>
        </aside>

        <form onSubmit={saveSelectedSection} className="admin-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="admin-eyebrow">{selectedSection.title}</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-[#222222]">
                {selectedSection.description}
              </h2>
            </div>
            <button type="submit" disabled={isSaving} className="admin-primary-button shrink-0 disabled:opacity-60">
              <Save size={18} aria-hidden="true" />
              {isSaving ? 'Kaydediliyor' : 'Bu Bölümü Kaydet'}
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            {selectedContents.map((content) => {
              const contentId = getContentId(content)
              const definition = fieldDefinitions.get(contentId)
              const label = definition?.label || content.content_key
              const help = definition?.help
              const isLongField =
                Boolean(content.is_html) ||
                definition?.multiline ||
                String(content.content_value || '').length > 96

              return (
                <section key={contentId} className="admin-panel-soft p-4">
                  <label className="admin-label">
                    {label}
                    {help && (
                      <span className="text-xs font-bold leading-5 text-[#222222]/48">
                        {help}
                      </span>
                    )}
                    {isLongField ? (
                      <textarea
                        rows={definition?.rows || 5}
                        value={content.content_value || ''}
                        onChange={(event) =>
                          updateContent(contentId, { content_value: event.target.value })
                        }
                        className={`admin-input ${content.is_html ? 'font-mono text-sm' : ''}`}
                      />
                    ) : (
                      <input
                        type={definition?.inputType || 'text'}
                        value={content.content_value || ''}
                        onChange={(event) =>
                          updateContent(contentId, { content_value: event.target.value })
                        }
                        className="admin-input"
                      />
                    )}
                  </label>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-bold text-[#222222]/42">
                      Teknik alan: {contentId}
                    </span>
                    <label className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#222222]/62">
                      <input
                        type="checkbox"
                        checked={content.is_active !== false}
                        onChange={(event) =>
                          updateContent(contentId, { is_active: event.target.checked })
                        }
                        className="size-4 accent-[#FF6A2A]"
                      />
                      Aktif
                    </label>
                  </div>

                  {content.is_html && (
                    <div className="mt-4 rounded-2xl border border-[#FFE0CC] bg-white p-4">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#222222]/42">
                        Önizleme
                      </p>
                      <SafeHtml html={content.content_value} className="leading-7 text-[#222222]/70" />
                    </div>
                  )}
                </section>
              )
            })}
          </div>

          {message && <div className="admin-message mt-4">{message}</div>}
        </form>
      </div>
    </div>
  )
}

export default ContentManager
