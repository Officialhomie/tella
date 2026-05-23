'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getUserPasses, getContent, type ContentMeta, type PassInfo } from '@/lib/contract'
import { useWallet } from '@/app/providers'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface PassWithMeta extends PassInfo {
  contentMeta: ContentMeta | null
}

export default function MyPassesPage() {
  const { wallet } = useWallet()
  const [passes, setPasses] = useState<PassWithMeta[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!wallet) return
    setLoading(true)
    getUserPasses(wallet.address)
      .then(async (raw) => {
        const enriched = await Promise.all(
          raw.map(async (p) => ({
            ...p,
            contentMeta: await getContent(p.content_id).catch(() => null),
          })),
        )
        setPasses(enriched)
      })
      .finally(() => setLoading(false))
  }, [wallet])

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 border-b border-[--border] pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[--text-primary]">My Passes</h1>
        <p className="mt-1.5 text-[--text-secondary]">Your on-chain content access passes</p>
      </div>

      {!wallet && (
        <EmptyState
          title="Connect your wallet to view passes"
          description="Use the Connect Wallet button in the top navigation"
        />
      )}

      {wallet && loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-[--surface]" />
          ))}
        </div>
      )}

      {wallet && !loading && passes.length === 0 && (
        <EmptyState
          title="No passes yet."
          description="Buy access to an article to get your first pass."
          action={
            <Link
              href="/browse"
              className="text-sm text-[--accent] transition-colors hover:text-[--accent-dim]"
            >
              Browse content
            </Link>
          }
        />
      )}

      {passes.length > 0 && (
        <div className="divide-y divide-[--border] rounded-lg border border-[--border] bg-[--surface]">
          {passes.map((p) => (
            <Link
              key={p.content_id}
              href={`/post/${p.content_id}`}
              className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-[--surface-raised]"
            >
              <div>
                <p className="font-medium text-[--text-primary]">
                  {p.contentMeta?.title ?? `Content #${p.content_id}`}
                </p>
                <p className="mt-0.5 text-xs text-[--text-muted]">
                  Block #{p.minted_at.toLocaleString()}
                </p>
              </div>
              <Badge variant="green">Access granted</Badge>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
