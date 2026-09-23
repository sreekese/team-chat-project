const STYLES = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-100',
  error: 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-900/60 dark:border-rose-700 dark:text-rose-100',
  info: 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-900/60 dark:border-sky-700 dark:text-sky-100',
}

const ICONS = {
  success: 'M9 12l2 2 4-4',
  error: 'M6 6l12 12M18 6L6 18',
  info: 'M12 8v4m0 4h.01',
}

export function Toaster({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-lg ${STYLES[toast.type]}`}
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={ICONS[toast.type]} />
          </svg>
          <p className="min-w-0 flex-1 text-sm font-medium break-words">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}