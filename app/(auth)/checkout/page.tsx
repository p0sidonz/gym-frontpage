import { Suspense } from 'react'
import { CheckoutForm } from '@/components/auth/checkout-form'

export const metadata = {
  title: 'Checkout — Fetch Fitness',
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading checkout…</p>
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  )
}
