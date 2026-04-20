'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase, edgeFunctionAnonHeaders } from '@/lib/supabase'
import { appHandoffUrl, appUrl, getAppOrigin } from '@/lib/app-url'
import { Eye, EyeOff, Loader2, Building2, Users, Shield, UserCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const LOGIN_TABS = [
  { id: 'owner' as const, label: 'Owner/Partner', icon: Building2, hint: 'Gym owners & partners' },
  { id: 'staff' as const, label: 'Staff', icon: Users, hint: 'Managers, trainers, receptionists & more' },
  { id: 'member' as const, label: 'Member', icon: UserCircle, hint: 'Gym members (app invite)' },
]

type LoginTab = (typeof LOGIN_TABS)[number]['id']

export function LoginForm() {
  const [activeTab, setActiveTab] = useState<LoginTab>('owner')
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) throw authError

      let profile: {
        id: string
        email: string | null
        full_name: string
        role: string
        gym_id: string | null
        avatar_url: string | null
        is_locked?: boolean
        locked_reason?: string | null
      } | null = null
      let profileError = null as unknown

      {
        const res = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        profile = res.data as typeof profile
        profileError = res.error
      }

      if (profileError && (profileError as { code?: string }).code === 'PGRST116') {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: '',
          role: 'receptionist',
          gym_id: null,
          avatar_url: null,
        })
        if (insertError) throw insertError
        const res2 = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        profile = res2.data as typeof profile
        profileError = res2.error
      }

      if (profileError || !profile) throw profileError || new Error('Profile missing')

      if (profile.is_locked) {
        await supabase.auth.signOut()
        throw new Error(
          profile.locked_reason
            ? `Your account has been locked: ${profile.locked_reason}`
            : 'Your account has been locked. Please contact your administrator.',
        )
      }

      const expectedRoles: Record<LoginTab, string[]> = {
        owner: ['gym_owner', 'partner', 'super_admin'],
        staff: ['manager', 'trainer', 'receptionist', 'housekeeping'],
        member: ['member'],
      }

      if (!expectedRoles[activeTab].includes(profile.role)) {
        const tabLabels: Record<string, string> = {
          gym_owner: 'Owner/Partner',
          partner: 'Owner/Partner',
          super_admin: 'Owner/Partner',
          manager: 'Staff',
          trainer: 'Staff',
          receptionist: 'Staff',
          housekeeping: 'Staff',
          member: 'Member',
        }
        const correctTab = tabLabels[profile.role] || 'Owner/Partner'
        await supabase.auth.signOut()
        throw new Error(
          `This account is registered as ${profile.role.replace('_', ' ')}. Please use the "${correctTab}" login tab.`,
        )
      }

      if (profile.role !== 'member') {
        supabase.functions
          .invoke('send-email', {
            headers: edgeFunctionAnonHeaders(),
            body: {
              template: 'login_alert',
              to: data.user.email,
              data: {
                email: data.user.email,
                timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
              },
            },
          })
          .catch(() => {})
      }

      const { data: sess } = await supabase.auth.getSession()
      const appOrigin = getAppOrigin()
      if (sess.session && appOrigin) {
        window.location.href = appHandoffUrl(sess.session.access_token, sess.session.refresh_token)
        return
      }

      window.location.href = '/'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
      <p className="text-sm text-muted-foreground mb-6">Sign in to your Fetch Fitness account</p>

      <div className="flex gap-1.5 p-1 bg-surface-100 rounded-xl border border-border/50 mb-6">
        {LOGIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id)
              setError('')
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-50',
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={activeTab}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5"
        >
          <Shield className="w-3 h-3" />
          {LOGIN_TABS.find((t) => t.id === activeTab)?.hint}
        </motion.p>
      </AnimatePresence>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-100 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <a href={appUrl('/forgot-password')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-100 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="login-remember"
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="w-4 h-4 rounded border-border bg-surface-100 text-brand-500 focus:ring-brand-500/50"
          />
          <label htmlFor="login-remember" className="text-sm text-muted-foreground">
            Remember me for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Signing in…' : `Sign in as ${LOGIN_TABS.find((t) => t.id === activeTab)?.label}`}
        </button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Register your gym
        </Link>
      </p>
    </motion.div>
  )
}
