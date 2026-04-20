'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRazorpay } from '@/lib/use-razorpay'
import { appHandoffUrl, getAppOrigin } from '@/lib/app-url'
import { cn, formatSubscriptionBillingSuffix, subscriptionTotalWithGst } from '@/lib/utils'
import { Eye, EyeOff, Loader2, ChevronLeft, ChevronRight, Check, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Singapore', 'Other']

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  note,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  note?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg bg-surface-100 border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all',
          error ? 'border-destructive' : 'border-border',
        )}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {note && !error && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Gym' },
  { id: 3, label: 'Pay' },
]

interface FormData {
  full_name: string
  email: string
  phone: string
  password: string
  confirm_password: string
  gym_name: string
  gym_address: string
  gym_city: string
  gym_state: string
  gym_postal_code: string
  gym_country: string
  gym_phone: string
  gst_number: string
}

const initial: FormData = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  gym_name: '',
  gym_address: '',
  gym_city: '',
  gym_state: '',
  gym_postal_code: '',
  gym_country: 'India',
  gym_phone: '',
  gst_number: '',
}

export function CheckoutForm() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId') || ''
  const { checkout } = useRazorpay()

  const [plan, setPlan] = useState<{
    id: string
    name: string
    price: number
    duration_months: number
    features: Record<string, unknown> | null
  } | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initial)
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [gymId, setGymId] = useState<string | null>(null)

  useEffect(() => {
    if (!planId) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').eq('id', planId).single()
      if (cancelled) return
      setPlanLoading(false)
      if (error || !data) {
        setGlobalError('Plan not found.')
        setPlan(null)
        return
      }
      const price = Number(data.price)
      const isDemo = price <= 0 || (data.features as { is_demo?: boolean })?.is_demo === true
      if (isDemo) {
        setGlobalError('This plan does not require payment. Use Register for the free demo.')
        setPlan(null)
        return
      }
      setPlan({
        id: data.id,
        name: data.name,
        price,
        duration_months: data.duration_months,
        features: (data.features as Record<string, unknown>) || null,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [planId])

  const update = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const f = (field: keyof FormData) => ({
    value: form[field],
    onChange: (v: string) => update(field, v),
    error: errors[field],
  })

  const validateStep1 = () => {
    const errs: typeof errors = {}
    if (!form.full_name || form.full_name.length < 2) errs.full_name = 'Name must be 2–100 characters'
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address'
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters with 1 uppercase, 1 number, 1 special'
    else if (!/(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(form.password))
      errs.password = 'Password must be at least 8 characters with 1 uppercase, 1 number, 1 special'
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs: typeof errors = {}
    if (!form.gym_name || form.gym_name.length < 2) errs.gym_name = 'Gym name must be at least 2 characters'
    if (!form.gym_address) errs.gym_address = 'Address is required'
    if (!form.gym_city) errs.gym_city = 'City is required'
    if (!form.gym_state) errs.gym_state = 'State is required'
    if (!form.gym_postal_code) errs.gym_postal_code = 'Postal code is required'
    if (!form.gym_phone) errs.gym_phone = 'Gym phone is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const ensureGym = async (ownerId: string): Promise<string> => {
    await supabase.from('profiles').upsert(
      {
        id: ownerId,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: 'gym_owner',
      },
      { onConflict: 'id' },
    )

    const { data: existing } = await supabase.from('gyms').select('id').eq('owner_id', ownerId).maybeSingle()
    if (existing?.id) return existing.id

    const { data: inserted, error } = await supabase
      .from('gyms')
      .insert({
        owner_id: ownerId,
        name: form.gym_name.trim(),
        address: form.gym_address.trim(),
        city: form.gym_city.trim(),
        state: form.gym_state.trim(),
        postal_code: form.gym_postal_code.trim(),
        country: form.gym_country,
        phone: form.gym_phone.trim(),
        gst_number: form.gst_number.trim() || null,
        subscription_status: 'awaiting_payment',
      })
      .select('id')
      .single()

    if (error || !inserted) throw new Error(error?.message || 'Could not create gym')
    await supabase.from('profiles').update({ gym_id: inserted.id }).eq('id', ownerId)
    return inserted.id as string
  }

  const handleCreateAccount = async () => {
    if (!validateStep2() || !plan) return
    setLoading(true)
    setGlobalError('')
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            phone: form.phone,
            role: 'gym_owner',
            gym_name: form.gym_name,
            gym_address: form.gym_address,
            gym_city: form.gym_city,
            gym_state: form.gym_state,
            gym_postal_code: form.gym_postal_code,
            gym_country: form.gym_country,
            gym_phone: form.gym_phone,
            gst_number: form.gst_number || null,
            wants_demo_trial: false,
          },
        },
      })
      if (authErr) throw authErr
      const userId = authData.user?.id
      if (!userId) throw new Error('Account could not be created')

      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) {
        setGlobalError(
          'Please verify your email from the link we sent, then return to checkout from pricing — or contact support.',
        )
        return
      }

      await new Promise((r) => setTimeout(r, 400))
      const gid = await ensureGym(userId)
      setGymId(gid)
      setStep(3)
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Could not create account.')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = () => {
    if (!plan || !gymId) return
    setPaying(true)
    setGlobalError('')
    checkout({
      planId: plan.id,
      gymId,
      prefill: {
        name: form.full_name,
        email: form.email,
        contact: form.phone.replace(/\D/g, '').slice(-10),
      },
      onSuccess: async () => {
        setPaying(false)
        const { data: sess } = await supabase.auth.getSession()
        if (sess.session && getAppOrigin()) {
          window.location.href = appHandoffUrl(sess.session.access_token, sess.session.refresh_token)
          return
        }
        window.location.href = '/login'
      },
      onError: (msg) => {
        setPaying(false)
        setGlobalError(msg)
      },
      onDismiss: () => setPaying(false),
    })
  }

  const formatInr = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  if (!planId) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">Missing plan. Start from the pricing page.</p>
        <Link href="/login" className="text-brand-400 font-medium">
          Log in
        </Link>
      </div>
    )
  }

  if (planLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center space-y-4">
        <p className="text-destructive text-sm">{globalError || 'Invalid plan.'}</p>
        <Link href="/register" className="text-brand-400 font-medium">
          Register for free demo
        </Link>
      </div>
    )
  }

  const totalIncl = subscriptionTotalWithGst(plan.price)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="text-2xl font-bold text-foreground mb-1">Subscribe to {plan.name}</h2>
      <p className="text-sm text-muted-foreground mb-2">
        {formatInr(plan.price)} + GST · {formatSubscriptionBillingSuffix(plan.duration_months)} · Total{' '}
        <span className="text-foreground font-semibold">{formatInr(totalIncl)}</span> incl. GST
      </p>
      <p className="text-xs text-muted-foreground mb-6">Account → gym details → secure payment (Razorpay).</p>

      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0',
                step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-brand-500 text-white' : 'bg-surface-200 text-muted-foreground',
              )}
            >
              {step > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <span className={cn('ml-2 text-xs font-medium', step >= s.id ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
            {i < steps.length - 1 && <div className={cn('flex-1 h-px mx-3', step > s.id ? 'bg-emerald-500/50' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {globalError && step < 3 && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{globalError}</div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Field id="co-name" label="Full Name" {...f('full_name')} placeholder="Your name" />
            <Field id="co-email" label="Email" type="email" {...f('email')} placeholder="you@example.com" />
            <Field id="co-phone" label="Phone" type="tel" {...f('phone')} placeholder="+91 98765 43210" note="Used for Razorpay prefill" />
            <div>
              <label htmlFor="co-pw" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="co-pw"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-100 border text-sm',
                    errors.password ? 'border-destructive' : 'border-border',
                  )}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="co-cpw" className="block text-sm font-medium text-foreground mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="co-cpw"
                  type={showCPw ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => update('confirm_password', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-100 border text-sm',
                    errors.confirm_password ? 'border-destructive' : 'border-border',
                  )}
                />
                <button type="button" onClick={() => setShowCPw(!showCPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1 text-xs text-destructive">{errors.confirm_password}</p>}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Field id="co-gym-name" label="Gym name" {...f('gym_name')} />
            <Field id="co-gym-phone" label="Gym phone" type="tel" {...f('gym_phone')} />
            <Field id="co-addr" label="Address" {...f('gym_address')} />
            <div className="grid grid-cols-2 gap-3">
              <Field id="co-city" label="City" {...f('gym_city')} />
              <Field id="co-state" label="State" {...f('gym_state')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="co-postal" label="Postal code" {...f('gym_postal_code')} />
              <div>
                <label htmlFor="co-country" className="block text-sm font-medium text-foreground mb-1.5">
                  Country
                </label>
                <select
                  id="co-country"
                  value={form.gym_country}
                  onChange={(e) => update('gym_country', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-100 border border-border text-sm"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Field id="co-gst" label="GST (optional)" {...f('gst_number')} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-500/15 flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-7 h-7 text-brand-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Pay <span className="text-foreground font-semibold">{formatInr(totalIncl)}</span> incl. GST via Razorpay. Webhooks confirm on the server.
            </p>
            {globalError && <p className="text-sm text-destructive">{globalError}</p>}
            <button
              type="button"
              onClick={handlePay}
              disabled={paying || !gymId}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {paying ? 'Opening checkout…' : 'Pay now'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {step < 3 && (
        <div className={cn('flex gap-3 mt-6', step > 1 ? 'justify-between' : 'justify-end')}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step === 1 ? (
            <button
              type="button"
              onClick={() => validateStep1() && setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating…' : 'Create account & continue'}
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-400 font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
