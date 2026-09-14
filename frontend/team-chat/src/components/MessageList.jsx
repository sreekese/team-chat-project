import { useEffect, useRef, useState } from 'react'
import { MessageBubble } from './MessageBubble'
import { Spinner } from './Spinner'

export function MessageList({
  messages,
  loading,
  hasOlder,
  loadOlder,
  currentUserId,
  onReact,
  onDelete,
  onOpenThread,
  emptyMessage = 'No messages yet. Say hello!',
}) {
  const containerRef = useRef(null)
  const [atBottom, setAtBottom] = useState(true)
  const firstRender = useRef(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      setAtBottom(distance < 80)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (atBottom) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: firstRender.current ? 'auto' : 'smooth',
      })
    }
    firstRender.current = false
  }, [messages.length, atBottom])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin px-4">
      <div className="mx-auto flex max-w-3xl flex-col">
        <div className="py-3">
          {hasOlder && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={loadOlder}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}
        </div>

        {loading && messages.length === 0 && (
          <div className="flex justify-center py-10 text-slate-400">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}

        <div className="flex flex-col gap-1 pb-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onReact={(emoji) => onReact(message.id, emoji)}
              onDelete={() => onDelete(message.id)}
              onOpenThread={() => onOpenThread(message)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}