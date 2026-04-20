'use client'

import { useCallback, useRef } from 'react'
import { edgeFunctionAnonHeaders, supabase } from '@/lib/supabase'

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptLoaded = false
let scriptLoading: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve()
  if (scriptLoading) return scriptLoading

  scriptLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => {
      scriptLoaded = true
      resolve()
    }
    s.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
    document.body.appendChild(s)
  })

  return scriptLoading
}

interface CheckoutParams {
  planId: string
  gymId?: string
  prefill?: { name?: string; email?: string; contact?: string }
  onSuccess: (data: { subscription_end: string }) => void
  onError: (err: string) => void
  /** Called when the Razorpay modal is closed without a successful payment (user cancelled, back, or checkout error UI). */
  onDismiss?: () => void
}

type RazorpayPaymentResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayConstructor = new (options: {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: CheckoutParams['prefill']
  theme: { color: string }
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>
  modal: { ondismiss: () => void }
}) => { open: () => void }

function getRazorpayConstructor(): RazorpayConstructor {
  const w = window as Window & { Razorpay?: RazorpayConstructor }
  if (!w.Razorpay) throw new Error('Razorpay SDK not loaded')
  return w.Razorpay
}

export function useRazorpay() {
  const busyRef = useRef(false)

  const checkout = useCallback(async (params: CheckoutParams) => {
    if (busyRef.current) return
    busyRef.current = true

    try {
      await loadScript()

      const { data: orderData, error: fnErr } = await supabase.functions.invoke('razorpay-payment', {
        body: { action: 'create-order', plan_id: params.planId, gym_id: params.gymId },
        headers: edgeFunctionAnonHeaders(),
      })

      if (fnErr || !orderData?.order_id) {
        throw new Error(fnErr?.message || (orderData as { error?: string })?.error || 'Order creation failed')
      }

      const od = orderData as {
        order_id: string
        amount: number
        currency: string
        plan_name: string
        plan_duration_months: number
      }

      const Rzp = getRazorpayConstructor()
      const rzp = new Rzp({
        key: RAZORPAY_KEY,
        // INR subunits (paise); must match Orders API (GST-inclusive total from edge function).
        amount: Math.round(Number(od.amount)),
        currency: od.currency,
        name: 'Fetch Fitness',
        description: `${od.plan_name} — ${od.plan_duration_months >= 12 ? '1 year (incl. GST)' : `${od.plan_duration_months} mo`}`,
        order_id: od.order_id,
        prefill: params.prefill,
        theme: { color: '#6366f1' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('razorpay-payment', {
              body: {
                action: 'verify-payment',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: params.planId,
                gym_id: params.gymId || '',
              },
              headers: edgeFunctionAnonHeaders(),
            })

            if (verifyErr || !(verifyData as { success?: boolean })?.success) {
              params.onError(verifyErr?.message || (verifyData as { error?: string })?.error || 'Payment verification failed')
            } else {
              params.onSuccess({ subscription_end: (verifyData as { subscription_end: string }).subscription_end })
            }
          } catch (e) {
            params.onError((e as Error).message)
          } finally {
            busyRef.current = false
          }
        },
        modal: {
          ondismiss: () => {
            busyRef.current = false
            params.onDismiss?.()
          },
        },
      })

      rzp.open()
    } catch (e) {
      params.onError((e as Error).message)
      busyRef.current = false
    }
  }, [])

  return { checkout }
}
