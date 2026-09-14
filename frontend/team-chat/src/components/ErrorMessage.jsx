export function ErrorMessage({ message, className = '' }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={`rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 ${className}`}
    >
      {message}
    </div>
  )
}