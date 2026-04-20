import { LandingPage } from '@/components/landing-page'
import {
  getLandingFeatureCards,
  getPublicSubscriptionPlans,
  type SubscriptionPlanRow,
} from '@/lib/fetch-landing-data'
import { subscriptionTotalWithGst } from '@/lib/utils'

/** Revalidate public pricing & features periodically for fresh SEO without hitting DB every request. */
export const revalidate = 120

function buildSoftwareJsonLd(plans: SubscriptionPlanRow[], featureTitles: string[]) {
  const paid = plans.filter(
    (p) => Number(p.price) > 0 && (p.features as { is_demo?: boolean } | undefined)?.is_demo !== true,
  )
  const offers = paid.map((p) => ({
    '@type': 'Offer' as const,
    name: `${p.name} plan`,
    price: String(subscriptionTotalWithGst(Number(p.price))),
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    description: `Yearly subscription — ${p.name}`,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Fetch Fitness',
    description:
      'All-in-one gym management: members, billing, attendance, staff, classes, and communications.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    ...(featureTitles.length > 0 ? { featureList: featureTitles } : {}),
    ...(offers.length > 0 ? { offers } : {}),
  }
}

export default async function Home() {
  const [plans, featureCards] = await Promise.all([getPublicSubscriptionPlans(), getLandingFeatureCards()])
  const jsonLd = buildSoftwareJsonLd(
    plans,
    featureCards.map((f) => f.title),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage plans={plans} featureCards={featureCards} />
    </>
  )
}
