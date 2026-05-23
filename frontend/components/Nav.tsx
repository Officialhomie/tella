'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletConnect } from './WalletConnect'
import { useWallet } from '@/app/providers'

const links = [
  { href: '/browse', label: 'Browse' },
  { href: '/my-passes', label: 'My Passes' },
  { href: '/creator', label: 'Publish' },
]

export function Nav() {
  const pathname = usePathname()
  const { wallet, setWallet } = useWallet()

  return (
    <header className="sticky top-0 z-50 border-b border-[--border] bg-[--bg]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[--accent]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="6" cy="6" r="1.5" fill="black"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[--text-primary]">
            Vara Agent
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-[--surface-raised] text-[--text-primary]'
                  : 'text-[--text-secondary] hover:text-[--text-primary]'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <WalletConnect connected={wallet} onConnect={setWallet} />
      </div>
    </header>
  )
}
