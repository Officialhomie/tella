'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { listContent, type ContentMeta } from '@/lib/contract'
import { ContentCard } from '@/components/ContentCard'
import Link from 'next/link'

export default function BrowsePage() {
  const [content, setContent] = useState<ContentMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listContent(0, 20)
      .then(setContent)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="mb-2 block text-sm text-neutral-500 hover:text-neutral-300">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold text-neutral-100">Browse</h1>
          <p className="mt-1 text-neutral-500">Latest AI x Crypto intelligence</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-neutral-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950 p-6 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && content.length === 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500">No content published yet.</p>
          <p className="mt-1 text-sm text-neutral-600">The agent publishes daily at 09:00 UTC.</p>
        </div>
      )}

      {content.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      )}
    </main>
  )
}
