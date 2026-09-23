import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api/endpoints'
import { dmApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useE2EE } from '../context/E2EEContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useChannel } from '../hooks/useChannel'
import { usePresence } from '../hooks/usePresence'
import { useRealtime } from '../hooks/useRealtime'
import { Sidebar } from '../components/Sidebar'
import { MessageArea } from '../components/MessageArea'
import { Spinner } from '../components/Spinner'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { Avatar } from '../components/Avatar'
import { displayName } from '../utils/format'

function ChannelLabelIcon({ type }) {
  if (type === 'dm') {
    return (
      <svg className="h-5 w-5 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.5 0-7 1.8-7 4.4V20h14v-1.6c0-2.6-3.5-4.4-7-4.4z" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13zM7 8h10v1.5H7V8zm0 3h10v1.5H7V11zm0 3h6v1.5H7V14z" />
    </svg>
  )
}

export function DirectMessages() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { hydrate } = useE2EE()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const {
    loadingWorkspaces,
    loadWorkspaces,
    currentWorkspace,
    channelDetails,
    refreshChannelDetail,
    members,
  } = useWorkspace()

  const { channels, currentChannel, loadingChannels } = useChannel(null, null)

  const [unreadCounts, setUnreadCounts] = useState({})
  const [showNewDm, setShowNewDm] = useState(false)
  const [dmQuery, setDmQuery] = useState('')
  const [dmResults, setDmResults] = useState([])
  const [searchingDms, setSearchingDms] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messageAreaRef = useRef(null)

  useEffect(() => {
    if (!loadingWorkspaces && !currentWorkspace) {
      loadWorkspaces()
    }
  }, [loadingWorkspaces, currentWorkspace, loadWorkspaces])

  useEffect(() => {
    if (currentChannel && currentChannel.type !== 'public') {
      refreshChannelDetail(currentChannel.id)
    }
  }, [currentChannel, refreshChannelDetail])

  useEffect(() => {
    hydrate(members.map((member) => member.user).filter(Boolean))
  }, [members, hydrate])

  const handleLiveMessage = useCallback((message, isOther) => {
    if (!isOther) {
      messageAreaRef.current?.appendMessageLive(message)
      return
    }
    setUnreadCounts((prev) => ({
      ...prev,
      [message.channel_id]: (prev[message.channel_id] || 0) + 1,
    }))
  }, [])

  const { typers, sendTyping } = useRealtime(
    channels,
    currentChannel?.id,
    handleLiveMessage,
  )
  const { onlineUsers } = usePresence(null)

  const activeChannelKey = Number(currentChannel?.id)
  const typingNames = useMemo(() => {
    const channelTypers = typers[activeChannelKey]
    if (!channelTypers) return []
    return Object.values(channelTypers).map((t) => t.name)
  }, [typers, activeChannelKey])

  const navigateToChannel = useCallback(
    (id) => {
      setUnreadCounts((prev) => ({ ...prev, [Number(id)]: 0 }))
      navigate(`/messages/${id}`)
    },
    [navigate],
  )

  const handleCreateDm = useCallback(
    async (target) => {
      try {
        const channel = await dmApi.create(target?.id)
        setShowNewDm(false)
        setDmQuery('')
        setDmResults([])
        navigate(`/messages/${channel.id}`)
      } catch (err) {
        toast.error(err.message || 'Could not start a direct message')
      }
    },
    [navigate, toast],
  )

  const handleLeaveDm = useCallback(
    async (channelId) => {
      try {
        await dmApi.leave(channelId)
        if (currentChannel && Number(currentChannel.id) === Number(channelId)) {
          navigate('/messages', { replace: true })
        }
        toast.success('Left conversation')
      } catch (err) {
        toast.error(err.message || 'Could not leave conversation')
      }
    },
    [currentChannel, navigate, toast],
  )

  const dmDetail = channelDetails[Number(currentChannel?.id)]
  const encryptionRecipients = useMemo(() => {
    if (!currentChannel) return []

    if (currentChannel.type === 'public') {
      return members.map((member) => member.user).filter(Boolean)
    }

    const detail = channelDetails[Number(currentChannel.id)]
    return (detail?.members || [])
      .map((member) => member.user)
      .filter(Boolean)
  }, [currentChannel, members, channelDetails])

  const otherMembers = useMemo(() => {
    if (!dmDetail?.members) return []
    return dmDetail.members
      .map((m) => m.user)
      .filter((u) => u.id !== user?.id)
  }, [dmDetail, user])

  const channelTitle = currentChannel
    ? currentChannel.type === 'dm'
      ? otherMembers.map(displayName).join(', ') || currentChannel.name
      : currentChannel.name
    : ''

  const dms = channels.filter((c) => c.type === 'dm')

  return (
    <div className="flex h-screen overflow-hidden bg-chat">
      <Sidebar
        workspace={null}
        channels={dms}
        members={[]}
        activeChannelId={currentChannel?.id}
        unreadCounts={unreadCounts}
        onlineUsers={onlineUsers}
        loading={loadingChannels}
        user={user}
        theme={theme}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggleTheme={toggleTheme}
        onSelectChannel={navigateToChannel}
        onOpenCreateChannel={() => {}}
        onManageMembers={() => {}}
        onStartDm={handleCreateDm}
        onStartNewDm={() => setShowNewDm(true)}
        onAcceptChannel={() => {}}
        onDeclineChannel={() => {}}
        onRemoveChannel={() => {}}
        onLeaveChannel={handleLeaveDm}
        onSwitchWorkspace={() => navigate('/workspaces')}
        onLogout={async () => {
          await logout()
          navigate('/login')
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-line bg-chat px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1 text-ink-soft hover:bg-surface-mute md:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <ChannelLabelIcon type={currentChannel?.type} />
          <h1 className="truncate text-base font-bold text-ink">
            {channelTitle || 'Direct Messages'}
          </h1>
          {currentChannel?.type === 'dm' && otherMembers.length > 0 && (
            <span className="hidden truncate text-xs text-ink-mute sm:inline">
              Direct message
            </span>
          )}
          <Button
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => setShowNewDm(true)}
            title="New message"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </Button>
        </header>

        {currentChannel && (
          <MessageArea
            key={currentChannel.id}
            ref={messageAreaRef}
            workspaceId={null}
            channelId={currentChannel.id}
            currentUserId={user?.id}
            typingNames={typingNames}
            recipients={encryptionRecipients}
            onTyping={() => sendTyping(currentChannel.id)}
          />
        )}

        {!currentChannel && (
          <div className="flex-1 flex items-center justify-center text-ink-mute">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-ink-mute/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-4 text-lg font-medium">No conversation selected</p>
              <p className="mt-1 text-sm">Start a new direct message from the sidebar</p>
            </div>
          </div>
        )}
      </main>

      <Modal
        open={showNewDm}
        title="New direct message"
        onClose={() => setShowNewDm(false)}
      >
        <form onSubmit={async (e) => { e.preventDefault(); if (dmResults.length === 1) handleCreateDm(dmResults[0]); }} className="flex flex-col gap-4">
          <Input
            label="Search users"
            name="dm-search"
            value={dmQuery}
            onChange={async (e) => {
              setDmQuery(e.target.value)
              const trimmed = e.target.value.trim()
              if (!trimmed) {
                setDmResults([])
                setSearchingDms(false)
                return
              }
              setSearchingDms(true)
              try {
                setDmResults(await userApi.search(trimmed))
              } catch {
                setDmResults([])
              } finally {
                setSearchingDms(false)
              }
            }}
            placeholder="Search by name or username"
            autoFocus
          />
          {searchingDms && (
            <div className="flex justify-center py-2">
              <Spinner size="sm" />
            </div>
          )}
          {!searchingDms && dmResults.length > 0 && (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {dmResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleCreateDm(result)}
                  className="flex items-center gap-3 rounded px-2 py-2 text-left hover:bg-surface-mute"
                >
                  <Avatar user={result} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{displayName(result)}</p>
                    <p className="text-sm text-ink-mute truncate">@{result.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!searchingDms && dmQuery.trim() && dmResults.length === 0 && (
            <p className="text-center text-ink-mute py-4">No users found</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNewDm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}