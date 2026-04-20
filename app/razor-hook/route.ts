import { handleRazorpayWebhook } from '@/lib/razorpay-webhook-handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Primary Razorpay webhook URL for this Next.js app (`landing/`):
 *   POST https://<marketing-domain>/razor-hook
 */
export async function POST(req: Request) {
  return handleRazorpayWebhook(req)
}
