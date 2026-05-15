'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { appHandoffUrl, getAppOrigin } from '@/lib/app-url'
import { Loader2 } from 'lucide-react'

function CheckoutSuccessInner() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setErr('Missing session. Return to checkout from pricing.')
      return
    }

    let cancelled = false
    ;(async () => {
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) {
        if (!cancelled) setErr('Please sign in to complete your subscription.')
        return
      }

      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: { action: 'verify-session', session_id: sessionId },
        headers: {
          Authorization: `Bearer ${sess.session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      })

      if (cancelled) return
      if (error || !(data as { success?: boolean })?.success) {
        setErr(error?.message || (data as { error?: string })?.error || 'Could not confirm payment.')
        return
      }

      setMsg('Payment confirmed. Redirecting to your dashboard…')
      const { data: s2 } = await supabase.auth.getSession()
      if (s2.session && getAppOrigin()) {
        window.location.href = appHandoffUrl(s2.session.access_token, s2.session.refresh_token)
        return
      }
      window.location.href = '/login'
    })()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <div className="text-center space-y-4 py-4">
      {!sessionId && err && <p className="text-destructive text-sm">{err}</p>}
      {sessionId && !err && !msg && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm text-muted-foreground">Confirming your payment…</p>
        </div>
      )}
      {msg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      {err && sessionId && <p className="text-destructive text-sm">{err}</p>}
      {err && (
        <Link href="/checkout" className="inline-block text-sm text-brand-400 font-medium">
          Back to checkout
        </Link>
      )}
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  )
}
