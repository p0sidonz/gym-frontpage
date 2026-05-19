import Link from 'next/link'
import { getSortedPostsData } from '@/lib/blog'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Fetch Fitness',
  description: 'Read the latest news, tips, and updates about gym management and fitness.',
}

export default function BlogIndex() {
  const allPostsData = getSortedPostsData()

  return (
    <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 max-w-4xl min-h-[80vh]">
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-8">
        Fetch Fitness Blog
      </h1>
      <p className="text-lg text-muted-foreground mb-12">
        Insights, tips, and updates to help you grow your fitness business.
      </p>

      <div className="grid gap-8">
        {allPostsData.map(({ slug, title, date, excerpt, author }) => (
          <Link key={slug} href={`/blog/${slug}`} className="block group">
            <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-brand-300">
              <h2 className="text-2xl font-bold mb-2 group-hover:text-brand-600 transition-colors">
                {title}
              </h2>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{author}</span>
                <span className="mx-2">•</span>
                <time dateTime={date}>
                  {new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <p className="text-muted-foreground leading-relaxed">{excerpt}</p>
            </div>
          </Link>
        ))}
        {allPostsData.length === 0 && (
          <div className="text-muted-foreground italic">No blog posts found. Check back later!</div>
        )}
      </div>
    </div>
  )
}
