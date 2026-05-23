'use client'

import { useEffect, useState } from 'react'
import { checkAccess, requestAccessKey } from '@/lib/contract'
import { ArticleBody } from '@/components/ArticleBody'
import { decrypt, splitKeyString } from '@/lib/encryption'
import { PassMintButton } from './PassMintButton'
import { EmptyState } from './ui/EmptyState'

interface Props {
  contentId: string
  ipfsCid: string
  price: string
  title: string
  description: string
  walletAddress: string | null
}

type ViewState =
  | { type: 'loading' }
  | { type: 'no_wallet' }
  | { type: 'no_access' }
  | { type: 'unlocking' }
  | { type: 'content'; markdown: string }
  | { type: 'error'; message: string }

export function ContentViewer({
  contentId,
  ipfsCid,
  price,
  title,
  walletAddress,
}: Props) {
  const [state, setState] = useState<ViewState>({ type: 'loading' })

  async function unlock() {
    if (!walletAddress) {
      setState({ type: 'no_wallet' })
      return
    }
    setState({ type: 'unlocking' })
    try {
      const keyString = await requestAccessKey(walletAddress, contentId)
      const { key, iv } = splitKeyString(keyString)

      const res = await fetch(`/api/ipfs-proxy?cid=${encodeURIComponent(ipfsCid)}`)
      if (!res.ok) throw new Error('Failed to fetch content from IPFS')
      const ciphertext = await res.text()

      const markdown = await decrypt(ciphertext, key, iv)
      setState({ type: 'content', markdown })
    } catch (err) {
      setState({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to decrypt content',
      })
    }
  }

  useEffect(() => {
    if (!walletAddress) {
      setState({ type: 'no_wallet' })
      return
    }

    checkAccess(contentId, walletAddress)
      .then((hasAccess) => {
        if (hasAccess) {
          unlock()
        } else {
          setState({ type: 'no_access' })
        }
      })
      .catch(() => setState({ type: 'no_access' }))
  }, [contentId, walletAddress])

  if (state.type === 'loading' || state.type === 'unlocking') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--border-strong) border-t-(--accent)" />
        <p className="text-sm text-(--text-secondary)">
          {state.type === 'loading' ? 'Checking access…' : 'Decrypting content…'}
        </p>
      </div>
    )
  }

  if (state.type === 'no_wallet') {
    return (
      <EmptyState
        title="Connect your wallet to read"
        description="You need a Polkadot-compatible wallet (Talisman, SubWallet) to access gated content."
      />
    )
  }

  if (state.type === 'no_access') {
    return (
      <div className="rounded-lg border border-(--border) bg-(--surface) p-8">
        <p className="mb-6 text-center text-sm text-(--text-secondary)">
          Access pass required to read this content.
        </p>
        <div className="mx-auto max-w-sm">
          <PassMintButton
            contentId={contentId}
            price={price}
            walletAddress={walletAddress!}
            onSuccess={unlock}
          />
        </div>
        <p className="mt-4 text-center text-xs text-(--text-muted)">
          One-time purchase. Access recorded on-chain, forever.
        </p>
      </div>
    )
  }

  if (state.type === 'error') {
    return (
      <div className="rounded-lg border border-red-900/60 bg-(--danger-subtle) p-5 text-sm text-red-400">
        {state.message}
      </div>
    )
  }

  return (
    <ArticleBody markdown={state.markdown} title={title} />
  )
}
