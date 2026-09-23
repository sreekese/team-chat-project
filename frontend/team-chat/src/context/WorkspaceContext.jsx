/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { channelApi, workspaceApi } from '../api/endpoints'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null)
  const [channels, setChannels] = useState([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [channelDetails, setChannelDetails] = useState({})
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const loadWorkspaces = useCallback(async () => {
    setLoadingWorkspaces(true)
    try {
      setWorkspaces(await workspaceApi.list())
    } finally {
      setLoadingWorkspaces(false)
    }
  }, [])

  const setCurrentWorkspace = useCallback((id) => {
    setCurrentWorkspaceId(id ? Number(id) : null)
    setChannels([])
    setMembers([])
  }, [])

  const loadChannels = useCallback(async (workspaceId) => {
    if (!workspaceId) return
    setLoadingChannels(true)
    try {
      setChannels(await channelApi.list(workspaceId))
    } finally {
      setLoadingChannels(false)
    }
  }, [])

  const loadMembers = useCallback(async (workspaceId) => {
    if (!workspaceId) return
    setLoadingMembers(true)
    try {
      const list = await workspaceApi.members(workspaceId)
      setMembers(list)
      return list
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  const addMember = useCallback(
    async (workspaceId, data) => {
      const member = await workspaceApi.addMember(workspaceId, data)
      setMembers((prev) =>
        prev.some((m) => m.user_id === member.user_id) ? prev : [...prev, member],
      )
      return member
    },
    [],
  )

  const removeMember = useCallback(async (workspaceId, userId) => {
    await workspaceApi.removeMember(workspaceId, userId)
    setMembers((prev) => prev.filter((m) => m.user_id !== userId))
  }, [])

  const regenerateInvite = useCallback(async (workspaceId) => {
    const ws = await workspaceApi.invite(workspaceId)
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === ws.id ? { ...w, ...ws } : w)),
    )
    return ws
  }, [])

  const deleteWorkspace = useCallback(async (workspaceId) => {
    await workspaceApi.delete(workspaceId)
    setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId))
    if (currentWorkspaceId === workspaceId) {
      setCurrentWorkspaceId(null)
    }
  }, [currentWorkspaceId])

  const joinWorkspace = useCallback(async (inviteCode) => {
    const ws = await workspaceApi.join(inviteCode)
    setWorkspaces((prev) =>
      prev.some((w) => w.id === ws.id)
        ? prev
        : [...prev, ws].sort((a, b) => a.name.localeCompare(b.name)),
    )
    return ws
  }, [])

  const createDm = useCallback(
    async (workspaceId, userId) => {
      const channel = await channelApi.createDm(workspaceId, userId)
      if (Number(workspaceId) === Number(currentWorkspaceId)) {
        setChannels((prev) =>
          prev.some((c) => c.id === channel.id)
            ? prev
            : [...prev, channel].sort((a, b) => a.name.localeCompare(b.name)),
        )
        setChannelDetails((prev) => ({ ...prev, [channel.id]: channel }))
        loadMembers(workspaceId)
      }
      return channel
    },
    [currentWorkspaceId, loadMembers],
  )

  const createWorkspace = useCallback(async (data) => {
    const ws = await workspaceApi.create(data)
    setWorkspaces((prev) =>
      [...prev, ws].sort((a, b) => a.name.localeCompare(b.name)),
    )
    return ws
  }, [])

  const createChannel = useCallback(async (workspaceId, data) => {
    const ch = await channelApi.create(workspaceId, data)
    setChannels((prev) =>
      [...prev, ch].sort((a, b) => a.name.localeCompare(b.name)),
    )
    return ch
  }, [])

  const acceptChannelInvite = useCallback(async (workspaceId, channelId) => {
    const channel = await channelApi.accept(workspaceId, channelId)
    setChannels((prev) =>
      prev.map((ch) => (Number(ch.id) === Number(channel.id) ? channel : ch)),
    )
    setChannelDetails((prev) => ({ ...prev, [channel.id]: channel }))
    return channel
  }, [])

  const declineChannelInvite = useCallback(async (workspaceId, channelId) => {
    await channelApi.decline(workspaceId, channelId)
    setChannels((prev) => prev.filter((ch) => Number(ch.id) !== Number(channelId)))
    setChannelDetails((prev) => {
      const next = { ...prev }
      delete next[channelId]
      return next
    })
  }, [])

  const removeChannel = useCallback(async (workspaceId, channelId) => {
    await channelApi.remove(workspaceId, channelId)
    setChannels((prev) => prev.filter((ch) => Number(ch.id) !== Number(channelId)))
    setChannelDetails((prev) => {
      const next = { ...prev }
      delete next[channelId]
      return next
    })
  }, [])

  const leaveChannel = useCallback(async (workspaceId, channelId) => {
    await channelApi.leave(workspaceId, channelId)
    setChannels((prev) => prev.filter((ch) => Number(ch.id) !== Number(channelId)))
    setChannelDetails((prev) => {
      const next = { ...prev }
      delete next[channelId]
      return next
    })
  }, [])

  const refreshChannelDetail = useCallback(
    async (channelId) => {
      if (!currentWorkspaceId || !channelId) return null
      try {
        const ch = await channelApi.get(currentWorkspaceId, channelId)
        setChannelDetails((prev) => ({ ...prev, [channelId]: ch }))
        return ch
      } catch {
        return null
      }
    },
    [currentWorkspaceId],
  )

  const currentWorkspace = useMemo(
    () =>
      workspaces.find((w) => w.id === Number(currentWorkspaceId)) || null,
    [workspaces, currentWorkspaceId],
  )

  const value = useMemo(
    () => ({
      workspaces,
      loadingWorkspaces,
      currentWorkspace,
      currentWorkspaceId,
      channels,
      loadingChannels,
      channelDetails,
      members,
      loadingMembers,
      loadWorkspaces,
      setCurrentWorkspace,
      loadChannels,
      loadMembers,
      addMember,
      removeMember,
      regenerateInvite,
      deleteWorkspace,
      joinWorkspace,
      createDm,
      createWorkspace,
      createChannel,
      acceptChannelInvite,
      declineChannelInvite,
      removeChannel,
      leaveChannel,
      refreshChannelDetail,
    }),
    [
      workspaces,
      loadingWorkspaces,
      currentWorkspace,
      currentWorkspaceId,
      channels,
      loadingChannels,
      channelDetails,
      members,
      loadingMembers,
      loadWorkspaces,
      setCurrentWorkspace,
      loadChannels,
      loadMembers,
      addMember,
      removeMember,
      regenerateInvite,
      deleteWorkspace,
      joinWorkspace,
      createDm,
      createWorkspace,
      createChannel,
      acceptChannelInvite,
      declineChannelInvite,
      removeChannel,
      leaveChannel,
      refreshChannelDetail,
    ],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return ctx
}
