'use client'

import { useState, type ComponentType, type Dispatch, type SetStateAction } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LandingFeatureCardRow, SubscriptionPlanRow } from '@/lib/fetch-landing-data'
import { ThemeToggle } from '@/components/theme-toggle'
import * as LucideIcons from 'lucide-react'
import {
  Dumbbell,
  ChevronDown,
  ChevronRight,
  Check,
  Star,
  ArrowRight,
  Menu,
  X,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import { cn, formatSubscriptionBillingSuffix, subscriptionTotalWithGst } from '@/lib/utils'
import { publicPricingFeatureLines } from '@/lib/subscriptionPlanFeatures'

function LandingFeatureIcon({ name, className }: { name: string; className?: string }) {
  const Cmp =
    ((LucideIcons as unknown) as Record<string, ComponentType<{ className?: string }>>)[name] || LucideIcons.Sparkles
  return <Cmp className={className} />
}

const STEPS = [
  { step: '01', title: 'Sign Up', desc: 'Create your account and set up your gym profile in under 2 minutes.' },
  { step: '02', title: 'Configure', desc: 'Add packages, staff, classes, and customize notifications to fit your gym.' },
  { step: '03', title: 'Grow', desc: 'Start enrolling members, tracking revenue, and scaling your fitness business.' },
]

const TESTIMONIALS = [
  {
    name: 'Rahul Sharma',
    role: 'Owner, FitZone Gym',
    text: 'Fetch Fitness transformed how we manage our 500+ members. Billing that used to take hours now takes minutes.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Manager, Iron Paradise',
    text: 'The diet and workout plan builder alone saved us from using 3 separate apps. Everything is in one place now.',
    rating: 5,
  },
  {
    name: 'Arjun Singh',
    role: 'Owner, CrossFit Hub',
    text: 'Our renewal rate jumped 40% after enabling automated WhatsApp reminders. Absolute game-changer.',
    rating: 5,
  },
]

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Start with a 90-day demo at no charge — no credit card required. Paid plans are yearly and billed separately when you upgrade.',
  },
  { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade or downgrade at any time from your dashboard. Changes take effect immediately.' },
  { q: 'Do you support multiple gym branches?', a: 'Yes. Each branch gets its own dashboard, and you can manage all of them from a single owner account.' },
  { q: 'Is my data secure?', a: 'With row-level security, Fully Encrypted password protected, SSL encryption, and regular backups.' },
  { q: 'Can I import my existing member data?', a: 'Yes. We support CSV imports for members, and our support team can help with bulk migrations.' },
  {
    q: 'What payment methods do members use?',
    a: 'Fetch Fitness supports cash, card, UPI, bank transfer, and online payments for member billing.',
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
}

type EnquiryFormState = { full_name: string; phone: string; email: string; message: string }

function LandingEnquiryForm({
  compact,
  enquiryForm,
  setEnquiryForm,
  enquiryMut,
  enquirySent,
}: {
  compact?: boolean
  enquiryForm: EnquiryFormState
  setEnquiryForm: Dispatch<SetStateAction<EnquiryFormState>>
  enquiryMut: UseMutationResult<void, Error, void, unknown>
  enquirySent: boolean
}) {
  if (enquirySent) {
    return (
      <div
        className={cn(
          'glass-card text-center space-y-3 border border-emerald-500/20 bg-emerald-500/5',
          compact ? 'p-6' : 'p-8',
        )}
      >
        <CheckCircle2 className={cn('text-emerald-400 mx-auto', compact ? 'w-10 h-10' : 'w-12 h-12')} />
        <h3 className="font-bold text-foreground text-sm sm:text-base">Thank you!</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">We&apos;ve received your enquiry and will reach out soon.</p>
      </div>
    )
  }

  return (
    <div className={cn('glass-card border border-border/80 shadow-lg shadow-black/10', compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8')}>
      {!compact && (
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold">Get in Touch</h2>
          <p className="mt-3 text-muted-foreground">Have questions? Drop us a message and we&apos;ll get back to you shortly.</p>
        </div>
      )}
      {compact && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-400 shrink-0" />
            Quick enquiry
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Tell us how to reach you — no signup required.</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name *</label>
          <input
            type="text"
            value={enquiryForm.full_name}
            onChange={(e) => setEnquiryForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Rahul Sharma"
            className="w-full px-4 py-3 rounded-xl bg-surface-100 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={enquiryForm.phone}
              onChange={(e) => setEnquiryForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-xl bg-surface-100 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={enquiryForm.email}
              onChange={(e) => setEnquiryForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@email.com"
              className="w-full px-4 py-3 rounded-xl bg-surface-100 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
        </div>
        {!enquiryForm.phone.trim() && !enquiryForm.email.trim() && enquiryForm.full_name.trim() && (
          <p className="text-xs text-amber-400">Please provide at least a phone number or email</p>
        )}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message</label>
          <textarea
            value={enquiryForm.message}
            onChange={(e) => setEnquiryForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="I'd like to know more about…"
            rows={compact ? 3 : 4}
            className="w-full px-4 py-3 rounded-xl bg-surface-100 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
          />
        </div>
        <button
          type="button"
          onClick={() => enquiryMut.mutate()}
          disabled={
            enquiryMut.isPending || !enquiryForm.full_name.trim() || (!enquiryForm.phone.trim() && !enquiryForm.email.trim())
          }
          className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {enquiryMut.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send enquiry
            </>
          )}
        </button>
        {compact && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-brand-400 transition-colors"
          />
        )}
      </div>
    </div>
  )
}

export function LandingPage({
  plans,
  featureCards,
}: {
  plans: SubscriptionPlanRow[]
  featureCards: LandingFeatureCardRow[]
}) {
  const router = useRouter()
  const [mobileNav, setMobileNav] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [enquiryForm, setEnquiryForm] = useState({ full_name: '', phone: '', email: '', message: '' })
  const [enquirySent, setEnquirySent] = useState(false)

  const enquiryMut = useMutation({
    mutationFn: async () => {
      if (!enquiryForm.full_name.trim()) throw new Error('Name is required')
      if (!enquiryForm.phone.trim() && !enquiryForm.email.trim()) throw new Error('Phone or email is required')
      const { error } = await supabase.from('platform_inquiries').insert({
        full_name: enquiryForm.full_name.trim(),
        phone: enquiryForm.phone.trim() || null,
        email: enquiryForm.email.trim() || null,
        message: enquiryForm.message.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setEnquiryForm({ full_name: '', phone: '', email: '', message: '' })
      setEnquirySent(true)
      setTimeout(() => setEnquirySent(false), 5000)
    },
    onError: () => {
      setToast({ type: 'error', msg: 'Failed to submit. Please try again.' })
      setTimeout(() => setToast(null), 3000)
    },
  })

  const handleBuyPlan = (plan: Record<string, unknown> & { id: string; price: number; features?: Record<string, unknown> }) => {
    const price = Number(plan.price)
    const isDemo = price <= 0 || plan.features?.is_demo === true
    if (isDemo) {
      router.push(`/register?planId=${encodeURIComponent(plan.id)}`)
      return
    }
    router.push(`/checkout?planId=${encodeURIComponent(plan.id)}`)
  }

  const scrollTo = (id: string) => {
    setMobileNav(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">Fetch Fitness</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {['features', 'how-it-works', 'pricing', 'testimonials', 'faq', 'contact'].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors capitalize"
              >
                {id === 'contact' ? 'Contact' : id.replace(/-/g, ' ')}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <button type="button" className="p-2 text-muted-foreground" onClick={() => setMobileNav(!mobileNav)}>
              {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileNav && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
            {['features', 'how-it-works', 'pricing', 'testimonials', 'faq', 'contact'].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground capitalize py-1.5"
              >
                {id === 'contact' ? 'Contact' : id.replace(/-/g, ' ')}
              </button>
            ))}
            <div className="flex gap-3 pt-3 border-t border-border">
              <Link
                href="/login"
                className="flex-1 text-center py-2.5 rounded-lg border border-border text-sm font-medium"
                onClick={() => setMobileNav(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold"
                onClick={() => setMobileNav(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-start">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6">
                <Zap className="w-3.5 h-3.5" /> Trusted by 500+ gyms across India
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl font-extrabold tracking-tight leading-[1.1]">
                The All-in-One Platform to{' '}
                <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">Run Your Gym</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Members, billing, attendance, diet plans, staff management, and more — Fetch Fitness replaces a dozen tools with one beautiful dashboard.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollTo('pricing')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm transition-colors"
                >
                  View Pricing
                </button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">No credit card required. Includes a free 90-day demo.</p>
            </div>
            <div className="w-full max-w-md mx-auto lg:max-w-none lg:pt-2">
              <LandingEnquiryForm
                compact
                enquiryForm={enquiryForm}
                setEnquiryForm={setEnquiryForm}
                enquiryMut={enquiryMut}
                enquirySent={enquirySent}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything Your Gym Needs</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">One platform to manage members, billing, staff, classes, and communications.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {!featureCards.length ? (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">Feature list will appear here once configured.</div>
            ) : (
              featureCards.map((f) => (
                <div key={f.id} className="glass-card p-5 hover:border-brand-500/30 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                    <LandingFeatureIcon name={f.icon_name} className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Get Started in 3 Steps</h2>
            <p className="mt-3 text-muted-foreground">Up and running in under 5 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="text-center relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-brand-500/40 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
                  <span className="text-xl font-bold text-brand-400">{s.step}</span>
                </div>
                <h3 className="font-bold text-lg text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Demo & yearly plans</h2>
            <p className="mt-3 text-muted-foreground">90-day demo at no charge, then yearly tiers (excl. GST). Upgrade anytime.</p>
          </div>

          <Tooltip.Provider delayDuration={200}>
            <div
              className={cn(
                'grid gap-6',
                plans.length === 0 ? '' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
              )}
            >
              {plans.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">No subscription plans are available right now. Please check back soon.</div>
              ) : (
                plans.map((plan: SubscriptionPlanRow) => {
                  const features = plan.features || {}
                  const cap = plan.max_members ?? (features as Record<string, unknown>).max_members
                  const memberCap = cap != null && cap !== '' ? Number(cap) : null
                  const membersUnlimited = memberCap !== null && Number.isFinite(memberCap) && memberCap <= 0
                  const isDemoPlan = Number(plan.price) <= 0 || features.is_demo === true
                  const demoDays = typeof features.demo_period_days === 'number' ? features.demo_period_days : 90
                  const popular = !isDemoPlan && plan.name === 'Pro'
                  const pricingLines = publicPricingFeatureLines(plan)
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'glass-card p-6 flex flex-col relative',
                        popular && 'border-brand-500/50 ring-1 ring-brand-500/20',
                        isDemoPlan && 'border-emerald-500/30 ring-1 ring-emerald-500/10',
                      )}
                    >
                      {isDemoPlan && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
                          Free demo
                        </div>
                      )}
                      {popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider">
                          Most Popular
                        </div>
                      )}
                      <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                      <div className="mt-3 space-y-1">
                        {isDemoPlan ? (
                          <>
                            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                              <span className="text-3xl font-extrabold text-foreground">{formatPrice(0)}</span>
                              <span className="text-sm text-muted-foreground">· {demoDays} days</span>
                            </div>
                            <p className="text-xs text-emerald-400 font-medium">No payment · full platform access for the demo period</p>
                            {memberCap !== null && Number.isFinite(memberCap) && (
                              <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight">
                                {membersUnlimited ? (
                                  <>
                                    <span className="text-brand-400">Unlimited</span>
                                    <span className="text-base sm:text-lg font-semibold text-muted-foreground">members</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm font-semibold text-muted-foreground">Up to</span>
                                    <span className="text-brand-400">{memberCap.toLocaleString('en-IN')}</span>
                                    <span className="text-base sm:text-lg font-semibold text-muted-foreground">members</span>
                                  </>
                                )}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                              <span className="text-3xl font-extrabold text-foreground">{formatPrice(plan.price)}</span>
                              <span className="text-sm text-muted-foreground">+ GST (18%)</span>
                              <span className="text-sm text-muted-foreground">{formatSubscriptionBillingSuffix(Number(plan.duration_months))}</span>
                            </div>
                            {memberCap !== null && Number.isFinite(memberCap) && (
                              <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight">
                                {membersUnlimited ? (
                                  <>
                                    <span className="text-brand-400">Unlimited</span>
                                    <span className="text-base sm:text-lg font-semibold text-muted-foreground">members</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm font-semibold text-muted-foreground">Up to</span>
                                    <span className="text-brand-400">{memberCap.toLocaleString('en-IN')}</span>
                                    <span className="text-base sm:text-lg font-semibold text-muted-foreground">members</span>
                                  </>
                                )}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Total {formatPrice(subscriptionTotalWithGst(Number(plan.price)))} incl. GST
                              {Number(plan.duration_months) >= 12 ? ' · 365 days' : ''}
                            </p>
                          </>
                        )}
                      </div>

                      <p className="mt-4 pt-4 border-t border-border/50 text-sm text-foreground/90 leading-relaxed">
                        Includes <span className="font-semibold text-foreground">all features</span> in{' '}
                        <button
                          type="button"
                          onClick={() => scrollTo('features')}
                          className="text-brand-400 hover:underline font-medium"
                        >
                          Everything Your Gym Needs
                        </button>{' '}
                        — only the member limit changes between plans.{' '}
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 min-w-[1.25rem] translate-y-0.5 items-center justify-center rounded-full border border-border/80 bg-muted/40 px-1 text-[11px] font-semibold leading-none text-muted-foreground align-middle hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                              aria-label="SMS and WhatsApp add-on details"
                            >
                              ?
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="z-50 max-w-xs rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md leading-relaxed"
                              sideOffset={6}
                            >
                              SMS &amp; WhatsApp are not included in the base subscription. They require an add-on package. After you sign up, use{' '}
                              <span className="font-medium text-foreground">Contact us</span> in your gym dashboard or call us to purchase.
                              <Tooltip.Arrow className="fill-border" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </p>

                      {pricingLines.length > 0 && (
                        <div className="mt-4 flex-1 space-y-2.5">
                          {pricingLines.map((line) => (
                            <div key={line} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <span className="text-muted-foreground">{line}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleBuyPlan(plan as any)}
                        className={cn(
                          'mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-colors',
                          popular
                            ? 'bg-brand-500 hover:bg-brand-600 text-white'
                            : isDemoPlan
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'border border-border hover:bg-black/5 dark:hover:bg-white/5 text-foreground',
                        )}
                      >
                        {isDemoPlan ? 'Start free demo' : 'Get Started'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </Tooltip.Provider>
        </div>
      </section>

      <section id="testimonials" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Loved by Gym Owners</h2>
            <p className="mt-3 text-muted-foreground">Hear from fitness businesses already using Fetch Fitness.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">&quot;{t.text}&quot;</p>
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="glass-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-foreground text-sm pr-4">{f.q}</span>
                  <ChevronDown
                    className={cn('w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform', openFaq === i && 'rotate-180')}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to Transform Your Gym?</h2>
          <p className="mt-4 text-muted-foreground text-lg">Join hundreds of gym owners who switched to Fetch Fitness and never looked back.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Start Your Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Compare Plans <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 sm:py-28 px-4 sm:px-6 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-xl mx-auto">
          <LandingEnquiryForm
            enquiryForm={enquiryForm}
            setEnquiryForm={setEnquiryForm}
            enquiryMut={enquiryMut}
            enquirySent={enquirySent}
          />
        </div>
      </section>

      <footer className="border-t border-border py-12 px-4 sm:px-6 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground">Fetch Fitness</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">The all-in-one SaaS platform for modern gyms and fitness studios.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Product</h4>
            <div className="space-y-2">
              <button type="button" onClick={() => scrollTo('features')} className="block text-xs text-muted-foreground hover:text-foreground">
                Features
              </button>
              <button type="button" onClick={() => scrollTo('pricing')} className="block text-xs text-muted-foreground hover:text-foreground">
                Pricing
              </button>
              <button type="button" onClick={() => scrollTo('testimonials')} className="block text-xs text-muted-foreground hover:text-foreground">
                Testimonials
              </button>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Company</h4>
            <div className="space-y-2">
              <button type="button" onClick={() => scrollTo('faq')} className="block text-xs text-muted-foreground hover:text-foreground">
                FAQ
              </button>
              <button type="button" onClick={() => scrollTo('contact')} className="block text-xs text-muted-foreground hover:text-foreground">
                Contact
              </button>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Account</h4>
            <div className="space-y-2">
              <Link href="/login" className="block text-xs text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <Link href="/register" className="block text-xs text-muted-foreground hover:text-foreground">
                Register
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Fetch Fitness. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Made in India</p>
        </div>
      </footer>

      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in',
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-destructive text-white',
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
