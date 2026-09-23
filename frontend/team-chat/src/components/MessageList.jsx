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
                className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-soft shadow-sm transition-colors hover:bg-surface-mute disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}
        </div>

        {loading && messages.length === 0 && (
          <div className="flex justify-center py-10 text-ink-mute">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <svg
              className="h-10 w-10 text-ink-mute"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
            <p className="text-sm font-medium text-ink-soft">{emptyMessage}</p>
            <p className="text-xs text-ink-mute">
              Be the first to start the conversation.
            </p>
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