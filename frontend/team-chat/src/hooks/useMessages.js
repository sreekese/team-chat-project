import { useCallback, useEffect, useRef, useState } from 'react'
import { messageApi } from '../api/endpoints'
import { appendMessage, sortedMessages } from '../utils/format'

export function useMessages(workspaceId, channelId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [error, setError] = useState(null)
  const pageRef = useRef(1)

  const fetchPage = useCallback(
    async (page) => {
      if (!workspaceId || !channelId) return null
      return messageApi.list(workspaceId, channelId, page)
    },
    [workspaceId, channelId],
  )

  const applyPage = useCallback((res, page) => {
    const list = res?.data || []
    setMessages((prev) => {
      if (page === 1) {
        return sortedMessages(list)
      }
      const existing = new Set(prev.map((m) => m.id))
      const added = list.filter((m) => !existing.has(m.id))
      return sortedMessages([...prev, ...added])
    })
    pageRef.current = page
    setHasOlder(Boolean(res?.links?.next))
    setError(null)
  }, [])

  useEffect(() => {
    let active = true
    fetchPage(1)
      .then((res) => {
        if (!active) return
        applyPage(res, 1)
        setLoading(false)
      })
      .catch((e) => {
        if (!active) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [workspaceId, channelId, fetchPage, applyPage])

  const send = useCallback(
    async ({ body, type, parentId, attachment }) => {
      if (!workspaceId || !channelId) return null
      const hasText = body && body.trim()
      if (!hasText && !attachment) return null
      setSending(true)
      try {
        const msg = await messageApi.send(workspaceId, channelId, {
          body: body?.trim(),
          type,
          parentId,
          attachment,
        })
        if (msg) {
          setMessages((prev) => appendMessage(prev, msg))
        }
        return msg
      } finally {
        setSending(false)
      }
    },
    [workspaceId, channelId],
  )

  const appendMessageLive = useCallback((message) => {
    if (!message?.id) return
    setMessages((prev) => appendMessage(prev, message))
  }, [])

  const react = useCallback(
    async (messageId, emoji) => {
      if (!workspaceId || !channelId || !messageId) return
      const updated = await messageApi.react(workspaceId, channelId, messageId, emoji)
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m)),
        )
      }
    },
    [workspaceId, channelId],
  )

  const remove = useCallback(
    async (messageId) => {
      if (!workspaceId || !channelId || !messageId) return
      await messageApi.remove(workspaceId, channelId, messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    },
    [workspaceId, channelId],
  )

  const loadOlder = useCallback(() => {
    setLoading(true)
    const page = pageRef.current + 1
    fetchPage(page)
      .then((res) => applyPage(res, page))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetchPage, applyPage])

  return {
    messages,
    loading,
    sending,
    error,
    hasOlder,
    send,
    appendMessageLive,
    react,
    remove,
    loadOlder,
  }
}