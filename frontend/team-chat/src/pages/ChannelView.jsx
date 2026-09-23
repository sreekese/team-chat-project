import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CreateChannelModal } from '../components/CreateChannelModal'
import { ManageMembersModal } from '../components/ManageMembersModal'
import { MessageArea } from '../components/MessageArea'
import { Sidebar } from '../components/Sidebar'
import { Spinner } from '../components/Spinner'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useE2EE } from '../context/E2EEContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useChannel } from '../hooks/useChannel'
import { usePresence } from '../hooks/usePresence'
import { useRealtime } from '../hooks/useRealtime'
import { displayName } from '../utils/format'

function ChannelLabelIcon({ type }) {
  if (type === 'dm') {
    return (
      <svg className="h-5 w-5 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.5 0-7 1.8-7 4.4V20h14v-1.6c0-2.6-3.5-4.4-7-4.4z" />
      </svg>
    )
  }
  if (type === 'private') {
    return (
      <svg className="h-5 w-5 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13zM7 8h10v1.5H7V8zm0 3h10v1.5H7V11zm0 3h6v1.5H7V14z" />
    </svg>
  )
}

export function ChannelView() {
  const { workspaceId, channelId } = useParams()
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
    loadMembers,
    createDm,
    acceptChannelInvite,
    declineChannelInvite,
    removeChannel,
    leaveChannel,
  } = useWorkspace()

  const { channels, currentChannel, loadingChannels, createChannel } =
    useChannel(workspaceId, channelId)

  const [unreadCounts, setUnreadCounts] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messageAreaRef = useRef(null)

  useEffect(() => {
    if (!loadingWorkspaces && !currentWorkspace) {
      loadWorkspaces()
    }
  }, [loadingWorkspaces, currentWorkspace, loadWorkspaces])

  useEffect(() => {
    if (workspaceId && currentWorkspace) {
      loadMembers(workspaceId)
    }
  }, [workspaceId, currentWorkspace, loadMembers])

  useEffect(() => {
    if (!channelId && channels.length > 0) {
      const preferred =
        channels.find((c) => c.type !== 'dm') || channels[0]
      if (preferred) {
        navigate(`/workspaces/${workspaceId}/channels/${preferred.id}`, {
          replace: true,
        })
      }
    }
  }, [channelId, channels, workspaceId, navigate])

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
  const { onlineUsers } = usePresence(workspaceId)

  const activeChannelKey = Number(currentChannel?.id)
  const typingNames = useMemo(() => {
    const channelTypers = typers[activeChannelKey]
    if (!channelTypers) return []
    return Object.values(channelTypers).map((t) => t.name)
  }, [typers, activeChannelKey])

  const navigateToChannel = useCallback(
    (id) => {
      setUnreadCounts((prev) => ({ ...prev, [Number(id)]: 0 }))
      navigate(`/workspaces/${workspaceId}/channels/${id}`)
    },
    [workspaceId, navigate],
  )

  const handleCreateChannel = useCallback(
    async (data) => {
      const channel = await createChannel(workspaceId, data)
      navigate(`/workspaces/${workspaceId}/channels/${channel.id}`)
      return channel
    },
    [workspaceId, createChannel, navigate],
  )

  const handleStartDm = useCallback(
    async (target) => {
      try {
        const channel = await createDm(workspaceId, target?.id)
        navigate(`/workspaces/${workspaceId}/channels/${channel.id}`)
      } catch (err) {
        toast.error(err.message || 'Could not start a direct message')
      }
    },
    [workspaceId, createDm, navigate, toast],
  )

  const handleAcceptChannel = useCallback(
    async (targetChannelId) => {
      try {
        const channel = await acceptChannelInvite(workspaceId, targetChannelId)
        toast.success(`Joined ${channel.name}`)
        navigate(`/workspaces/${workspaceId}/channels/${channel.id}`)
      } catch (err) {
        toast.error(err.message || 'Could not accept channel invite')
      }
    },
    [workspaceId, acceptChannelInvite, navigate, toast],
  )

  const handleDeclineChannel = useCallback(
    async (targetChannelId) => {
      try {
        await declineChannelInvite(workspaceId, targetChannelId)
        toast.success('Channel invite declined')
        if (Number(channelId) === Number(targetChannelId)) {
          navigate(`/workspaces/${workspaceId}`, { replace: true })
        }
      } catch (err) {
        toast.error(err.message || 'Could not decline channel invite')
      }
    },
    [workspaceId, channelId, declineChannelInvite, navigate, toast],
  )

  const dmDetail = channelDetails[Number(channelId)]
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

  if (!currentWorkspace) {
    return (
      <div className="flex h-screen items-center justify-center text-ink-mute">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-chat">
<Sidebar
        workspace={currentWorkspace}
        channels={channels}
        members={members}
        activeChannelId={channelId}
        unreadCounts={unreadCounts}
        onlineUsers={onlineUsers}
        loading={loadingChannels}
        user={user}
        theme={theme}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggleTheme={toggleTheme}
        onSelectChannel={navigateToChannel}
        onOpenCreateChannel={() => setShowCreate(true)}
        onManageMembers={() => setShowMembers(true)}
        onStartDm={handleStartDm}
        onAcceptChannel={handleAcceptChannel}
        onDeclineChannel={handleDeclineChannel}
        onRemoveChannel={removeChannel}
        onLeaveChannel={leaveChannel}
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
            {channelTitle || 'Channel'}
          </h1>
          {currentChannel?.type === 'dm' && otherMembers.length > 0 && (
            <span className="hidden truncate text-xs text-ink-mute sm:inline">
              Direct message
            </span>
          )}
          <Button
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => setShowMembers(true)}
            title="Invite people"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </header>

        {currentChannel?.can_open !== false && currentChannel && (
          <MessageArea
            key={`${workspaceId}-${currentChannel.id}`}
            ref={messageAreaRef}
            workspaceId={workspaceId}
            channelId={currentChannel.id}
            currentUserId={user?.id}
            typingNames={typingNames}
            recipients={encryptionRecipients}
            onTyping={() => sendTyping(currentChannel.id)}
          />
        )}
      </main>

      <CreateChannelModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateChannel}
      />

      <ManageMembersModal
        open={showMembers}
        workspaceId={workspaceId}
        onClose={() => setShowMembers(false)}
      />
    </div>
  )
}
