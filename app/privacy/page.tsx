import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal-page-shell'
import { getSupportEmail } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy — Fetch Fitness',
  description: 'How Fetch Fitness collects, uses, and protects personal information when you use our website and services.',
}

export default function PrivacyPage() {
  const email = getSupportEmail()

  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="May 4, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          Fetch Fitness (&quot;we&quot;, &quot;us&quot;) respects your privacy. This Privacy Policy describes how we
          collect, use, store, and share personal information when you visit our{' '}
          <Link href="/">marketing website</Link>, use our registration or checkout pages, or use the Fetch Fitness
          application connected to your account.
        </p>
        <p>
          This Policy is designed to reflect practices consistent with the <strong>Information Technology Act, 2000</strong>{' '}
          and applicable rules in India, including the <strong>Information Technology (Reasonable Security Practices and
          Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> where relevant, and aligns with
          common expectations under the <strong>Digital Personal Data Protection Act, 2023</strong> as guidance evolves.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Account and profile:</strong> Name, email address, phone number, business or gym name, and similar
            details you provide when registering or contacting us.
          </li>
          <li>
            <strong>Usage and technical data:</strong> IP address, device and browser type, pages viewed, and approximate
            location derived from IP, collected through logs, cookies, and similar technologies.
          </li>
          <li>
            <strong>Payment information:</strong> Payments are processed by our payment partners (for example Razorpay).
            We do not store full card numbers on our servers; we may receive limited billing metadata and transaction
            references.
          </li>
          <li>
            <strong>Communications:</strong> Messages you send to support or through enquiry forms.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use information</h2>
        <p>We use personal information to:</p>
        <ul>
          <li>Provide, operate, and improve the Service;</li>
          <li>Create and manage your account;</li>
          <li>Process payments and subscriptions;</li>
          <li>Respond to enquiries and support requests;</li>
          <li>Send service-related notices (for example security, billing, or policy updates);</li>
          <li>Analyse usage in aggregate to improve our website and product (including analytics);</li>
          <li>Comply with law and protect our rights and users.</li>
        </ul>
      </section>

      <section>
        <h2>4. Cookies and analytics</h2>
        <p>
          We use cookies and similar technologies for essential site operation, preferences (such as theme), and
          analytics. Our site may use Google Analytics or similar tools to understand traffic patterns. You can control
          cookies through your browser settings; blocking some cookies may affect functionality.
        </p>
      </section>

      <section>
        <h2>5. Sharing of information</h2>
        <p>We may share information with:</p>
        <ul>
          <li>
            <strong>Service providers</strong> who assist us (for example hosting, database, email, payments, analytics),
            under contracts that require appropriate protection;
          </li>
          <li>
            <strong>Legal and safety</strong> when we believe disclosure is required by law, court order, or to protect
            the rights, property, or safety of Fetch Fitness, our users, or others.
          </li>
        </ul>
        <p>We do not sell your personal information to third parties for their independent marketing.</p>
      </section>

      <section>
        <h2>6. International transfers</h2>
        <p>
          Our infrastructure or subprocessors may be located outside India. Where personal data is transferred across
          borders, we take steps consistent with applicable law to ensure appropriate safeguards.
        </p>
      </section>

      <section>
        <h2>7. Retention</h2>
        <p>
          We retain information for as long as needed to provide the Service, meet legal obligations, resolve disputes,
          and enforce our agreements. Retention periods may differ by data category and legal requirements.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          We implement technical and organisational measures designed to protect personal information. No method of
          transmission or storage is completely secure; we encourage strong passwords and safeguarding your credentials.
        </p>
      </section>

      <section>
        <h2>9. Your rights</h2>
        <p>
          Depending on applicable law, you may have the right to access, correct, update, or delete certain personal
          information, or to object to or restrict certain processing. To exercise these rights, contact us at{' '}
          <a href={`mailto:${email}`}>{email}</a>. We may need to verify your identity before fulfilling a request.
        </p>
      </section>

      <section>
        <h2>10. Children</h2>
        <p>
          The Service is intended for businesses and adults. We do not knowingly collect personal information from
          children without appropriate parental consent. If you believe we have collected information from a child in
          error, contact us and we will take appropriate steps.
        </p>
      </section>

      <section>
        <h2>11. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the new version on this page and update the
          &quot;Last updated&quot; date. Where changes are material, we may provide additional notice.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>
          Privacy questions or requests: <a href={`mailto:${email}`}>{email}</a>
        </p>
        <p>
          For terms governing use of the Service, see our <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>
    </LegalPageShell>
  )
}
