interface Props {
  children: React.ReactNode
  variant?: 'default' | 'green' | 'amber' | 'blue'
}

const variants = {
  default: 'border-(--border-strong) text-(--text-secondary)',
  green: 'border-(--accent-dim)/40 bg-(--accent-subtle) text-(--accent)',
  amber: 'border-amber-800/40 bg-amber-950/40 text-amber-400',
  blue: 'border-blue-800/40 bg-blue-950/30 text-blue-400',
}

export function Badge({ children, variant = 'default' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
