import { Spinner } from './Spinner'

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary:
    'bg-surface text-ink-body border border-line-strong hover:bg-surface-mute',
  ghost: 'text-ink-soft hover:bg-surface-mute',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

const sizes = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  type = 'button',
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}