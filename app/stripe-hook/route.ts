import { handleStripeWebhook } from '@/lib/stripe-webhook-handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Stripe webhook: configure endpoint URL to POST https://<marketing-domain>/stripe-hook */
export async function POST(req: Request) {
  return handleStripeWebhook(req)
}
