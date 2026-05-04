import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

const legalLinks = [
  { href: '/support', label: 'Support' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
] as const

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base">Fetch Fitness</span>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-1">
              {legalLinks.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="mt-10 space-y-8 text-sm text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-base [&_h2]:mt-0 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:font-medium [&_h3]:text-sm [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_strong]:font-medium [&_a]:text-brand-500 [&_a]:underline hover:[&_a]:text-brand-400">
          {children}
        </div>
      </main>

      <footer className="border-t border-border py-8 px-4 sm:px-6 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Fetch Fitness</p>
        </div>
      </footer>
    </div>
  )
}
