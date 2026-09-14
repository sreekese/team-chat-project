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
      loadWorkspaces,
      setCurrentWorkspace,
      loadChannels,
      createWorkspace,
      createChannel,
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
      loadWorkspaces,
      setCurrentWorkspace,
      loadChannels,
      createWorkspace,
      createChannel,
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