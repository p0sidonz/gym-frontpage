import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const GST_RATE = 0.18

export function subscriptionTotalWithGst(basePrice: number): number {
  return Math.round(basePrice * (1 + GST_RATE) * 100) / 100
}

export function subscriptionChargeTotal(basePrice: number, gstEnabled: boolean): number {
  if (!gstEnabled) return Math.round(Number(basePrice) * 100) / 100
  return subscriptionTotalWithGst(basePrice)
}

export function formatSubscriptionBillingSuffix(durationMonths: number): string {
  if (durationMonths >= 12 && durationMonths % 12 === 0) {
    const y = durationMonths / 12
    return y === 1 ? '/ year' : `/ ${y} years`
  }
  return `/ ${durationMonths} mo`
}
