import { FileText, Images, Inbox, ListChecks, MessageSquareText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fallbackContent } from '../fallbackContent.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { useEffect, useState } from 'react'

const cards = [
  { label: 'Site Yazıları', href: '/admin/contents', icon: FileText, key: 'contents' },
  { label: 'Program İçerikleri', href: '/admin/programs', icon: ListChecks, key: 'programs' },
  { label: 'Galeri Görselleri', href: '/admin/gallery', icon: Images, key: 'gallery' },
  { label: 'SSS', href: '/admin/faqs', icon: MessageSquareText, key: 'faqs' },
  { label: 'İletişim Talepleri', href: '/admin/contacts', icon: Inbox, key: 'contacts' },
]

const fallbackCounts = {
  contents: 5,
  programs: fallbackContent.programs.length,
  gallery: fallbackContent.gallery.length,
  faqs: fallbackContent.faqs.length,
  contacts: 0,
}

function Dashboard() {
  const [counts, setCounts] = useState(fallbackCounts)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    const countQueries = [
      ['contents', () => supabase.from('site_contents').select('*', { count: 'exact', head: true })],
      ['programs', () => supabase.from('program_items').select('*', { count: 'exact', head: true })],
      [
        'gallery',
        () =>
          supabase
            .from('site_images')
            .select('*', { count: 'exact', head: true })
            .eq('usage_area', 'gallery'),
      ],
      ['faqs', () => supabase.from('faq_items').select('*', { count: 'exact', head: true })],
      ['contacts', () => supabase.from('contact_requests').select('*', { count: 'exact', head: true })],
    ]

    Promise.all(
      countQueries.map(async ([key, query]) => {
        const { count } = await query()
        return [key, count || 0]
      }),
    ).then((entries) => setCounts(Object.fromEntries(entries)))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <p className="admin-eyebrow">Dashboard</p>
        <h1 className="admin-title mt-2">ORION KAMP 2026 yönetim merkezi</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <Link
              key={card.href}
              to={card.href}
              className="admin-card admin-card-hover p-6"
            >
              <div className="orion-gradient mb-5 grid size-12 place-items-center rounded-2xl text-white shadow-[0_14px_30px_rgba(255,106,42,0.24)]">
                <Icon size={24} aria-hidden="true" />
              </div>
              <p className="text-4xl font-black text-[#222222]">{counts[card.key]}</p>
              <h2 className="mt-2 text-lg font-black text-[#222222]/78">{card.label}</h2>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
