import { Loader2, LockKeyhole, Rocket, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  getAdminEmailFromUsername,
  hasDemoAdminSession,
  startDemoAdminSession,
  validateDemoAdminLogin,
} from '../lib/adminAuth.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState(() => !isSupabaseConfigured && hasDemoAdminSession())
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const cleanUsername = username.trim()

    if (!cleanUsername) {
      setError('Kullanıcı adınızı yazmalısınız.')
      return
    }

    if (!password) {
      setError('Şifrenizi yazmalısınız.')
      return
    }

    setIsLoading(true)

    if (!isSupabaseConfigured) {
      if (!validateDemoAdminLogin({ username: cleanUsername, password })) {
        setError('Kullanıcı adı veya şifre hatalı.')
        setIsLoading(false)
        return
      }

      startDemoAdminSession()
      setIsLoading(false)
      navigate('/admin')
      return
    }

    const adminEmail = getAdminEmailFromUsername(cleanUsername)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password,
    })
    setIsLoading(false)

    if (signInError) {
      console.error('Supabase admin giriş hatası:', {
        code: signInError.code,
        email: adminEmail,
        message: signInError.message,
        status: signInError.status,
      })
      setError(
        signInError.code === 'invalid_credentials'
          ? `${adminEmail} kullanıcısı Supabase Auth içinde yok veya şifresi hatalı. SQL kurulumunu ve admin şifresini kontrol edin.`
          : `Admin girişi yapılamadı: ${signInError.message}`,
      )
      return
    }

    navigate('/admin')
  }

  if (hasSession) {
    return <Navigate to="/admin" replace />
  }

  return (
    <main className="admin-page-bg grid min-h-screen place-items-center px-4 py-10 text-[#0B1026]">
      <div className="admin-card w-full max-w-md p-6 shadow-[0_28px_90px_rgba(255,106,42,0.14)] sm:p-7">
        <div className="mb-8 flex items-center gap-3">
          <span className="orion-gradient grid size-12 place-items-center rounded-2xl text-white shadow-[0_14px_30px_rgba(255,106,42,0.24)]">
            <Rocket size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-black">ORION Admin</h1>
            <p className="text-sm font-semibold text-[#0B1026]/60">Kullanıcı adı ve şifre ile giriş</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <label className="admin-label">
            Kullanıcı Adı
            <span className="relative">
              <UserRound
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6A2A]"
                size={18}
                aria-hidden="true"
              />
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="admin-input pl-11"
                placeholder="orionadmin"
              />
            </span>
          </label>

          <label className="admin-label">
            Şifre
            <span className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6A2A]"
                size={18}
                aria-hidden="true"
              />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="admin-input pl-11"
                placeholder="••••••••"
              />
            </span>
          </label>

          {error && (
            <div className="contact-status contact-status-error" aria-live="polite">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="admin-primary-button px-5 py-4 disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="animate-spin" size={19} aria-hidden="true" /> : <LockKeyhole size={19} aria-hidden="true" />}
            Giriş Yap
          </button>
        </form>
      </div>
    </main>
  )
}

export default AdminLogin
