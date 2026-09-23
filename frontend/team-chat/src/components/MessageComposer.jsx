import { useRef, useState } from 'react'
import { Button } from './Button'
import { formatBytes } from '../utils/format'

export function MessageComposer({
  onSend,
  sending,
  onTyping,
  placeholder = 'Message',
}) {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const lastTypingSent = useRef(0)

  const canSend = (text.trim() || file) && !sending

  const handleSubmit = () => {
    if (!canSend) return
    onSend({ body: text, attachment: file })
    setText('')
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e) => {
    const value = e.target.value
    setText(value)
    if (value.trim() && typeof onTyping === 'function') {
      const now = Date.now()
      if (now - lastTypingSent.current > 2000) {
        lastTypingSent.current = now
        onTyping()
      }
    }
  }

  return (
    <div className="border-t border-line bg-chat px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded border border-line-strong bg-surface shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          <textarea
            value={text}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={placeholder}
            className="block w-full resize-none bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none"
          />

          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition-colors ${
                  file
                    ? 'bg-surface-mute text-ink-body'
                    : 'text-ink-soft hover:bg-surface-mute hover:text-ink-body'
                }`}
                title="Attach a file"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M21.4 11.5l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8.5-8.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {file ? file.name : 'Attach'}
              </button>
              {file && (
                <span className="max-w-[180px] truncate text-xs text-ink-soft">
                  ({formatBytes(file.size)})
                </span>
              )}
            </div>

            <Button size="sm" onClick={handleSubmit} disabled={!canSend} loading={sending}>
              Send
            </Button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-ink-mute">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  )
}