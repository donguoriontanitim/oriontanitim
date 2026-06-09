import { createClient } from '@supabase/supabase-js'

const githubPagesFallbackEnabled =
  typeof window !== 'undefined' && window.location.hostname === 'donguoriontanitim.github.io'
const fallbackSupabaseUrl = githubPagesFallbackEnabled
  ? 'https://vigbyqymmxsofjusjlss.supabase.co'
  : ''
const fallbackSupabaseAnonKey = githubPagesFallbackEnabled
  ? 'sb_publishable_UzXpltbZBcyfuTDLTeH5DA_4ehqTxus'
  : ''
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey)?.trim()
const usesPlaceholderConfig =
  supabaseUrl?.includes('your-project-ref') || supabaseAnonKey === 'your-public-anon-key'

export const supabaseConfigStatus = {
  hasAnonKey: Boolean(supabaseAnonKey),
  hasUrl: Boolean(supabaseUrl),
  usesPlaceholderConfig,
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !usesPlaceholderConfig,
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase ortam değişkenleri eksik.')
  }

  return supabase
}
