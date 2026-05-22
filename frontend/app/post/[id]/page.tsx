'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { getContent, type ContentMeta } from '@/lib/contract'
import { ContentViewer } from '@/components/ContentViewer'
import { WalletConnect } from '@/components/WalletConnect'
import { type InjectedAccountWithMeta } from '@/lib/wallet'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default function PostPage({ params }: Props) {
  const { id } = use(params)
  const [content, setContent] = useState<ContentMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<InjectedAccountWithMeta | null>(null)

  useEffect(() => {
    getContent(id)
      .then(setContent)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-neutral-800" />
      </main>
    )
  }

  if (!content) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-neutral-500">
        Content not found.
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/browse" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Browse
        </Link>
        <WalletConnect connected={wallet} onConnect={setWallet} />
      </div>

      <div className="mb-8">
        <span className="mb-3 inline-block rounded bg-violet-900 px-2 py-0.5 text-xs font-medium text-violet-300">
          {content.content_type}
        </span>
        <h1 className="text-3xl font-bold text-neutral-100">{content.title}</h1>
        <p className="mt-3 text-neutral-400">{content.description}</p>
        <p className="mt-2 text-xs text-neutral-600">
          Block #{Number(content.published_at).toLocaleString()} ·{' '}
          {content.pass_count} reader{content.pass_count !== 1 ? 's' : ''}
        </p>
      </div>

      <ContentViewer
        contentId={content.id}
        ipfsCid={(content as ContentMeta & { ipfs_cid?: string }).ipfs_cid ?? ''}
        price={content.price}
        title={content.title}
        description={content.description}
        walletAddress={wallet?.address ?? null}
      />
    </main>
  )
}
