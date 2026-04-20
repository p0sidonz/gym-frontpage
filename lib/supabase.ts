import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** For `functions.invoke` so the Edge gateway accepts the anon JWT. */
export function edgeFunctionAnonHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${supabaseAnonKey}`,
    apikey: supabaseAnonKey,
  }
}
