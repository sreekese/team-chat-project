import { useRef, useState } from 'react'
import { Button } from './Button'
import { formatBytes } from '../utils/format'

export function MessageComposer({ onSend, sending, placeholder = 'Message' }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)

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

  return (
    <div className="border-t border-slate-200 bg-chat px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded border border-slate-300 bg-white shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={placeholder}
            className="block w-full resize-none px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
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
                    ? 'bg-slate-100 text-slate-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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
                <span className="max-w-[180px] truncate text-xs text-slate-500">
                  ({formatBytes(file.size)})
                </span>
              )}
            </div>

            <Button size="sm" onClick={handleSubmit} disabled={!canSend} loading={sending}>
              Send
            </Button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  )
}