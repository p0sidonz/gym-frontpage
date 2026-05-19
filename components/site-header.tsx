'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  const [mobileNav, setMobileNav] = useState(false)
  const pathname = usePathname()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === '/') {
      e.preventDefault()
      setMobileNav(false)
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setMobileNav(false)
    }
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">Fetch Fitness</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {['features', 'how-it-works', 'pricing', 'testimonials', 'faq', 'contact'].map((id) => (
            <Link
              key={id}
              href={`/#${id}`}
              onClick={(e) => handleNavClick(e, id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors capitalize"
            >
              {id === 'contact' ? 'Contact' : id.replace(/-/g, ' ')}
            </Link>
          ))}
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button type="button" className="p-2 text-muted-foreground" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileNav && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {['features', 'how-it-works', 'pricing', 'testimonials', 'faq', 'contact'].map((id) => (
            <Link
              key={id}
              href={`/#${id}`}
              onClick={(e) => handleNavClick(e, id)}
              className="block w-full text-left text-sm text-muted-foreground hover:text-foreground capitalize py-1.5"
            >
              {id === 'contact' ? 'Contact' : id.replace(/-/g, ' ')}
            </Link>
          ))}
          <Link href="/blog" onClick={() => setMobileNav(false)} className="block w-full text-left text-sm text-muted-foreground hover:text-foreground py-1.5">
            Blog
          </Link>
          <div className="flex gap-3 pt-3 border-t border-border">
            <Link
              href="/login"
              className="flex-1 text-center py-2.5 rounded-lg border border-border text-sm font-medium"
              onClick={() => setMobileNav(false)}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="flex-1 text-center py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold"
              onClick={() => setMobileNav(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
