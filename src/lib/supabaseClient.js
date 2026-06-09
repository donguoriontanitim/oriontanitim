import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
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
