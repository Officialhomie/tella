import { type ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md'
  fullWidth?: boolean
  isLoading?: boolean
}

const base =
  'inline-flex items-center justify-center font-semibold select-none whitespace-nowrap ' +
  'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] ' +
  'disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: [
    'bg-[--accent] text-black',
    'hover:bg-[--accent-dim] hover:-translate-y-px',
    'hover:shadow-[0_4px_16px_rgba(34,197,94,0.35)]',
  ].join(' '),
  ghost: [
    'bg-[--surface-raised] text-[--text-primary] border border-[--border-strong]',
    'hover:border-[--text-muted]',
  ].join(' '),
  outline: [
    'border border-[--border-strong] text-[--text-secondary] bg-transparent',
    'hover:text-[--text-primary] hover:border-[--text-muted]',
  ].join(' '),
  danger: [
    'bg-[--danger-subtle] border border-red-900/60 text-red-400',
    'hover:border-red-700/60 hover:text-red-300',
  ].join(' '),
}

const sizes = {
  sm: 'h-8 px-4 text-xs rounded-md gap-1.5 duration-[150ms]',
  md: 'h-10 px-6 text-sm rounded-lg gap-2 duration-[150ms]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  isLoading,
  className = '',
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
