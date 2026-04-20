import { handleRazorpayWebhook } from '@/lib/razorpay-webhook-handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** @deprecated Prefer POST /razor-hook — same behavior. */
export async function POST(req: Request) {
  return handleRazorpayWebhook(req)
}
