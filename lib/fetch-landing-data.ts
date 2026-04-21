import { createServerSupabase } from '@/lib/supabase-server'

export type LandingFeatureCardRow = {
  id: string
  title: string
  description: string | null
  icon_name: string
  sort_order: number
}

export type SubscriptionPlanRow = {
  id: string
  name: string
  price: number
  duration_months: number
  features?: Record<string, unknown> | null
  max_members?: number | null
  show_on_landing?: boolean | null
}

export async function getLandingFeatureCards(): Promise<LandingFeatureCardRow[]> {
  const supabase = createServerSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('landing_feature_cards')
    .select('id, title, description, icon_name, sort_order')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[landing] landing_feature_cards', error.message)
    return []
  }
  return (data || []) as LandingFeatureCardRow[]
}

export async function getPlatformGstSettings(): Promise<{ gst_enabled: boolean; platform_gstin: string | null }> {
  const supabase = createServerSupabase()
  if (!supabase) return { gst_enabled: true, platform_gstin: null }

  const { data, error } = await supabase.rpc('get_platform_gst_settings')
  if (error) {
    console.error('[landing] get_platform_gst_settings', error.message)
    return { gst_enabled: true, platform_gstin: null }
  }
  const row = Array.isArray(data) ? data[0] : data
  return {
    gst_enabled: (row as { gst_enabled?: boolean })?.gst_enabled !== false,
    platform_gstin: (row as { platform_gstin?: string | null })?.platform_gstin ?? null,
  }
}

export async function getPublicSubscriptionPlans(): Promise<SubscriptionPlanRow[]> {
  const supabase = createServerSupabase()
  if (!supabase) return []

  const { data, error } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('price')

  if (error) {
    console.error('[landing] subscription_plans', error.message)
    return []
  }

  const rows = (data || []) as SubscriptionPlanRow[]
  return rows.filter((p) => p.show_on_landing !== false)
}
