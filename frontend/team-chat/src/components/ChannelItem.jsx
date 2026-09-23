import { useState } from 'react'

function ChannelIcon({ type }) {
  if (type === 'dm') {
    return (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.5 0-7 1.8-7 4.4V20h14v-1.6c0-2.6-3.5-4.4-7-4.4z" />
      </svg>
    )
  }
  if (type === 'private') {
    return (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13zM7 8h10v1.5H7V8zm0 3h10v1.5H7V11zm0 3h6v1.5H7V14z" />
    </svg>
  )
}

export function ChannelItem({ channel, active, unread = 0, onClick, currentUserId, onRemove, onLeave }) {
  const isOwner = channel.created_by === currentUserId
  const isDm = channel.type === 'dm'
  const [showAction, setShowAction] = useState(false)

  const handleRemove = (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${channel.name}"? This cannot be undone.`)) {
      onRemove?.(channel.id)
    }
    setShowAction(false)
  }

  const handleLeave = (e) => {
    e.stopPropagation()
    if (window.confirm(`Leave "${channel.name}"? You will no longer receive messages.`)) {
      onLeave?.(channel.id)
    }
    setShowAction(false)
  }

  return (
    <div className="relative group" onMouseEnter={() => setShowAction(true)} onMouseLeave={() => setShowAction(false)}>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium transition-colors ${
          active
            ? 'bg-sidebar-active text-white'
            : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
        }`}
      >
        <ChannelIcon type={channel.type} />
        <span className="truncate flex-1">{channel.name}</span>
        {unread > 0 && (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-sidebar">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {showAction && (
        <>
          {!isDm && isOwner && onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete channel"
              aria-label={`Delete ${channel.name}`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
          {isDm && onLeave && (
            <button
              type="button"
              onClick={handleLeave}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Leave conversation"
              aria-label={`Leave ${channel.name}`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  )
}