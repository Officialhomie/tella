import Link from 'next/link'
import type { ContentMeta } from '@/lib/contract'
import { Badge } from '@/components/ui/Badge'

const ONE_VARA = 1_000_000_000_000n

function formatVara(units: string): string {
  const n = BigInt(units)
  const vara = Number(n) / Number(ONE_VARA)
  return vara.toFixed(vara < 1 ? 3 : 1) + ' VARA'
}

interface Props {
  content: ContentMeta
}

export function ContentCard({ content }: Props) {
  const badgeVariant = content.content_type === 'Newsletter' ? 'green' : 'blue'

  return (
    <Link
      href={`/post/${content.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-(--border) bg-(--surface) p-5
                 transition-all duration-[250ms] ease-(--ease-spring)
                 hover:-translate-y-1 hover:border-(--border-strong)
                 hover:shadow-[var(--shadow-md),var(--shadow-glow)]"
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant={badgeVariant}>{content.content_type}</Badge>
        <span className="font-mono text-xs text-(--text-muted)">
          #{Number(content.published_at).toLocaleString()}
        </span>
      </div>

      <h3 className="text-sm font-semibold leading-snug text-(--text-primary) transition-colors duration-(--dur-fast) group-hover:text-white">
        {content.title}
      </h3>

      <p className="line-clamp-2 text-xs leading-relaxed text-(--text-secondary)">
        {content.description}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-(--border) pt-3">
        <span className="font-mono text-sm font-semibold text-(--accent)">
          {formatVara(content.price)}
        </span>
        <span className="text-xs text-(--text-muted)">
          {content.pass_count} {content.pass_count === 1 ? 'reader' : 'readers'}
        </span>
      </div>
    </Link>
  )
}
