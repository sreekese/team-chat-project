import { useCallback, useEffect, useState } from 'react'
import { messageApi } from '../api/endpoints'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { MessageBubble } from './MessageBubble'
import { Spinner } from './Spinner'
import { appendMessage, displayName, formatMessageTime } from '../utils/format'

export function ThreadView({
  parent,
  workspaceId,
  channelId,
  currentUserId,
  onClose,
  onReact,
  onDelete,
}) {
  const [replies, setReplies] = useState(parent.replies || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let active = true
    messageApi
      .get(workspaceId, channelId, parent.id)
      .then((res) => {
        if (active) {
          setReplies(res.replies || [])
          setLoading(false)
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [parent.id, workspaceId, channelId])

  const sendReply = useCallback(
    async (body) => {
      if (!body || !body.trim() || sending) return
      setSending(true)
      setError(null)
      try {
        const reply = await messageApi.send(workspaceId, channelId, {
          body,
          parentId: parent.id,
        })
        setReplies((prev) => appendMessage(prev, reply))
      } catch (e) {
        setError(e.message)
      } finally {
        setSending(false)
        setDraft('')
      }
    },
    [workspaceId, channelId, parent.id, sending],
  )

  return (
    <div className="flex h-full w-96 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-800">
          Thread · {displayName(parent.user)}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close thread"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar user={parent.user} size="sm" />
            <span className="text-sm font-bold text-slate-800">
              {displayName(parent.user)}
            </span>
            <span className="text-xs text-slate-400">
              {formatMessageTime(parent.created_at)}
            </span>
          </div>
          {parent.body && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
              {parent.body}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6 text-slate-400">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {replies.map((reply) => (
              <MessageBubble
                key={reply.id}
                message={reply}
                currentUserId={currentUserId}
                onReact={(emoji) => onReact(reply.id, emoji)}
                onDelete={() => onDelete(reply.id)}
                onOpenThread={() => {}}
              />
            ))}
            {replies.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                No replies yet.
              </p>
            )}
          </div>
        )}

        <ErrorMessage message={error} className="mb-2" />
      </div>

      <div className="border-t border-slate-200 px-3 py-3">
        <div className="overflow-hidden rounded border border-slate-300 bg-white shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendReply(draft)
              }
            }}
            rows={2}
            placeholder="Reply in thread"
            className="block w-full resize-none px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex justify-end px-2 py-1.5">
            <Button
              size="sm"
              onClick={() => sendReply(draft)}
              disabled={!draft.trim()}
              loading={sending}
            >
              Reply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}