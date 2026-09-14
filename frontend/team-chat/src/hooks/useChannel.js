import { useEffect } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'

export function useChannel(workspaceId, channelId) {
  const {
    channels,
    loadingChannels,
    loadChannels,
    createChannel,
    setCurrentWorkspace,
  } = useWorkspace()

  useEffect(() => {
    const id = Number(workspaceId)
    if (!id) return
    setCurrentWorkspace(id)
    loadChannels(id)
  }, [workspaceId, setCurrentWorkspace, loadChannels])

  const currentChannel =
    channels.find((c) => c.id === Number(channelId)) || null

  return {
    channels,
    currentChannel,
    loadingChannels,
    createChannel,
  }
}