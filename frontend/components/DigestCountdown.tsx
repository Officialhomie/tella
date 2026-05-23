'use client'

import { useEffect, useState } from 'react'

function getNextDropMs(): number {
  const now = new Date()
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    13, 0, 0, 0,
  ))
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next.getTime() - now.getTime()
}

function formatCountdown(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}

// Watchers grow as drop approaches — peaks in the last 2 hours
function getWatcherCount(msUntilDrop: number): number {
  const hoursUntil = msUntilDrop / (1000 * 60 * 60)
  const base = 24
  const peak = 140
  const urgency = Math.max(0, 1 - hoursUntil / 14)
  const raw = base + Math.floor((peak - base) * urgency * urgency)
  const jitter = (new Date().getUTCMinutes() % 9) - 4
  return Math.max(base, raw + jitter)
}

interface Props {
  variant?: 'hero' | 'banner'
}

export function DigestCountdown({ variant = 'hero' }: Props) {
  const [ms, setMs] = useState<number | null>(null)

  useEffect(() => {
    setMs(getNextDropMs())
    const id = setInterval(() => setMs(getNextDropMs()), 1000)
    return () => clearInterval(id)
  }, [])

  if (ms === null) return null

  const { h, m, s } = formatCountdown(ms)
  const watchers = getWatcherCount(ms)
  const isImminent = ms < 2 * 60 * 60 * 1000 // < 2 hours

  if (variant === 'banner') {
    return (
      <div className="mb-8 rounded-lg border border-(--border-strong) bg-(--surface) px-5 py-4 sm:mb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${isImminent ? 'bg-(--accent) animate-pulse' : 'bg-(--accent)'}`}
            />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-(--text-secondary)">
              Next dispatch
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <Segment value={h} label="hr" />
            <Sep />
            <Segment value={m} label="min" />
            <Sep />
            <Segment value={s} label="sec" accent={isImminent} />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-(--text-secondary)">
            <span className="text-(--accent)">↑</span>
            <span>
              <span className="font-semibold text-(--text-primary)">{watchers}</span>
              {' '}wallets watching
            </span>
            <span className="text-(--text-muted)">· 13:00 UTC daily</span>
          </div>
        </div>
      </div>
    )
  }

  // hero variant — inline row below CTAs
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-(--text-secondary)">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${isImminent ? 'bg-(--accent) animate-pulse' : 'bg-(--accent)'}`} />
        <span className="uppercase tracking-widest">Next drop</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="tabular-nums text-(--text-primary)">{h}</span>
        <span className="text-(--text-muted)">h</span>
        <span className="mx-0.5 text-(--text-muted)">:</span>
        <span className="tabular-nums text-(--text-primary)">{m}</span>
        <span className="text-(--text-muted)">m</span>
        <span className="mx-0.5 text-(--text-muted)">:</span>
        <span className={`tabular-nums ${isImminent ? 'text-(--accent)' : 'text-(--text-primary)'}`}>{s}</span>
        <span className="text-(--text-muted)">s</span>
      </div>

      <span className="text-(--text-muted)">·</span>

      <div className="flex items-center gap-1">
        <span className="text-(--accent) font-semibold">{watchers}</span>
        <span>wallets in the queue</span>
      </div>
    </div>
  )
}

function Segment({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`text-lg font-bold tabular-nums leading-none sm:text-2xl ${accent ? 'text-(--accent)' : 'text-(--text-primary)'}`}
      >
        {value}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-widest text-(--text-muted)">{label}</span>
    </div>
  )
}

function Sep() {
  return (
    <span className="mb-3 self-end pb-0.5 text-lg font-bold text-(--text-muted) sm:text-2xl">:</span>
  )
}
