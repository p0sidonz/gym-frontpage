import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal-page-shell'
import { getSupportEmail } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of Service — Fetch Fitness',
  description:
    'Terms of Service for Fetch Fitness, including cancellation, refunds, and consumer rights under Indian law.',
}

export default function TermsPage() {
  const email = getSupportEmail()

  return (
    <LegalPageShell title="Terms of Service" lastUpdated="May 4, 2026">
      <section>
        <h2>1. Agreement</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Fetch Fitness website,
          marketing pages, registration and checkout flows, and the Fetch Fitness software service (together, the
          &quot;Service&quot;) offered by Fetch Fitness (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By accessing
          or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. The Service</h2>
        <p>
          Fetch Fitness is a cloud-based platform for gym and fitness-business management (for example: members,
          billing, attendance, staff, and communications). Features may change over time. We strive for high
          availability but do not guarantee uninterrupted access.
        </p>
      </section>

      <section>
        <h2>3. Eligibility and accounts</h2>
        <p>
          You must be able to form a binding contract under applicable law to use the Service. You are responsible for
          maintaining the confidentiality of your account credentials and for activity under your account. You agree to
          provide accurate information and to keep it updated.
        </p>
      </section>

      <section>
        <h2>4. Subscriptions, fees, and taxes</h2>
        <p>
          Paid plans, where offered, are described on our website at the time of purchase (including billing cycle,
          fees, and any applicable taxes such as GST in India). You authorize us and our payment partners to charge the
          payment method you provide. Demo or trial access, if offered, is subject to these Terms unless we specify
          otherwise at signup.
        </p>
      </section>

      <section id="cancellation-and-refunds">
        <h2>5. Cancellation and refund policy (India)</h2>
        <p>
          This section is intended to align with consumer-protection expectations in India, including the{' '}
          <strong>Consumer Protection Act, 2019</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>{' '}
          as applicable to our business model. It does not waive any non-excludable rights you may have under law.
        </p>

        <h3>5.1 Cancellation by you</h3>
        <p>
          You may stop using the Service at any time. For paid subscriptions, you may request cancellation so that the
          subscription does not renew at the end of the current billing period, unless we offer self-service
          cancellation inside the product—in which case those in-product controls apply. Cancellation does not
          automatically delete your data; retention and deletion are handled as described in our{' '}
          <Link href="/privacy">Privacy Policy</Link> and product settings where available.
        </p>

        <h3>5.2 Refunds</h3>
        <ul>
          <li>
            <strong>Duplicate or erroneous charges:</strong> If you were charged incorrectly or twice for the same
            transaction, contact us at <a href={`mailto:${email}`}>{email}</a>. After verification, we will initiate a
            refund or correction as appropriate, typically within <strong>7–14 business days</strong> from approval,
            subject to your bank or payment provider&apos;s processing time.
          </li>
          <li>
            <strong>Service not materially provided:</strong> If you paid for a subscription period and we did not
            materially provide access to the Service through no fault of yours, you may request a proportional refund or
            credit for the affected period. We will assess each request in good faith and in line with applicable law.
          </li>
          <li>
            <strong>Change of mind / mid-term cancellation:</strong> Unless required by applicable law or expressly
            stated at checkout, fees for the current billing period are generally non-refundable after access has been
            granted. Where Indian law grants you a statutory right to a refund or remedy, that right prevails over any
            inconsistent sentence in these Terms.
          </li>
        </ul>

        <h3>5.3 Grievance officer (India)</h3>
        <p>
          For grievances relating to the Service, billing, or these Terms, write to{' '}
          <a href={`mailto:${email}`}>{email}</a> with the subject line &quot;Grievance — Terms&quot;. Include your
          name, contact details, and a clear description of the issue. We will acknowledge receipt and work with you to
          resolve the matter in accordance with applicable law and our internal processes.
        </p>
      </section>

      <section>
        <h2>6. Acceptable use</h2>
        <p>
          You agree not to misuse the Service (for example: no unlawful activity, no attempting to breach security, no
          scraping that overloads our systems, no infringement of others&apos; rights). We may suspend or terminate
          access for violations.
        </p>
      </section>

      <section>
        <h2>7. Intellectual property</h2>
        <p>
          We and our licensors own the Service, including software, branding, and content on our marketing site. We
          grant you a limited, non-exclusive, non-transferable right to use the Service during your subscription in line
          with these Terms. You retain rights to content you upload; you grant us a licence to host and process it as
          needed to operate the Service.
        </p>
      </section>

      <section>
        <h2>8. Disclaimers</h2>
        <p>
          To the fullest extent permitted by law, the Service is provided &quot;as is&quot; without warranties of
          merchantability, fitness for a particular purpose, or non-infringement. Some jurisdictions do not allow certain
          disclaimers; in those cases, our liability is limited as permitted by law.
        </p>
      </section>

      <section>
        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by applicable law, we are not liable for indirect, incidental, special,
          consequential, or punitive damages, or loss of profits, data, or goodwill. Our aggregate liability arising out
          of these Terms or the Service in any twelve-month period is limited to the amount you paid us for the Service
          in that period (or zero if the Service was free), except where law does not permit such a cap.
        </p>
      </section>

      <section>
        <h2>10. Governing law and disputes</h2>
        <p>
          These Terms are governed by the <strong>laws of India</strong>. Subject to your non-waivable rights, courts
          in India shall have jurisdiction over disputes arising from these Terms or the Service.
        </p>
      </section>

      <section>
        <h2>11. Changes</h2>
        <p>
          We may update these Terms from time to time. We will post the updated version on this page and revise the
          &quot;Last updated&quot; date. Material changes may be communicated by email or in-product notice where
          appropriate. Continued use after changes constitutes acceptance unless applicable law requires otherwise.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>
          Questions about these Terms: <a href={`mailto:${email}`}>{email}</a>
        </p>
      </section>
    </LegalPageShell>
  )
}
