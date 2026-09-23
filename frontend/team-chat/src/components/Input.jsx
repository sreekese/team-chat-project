export function Input({
  label,
  name,
  type = 'text',
  error,
  hint,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-ink-body"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={`w-full rounded border bg-surface px-3 py-2 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-mute focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-400 focus:ring-rose-300'
            : 'border-line-strong focus:ring-accent focus:border-accent'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  )
}