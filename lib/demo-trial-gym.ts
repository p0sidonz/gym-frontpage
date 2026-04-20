import type { SupabaseClient } from '@supabase/supabase-js'

const DEMO_PLAN_NAME = '90-Day Demo'
const DEMO_DAYS = 90

type GymFields = {
  name: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
  gst_number: string | null
}

/** Applies 90-day demo trial only for the free registration (demo) path — not for paid checkout (`awaiting_payment`). */
export async function applyDemoTrialForGymOwner(
  supabase: SupabaseClient,
  params: {
    userId: string
    email: string
    full_name: string
    phone: string | null
    gym: GymFields
  },
): Promise<void> {
  const { userId, email, full_name, phone, gym } = params

  await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: full_name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      role: 'gym_owner',
    },
    { onConflict: 'id' },
  )

  const { data: demoPlan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('name', DEMO_PLAN_NAME)
    .eq('is_active', true)
    .maybeSingle()

  const { data: existingList } = await supabase.from('gyms').select('id, subscription_status').eq('owner_id', userId)

  if (existingList?.some((row) => row.subscription_status === 'awaiting_payment')) return

  const end = new Date()
  end.setDate(end.getDate() + DEMO_DAYS)

  if (!existingList?.length) {
    const { data: inserted, error } = await supabase
      .from('gyms')
      .insert({
        owner_id: userId,
        name: gym.name.trim(),
        address: gym.address.trim(),
        city: gym.city.trim(),
        state: gym.state.trim(),
        postal_code: gym.postal_code.trim(),
        country: gym.country,
        phone: gym.phone.trim(),
        gst_number: gym.gst_number?.trim() || null,
        subscription_plan_id: demoPlan?.id ?? null,
        subscription_status: 'trial',
        subscription_start: new Date().toISOString(),
        subscription_end: end.toISOString(),
      })
      .select('id')
      .single()
    if (error || !inserted) throw new Error(error?.message || 'Could not create gym')
    await supabase.from('profiles').update({ gym_id: inserted.id }).eq('id', userId)
    return
  }

  const g = existingList[0]
  if (g.subscription_status === 'awaiting_payment') return
  if (g.subscription_status === 'trial' || g.subscription_status === 'active') return

  if (existingList.length === 1 && g.subscription_status === 'pending') {
    const { error } = await supabase
      .from('gyms')
      .update({
        name: gym.name.trim(),
        address: gym.address.trim(),
        city: gym.city.trim(),
        state: gym.state.trim(),
        postal_code: gym.postal_code.trim(),
        country: gym.country,
        phone: gym.phone.trim(),
        gst_number: gym.gst_number?.trim() || null,
        subscription_plan_id: demoPlan?.id ?? null,
        subscription_status: 'trial',
        subscription_start: new Date().toISOString(),
        subscription_end: end.toISOString(),
      })
      .eq('id', g.id)
    if (error) throw new Error(error.message)
    await supabase.from('profiles').update({ gym_id: g.id }).eq('id', userId)
  }
}

/** First login after email verification: create demo gym from auth metadata if missing, or upgrade a lone legacy pending gym. */
export async function ensureDemoTrialOnOwnerFirstLogin(
  supabase: SupabaseClient,
  user: { id: string; user_metadata?: Record<string, unknown>; email?: string | null },
  profile: { role: string; gym_id: string | null },
): Promise<string | null> {
  if (profile.role !== 'gym_owner') return null

  const meta = user.user_metadata || {}
  if (meta.wants_demo_trial !== true) return null

  const gymName = typeof meta.gym_name === 'string' ? meta.gym_name.trim() : ''
  if (!gymName) return null

  const gym: GymFields = {
    name: gymName,
    address: typeof meta.gym_address === 'string' ? meta.gym_address : '',
    city: typeof meta.gym_city === 'string' ? meta.gym_city : '',
    state: typeof meta.gym_state === 'string' ? meta.gym_state : '',
    postal_code: typeof meta.gym_postal_code === 'string' ? meta.gym_postal_code : '',
    country: typeof meta.gym_country === 'string' ? meta.gym_country : 'India',
    phone: typeof meta.gym_phone === 'string' ? meta.gym_phone : '',
    gst_number: typeof meta.gst_number === 'string' ? meta.gst_number : null,
  }

  const { data: gyms } = await supabase.from('gyms').select('id, subscription_status').eq('owner_id', user.id)

  if (!gyms?.length) {
    await applyDemoTrialForGymOwner(supabase, {
      userId: user.id,
      email: user.email || (typeof meta.email === 'string' ? meta.email : '') || '',
      full_name: typeof meta.full_name === 'string' ? meta.full_name : '',
      phone: typeof meta.phone === 'string' ? meta.phone : null,
      gym,
    })
    return (await supabase.from('profiles').select('gym_id').eq('id', user.id).single()).data?.gym_id ?? null
  }

  if (gyms.length !== 1) return null

  const g = gyms[0]
  if (g.subscription_status === 'awaiting_payment') return null
  if (g.subscription_status === 'trial' || g.subscription_status === 'active') return profile.gym_id

  if (g.subscription_status === 'pending') {
    await applyDemoTrialForGymOwner(supabase, {
      userId: user.id,
      email: user.email || '',
      full_name: typeof meta.full_name === 'string' ? meta.full_name : '',
      phone: typeof meta.phone === 'string' ? meta.phone : null,
      gym,
    })
    return (await supabase.from('profiles').select('gym_id').eq('id', user.id).single()).data?.gym_id ?? null
  }

  return profile.gym_id
}
