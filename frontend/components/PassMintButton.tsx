'use client'

import { useState } from 'react'
import { mintPass } from '@/lib/contract'
import { Button } from './ui/Button'

interface Props {
  contentId: string
  price: string
  walletAddress: string
  onSuccess: () => void
}

export function PassMintButton({ contentId, price, walletAddress, onSuccess }: Props) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const ONE_VARA = 1_000_000_000_000n
  const displayPrice = (Number(BigInt(price)) / Number(ONE_VARA)).toFixed(1)

  async function handleMint() {
    setStatus('pending')
    setError(null)
    try {
      await mintPass(walletAddress, contentId, BigInt(price))
      setStatus('success')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-(--accent-dim)/40 bg-(--accent-subtle) px-4 py-3 text-sm font-medium text-(--accent)">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Access granted. Content unlocking…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="primary"
        fullWidth
        onClick={handleMint}
        disabled={status === 'pending'}
        className={status === 'pending' ? 'cursor-wait' : ''}
      >
        {status === 'pending'
          ? 'Signing transaction…'
          : `Buy Access Pass — ${displayPrice} VARA`}
      </Button>
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  )
}
