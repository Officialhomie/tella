interface Props {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-12 text-center">
      <p className="font-semibold text-(--text-primary)">{title}</p>
      {description && (
        <p className="mt-1.5 text-sm text-(--text-secondary)">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
