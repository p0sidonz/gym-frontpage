import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal-page-shell'
import { getSupportEmail } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Customer Support — Fetch Fitness',
  description: 'Contact Fetch Fitness for help with your gym management subscription, billing, and technical support.',
}

export default function SupportPage() {
  const email = getSupportEmail()

  return (
    <LegalPageShell title="Customer Support" lastUpdated="May 4, 2026">
      <section>
        <h2>How we can help</h2>
        <p>
          Fetch Fitness provides software for gym owners, managers, and staff. If you need help signing up, using the
          platform, understanding your subscription, or reporting a problem, reach us using the options below.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          <strong>Email:</strong>{' '}
          <a href={`mailto:${email}`}>{email}</a>
        </p>
        <p>
          We aim to respond to support requests within <strong>1–2 business days</strong> (Monday–Friday, excluding
          public holidays in India). Complex issues may take longer; we will keep you updated.
        </p>
      </section>

      <section>
        <h2>Before you write</h2>
        <ul>
          <li>
            For <strong>billing or subscription</strong> questions, include your registered email and gym name (if
            applicable).
          </li>
          <li>
            For <strong>technical issues</strong>, describe what you were doing, what you expected, and any error
            message or screenshot.
          </li>
          <li>
            For <strong>cancellations and refunds</strong>, see our{' '}
            <Link href="/terms#cancellation-and-refunds">Terms of Service — Cancellation and refunds</Link>.
          </li>
        </ul>
      </section>

      <section>
        <h2>Sales and onboarding</h2>
        <p>
          Interested in Fetch Fitness for your gym? Use the enquiry form on our{' '}
          <Link href="/#contact">homepage</Link> or email us at the address above.
        </p>
      </section>
    </LegalPageShell>
  )
}
