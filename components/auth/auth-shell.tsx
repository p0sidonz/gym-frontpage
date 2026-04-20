import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden bg-surface-50 flex-col items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-brand-600/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/30">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Power Your<br />
            <span className="gradient-text">Gym Business</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The all-in-one SaaS platform for gym owners, trainers, and wellness studios.
          </p>
          <div className="mt-8 space-y-3 text-left">
            {[
              'Member management & billing',
              'Class scheduling & bookings',
              'Trainer commission tracking',
            ].map((f) => (
              <p key={f} className="text-sm text-muted-foreground">
                ✓ {f}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground">Fetch Fitness</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
