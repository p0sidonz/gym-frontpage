'use client'

import { useEffect, useState } from 'react'
import { getPricingRegionFromBrowser, type PricingRegion } from '@/lib/pricing-locale'

/** Resolves INR vs USD from the visitor browser timezone (India → INR). */
export function usePricingRegion(): { region: PricingRegion; ready: boolean } {
  const [region, setRegion] = useState<PricingRegion>('IN')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setRegion(getPricingRegionFromBrowser())
    setReady(true)
  }, [])

  return { region, ready }
}
