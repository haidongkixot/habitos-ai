import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Blog</h1>
          <p className="text-gray-400">Tips, research, and insights about building better habits</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">✍️</div>
            <p>No posts published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="block bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="text-gray-400 text-sm line-clamp-2">{post.excerpt}</p>}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 mt-1">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
