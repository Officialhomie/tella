'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-(--z-dropdown) border-b border-(--border) bg-(--bg)">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 min-h-[44px]"
          onClick={() => setMenuOpen(false)}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-(--accent)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="6" cy="6" r="1.5" fill="black"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-(--text-primary)">
            Tella
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[36px] items-center rounded px-3 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-(--surface-raised) text-(--text-primary)'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: wallet + hamburger */}
        <div className="flex items-center gap-2">
          <WalletConnect connected={wallet} onConnect={setWallet} />

          {/* Hamburger — mobile only */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded border border-(--border-strong) text-(--text-secondary) transition-colors hover:text-(--text-primary) sm:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="border-t border-(--border) bg-(--bg) px-4 pb-4 pt-2 sm:hidden">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex min-h-[48px] items-center rounded px-3 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-(--surface-raised) text-(--text-primary)'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
