/* eslint-disable */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, edgeFunctionAnonHeaders } from '@/lib/supabase'
import { appHandoffUrl, getAppOrigin } from '@/lib/app-url'
import { Eye, EyeOff, Loader2, ChevronLeft, ChevronRight, Check, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { applyDemoTrialForGymOwner } from '@/lib/demo-trial-gym'

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
  children,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  note?: string
  children?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      {children ?? (
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
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {note && !error && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Gym Info' },
  { id: 3, label: 'Done' },
]

interface FormData {
  full_name: string
  email: string
  phone: string
  password: string
  confirm_password: string
  role: 'gym_owner' | 'staff'
  invite_code: string
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
  role: 'gym_owner',
  invite_code: '',
  gym_name: '',
  gym_address: '',
  gym_city: '',
  gym_state: '',
  gym_postal_code: '',
  gym_country: 'India',
  gym_phone: '',
  gst_number: '',
}

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initial)
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  useEffect(() => {
    const pid = searchParams.get('planId')
    if (!pid) return
    let cancelled = false
    ;(async () => {
      const { data: pl } = await supabase.from('subscription_plans').select('price, features').eq('id', pid).maybeSingle()
      if (cancelled || !pl) return
      const isDemo = Number(pl.price) <= 0 || (pl.features as { is_demo?: boolean })?.is_demo === true
      if (!isDemo) router.replace(`/checkout?planId=${encodeURIComponent(pid)}`)
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams, router])

  const validateStep1 = () => {
    const errs: typeof errors = {}
    if (!form.full_name || form.full_name.length < 2) errs.full_name = 'Name must be 2-100 characters'
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address'
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters with 1 uppercase, 1 number, 1 special'
    else if (!/(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(form.password))
      errs.password = 'Password must be at least 8 characters with 1 uppercase, 1 number, 1 special'
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    if (form.role === 'staff' && !form.invite_code) errs.invite_code = 'Invite code is required for staff'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    if (form.role !== 'gym_owner') return true
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

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && form.role === 'gym_owner' && !validateStep2()) return
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return
    setLoading(true)
    setGlobalError('')

    try {
      if (form.role === 'staff') {
        const { data: invite, error: inviteErr } = await supabase
          .from('staff_invites')
          .select('*')
          .eq('code', form.invite_code)
          .eq('email', form.email)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single()
        if (inviteErr || !invite) throw new Error('Invalid or expired invite code')
      }

      const planIdParam = searchParams.get('planId')
      let wantsDemoTrial = true
      if (planIdParam) {
        const { data: pl } = await supabase.from('subscription_plans').select('price, features').eq('id', planIdParam).maybeSingle()
        wantsDemoTrial = Boolean(
          pl && (Number(pl.price) <= 0 || (pl.features as { is_demo?: boolean })?.is_demo === true),
        )
      }

      const { error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            phone: form.phone,
            role: form.role,
            invite_code: form.invite_code,
            gym_name: form.gym_name,
            gym_address: form.gym_address,
            gym_city: form.gym_city,
            gym_state: form.gym_state,
            gym_postal_code: form.gym_postal_code,
            gym_country: form.gym_country,
            gym_phone: form.gym_phone,
            gst_number: form.gst_number || null,
            wants_demo_trial: form.role === 'gym_owner' ? wantsDemoTrial : false,
          },
        },
      })
      if (authErr) throw authErr

      const signupData = {
        name: form.full_name,
        email: form.email,
        role: form.role === 'gym_owner' ? 'Gym Owner' : 'Staff',
        gym_name: form.gym_name || null,
        gym_address: form.gym_address || null,
        gym_city: form.gym_city || null,
        gym_state: form.gym_state || null,
        gym_postal_code: form.gym_postal_code || null,
        gym_phone: form.gym_phone || null,
      }
      try {
        await supabase.functions.invoke('send-email', {
          headers: edgeFunctionAnonHeaders(),
          body: { template: 'signup_welcome', to: form.email, data: signupData },
        })
        if (form.role === 'gym_owner' && wantsDemoTrial) {
          await supabase.functions.invoke('send-email', {
            headers: edgeFunctionAnonHeaders(),
            body: {
              template: 'demo_trial_thanks',
              to: form.email,
              data: { name: form.full_name, email: form.email, gym_name: form.gym_name || null },
            },
          })
        }
      } catch {
        /* best-effort */
      }

      const { data: sess } = await supabase.auth.getSession()
      if (sess.session && form.role === 'gym_owner' && wantsDemoTrial) {
        try {
          await applyDemoTrialForGymOwner(supabase, {
            userId: sess.session.user.id,
            email: form.email,
            full_name: form.full_name,
            phone: form.phone || null,
            gym: {
              name: form.gym_name,
              address: form.gym_address,
              city: form.gym_city,
              state: form.gym_state,
              postal_code: form.gym_postal_code,
              country: form.gym_country,
              phone: form.gym_phone,
              gst_number: form.gst_number || null,
            },
          })
        } catch (e) {
          console.error(e)
        }
      }

      if (sess.session && getAppOrigin()) {
        window.location.href = appHandoffUrl(sess.session.access_token, sess.session.refresh_token)
        return
      }

      setStep(3)
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const f = (field: keyof FormData) => ({
    value: form[field] as string,
    onChange: (v: string) => update(field, v),
    error: errors[field],
  })

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="text-2xl font-bold text-foreground mb-1">Create your account</h2>
      <p className="text-sm text-muted-foreground mb-6">Get started with Fetch Fitness today</p>

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

      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{globalError}</div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Field id="reg-name" label="Full Name" {...f('full_name')} placeholder="John Smith" />
            <Field id="reg-email" label="Email Address" type="email" {...f('email')} placeholder="you@example.com" />
            <Field id="reg-phone" label="Phone Number" type="tel" {...f('phone')} placeholder="+91 98765 43210" note="Optional — international format" />

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  className={cn(
                    'w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-100 border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all',
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
              <label htmlFor="reg-cpw" className="block text-sm font-medium text-foreground mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-cpw"
                  type={showCPw ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => update('confirm_password', e.target.value)}
                  placeholder="Repeat password"
                  className={cn(
                    'w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-100 border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all',
                    errors.confirm_password ? 'border-destructive' : 'border-border',
                  )}
                />
                <button type="button" onClick={() => setShowCPw(!showCPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1 text-xs text-destructive">{errors.confirm_password}</p>}
            </div>

            <div>
              <label htmlFor="reg-role" className="block text-sm font-medium text-foreground mb-1.5">
                I am a
              </label>
              <select
                id="reg-role"
                value={form.role}
                onChange={(e) => update('role', e.target.value as 'gym_owner' | 'staff')}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-100 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              >
                <option value="gym_owner">Gym Owner</option>
                <option value="staff">Staff Member (with invite code)</option>
              </select>
            </div>

            {form.role === 'gym_owner' && (
              <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/25 text-sm text-foreground/90 flex gap-2.5">
                <Info className="w-4 h-4 flex-shrink-0 text-brand-400 mt-0.5" aria-hidden />
                <p>
                  <span className="font-medium text-foreground">New user?</span> As a gym owner, your{' '}
                  <span className="font-medium text-foreground">90-day demo</span> is activated after you verify your email and sign in — full access to the product, no payment required.
                </p>
              </div>
            )}

            {form.role === 'staff' && <Field id="reg-invite" label="Invite Code" {...f('invite_code')} placeholder="Enter your invite code" />}
          </motion.div>
        )}

        {step === 2 && form.role === 'gym_owner' && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Field id="reg-gym-name" label="Gym Name" {...f('gym_name')} placeholder="FitZone Gym" />
            <Field id="reg-gym-phone" label="Gym Phone" type="tel" {...f('gym_phone')} placeholder="+91 98765 43210" />
            <Field id="reg-gym-address" label="Gym Address" {...f('gym_address')} placeholder="123 Main Street" />
            <div className="grid grid-cols-2 gap-3">
              <Field id="reg-gym-city" label="City" {...f('gym_city')} placeholder="Mumbai" />
              <Field id="reg-gym-state" label="State" {...f('gym_state')} placeholder="Maharashtra" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="reg-gym-postal" label="Postal Code" {...f('gym_postal_code')} placeholder="400001" />
              <div>
                <label htmlFor="reg-gym-country" className="block text-sm font-medium text-foreground mb-1.5">
                  Country
                </label>
                <select
                  id="reg-gym-country"
                  value={form.gym_country}
                  onChange={(e) => update('gym_country', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-100 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Field id="reg-gst" label="GST Number" {...f('gst_number')} placeholder="22AAAAA0000A1Z5 (optional)" note="15-character alphanumeric, if applicable" />
          </motion.div>
        )}

        {step === 2 && form.role === 'staff' && (
          <motion.div key="step2-staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              Your gym information will be pulled from your invite. Click Continue to complete registration.
            </p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Account Created!</h3>
            <p className="text-sm text-muted-foreground mb-2">
              We&apos;ve sent a verification email to <strong className="text-foreground">{form.email}</strong>.
            </p>
            {form.role === 'gym_owner' && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-2">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
                <span>
                  Next step: verify your email, then sign in. As a new user, your <strong className="font-semibold">90-day demo</strong> will be activated for your gym — full access, no card required.
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
            >
              Go to Login
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          )}
        </div>
      )}

      {step === 1 && (
        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      )}
    </motion.div>
  )
}
