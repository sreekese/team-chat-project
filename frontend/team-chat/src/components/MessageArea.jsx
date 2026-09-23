import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { useE2EE } from '../context/E2EEContext'
import { useToast } from '../context/ToastContext'
import { useMessages } from '../hooks/useMessages'
import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'
import { ThreadView } from './ThreadView'

export const MessageArea = forwardRef(function MessageArea(
  { workspaceId, channelId, currentUserId, typingNames = [], onTyping, recipients = [] },
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
  const { encrypt } = useE2EE()
  const [threadParent, setThreadParent] = useState(null)
  const { toast } = useToast()

  const safeReact = useCallback(
    (messageId, emoji) => {
      react(messageId, emoji).catch((e) => toast.error(e.message))
    },
    [react, toast],
  )

  const safeRemove = useCallback(
    (messageId) => {
      remove(messageId).catch((e) => toast.error(e.message))
    },
    [remove, toast],
  )

  const safeSend = useCallback(
    async (payload) => {
      try {
        return await send(payload, {
          recipients,
          selfId: currentUserId,
          encrypt,
          onEncryptionFallback: () => {
            toast.info('Sent without encryption because a recipient has not set it up yet.')
          },
        })
      } catch (e) {
        toast.error(e.message)
        return null
      }
    },
    [send, recipients, currentUserId, encrypt, toast],
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
          <p className="border-t border-line px-4 py-2 text-center text-xs text-rose-600">
            {error}
          </p>
        )}

        {typingNames.length > 0 && (
          <p className="px-4 py-1 text-xs font-medium text-ink-soft">
            {typingNames.join(', ')}{' '}
            {typingNames.length === 1 ? 'is' : 'are'} typing…
          </p>
        )}

        <div className={threadParent ? 'border-t border-line' : ''}>
          <MessageComposer onSend={safeSend} sending={sending} onTyping={onTyping} />
        </div>
      </div>

      {threadParent && (
        <ThreadView
          key={threadParent.id}
          parent={threadParent}
          workspaceId={workspaceId}
          channelId={channelId}
          currentUserId={currentUserId}
          recipients={recipients}
          onClose={() => setThreadParent(null)}
          onReact={safeReact}
          onDelete={safeRemove}
        />
      )}
    </div>
  )
})
