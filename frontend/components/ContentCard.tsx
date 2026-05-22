import Link from 'next/link'
import type { ContentMeta } from '@/lib/contract'

const ONE_VARA = 1_000_000_000_000n

function formatVara(units: string): string {
  const n = BigInt(units)
  const vara = Number(n) / Number(ONE_VARA)
  return vara.toFixed(vara < 1 ? 3 : 1) + ' VARA'
}

function formatDate(block: number): string {
  // Rough estimate: ~3s per block from genesis (block 0 ≈ Jan 2024)
  return `Block #${block.toLocaleString()}`
}

interface Props {
  content: ContentMeta
}

export function ContentCard({ content }: Props) {
  const badge =
    content.content_type === 'Newsletter'
      ? 'bg-violet-900 text-violet-300'
      : 'bg-blue-900 text-blue-300'

  return (
    <Link
      href={`/post/${content.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-600 hover:bg-neutral-800"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge}`}>
          {content.content_type}
        </span>
        <span className="text-xs text-neutral-500">{formatDate(content.published_at)}</span>
      </div>

      <h3 className="text-base font-semibold text-neutral-100 group-hover:text-white">
        {content.title}
      </h3>

      <p className="line-clamp-2 text-sm text-neutral-400">{content.description}</p>

      <div className="mt-auto flex items-center justify-between pt-2 text-sm">
        <span className="font-medium text-violet-400">{formatVara(content.price)}</span>
        <span className="text-neutral-500">
          {content.pass_count} {content.pass_count === 1 ? 'reader' : 'readers'}
        </span>
      </div>
    </Link>
  )
}
