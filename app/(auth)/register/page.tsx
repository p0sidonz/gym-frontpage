import { RegisterForm } from '@/components/auth/register-form'
import { Suspense } from 'react'

export const metadata = {
  title: 'Register — Fetch Fitness',
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading registration…</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
