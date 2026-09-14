import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { useMessages } from '../hooks/useMessages'
import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'
import { ThreadView } from './ThreadView'

export const MessageArea = forwardRef(function MessageArea(
  { workspaceId, channelId, currentUserId },
  ref,
) {
  const {
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
  } = useMessages(workspaceId, channelId)

  const [threadParent, setThreadParent] = useState(null)

  const safeReact = useCallback(
    (messageId, emoji) => {
      react(messageId, emoji).catch(() => {})
    },
    [react],
  )

  const safeRemove = useCallback(
    (messageId) => {
      remove(messageId).catch(() => {})
    },
    [remove],
  )

  useImperativeHandle(
    ref,
    () => ({ react, remove, appendMessageLive }),
    [react, remove, appendMessageLive],
  )

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageList
          messages={messages}
          loading={loading}
          hasOlder={hasOlder}
          loadOlder={loadOlder}
          currentUserId={currentUserId}
          onReact={safeReact}
          onDelete={safeRemove}
          onOpenThread={setThreadParent}
        />

        {error && (
          <p className="border-t border-slate-200 px-4 py-2 text-center text-xs text-rose-600">
            {error}
          </p>
        )}

        <div className={threadParent ? 'border-t border-slate-200' : ''}>
          <MessageComposer onSend={send} sending={sending} />
        </div>
      </div>

      {threadParent && (
        <ThreadView
          key={threadParent.id}
          parent={threadParent}
          workspaceId={workspaceId}
          channelId={channelId}
          currentUserId={currentUserId}
          onClose={() => setThreadParent(null)}
          onReact={safeReact}
          onDelete={safeRemove}
        />
      )}
    </div>
  )
})