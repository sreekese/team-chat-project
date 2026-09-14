import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CreateChannelModal } from '../components/CreateChannelModal'
import { MessageArea } from '../components/MessageArea'
import { Sidebar } from '../components/Sidebar'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useChannel } from '../hooks/useChannel'
import { useRealtime } from '../hooks/useRealtime'
import { displayName } from '../utils/format'

function ChannelLabelIcon({ type }) {
  if (type === 'dm') {
    return (
      <svg className="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.5 0-7 1.8-7 4.4V20h14v-1.6c0-2.6-3.5-4.4-7-4.4z" />
      </svg>
    )
  }
  if (type === 'private') {
    return (
      <svg className="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13zM7 8h10v1.5H7V8zm0 3h10v1.5H7V11zm0 3h6v1.5H7V14z" />
    </svg>
  )
}

export function ChannelView() {
  const { workspaceId, channelId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    loadingWorkspaces,
    loadWorkspaces,
    currentWorkspace,
    channelDetails,
    refreshChannelDetail,
  } = useWorkspace()

  const { channels, currentChannel, loadingChannels, createChannel } =
    useChannel(workspaceId, channelId)

  const [unreadCounts, setUnreadCounts] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const messageAreaRef = useRef(null)

  useEffect(() => {
    if (!loadingWorkspaces && !currentWorkspace) {
      loadWorkspaces()
    }
  }, [loadingWorkspaces, currentWorkspace, loadWorkspaces])

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
    if (currentChannel?.type === 'dm') {
      refreshChannelDetail(currentChannel.id)
    }
  }, [currentChannel, refreshChannelDetail])

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

  useRealtime(channels, currentChannel?.id, handleLiveMessage)

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

  const dmDetail = channelDetails[Number(channelId)]
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
      <div className="flex h-screen items-center justify-center text-slate-400">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-chat">
      <Sidebar
        workspace={currentWorkspace}
        channels={channels}
        activeChannelId={channelId}
        unreadCounts={unreadCounts}
        loading={loadingChannels}
        user={user}
        onSelectChannel={navigateToChannel}
        onOpenCreateChannel={() => setShowCreate(true)}
        onSwitchWorkspace={() => navigate('/workspaces')}
        onLogout={async () => {
          await logout()
          navigate('/login')
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-slate-200 bg-chat px-4 py-3">
          <ChannelLabelIcon type={currentChannel?.type} />
          <h1 className="truncate text-base font-bold text-slate-800">
            {channelTitle || 'Channel'}
          </h1>
          {currentChannel?.type === 'dm' && otherMembers.length > 0 && (
            <span className="hidden truncate text-xs text-slate-400 sm:inline">
              Direct message
            </span>
          )}
        </header>

        {currentChannel && (
          <MessageArea
            key={`${workspaceId}-${currentChannel.id}`}
            ref={messageAreaRef}
            workspaceId={workspaceId}
            channelId={currentChannel.id}
            currentUserId={user?.id}
          />
        )}
      </main>

      <CreateChannelModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateChannel}
      />
    </div>
  )
}