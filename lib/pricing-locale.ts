/** Browser IANA time zones treated as India for INR + GST pricing. */
const INDIA_TIMEZONES = new Set(['Asia/Kolkata', 'Asia/Calcutta'])

export type PricingRegion = 'IN' | 'INTL'

export function isIndiaTimezone(timeZone: string): boolean {
  return INDIA_TIMEZONES.has(timeZone)
}

/** Uses the visitor browser timezone (client-only). */
export function getPricingRegionFromBrowser(): PricingRegion {
  if (typeof window === 'undefined') return 'IN'
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return isIndiaTimezone(tz) ? 'IN' : 'INTL'
  } catch {
    return 'IN'
  }
}
