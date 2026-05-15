import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { fulfillStripeCheckoutSession } from '@/lib/subscription-stripe-fulfill'

export async function handleStripeWebhook(req: Request): Promise<Response> {
  const raw = await req.text()
  const sig = req.headers.get('stripe-signature')
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const stripeSecret = process.env.STRIPE_SECRET_KEY

  if (!whSecret || !sig || !serviceKey || !supabaseUrl || !stripeSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecret)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, skipped: true })
    }
    const result = await fulfillStripeCheckoutSession(supabase, supabaseUrl, serviceKey, {
      id: session.id,
      payment_status: session.payment_status === 'paid' ? 'paid' : session.payment_status,
      amount_total: session.amount_total,
      payment_intent: session.payment_intent as string | null,
      metadata: session.metadata as Record<string, string> | null,
    })
    if (!result.ok) {
      if (result.error === 'Payment record not found') {
        return NextResponse.json({ received: true, skipped: true })
      }
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ received: true })
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    await supabase
      .from('subscription_payments')
      .update({ status: 'failed', failure_reason: 'Checkout session expired' })
      .eq('stripe_checkout_session_id', session.id)
      .eq('status', 'created')
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
