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
  members = [],
  activeChannelId,
  unreadCounts = {},
  onlineUsers = [],
  loading = false,
  user,
  theme,
  open = false,
  onClose,
  onToggleTheme,
  onSelectChannel,
  onOpenCreateChannel,
  onManageMembers,
  onAcceptChannel,
  onDeclineChannel,
  onRemoveChannel,
  onLeaveChannel,
  onSwitchWorkspace,
  onLogout,
}) {
  const pending = channels.filter((c) => c.type !== 'dm' && c.membership_status === 'pending')
  const regular = channels.filter((c) => c.type !== 'dm' && c.membership_status !== 'pending')
  const dms = channels.filter((c) => c.type === 'dm')
  const currentUser = user?.id

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-sidebar text-slate-300 transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
                  currentUserId={user?.id}
                  onClick={() => {
                    onSelectChannel(channel.id)
                    onClose?.()
                  }}
                  onRemove={onRemoveChannel}
                />
              ))
            )}
          </div>

          {pending.length > 0 && (
            <>
              <SectionLabel>Invites — {pending.length}</SectionLabel>
              <div className="flex flex-col gap-1">
                {pending.map((channel) => (
                  <div
                    key={channel.id}
                    className="rounded border border-white/10 bg-white/5 px-2 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAcceptChannel?.(channel.id)}
                        className="rounded bg-emerald-500 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-400"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineChannel?.(channel.id)}
                        className="rounded bg-white/10 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-white/15 hover:text-white"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {dms.length > 0 && (
            <>
              <SectionLabel>Direct Messages</SectionLabel>
              <div className="flex flex-col gap-0.5">
                {dms.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    active={channel.id === Number(activeChannelId)}
                    unread={unreadCounts[channel.id] || 0}
                    currentUserId={user?.id}
                    onClick={() => {
                      onSelectChannel(channel.id)
                      onClose?.()
                    }}
                    onLeave={onLeaveChannel}
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

          {onlineUsers.length > 0 && (
            <>
              <SectionLabel>Online — {onlineUsers.length}</SectionLabel>
              <div className="flex flex-col gap-0.5">
                {onlineUsers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5"
                  >
                    <span className="relative shrink-0">
                      <Avatar user={member} size="sm" />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-300">
                      {member.name || member.username}
                    </span>
                    {Number(member.id) === currentUser && (
                      <span className="shrink-0 text-[10px] text-slate-500">
                        you
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {members.length > 0 && (
            <>
              <div className="flex items-center justify-between pr-1">
                <SectionLabel>Members — {members.length}</SectionLabel>
                <button
                  type="button"
                  onClick={onManageMembers}
                  className="rounded p-1 text-slate-400 hover:bg-sidebar-hover hover:text-white"
                  title="Invite people"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16M4 12h16" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {members.map((m) => {
                  const isSelf = Number(m.user_id) === currentUser
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className="group flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-sidebar-hover"
                    >
                      <Avatar user={m.user} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-300">
                        {m.user?.name || m.user?.username}
                      </span>
                      {isSelf && (
                        <span className="shrink-0 text-[10px] text-slate-500">
                          you
                        </span>
                      )}
                      {!isSelf && (
                        <svg
                          className="h-3.5 w-3.5 shrink-0 text-slate-600 opacity-0 group-hover:opacity-100"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
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
                onClick={onToggleTheme}
                className="rounded p-1 text-slate-400 hover:bg-sidebar-hover hover:text-white"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
                  </svg>
                )}
              </button>
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
    </>
  )
}
