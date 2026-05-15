import { subscriptionChargeTotal } from '@/lib/utils'
import type { PricingRegion } from '@/lib/pricing-locale'

export type PlanWithPrices = {
  price: number
  price_usd?: number | null
  features?: Record<string, unknown> | null
}

export function planPricingRegionValue(region: PricingRegion): 'IN' | 'INTL' {
  return region
}

export function planListAmount(plan: PlanWithPrices, region: PricingRegion): number {
  if (region === 'IN') return Number(plan.price)
  const usd = plan.price_usd != null ? Number(plan.price_usd) : NaN
  if (Number.isFinite(usd) && usd >= 0) return usd
  return Number(plan.price)
}

export function planCurrency(region: PricingRegion): 'INR' | 'USD' {
  return region === 'IN' ? 'INR' : 'USD'
}

export function planIsDemo(plan: PlanWithPrices, region: PricingRegion): boolean {
  const amount = planListAmount(plan, region)
  if (amount <= 0) return true
  return plan.features?.is_demo === true
}

export function planChargeTotal(
  plan: PlanWithPrices,
  region: PricingRegion,
  gstEnabled: boolean,
): number {
  const base = planListAmount(plan, region)
  if (region === 'INTL') return Math.round(base * 100) / 100
  return subscriptionChargeTotal(base, gstEnabled)
}

export function formatPlanMoney(amount: number, region: PricingRegion): string {
  const currency = planCurrency(region)
  const locale = currency === 'INR' ? 'en-IN' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(amount)
}
