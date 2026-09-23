import { useCallback, useEffect, useRef, useState } from 'react'
import { getPusher, initPusher } from '../lib/pusher'
import { useAuth } from '../context/AuthContext'

const TYPING_TIMEOUT = 2500

export function useRealtime(channels, activeChannelId, onMessage) {
  const { token, user } = useAuth()
  const onMessageRef = useRef(onMessage)
  const activeChannelRef = useRef(activeChannelId)
  const userRef = useRef(user)
  const clientRef = useRef(null)
  const [typers, setTypers] = useState({})

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    activeChannelRef.current = activeChannelId
  }, [activeChannelId])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (!token) return undefined

    let client = getPusher()
    if (!client) {
      client = initPusher(token)
    }
    clientRef.current = client

    const subscriptions = channels.map((channel) => {
      const sub = client.subscribe(`private-channel.${channel.id}`)
      sub.bind('message.created', (payload) => {
        const message = payload?.message
        if (!message) return
        const isOther =
          Number(message.channel_id) !== Number(activeChannelRef.current)
        onMessageRef.current(message, isOther)
      })
      sub.bind('client-typing', (payload) => {
        const info = payload?.user
        if (!info || Number(info.id) === Number(userRef.current?.id)) return
        const id = Number(channel.id)
        setTypers((prev) => {
          const users = {
            ...(prev[id] || {}),
            [Number(info.id)]: {
              name: info.name || info.username || 'Someone',
              expiresAt: Date.now() + TYPING_TIMEOUT,
            },
          }
          return { ...prev, [id]: users }
        })
      })
      return sub
    })

    return () => {
      subscriptions.forEach((sub) => {
        sub.unbind_all()
        client.unsubscribe(sub.name)
      })
    }
  }, [channels, token])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypers((prev) => {
        let changed = false
        const next = {}
        Object.entries(prev).forEach(([channelId, users]) => {
          const kept = {}
          Object.entries(users).forEach(([userId, t]) => {
            if (t.expiresAt > now) {
              kept[userId] = t
            } else {
              changed = true
            }
          })
          if (Object.keys(kept).length > 0) {
            next[channelId] = kept
          }
        })
        if (Object.keys(next).length !== Object.keys(prev).length) {
          changed = true
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const sendTyping = useCallback((channelId) => {
    const client = clientRef.current
    const current = userRef.current
    if (!client || !current || !channelId) return
    client
      .subscribe(`private-channel.${channelId}`)
      .trigger('client-typing', {
        user: {
          id: current.id,
          name: current.name,
          username: current.username,
        },
      })
  }, [])

  return { typers, sendTyping }
}