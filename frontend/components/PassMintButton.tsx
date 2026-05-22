'use client'

import { useState } from 'react'
import { mintPass } from '@/lib/contract'

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
      <div className="rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-center text-sm text-green-300">
        Access granted. Content unlocking…
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleMint}
        disabled={status === 'pending'}
        className="w-full rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
      >
        {status === 'pending'
          ? 'Signing transaction…'
          : `Buy Access Pass — ${displayPrice} VARA`}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
