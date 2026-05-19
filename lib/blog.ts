import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  content: string
  seoTitle?: string
  seoDescription?: string
}

const blogsDirectory = path.join(process.cwd(), 'content', 'blog')

export function getSortedPostsData(): BlogPost[] {
  if (!fs.existsSync(blogsDirectory)) {
    return []
  }
  
  const fileNames = fs.readdirSync(blogsDirectory)
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(blogsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')

      const matterResult = matter(fileContents)

      return {
        slug,
        title: matterResult.data.title,
        date: matterResult.data.date,
        author: matterResult.data.author,
        excerpt: matterResult.data.excerpt,
        content: matterResult.content,
        ...matterResult.data,
      } as BlogPost
    })

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export function getPostData(slug: string): BlogPost | undefined {
  const fullPath = path.join(blogsDirectory, `${slug}.md`)
  if (!fs.existsSync(fullPath)) {
    return undefined
  }
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const matterResult = matter(fileContents)

  return {
    slug,
    title: matterResult.data.title,
    date: matterResult.data.date,
    author: matterResult.data.author,
    excerpt: matterResult.data.excerpt,
    content: matterResult.content,
    ...matterResult.data,
  } as BlogPost
}
