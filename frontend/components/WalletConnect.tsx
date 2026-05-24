'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { connectWallet, isMobile, type InjectedAccountWithMeta } from '@/lib/wallet'
import { Button } from './ui/Button'

// Wallets with built-in DApp browsers on mobile.
// Deep link opens the current URL inside the wallet's browser where
// window.injectedWeb3 is available and extension-dapp works normally.
const MOBILE_WALLETS = [
  {
    name: 'SubWallet',
    hint: 'Most popular on Vara Network',
    deepLink: (url: string) => `subwallet://browser?url=${encodeURIComponent(url)}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#004BFF"/>
        <path d="M8 10h10a6 6 0 0 1 0 12H8V10z" fill="white" opacity="0.9"/>
        <path d="M8 16h12a4 4 0 0 1 0 8H8v-8z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Nova Wallet',
    hint: 'Available on iOS & Android',
    deepLink: (url: string) => `novawallet://open/dapp?url=${encodeURIComponent(url)}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#E040FB"/>
        <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="2.5" fill="none"/>
        <circle cx="16" cy="16" r="3" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Talisman',
    hint: 'Open in Talisman mobile',
    deepLink: (url: string) => `talisman://browser?url=${encodeURIComponent(url)}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#D5FF5C"/>
        <path d="M16 6L22 12H18v8h4l-6 6-6-6h4v-8H10L16 6z" fill="#1A1A1A"/>
      </svg>
    ),
  },
]

interface Props {
  onConnect: (account: InjectedAccountWithMeta) => void
  connected?: InjectedAccountWithMeta | null
}

export function WalletConnect({ onConnect, connected }: Props) {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [mobileNoExt, setMobileNoExt] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showPicker])

  const tryConnect = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const found = await connectWallet()
      setAccounts(found)
      if (found.length === 1) onConnect(found[0])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      if (msg === 'NO_EXTENSION') {
        if (isMobile()) {
          setMobileNoExt(true)
          setShowPicker(true)
        } else {
          setError('No wallet extension found. Install Talisman or SubWallet.')
        }
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [onConnect])

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://tella-ai.vercel.app'

  if (connected) {
    return (
      <div className="flex min-h-[36px] max-w-[160px] items-center gap-1.5 rounded-lg border border-(--border-strong) bg-(--surface) px-2.5 py-1.5 sm:max-w-none sm:px-3">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--accent)" />
        <span className="truncate font-mono text-xs text-(--text-secondary)">
          {connected.address.slice(0, 6)}…{connected.address.slice(-4)}
        </span>
        <span className="hidden text-xs text-(--text-muted) sm:inline">
          ({connected.meta.name})
        </span>
      </div>
    )
  }

  return (
    <div className="relative" ref={pickerRef}>
      {accounts.length > 1 ? (
        <select
          className="h-10 max-w-[140px] rounded-lg border border-(--border-strong) bg-(--surface) px-3 text-sm text-(--text-primary) focus:outline-none sm:max-w-none"
          onChange={(e) => {
            const account = accounts.find((a) => a.address === e.target.value)
            if (account) onConnect(account)
          }}
          defaultValue=""
        >
          <option value="" disabled>Select account</option>
          {accounts.map((a) => (
            <option key={a.address} value={a.address}>
              {a.meta.name} — {a.address.slice(0, 8)}…
            </option>
          ))}
        </select>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={mobileNoExt ? () => setShowPicker((v) => !v) : tryConnect}
          disabled={loading}
          isLoading={loading}
        >
          {loading ? '' : mobileNoExt ? 'Choose Wallet' : 'Connect Wallet'}
        </Button>
      )}

      {error && (
        <p className="mt-1 max-w-[200px] text-xs text-red-400 sm:max-w-none" role="alert">
          {error}
        </p>
      )}

      {/* Mobile wallet picker dropdown */}
      {showPicker && (
        <div className="absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-72 rounded-xl border border-(--border-strong) bg-(--surface) shadow-[var(--shadow-lg)]">
          <div className="border-b border-(--border) px-4 py-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
              Open in wallet browser
            </p>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Tap to open this page inside your wallet app
            </p>
          </div>

          <div className="p-2">
            {MOBILE_WALLETS.map((w) => (
              <a
                key={w.name}
                href={w.deepLink(currentUrl)}
                onClick={() => setShowPicker(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-(--surface-raised) active:bg-(--surface-raised)"
              >
                <div className="shrink-0">{w.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-(--text-primary)">{w.name}</p>
                  <p className="text-xs text-(--text-muted)">{w.hint}</p>
                </div>
                <svg className="shrink-0 text-(--text-muted)" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ))}
          </div>

          <div className="border-t border-(--border) px-4 py-3">
            <p className="text-xs text-(--text-muted)">
              Already inside a wallet browser?{' '}
              <button
                className="text-(--accent) hover:underline"
                onClick={() => {
                  setShowPicker(false)
                  setMobileNoExt(false)
                  tryConnect()
                }}
              >
                Try connecting again
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
