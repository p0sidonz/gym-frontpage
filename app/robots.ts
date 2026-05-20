import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fetch.fitness'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/razor-hook/', '/stripe-hook/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
