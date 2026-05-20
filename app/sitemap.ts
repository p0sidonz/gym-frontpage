import { MetadataRoute } from 'next'
import { getSortedPostsData } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use NEXT_PUBLIC_SITE_URL or fallback to the domain from support email / standard fetch.fitness
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fetch.fitness'
  
  const allPosts = getSortedPostsData()
  
  const blogUrls = allPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date).toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  
  const staticRoutes = [
    '',
    '/blog',
    '/support',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1.0 : 0.6,
  }))

  return [...staticRoutes, ...blogUrls]
}
