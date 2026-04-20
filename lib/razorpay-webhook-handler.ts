import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function handleRazorpayWebhook(req: Request): Promise<Response> {
  const raw = await req.text()
  const sig = req.headers.get('x-razorpay-signature')
  const whSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!whSecret || !sig || !serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const expected = crypto.createHmac('sha256', whSecret).update(raw).digest('hex')
  if (expected !== sig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let body: { event?: string; payload?: { payment?: { entity?: Record<string, string> } } }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const event = body.event

  if (event === 'payment.captured') {
    const payment = body.payload?.payment?.entity
    const orderId = payment?.order_id
    const paymentId = payment?.id
    if (!orderId) return NextResponse.json({ received: true })

    const { data: row } = await supabase
      .from('subscription_payments')
      .select('gym_id, plan_id, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()

    if (!row?.gym_id || !row?.plan_id) return NextResponse.json({ received: true })
    if (row.status === 'paid') return NextResponse.json({ received: true, duplicate: true })

    const paidAt = new Date().toISOString()
    await supabase
      .from('subscription_payments')
      .update({
        razorpay_payment_id: paymentId ?? null,
        status: 'paid',
        paid_at: paidAt,
      })
      .eq('razorpay_order_id', orderId)

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('duration_months, name, price')
      .eq('id', row.plan_id)
      .single()

    if (plan && Number(plan.price) > 0) {
      const now = new Date()
      const subEnd = new Date(now)
      subEnd.setMonth(subEnd.getMonth() + (plan.duration_months || 12))
      await supabase
        .from('gyms')
        .update({
          subscription_plan_id: row.plan_id,
          subscription_status: 'active',
          subscription_start: now.toISOString(),
          subscription_end: subEnd.toISOString(),
        })
        .eq('id', row.gym_id)
    }

    return NextResponse.json({ received: true })
  }

  if (event === 'payment.failed') {
    const payment = body.payload?.payment?.entity
    const orderId = payment?.order_id
    if (orderId) {
      await supabase.from('subscription_payments').update({ status: 'failed' }).eq('razorpay_order_id', orderId)
    }
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
