'use client'

import { useState, useCallback } from 'react'
import { connectWallet, type InjectedAccountWithMeta } from '@/lib/wallet'

interface Props {
  onConnect: (account: InjectedAccountWithMeta) => void
  connected?: InjectedAccountWithMeta | null
}

export function WalletConnect({ onConnect, connected }: Props) {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleConnect = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const found = await connectWallet()
      setAccounts(found)
      if (found.length === 1) onConnect(found[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [onConnect])

  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm">
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <span className="font-mono text-neutral-300">
          {connected.address.slice(0, 6)}…{connected.address.slice(-4)}
        </span>
        <span className="text-neutral-500">({connected.meta.name})</span>
      </div>
    )
  }

  return (
    <div>
      {accounts.length > 1 ? (
        <select
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200"
          onChange={(e) => {
            const account = accounts.find((a) => a.address === e.target.value)
            if (account) onConnect(account)
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Select account
          </option>
          {accounts.map((a) => (
            <option key={a.address} value={a.address}>
              {a.meta.name} — {a.address.slice(0, 8)}…
            </option>
          ))}
        </select>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? 'Connecting…' : 'Connect Wallet'}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
