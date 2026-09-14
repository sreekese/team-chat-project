import { useEffect, useRef } from 'react'

const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '🤔', '🙏', '💯', '🚀']

export function EmojiPicker({ onSelect, onClose, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className={`z-30 rounded-lg border border-slate-200 bg-white p-2 shadow-lg ${className}`}
    >
      <div className="grid grid-cols-5 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="rounded p-1.5 text-xl transition-colors hover:bg-slate-100"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}