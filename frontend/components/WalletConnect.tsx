'use client'

import { useState, useCallback } from 'react'
import { connectWallet, type InjectedAccountWithMeta } from '@/lib/wallet'
import { Button } from './ui/Button'

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
      <div className="flex items-center gap-2 rounded-lg border border-[--border-strong] bg-[--surface] px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[--accent]" />
        <span className="font-mono text-xs text-[--text-secondary]">
          {connected.address.slice(0, 6)}…{connected.address.slice(-4)}
        </span>
        <span className="text-xs text-[--text-muted]">({connected.meta.name})</span>
      </div>
    )
  }

  return (
    <div>
      {accounts.length > 1 ? (
        <select
          className="rounded-lg border border-[--border-strong] bg-[--surface] px-3 py-1.5 text-sm text-[--text-primary] focus:outline-none focus:border-[--accent]/50"
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
        <Button variant="ghost" size="sm" onClick={handleConnect} disabled={loading}>
          {loading ? 'Connecting…' : 'Connect Wallet'}
        </Button>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
