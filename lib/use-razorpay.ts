'use client'

import { useCallback, useRef } from 'react'
import { edgeFunctionAnonHeaders, supabase } from '@/lib/supabase'
import { getPaymentProvider } from '@/lib/payment-provider'
import { getPricingRegionFromBrowser, type PricingRegion } from '@/lib/pricing-locale'

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
  /**
   * Origin for Stripe return URLs (success/cancel). Defaults to `window.location.origin`.
   * Set to the main app origin when paying from the Vite app (e.g. gym settings upgrade).
   */
  returnOrigin?: string
  /** Defaults to browser timezone (India → IN, else INTL). */
  pricingRegion?: PricingRegion
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

async function userEdgeHeaders(): Promise<Record<string, string>> {
  const { data: sess } = await supabase.auth.getSession()
  if (!sess.session) throw new Error('You must be signed in to pay.')
  return {
    Authorization: `Bearer ${sess.session.access_token}`,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

export function useRazorpay() {
  const busyRef = useRef(false)

  const checkout = useCallback(async (params: CheckoutParams) => {
    if (busyRef.current) return
    busyRef.current = true

    try {
      const pricingRegion = params.pricingRegion ?? getPricingRegionFromBrowser()

      if (getPaymentProvider() === 'stripe') {
        if (!params.gymId) {
          busyRef.current = false
          params.onError('Gym is required for checkout. Open checkout from pricing after signing up.')
          return
        }
        const origin = (params.returnOrigin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(
          /\/$/,
          '',
        )
        if (!origin) {
          busyRef.current = false
          params.onError('Could not resolve return URL for Stripe.')
          return
        }
        const success_url = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
        const cancel_url = `${origin}/checkout?planId=${encodeURIComponent(params.planId)}`

        const { data, error } = await supabase.functions.invoke('stripe-payment', {
          body: {
            action: 'create-checkout-session',
            plan_id: params.planId,
            gym_id: params.gymId,
            success_url,
            cancel_url,
            customer_email: params.prefill?.email,
            customer_name: params.prefill?.name,
            pricing_region: pricingRegion,
          },
          headers: await userEdgeHeaders(),
        })

        if (error || !(data as { url?: string })?.url) {
          throw new Error(error?.message || (data as { error?: string })?.error || 'Could not start Stripe checkout')
        }
        window.location.href = (data as { url: string }).url
        return
      }

      await loadScript()

      const { data: orderData, error: fnErr } = await supabase.functions.invoke('razorpay-payment', {
        body: { action: 'create-order', plan_id: params.planId, gym_id: params.gymId, pricing_region: pricingRegion },
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
        gst_enabled?: boolean
      }
      const gstOn = od.gst_enabled !== false
      const periodLabel = od.plan_duration_months >= 12 ? `1 year${gstOn ? ' (incl. GST)' : ''}` : `${od.plan_duration_months} mo`

      const Rzp = getRazorpayConstructor()
      const rzp = new Rzp({
        key: RAZORPAY_KEY,
        amount: Math.round(Number(od.amount)),
        currency: od.currency,
        name: 'Fetch Fitness',
        description: `${od.plan_name} — ${periodLabel}`,
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
