import type { SupabaseClient } from '@supabase/supabase-js'

type StripeSessionLike = {
  id: string
  payment_status: string
  amount_total: number | null
  payment_intent: string | { id?: string } | null
  metadata: Record<string, string> | null
}

function paymentIntentId(session: StripeSessionLike): string | null {
  const pi = session.payment_intent
  if (typeof pi === 'string') return pi
  if (pi && typeof pi === 'object' && 'id' in pi && typeof pi.id === 'string') return pi.id
  return null
}

/**
 * Idempotent: activates gym subscription when Stripe Checkout is paid.
 * Used by the Next.js Stripe webhook (same rules as the stripe-payment Edge verify path).
 */
export async function fulfillStripeCheckoutSession(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  session: StripeSessionLike,
): Promise<{ ok: boolean; error?: string; duplicate?: boolean }> {
  if (session.payment_status !== 'paid') return { ok: false, error: 'Payment not completed' }
  const gymId = session.metadata?.gym_id
  const planId = session.metadata?.plan_id
  if (!gymId || !planId) return { ok: false, error: 'Missing session metadata' }

  const { data: row } = await supabase
    .from('subscription_payments')
    .select('id, status, amount, currency, gym_id, plan_id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (!row) return { ok: false, error: 'Payment record not found' }
  if (row.status === 'paid') return { ok: true, duplicate: true }

  const expectedPaise = Math.round(Number(row.amount) * 100)
  if (session.amount_total != null && session.amount_total !== expectedPaise) {
    await supabase
      .from('subscription_payments')
      .update({ status: 'failed', failure_reason: 'Stripe amount mismatch' })
      .eq('id', row.id)
    return { ok: false, error: 'Amount mismatch' }
  }

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('duration_months, name, price')
    .eq('id', planId)
    .single()

  if (!plan || !Number.isFinite(Number(plan.price)) || Number(plan.price) <= 0) {
    await supabase.from('subscription_payments').update({ status: 'failed', failure_reason: 'Invalid plan' }).eq('id', row.id)
    return { ok: false, error: 'Invalid plan' }
  }

  const now = new Date()
  const subEnd = new Date(now)
  subEnd.setMonth(subEnd.getMonth() + (plan.duration_months || 12))

  await supabase
    .from('subscription_payments')
    .update({
      stripe_payment_intent_id: paymentIntentId(session),
      status: 'paid',
      paid_at: now.toISOString(),
    })
    .eq('id', row.id)

  await supabase
    .from('gyms')
    .update({
      subscription_plan_id: planId,
      subscription_status: 'active',
      subscription_start: now.toISOString(),
      subscription_end: subEnd.toISOString(),
    })
    .eq('id', gymId)

  const totalPaid = Number(row.amount)
  try {
    const { data: gym } = await supabase.from('gyms').select('name, owner_id').eq('id', gymId).single()
    if (gym?.owner_id) {
      const { data: owner } = await supabase.from('profiles').select('full_name, email').eq('id', gym.owner_id).single()
      if (owner?.email) {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({
            template: 'subscription_welcome',
            to: owner.email,
            data: {
              owner_name: owner.full_name,
              plan_name: plan?.name || 'Premium',
              amount: String(totalPaid || plan?.price || '0'),
              subscription_end: subEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            },
          }),
        })
      }
    }
  } catch {
    /* best-effort */
  }

  return { ok: true }
}
