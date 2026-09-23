import { useState } from 'react'
import { Avatar } from './Avatar'
import { EmojiPicker } from './EmojiPicker'
import { useDecryptedMessage } from '../context/E2EEContext'
import { displayName, formatBytes, formatMessageTime } from '../utils/format'

function groupReactions(reactions = []) {
  const groups = new Map()
  reactions.forEach((r) => {
    if (!groups.has(r.emoji)) {
      groups.set(r.emoji, { emoji: r.emoji, count: 0, reacted: false })
    }
    const group = groups.get(r.emoji)
    group.count += 1
  })
  return [...groups.values()]
}

function AttachmentChip({ attachment }) {
  return (
    <div className="mt-1 flex items-center gap-2 rounded border border-line bg-surface-soft px-2.5 py-2">
      <svg className="h-5 w-5 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M13.5 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5.5-5zM13 3v5h5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {attachment.file_name}
        </p>
        <p className="text-xs text-ink-soft">
          {formatBytes(attachment.size)}
          {attachment.mime_type ? ` · ${attachment.mime_type}` : ''}
        </p>
      </div>
    </div>
  )
}

export function MessageBubble({
  message,
  currentUserId,
  onReact,
  onDelete,
  onOpenThread,
}) {
  const [showPicker, setShowPicker] = useState(false)
  const isOwn = message.user_id === currentUserId
  const reactionGroups = groupReactions(message.reactions)
  const { plain, failed } = useDecryptedMessage(message)

  return (
    <div className="group flex gap-3 rounded px-2 py-1 hover:bg-surface-mute">
      <Avatar user={message.user} size="md" className="mt-1" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-ink">
            {displayName(message.user)}
          </span>
          <span className="text-xs text-ink-mute">
            {formatMessageTime(message.created_at)}
          </span>
          {message.parent_id && (
            <span className="rounded bg-surface-mute px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
              reply
            </span>
          )}
        </div>

        {message.encrypted_body ? (
          failed ? (
            <p className="whitespace-pre-wrap break-words text-sm italic leading-relaxed text-ink-mute">
              Message could not be decrypted
            </p>
          ) : (
            plain && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-body">
                {plain}
              </p>
            )
          )
        ) : (
          message.body && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-body">
              {message.body}
            </p>
          )
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-1 flex flex-col gap-2">
            {message.attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {reactionGroups.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {reactionGroups.map(({ emoji, count, reacted }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  reacted
                    ? 'border-accent bg-accent/10 text-ink-body'
                    : 'border-line bg-surface text-ink-soft hover:border-line-strong'
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-0.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!showPicker && (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="rounded px-1.5 py-0.5 text-xs font-semibold text-ink-mute hover:bg-surface hover:text-ink"
            >
              Add reaction
            </button>
          )}
          {message.parent_id === null && message.replies_count > 0 && (
            <button
              type="button"
              onClick={onOpenThread}
              className="rounded px-1.5 py-0.5 text-xs font-semibold text-ink-mute hover:bg-surface hover:text-ink"
            >
              {message.replies_count} {message.replies_count === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this message?')) onDelete()
              }}
              className="rounded px-1.5 py-0.5 text-xs font-semibold text-ink-mute hover:bg-surface hover:text-rose-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {showPicker && (
        <EmojiPicker
          className="absolute"
          onSelect={(emoji) => {
            setShowPicker(false)
            onReact(emoji)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}