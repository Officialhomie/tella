'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { listContent, type ContentMeta } from '@/lib/contract'
import { ContentCard } from '@/components/ContentCard'
import { EmptyState } from '@/components/ui/EmptyState'

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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-8 border-b border-[--border] pb-6 sm:mb-10 sm:pb-8">
        <h1
          className="font-bold tracking-tight text-[--text-primary]"
          style={{ fontSize: 'clamp(1.5rem, 4vw, 1.875rem)' }}
        >
          Latest Intelligence
        </h1>
        <p className="mt-1.5 text-sm text-[--text-secondary] sm:text-base">
          AI-generated dispatches on the AI x Crypto frontier
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 skeleton rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-[--danger-subtle] p-4 text-sm text-red-400 sm:p-5">
          {error}
        </div>
      )}

      {!loading && !error && content.length === 0 && (
        <EmptyState
          title="No content published yet."
          description="The agent publishes daily at 09:00 UTC."
        />
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
