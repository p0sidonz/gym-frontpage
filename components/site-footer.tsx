'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell } from 'lucide-react'

export function SiteFooter() {
  const pathname = usePathname()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === '/') {
      e.preventDefault()
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 bg-black/5 dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Fetch Fitness</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">The all-in-one SaaS platform for modern gyms and fitness studios.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm mb-3">Product</h4>
          <div className="space-y-2">
            <Link href="/#features" onClick={(e) => handleNavClick(e, 'features')} className="block text-xs text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/#pricing" onClick={(e) => handleNavClick(e, 'pricing')} className="block text-xs text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/#testimonials" onClick={(e) => handleNavClick(e, 'testimonials')} className="block text-xs text-muted-foreground hover:text-foreground">
              Testimonials
            </Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm mb-3">Company</h4>
          <div className="space-y-2">
            <Link href="/blog" className="block text-xs text-muted-foreground hover:text-foreground">
              Blog
            </Link>
            <Link href="/#faq" onClick={(e) => handleNavClick(e, 'faq')} className="block text-xs text-muted-foreground hover:text-foreground">
              FAQ
            </Link>
            <Link href="/#contact" onClick={(e) => handleNavClick(e, 'contact')} className="block text-xs text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm mb-3">Legal</h4>
          <div className="space-y-2">
            <Link href="/support" className="block text-xs text-muted-foreground hover:text-foreground">
              Support
            </Link>
            <Link href="/terms" className="block text-xs text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy" className="block text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm mb-3">Account</h4>
          <div className="space-y-2">
            <Link href="/login" className="block text-xs text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link href="/register" className="block text-xs text-muted-foreground hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Fetch Fitness. All rights reserved.</p>
        <p className="text-xs text-muted-foreground">Made with ❤️</p>
      </div>
    </footer>
  )
}
