'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getContent, type ContentMeta } from '@/lib/contract'
import { ContentViewer } from '@/components/ContentViewer'
import { useWallet } from '@/app/providers'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default function PostPage({ params }: Props) {
  const { id } = use(params)
  const [content, setContent] = useState<ContentMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const { wallet } = useWallet()

  useEffect(() => {
    getContent(id)
      .then(setContent)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-4">
          <div className="h-4 w-16 animate-pulse rounded bg-[--surface]" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-[--surface]" />
          <div className="h-4 w-full animate-pulse rounded bg-[--surface]" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-[--surface]" />
        </div>
      </main>
    )
  }

  if (!content) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[--text-secondary]">Content not found.</p>
        <Link
          href="/browse"
          className="mt-3 inline-block text-sm text-[--accent] hover:text-[--accent-dim]"
        >
          Back to browse
        </Link>
      </main>
    )
  }

  const badgeVariant = content.content_type === 'Newsletter' ? 'green' : 'blue'

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/browse"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-[--text-secondary] transition-colors hover:text-[--text-primary]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8.5 11L4.5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Browse
      </Link>

      <div className="mb-10 border-b border-[--border] pb-10">
        <div className="mb-4">
          <Badge variant={badgeVariant}>{content.content_type}</Badge>
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-[--text-primary] sm:text-4xl">
          {content.title}
        </h1>
        <p className="text-base leading-relaxed text-[--text-secondary]">{content.description}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-[--text-muted]">
          <span>Block #{Number(content.published_at).toLocaleString()}</span>
          <span className="h-1 w-1 rounded-full bg-[--border-strong]" />
          <span>{content.pass_count} reader{content.pass_count !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <ContentViewer
        contentId={content.id}
        ipfsCid={content.ipfs_cid}
        price={content.price}
        title={content.title}
        description={content.description}
        walletAddress={wallet?.address ?? null}
      />
    </main>
  )
}
