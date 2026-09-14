import { Avatar } from './Avatar'
import { ChannelItem } from './ChannelItem'
import { Spinner } from './Spinner'

function SectionLabel({ children }) {
  return (
    <div className="px-2 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </div>
  )
}

export function Sidebar({
  workspace,
  channels,
  activeChannelId,
  unreadCounts = {},
  loading = false,
  user,
  onSelectChannel,
  onOpenCreateChannel,
  onSwitchWorkspace,
  onLogout,
}) {
  const regular = channels.filter((c) => c.type !== 'dm')
  const dms = channels.filter((c) => c.type === 'dm')

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-slate-300">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {workspace?.name || 'Workspace'}
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchWorkspace}
          className="shrink-0 rounded px-1.5 py-1 text-xs font-semibold text-slate-400 hover:bg-sidebar-hover hover:text-white"
          title="Switch workspace"
        >
          Switch
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        <div className="flex items-center justify-between pr-1">
          <SectionLabel>Channels</SectionLabel>
          <button
            type="button"
            onClick={onOpenCreateChannel}
            className="rounded p-1 text-slate-400 hover:bg-sidebar-hover hover:text-white"
            title="Create channel"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16M4 12h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {loading && regular.length === 0 ? (
            <div className="px-2 py-2">
              <Spinner size="sm" />
            </div>
          ) : (
            regular.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                active={channel.id === Number(activeChannelId)}
                unread={unreadCounts[channel.id] || 0}
                onClick={() => onSelectChannel(channel.id)}
              />
            ))
          )}
        </div>

        {dms.length > 0 && (
          <>
            <SectionLabel>Direct messages</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {dms.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  active={channel.id === Number(activeChannelId)}
                  unread={unreadCounts[channel.id] || 0}
                  onClick={() => onSelectChannel(channel.id)}
                />
              ))}
            </div>
          </>
        )}

        {!loading && channels.length === 0 && (
          <p className="px-2 py-2 text-xs text-slate-500">
            No channels yet. Create one to get started.
          </p>
        )}
      </nav>

      {user && (
        <div className="border-t border-white/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar user={user} size="sm" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-300">
              {user.name}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded p-1 text-slate-400 hover:bg-sidebar-hover hover:text-white"
              title="Log out"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}