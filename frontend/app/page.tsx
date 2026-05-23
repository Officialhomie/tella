'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

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
      <section className="border-b border-[--border] px-4 pb-20 pt-24">
        <div className="mx-auto max-w-5xl">

          {/* Terminal prompt — signature moment */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded border border-[--border-strong] bg-[--surface] px-4 py-2 font-mono text-xs text-[--text-secondary]"
            data-reveal
          >
            <span className="text-[--accent]">$</span>
            <span>vara-agent</span>
            <span className="text-[--text-muted]">--run</span>
            <span className="text-[--text-primary]">generate-digest</span>
            <span className="inline-block h-3 w-1.5 bg-[--accent] animate-[blink_1s_step-end_infinite]" />
          </div>

          <h1
            className="mb-6 max-w-2xl font-mono text-4xl font-bold leading-[1.1] tracking-tight text-[--text-primary] sm:text-5xl lg:text-6xl"
            data-reveal
          >
            AI × Crypto
            <br />
            Intelligence.
            <br />
            <span className="text-[--accent]">Gated on-chain.</span>
          </h1>

          <p
            className="mb-10 max-w-md text-base leading-relaxed text-[--text-secondary]"
            data-reveal
          >
            Daily AI-generated digests and deep-dives on artificial intelligence and crypto.
            Buy a VARA pass once — yours on-chain, forever.
          </p>

          <div className="flex flex-wrap items-center gap-3" data-reveal>
            <Link
              href="/browse"
              className="rounded-lg bg-[--accent] px-7 py-2.5 text-sm font-semibold text-black transition-all duration-[--dur-fast] hover:bg-[--accent-dim] hover:-translate-y-px hover:shadow-[--shadow-glow]"
            >
              Browse Content
            </Link>
            <Link
              href="/creator"
              className="rounded-lg border border-[--border-strong] px-7 py-2.5 text-sm font-semibold text-[--text-secondary] transition-colors duration-[--dur-fast] hover:border-[--text-muted] hover:text-[--text-primary]"
            >
              Publish Content
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div
          className="grid grid-cols-1 divide-y divide-[--border] sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          data-reveal-stagger
        >
          {features.map((item) => (
            <div
              key={item.label}
              className="py-8 sm:px-8 sm:py-0 first:pt-0 last:pb-0 sm:first:pl-0 sm:last:pr-0"
            >
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded border border-[--border-strong] bg-[--surface]">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-[--accent]">
                  <path
                    d={item.icon}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="mb-2 font-semibold text-[--text-primary]">{item.label}</p>
              <p className="text-sm leading-relaxed text-[--text-secondary]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
