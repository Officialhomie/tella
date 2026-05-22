'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { checkAccess, requestAccessKey } from '@/lib/contract'
import { decrypt, splitKeyString } from '@/lib/encryption'
import { PassMintButton } from './PassMintButton'

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
  description,
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
      <div className="py-20 text-center text-neutral-500">
        {state.type === 'loading' ? 'Checking access…' : 'Decrypting content…'}
      </div>
    )
  }

  if (state.type === 'no_wallet') {
    return (
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-8 text-center">
        <p className="mb-2 text-lg font-semibold text-neutral-200">Connect your wallet to read</p>
        <p className="text-sm text-neutral-500">
          You need a Polkadot-compatible wallet (Talisman, SubWallet) to access gated content.
        </p>
      </div>
    )
  }

  if (state.type === 'no_access') {
    return (
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-8">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-neutral-100">{title}</h2>
          <p className="text-sm text-neutral-400">{description}</p>
        </div>
        <div className="mx-auto max-w-sm">
          <PassMintButton
            contentId={contentId}
            price={price}
            walletAddress={walletAddress!}
            onSuccess={unlock}
          />
        </div>
        <p className="mt-4 text-center text-xs text-neutral-600">
          One-time access pass. Yours forever, on-chain.
        </p>
      </div>
    )
  }

  if (state.type === 'error') {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950 p-6 text-sm text-red-300">
        {state.message}
      </div>
    )
  }

  return (
    <article className="prose prose-invert prose-neutral max-w-none">
      <ReactMarkdown>{state.markdown}</ReactMarkdown>
    </article>
  )
}
