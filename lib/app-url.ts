/**
 * Main app origin (e.g. https://my.yourdomain.com) — dashboard + session handoff.
 * Must match the Vite app URL where `/auth/handoff` lives.
 */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  }
  return (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
}

/** Full URL on the app for a path (login, etc.). */
export function appUrl(path: string): string {
  const base = getAppOrigin()
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}

/** Pass Supabase session to the Vite app via hash (see `src/pages/auth/AuthHandoff.tsx`). */
export function appHandoffUrl(accessToken: string, refreshToken: string): string {
  const base = getAppOrigin()
  if (!base) return ''
  const hash = new URLSearchParams({
    access_token: accessToken,
    refresh_token: refreshToken,
  }).toString()
  return `${base}/auth/handoff#${hash}`
}

export function navigateToApp(path: string) {
  if (typeof window === 'undefined') return
  window.location.href = appUrl(path)
}
