export type PaymentProvider = 'razorpay' | 'stripe'

export function getPaymentProvider(): PaymentProvider {
  const v = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'razorpay').toLowerCase().trim()
  return v === 'stripe' ? 'stripe' : 'razorpay'
}
