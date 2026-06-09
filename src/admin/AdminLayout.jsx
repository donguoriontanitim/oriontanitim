import {
  FileText,
  ImagePlus,
  Images,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareText,
  Rocket,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { clearDemoAdminSession, hasDemoAdminSession } from '../lib/adminAuth.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Site Yazıları', href: '/admin/contents', icon: FileText },
  { label: 'Programlar', href: '/admin/programs', icon: ListChecks },
  { label: 'Galeri', href: '/admin/gallery', icon: Images },
  { label: 'Görsel Yönetimi', href: '/admin/images', icon: ImagePlus },
  { label: 'SSS', href: '/admin/faqs', icon: MessageSquareText },
  { label: 'İletişim Talepleri', href: '/admin/contacts', icon: Inbox },
]

function AdminLayout() {
  const [session, setSession] = useState(null)
  const [demoSession, setDemoSession] = useState(() => !isSupabaseConfigured && hasDemoAdminSession())
  const [isChecking, setIsChecking] = useState(isSupabaseConfigured)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session)
        setIsChecking(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    } else {
      clearDemoAdminSession()
      setDemoSession(false)
    }

    navigate('/admin/login')
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  if (isChecking) {
    return (
      <div className="admin-page-bg grid min-h-screen place-items-center px-4 text-[#0B1026]">
        <div className="admin-card px-8 py-6 text-center font-black">
          Admin oturumu kontrol ediliyor...
        </div>
      </div>
    )
  }

  if (isSupabaseConfigured && !session) {
    return <Navigate to="/admin/login" replace />
  }

  if (!isSupabaseConfigured && !demoSession) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="admin-page-bg min-h-screen text-[#0B1026]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#FFE0CC] bg-white/92 p-5 shadow-[0_24px_70px_rgba(255,106,42,0.1)] backdrop-blur lg:block">
        <a href="#/" className="mb-8 flex items-center gap-3">
          <span className="orion-gradient grid size-12 place-items-center rounded-2xl text-white shadow-[0_14px_30px_rgba(255,106,42,0.24)]">
            <Rocket size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.18em] text-[#0B1026]">Orion</span>
            <span className="block text-xs font-black text-[#FF6A2A]">Admin Panel</span>
          </span>
        </a>

        <nav className="grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                    isActive
                      ? 'orion-gradient text-white shadow-[0_14px_30px_rgba(255,106,42,0.22)]'
                      : 'text-[#0B1026]/68 hover:bg-[#FFF1E8] hover:text-[#FF6A2A]'
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="admin-secondary-button absolute bottom-5 left-5 right-5"
        >
          <LogOut size={18} aria-hidden="true" />
          Çıkış Yap
        </button>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#FFE0CC] bg-white/88 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:min-h-18 lg:px-8">
            <a href="#/" className="flex min-w-0 items-center gap-3">
              <span className="orion-gradient grid size-10 shrink-0 place-items-center rounded-2xl text-white lg:hidden">
                <Rocket size={19} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[#0B1026]">ORION KAMP 2026</span>
                <span className="block truncate text-xs font-black text-[#FF6A2A]">Yönetim paneli</span>
              </span>
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className="grid size-11 place-items-center rounded-2xl border border-[#FFE0CC] bg-[#FFF8F0] text-[#FF6A2A] lg:hidden"
                aria-label={isMobileMenuOpen ? 'Admin menüsünü kapat' : 'Admin menüsünü aç'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
              </button>
            </div>
          </div>
          {isMobileMenuOpen && (
            <nav className="grid max-h-[calc(100dvh-5rem)] gap-2 overflow-y-auto border-t border-[#FFE0CC] bg-white px-4 py-3 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.end}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                        isActive
                          ? 'orion-gradient text-white shadow-[0_12px_26px_rgba(255,106,42,0.22)]'
                          : 'bg-[#FFFBF5] text-[#0B1026]/72 hover:bg-[#FFF1E8] hover:text-[#FF6A2A]'
                      }`
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                )
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="admin-secondary-button mt-1"
              >
                <LogOut size={16} aria-hidden="true" />
                Çıkış
              </button>
            </nav>
          )}
        </header>

        {!isSupabaseConfigured && (
          <div className="admin-message mx-4 mt-5 sm:mx-6 lg:mx-8">
            Supabase ortam değişkenleri tanımlı değil. Admin ekranları demo modunda çalışıyor.
          </div>
        )}

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
