import { useCallback, useEffect, useState } from 'react'
import { messageApi } from '../api/endpoints'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { MessageBubble } from './MessageBubble'
import { Spinner } from './Spinner'
import { useE2EE, useDecryptedMessage } from '../context/E2EEContext'
import { E2eeError } from '../crypto/e2ee'
import { appendMessage, displayName, formatMessageTime } from '../utils/format'

function canSendPlaintextFallback(error) {
  return (
    error instanceof E2eeError &&
    [
      'A member has not set up encryption yet',
      'No other members have set up encryption yet',
      'No recipients with encryption keys',
    ].includes(error.message)
  )
}

export function ThreadView({
  parent,
  workspaceId,
  channelId,
  currentUserId,
  recipients = [],
  onClose,
  onReact,
  onDelete,
}) {
  const { encrypt } = useE2EE()
  const [replies, setReplies] = useState(parent.replies || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const { plain: parentPlain, failed: parentFailed } = useDecryptedMessage(parent)

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
        let payload
        try {
          const envelope = await encrypt({
            text: body.trim(),
            recipients,
            selfId: currentUserId,
          })
          payload = { parentId: parent.id, ...envelope }
        } catch (err) {
          if (!canSendPlaintextFallback(err)) {
            throw err
          }
          payload = { body: body.trim(), parentId: parent.id }
        }
        const reply = await messageApi.send(workspaceId, channelId, {
          ...payload,
        })
        setReplies((prev) => appendMessage(prev, reply))
      } catch (e) {
        setError(e.message)
      } finally {
        setSending(false)
        setDraft('')
      }
    },
    [workspaceId, channelId, parent.id, sending, encrypt, recipients, currentUserId],
  )

  return (
    <div className="flex h-full w-96 shrink-0 flex-col border-l border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-bold text-ink">
          Thread · {displayName(parent.user)}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-ink-soft hover:bg-surface-mute hover:text-ink"
          aria-label="Close thread"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        <div className="mb-4 rounded border border-line bg-surface-soft px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar user={parent.user} size="sm" />
            <span className="text-sm font-bold text-ink">
              {displayName(parent.user)}
            </span>
            <span className="text-xs text-ink-mute">
              {formatMessageTime(parent.created_at)}
            </span>
          </div>
          {parent.encrypted_body ? (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-body">
              {parentFailed ? 'Message could not be decrypted' : parentPlain || ''}
            </p>
          ) : parent.body && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-body">
              {parent.body}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6 text-ink-mute">
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
              <div className="flex flex-col items-center gap-1 py-6 text-center">
                <p className="text-sm text-ink-soft">No replies yet.</p>
                <p className="text-xs text-ink-mute">
                  Reply to start the thread.
                </p>
              </div>
            )}
          </div>
        )}

        <ErrorMessage message={error} className="mb-2" />
      </div>

      <div className="border-t border-line px-3 py-3">
        <div className="overflow-hidden rounded border border-line-strong bg-surface shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
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
            className="block w-full resize-none bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none"
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
