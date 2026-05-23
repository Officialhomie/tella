'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { publishContent, getCreatorRevenue, claimRevenue } from '@/lib/contract'
import { formatVaraFromUnits } from '@/lib/amount'
import { generateKey, encodeKeyString } from '@/lib/encryption-browser'
import { useWallet } from '@/app/providers'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

const inputClass =
  'w-full rounded-lg border border-[--border-strong] bg-[--surface] px-3 py-2 text-sm text-[--text-primary] placeholder-[--text-muted] transition-colors focus:border-[--accent]/50 focus:outline-none'

const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-widest text-[--text-secondary]'

export default function CreatorPage() {
  const { wallet } = useWallet()
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
    try {
      const amount = await getCreatorRevenue(wallet.address)
      setRevenue(`${formatVaraFromUnits(amount)} VARA pending`)
    } catch (err) {
      setStatus('Error: ' + (err instanceof Error ? err.message : String(err)))
    }
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
      <div className="mb-10 border-b border-[--border] pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[--text-primary]">
          Creator Dashboard
        </h1>
        <p className="mt-1.5 text-[--text-secondary]">Publish gated content on Vara Network</p>
      </div>

      {!wallet && (
        <EmptyState
          title="Connect your wallet to publish"
          description="Use the Connect Wallet button in the top navigation"
        />
      )}

      {wallet && (
        <div className="space-y-6">
          <section className="rounded-lg border border-[--border] bg-[--surface] p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[--text-secondary]">
              Publish Content
            </h2>
            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                  placeholder="AI x Crypto Weekly #1"
                />
              </div>
              <div>
                <label className={labelClass}>Description (teaser)</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>IPFS CID</label>
                <input
                  required
                  value={form.ipfsCid}
                  onChange={(e) => setForm({ ...form, ipfsCid: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="bafybeig..."
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Price (VARA)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Type</label>
                  <select
                    value={form.contentType}
                    onChange={(e) =>
                      setForm({ ...form, contentType: e.target.value as 'Article' | 'Newsletter' })
                    }
                    className={inputClass}
                  >
                    <option value="Article">Article</option>
                    <option value="Newsletter">Newsletter</option>
                  </select>
                </div>
              </div>
              <Button type="submit" fullWidth>
                Publish
              </Button>
            </form>
            {status && (
              <p
                className={`mt-3 text-sm ${
                  status.startsWith('Error') ? 'text-red-400' : 'text-[--text-secondary]'
                }`}
              >
                {status}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-[--border] bg-[--surface] p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[--text-secondary]">
              Revenue
            </h2>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleCheckRevenue}>
                Check Balance
              </Button>
              {revenue && (
                <>
                  <span className="font-mono text-sm font-semibold text-[--accent]">{revenue}</span>
                  <Button variant="primary" size="sm" onClick={handleClaim}>
                    Claim
                  </Button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
