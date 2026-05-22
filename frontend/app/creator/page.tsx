'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { WalletConnect } from '@/components/WalletConnect'
import { publishContent, getCreatorRevenue, claimRevenue } from '@/lib/contract'
import { generateKey, encodeKeyString } from '@/lib/encryption-browser'
import { type InjectedAccountWithMeta } from '@/lib/wallet'
import Link from 'next/link'

export default function CreatorPage() {
  const [wallet, setWallet] = useState<InjectedAccountWithMeta | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    ipfsCid: '',
    price: '1',
    contentType: 'Article' as 'Article' | 'Newsletter',
  })
  const [status, setStatus] = useState<string | null>(null)
  const [revenue, setRevenue] = useState<string | null>(null)

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!wallet) return
    setStatus('Publishing...')
    try {
      const priceUnits = (parseFloat(form.price) * 1_000_000_000_000).toFixed(0)
      // For creator-uploaded content, generate a placeholder key
      // (in production, creator encrypts content client-side before uploading to IPFS)
      const aesKey = generateKey()
      const keyString = encodeKeyString(aesKey)

      await publishContent(wallet.address, {
        title: form.title,
        description: form.description,
        ipfsCid: form.ipfsCid,
        price: BigInt(priceUnits),
        encryptedAesKey: keyString,
        contentType: form.contentType,
      })
      setStatus('Published successfully!')
      setForm({ title: '', description: '', ipfsCid: '', price: '1', contentType: 'Article' })
    } catch (err) {
      setStatus('Error: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function handleCheckRevenue() {
    if (!wallet) return
    const amount = await getCreatorRevenue(wallet.address)
    const vara = (Number(BigInt(amount)) / 1e12).toFixed(4)
    setRevenue(`${vara} VARA pending`)
  }

  async function handleClaim() {
    if (!wallet) return
    setStatus('Claiming...')
    try {
      await claimRevenue(wallet.address)
      setStatus('Revenue claimed!')
      setRevenue(null)
    } catch (err) {
      setStatus('Error: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">← Home</Link>
        <WalletConnect connected={wallet} onConnect={setWallet} />
      </div>

      <h1 className="mb-8 text-3xl font-bold text-neutral-100">Creator Dashboard</h1>

      {!wallet && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
          Connect your wallet to publish content.
        </div>
      )}

      {wallet && (
        <div className="space-y-8">
          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-200">Publish Content</h2>
            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-neutral-400">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none"
                  placeholder="AI x Crypto Weekly #1"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-neutral-400">Description (teaser)</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-neutral-400">IPFS CID (encrypted content)</label>
                <input
                  required
                  value={form.ipfsCid}
                  onChange={(e) => setForm({ ...form, ipfsCid: e.target.value })}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-violet-500 focus:outline-none"
                  placeholder="bafybeig..."
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-neutral-400">Price (VARA)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-neutral-400">Type</label>
                  <select
                    value={form.contentType}
                    onChange={(e) => setForm({ ...form, contentType: e.target.value as 'Article' | 'Newsletter' })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
                  >
                    <option value="Article">Article</option>
                    <option value="Newsletter">Newsletter</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-violet-600 py-2.5 font-semibold text-white hover:bg-violet-500"
              >
                Publish
              </button>
            </form>
            {status && <p className="mt-3 text-sm text-neutral-400">{status}</p>}
          </section>

          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-200">Revenue</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCheckRevenue}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
              >
                Check Balance
              </button>
              {revenue && (
                <>
                  <span className="font-semibold text-violet-400">{revenue}</span>
                  <button
                    onClick={handleClaim}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                  >
                    Claim
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
