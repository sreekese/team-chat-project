import { useEffect, useState } from 'react'
import { getPusher } from '../lib/pusher'

export function usePresence(workspaceId) {
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (!workspaceId) return undefined

    const client = getPusher()
    if (!client) return undefined

    const channel = client.subscribe(`presence-workspace.${workspaceId}`)

    const onSucceeded = (members) => {
      setOnlineUsers(Object.values(members.members))
    }

    const onAdded = (member) => {
      const info = member.info
      if (!info) return
      setOnlineUsers((prev) =>
        prev.some((u) => u.id === info.id) ? prev : [...prev, info],
      )
    }

    const onRemoved = (member) => {
      const id = member.info?.id ?? member.id
      setOnlineUsers((prev) => prev.filter((u) => u.id !== id))
    }

    channel.bind('pusher:subscription_succeeded', onSucceeded)
    channel.bind('pusher:member_added', onAdded)
    channel.bind('pusher:member_removed', onRemoved)

    return () => {
      channel.unbind_all()
      client.unsubscribe(channel.name)
    }
  }, [workspaceId])

  return { onlineUsers }
}