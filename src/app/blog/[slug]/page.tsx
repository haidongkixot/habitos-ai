import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, published: true },
  })

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/blog" className="text-emerald-400 hover:text-emerald-300 text-sm mb-8 block">← Back to Blog</Link>
        <h1 className="text-4xl font-bold text-white mb-4">{post.title}</h1>
        <p className="text-gray-500 text-sm mb-8">
          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {post.excerpt && (
          <p className="text-lg text-gray-300 mb-8 leading-relaxed border-l-4 border-emerald-500 pl-4">{post.excerpt}</p>
        )}
        <div className="prose prose-invert prose-emerald max-w-none">
          {post.content ? (
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</div>
          ) : (
            <p className="text-gray-500">Content coming soon...</p>
          )}
        </div>
      </div>
    </div>
  )
}
