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

export function ChannelItem({ channel, active, unread = 0, onClick }) {
  return (
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
  )
}