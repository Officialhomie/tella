'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { getUserPasses, getContent, type ContentMeta, type PassInfo } from '@/lib/contract'
import { WalletConnect } from '@/components/WalletConnect'
import { type InjectedAccountWithMeta } from '@/lib/wallet'
import Link from 'next/link'

interface PassWithMeta extends PassInfo {
  contentMeta: ContentMeta | null
}

export default function MyPassesPage() {
  const [wallet, setWallet] = useState<InjectedAccountWithMeta | null>(null)
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
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">← Home</Link>
        <WalletConnect connected={wallet} onConnect={setWallet} />
      </div>

      <h1 className="mb-8 text-3xl font-bold text-neutral-100">My Passes</h1>

      {!wallet && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
          Connect your wallet to see your passes.
        </div>
      )}

      {wallet && loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-800" />
          ))}
        </div>
      )}

      {wallet && !loading && passes.length === 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p className="text-neutral-500">No passes yet.</p>
          <Link href="/browse" className="mt-2 block text-sm text-violet-400 hover:text-violet-300">
            Browse content →
          </Link>
        </div>
      )}

      {passes.length > 0 && (
        <div className="space-y-3">
          {passes.map((p) => (
            <Link
              key={p.content_id}
              href={`/post/${p.content_id}`}
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 hover:border-neutral-600"
            >
              <div>
                <p className="font-medium text-neutral-200">
                  {p.contentMeta?.title ?? `Content #${p.content_id}`}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Minted at block #{p.minted_at.toLocaleString()}
                </p>
              </div>
              <span className="rounded-full border border-green-800 bg-green-950 px-3 py-1 text-xs text-green-400">
                Access granted
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
