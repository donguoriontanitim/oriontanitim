import { createClient } from '@supabase/supabase-js'

const githubPagesFallbackEnabled =
  typeof window !== 'undefined' && window.location.hostname === 'donguoriontanitim.github.io'
const fallbackSupabaseUrl = githubPagesFallbackEnabled
  ? 'https://vigbyqymmxsofjusjlss.supabase.co'
  : ''
const fallbackSupabaseAnonKey = githubPagesFallbackEnabled
  ? 'sb_publishable_UzXpltbZBcyfuTDLTeH5DA_4ehqTxus'
  : ''
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''
const isValidSupabaseUrl = (value = '') => /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(value)
const isValidSupabaseKey = (value = '') =>
  value.startsWith('sb_') || value.split('.').length === 3
const supabaseUrl =
  isValidSupabaseUrl(envSupabaseUrl) ? envSupabaseUrl : fallbackSupabaseUrl
const supabaseAnonKey =
  isValidSupabaseKey(envSupabaseAnonKey) ? envSupabaseAnonKey : fallbackSupabaseAnonKey
const usesPlaceholderConfig =
  !isValidSupabaseUrl(supabaseUrl) ||
  !isValidSupabaseKey(supabaseAnonKey) ||
  supabaseUrl?.includes('your-project-ref') ||
  supabaseAnonKey === 'your-public-anon-key'

export const supabaseConfigStatus = {
  hasAnonKey: Boolean(supabaseAnonKey),
  hasUrl: Boolean(supabaseUrl),
  usesPlaceholderConfig,
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !usesPlaceholderConfig,
)

export const supabaseRestConfig = {
  anonKey: supabaseAnonKey,
  url: supabaseUrl,
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase ortam değişkenleri eksik.')
  }

  return supabase
}
