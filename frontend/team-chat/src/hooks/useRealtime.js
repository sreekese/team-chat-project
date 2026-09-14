import { useEffect, useRef } from 'react'
import { getPusher, initPusher } from '../lib/pusher'
import { useAuth } from '../context/AuthContext'

export function useRealtime(channels, activeChannelId, onMessage) {
  const { token } = useAuth()
  const onMessageRef = useRef(onMessage)
  const activeChannelRef = useRef(activeChannelId)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    activeChannelRef.current = activeChannelId
  }, [activeChannelId])

  useEffect(() => {
    if (!token) return undefined

    let client = getPusher()
    if (!client) {
      client = initPusher(token)
    }

    const subscriptions = channels.map((channel) => {
      const sub = client.subscribe(`private-channel.${channel.id}`)
      sub.bind('message.created', (payload) => {
        const message = payload?.message
        if (!message) return
        const isOther =
          Number(message.channel_id) !== Number(activeChannelRef.current)
        onMessageRef.current(message, isOther)
      })
      return sub
    })

    return () => {
      subscriptions.forEach((sub) => {
        sub.unbind('message.created')
        client.unsubscribe(sub.name)
      })
    }
  }, [channels, token])
}