'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { DigestCountdown } from '@/components/DigestCountdown'

const features = [
  {
    label: 'AI-generated',
    desc: 'Daily digests written by an AI analyst agent trained on the latest AI x Crypto developments.',
    icon: 'M10 2L3 6v8l7 4 7-4V6l-7-4z M10 10 m-1.5 0 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0',
  },
  {
    label: 'IPFS-stored',
    desc: 'Content is AES-256 encrypted and pinned to IPFS — permanently decentralized and censorship-resistant.',
    icon: 'M3 7l7-4 7 4v6l-7 4-7-4V7z M3 7l7 4m0 6V11m7-4l-7 4',
  },
  {
    label: 'VARA-gated',
    desc: 'One-time on-chain access pass per article. Ownership recorded on Vara Network, no subscriptions.',
    icon: 'M5 11V7a5 5 0 0110 0v4 M3 11h14a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6a1 1 0 011-1z',
  },
]

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    )

    const el = ref.current
    if (!el) return

    el.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((node) =>
      observer.observe(node)
    )

    return () => observer.disconnect()
  }, [])

  return ref
}

export default function HomePage() {
  const pageRef = useScrollReveal()

  return (
    <main className="flex-1" ref={pageRef as React.RefObject<HTMLElement>}>
      {/* ── Hero ── */}
      <section className="border-b border-(--border) px-4 pb-14 pt-14 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-5xl">

          {/* Terminal prompt — signature moment */}
          <div
            className="mb-6 flex max-w-full items-center gap-2 overflow-hidden rounded border border-(--border-strong) bg-(--surface) px-4 py-2 font-mono text-xs text-(--text-secondary) w-fit"
            data-reveal
          >
            <span className="shrink-0 text-(--accent)">$</span>
            <span className="shrink-0">tella</span>
            <span className="hidden shrink-0 text-(--text-muted) sm:inline">--run</span>
            <span className="truncate text-(--text-primary)">generate-digest</span>
            <span className="shrink-0 inline-block h-3 w-1.5 bg-(--accent) animate-[blink_1s_step-end_infinite]" />
          </div>

          {/* Fluid headline — clamp scales from 32px → 60px */}
          <h1
            className="mb-5 max-w-2xl font-mono font-bold leading-[1.08] tracking-tight text-(--text-primary)"
            style={{ fontSize: 'clamp(2rem, 5.5vw, 3.75rem)' }}
            data-reveal
          >
            AI × Crypto
            <br />
            Intelligence.
            <br />
            <span className="text-(--accent)">Gated on-chain.</span>
          </h1>

          <p
            className="mb-8 max-w-md text-sm leading-relaxed text-(--text-secondary) sm:text-base"
            data-reveal
          >
            Daily AI-generated digests and deep-dives on artificial intelligence and crypto.
            Buy a VARA pass once — yours on-chain, forever.
          </p>

          {/* CTAs — stacked on mobile, inline on sm+ */}
          <div
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            data-reveal
          >
            <Link
              href="/browse"
              className="flex min-h-[48px] items-center justify-center rounded-lg bg-(--accent) px-7 text-sm font-semibold text-black transition-all duration-[150ms] hover:bg-(--accent-dim) hover:-translate-y-px hover:shadow-[var(--shadow-glow)] sm:min-h-[42px]"
            >
              Browse Content
            </Link>
            <Link
              href="/creator"
              className="flex min-h-[48px] items-center justify-center rounded-lg border border-(--border-strong) px-7 text-sm font-semibold text-(--text-secondary) transition-colors duration-[150ms] hover:border-(--text-muted) hover:text-(--text-primary) sm:min-h-[42px]"
            >
              Publish Content
            </Link>
          </div>

          <DigestCountdown variant="hero" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div
          className="grid grid-cols-1 divide-y divide-(--border) sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          data-reveal-stagger
        >
          {features.map((item) => (
            <div
              key={item.label}
              className="py-7 first:pt-0 last:pb-0 sm:px-8 sm:py-0 sm:first:pl-0 sm:last:pr-0"
            >
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded border border-(--border-strong) bg-(--surface)">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-(--accent)">
                  <path
                    d={item.icon}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="mb-2 font-semibold text-(--text-primary)">{item.label}</p>
              <p className="text-sm leading-relaxed text-(--text-secondary)">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
