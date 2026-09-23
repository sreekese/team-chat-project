import { useCallback, useEffect, useState } from 'react'
import { userApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { Input } from './Input'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { displayName } from '../utils/format'
import { buildInviteLink, buildInviteMessage } from '../utils/invite'

function canManage(member) {
  return member?.role === 'owner' || member?.role === 'admin'
}

export function ManageMembersModal({ open, onClose, workspaceId }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const {
    currentWorkspace,
    members,
    loadingMembers,
    loadMembers,
    addMember,
    removeMember,
    regenerateInvite,
  } = useWorkspace()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const currentMember = members.find((m) => Number(m.user_id) === Number(user?.id))
  const isManager = canManage(currentMember)
  const memberIds = new Set(members.map((m) => m.user_id))
  const inviteCode = currentWorkspace?.invite_code

  useEffect(() => {
    if (workspaceId) {
      loadMembers(workspaceId)
    }
  }, [workspaceId, loadMembers])

  useEffect(() => {
    const trimmed = query.trim()
    const t = setTimeout(async () => {
      if (!trimmed) {
        setResults([])
        setSearching(false)
        return
      }
      setSearching(true)
      try {
        setResults(await userApi.search(trimmed))
      } catch (err) {
        setError(err.message)
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const handleAdd = useCallback(
    async (target) => {
      setAddingId(target.id)
      setError(null)
      try {
        await addMember(workspaceId, { user_id: target.id })
        toast.success(`${displayName(target)} added to workspace`)
      } catch (err) {
        setError(err.message)
      } finally {
        setAddingId(null)
      }
    },
    [workspaceId, addMember, toast],
  )

  const handleRemove = useCallback(
    async (target) => {
      setBusyId(target.id)
      setError(null)
      try {
        await removeMember(workspaceId, target.id)
        toast.success(`${displayName(target)} removed from workspace`)
      } catch (err) {
        setError(err.message)
      } finally {
        setBusyId(null)
      }
    },
    [workspaceId, removeMember, toast],
  )

  const handleRegenerate = useCallback(async () => {
    setError(null)
    try {
      await regenerateInvite(workspaceId)
      toast.success('New invite code generated')
    } catch (err) {
      setError(err.message)
    }
  }, [workspaceId, regenerateInvite, toast])

  const copyCode = async () => {
    if (!inviteCode) return
    await navigator.clipboard?.writeText(inviteCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const inviteLink = buildInviteLink(inviteCode)
  const shareMessage = buildInviteMessage(currentWorkspace?.name, inviteCode)

  const copyLink = async () => {
    if (!inviteCode) return
    await navigator.clipboard?.writeText(inviteLink).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1500)
  }

  const handleNativeShare = async () => {
    if (!inviteCode) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Invite to workspace',
          text: shareMessage,
          url: inviteLink,
        })
      } catch {
        // user dismissed the share sheet
      }
    } else {
      await copyLink()
    }
  }

  return (
    <Modal open={open} title="Invite people" onClose={onClose} size="lg">
      <div className="flex flex-col gap-5">
        <ErrorMessage message={error} />

        {isManager && (
          <div>
            <div className="mb-2 text-sm font-semibold text-ink-body">
              Add members
            </div>
            <div>
              <Input
                label="Search by name, username or email"
                name="member-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try typing someone's username"
              />
              {searching && (
                <div className="mt-2 flex justify-center py-2 text-ink-mute">
                  <Spinner size="sm" />
                </div>
              )}
              {!searching && results.length > 0 && (
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded border border-line">
                  {results.map((u) => {
                    const already = memberIds.has(u.id)
                    return (
                      <li
                        key={u.id}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <Avatar user={u} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {displayName(u)}
                          </p>
                          <p className="truncate text-xs text-ink-mute">
                            @{u.username}
                          </p>
                        </div>
                        {already ? (
                          <span className="text-xs font-medium text-ink-mute">
                            Added
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            loading={addingId === u.id}
                            onClick={() => handleAdd(u)}
                          >
                            Add
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              {!searching && query.trim() && results.length === 0 && (
                <p className="mt-2 text-sm text-ink-soft">
                  No users found. Ask them to register first, then search again.
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-body">
              Invite code
            </span>
            {isManager && (
              <button
                type="button"
                onClick={handleRegenerate}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Regenerate
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-line bg-surface-mute px-3 py-2 text-center text-lg font-bold tracking-widest text-accent">
              {inviteCode || '----------'}
            </code>
            <Button size="sm" variant="secondary" onClick={copyCode} disabled={!inviteCode}>
              {copied ? 'Copied!' : 'Copy code'}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={copyLink} disabled={!inviteCode}>
              {copiedLink ? 'Link copied!' : 'Copy invite link'}
            </Button>
            <a
              href={inviteCode ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}` : undefined}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="secondary" disabled={!inviteCode}>
                WhatsApp
              </Button>
            </a>
            <a
              href={inviteCode ? `mailto:?subject=${encodeURIComponent('Invite to a workspace')}&body=${encodeURIComponent(shareMessage)}` : undefined}
            >
              <Button size="sm" variant="secondary" disabled={!inviteCode}>
                Email
              </Button>
            </a>
            {typeof navigator !== 'undefined' && navigator.share && (
              <Button size="sm" variant="secondary" onClick={handleNativeShare} disabled={!inviteCode}>
                Share…
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Anyone with this code or link can join the workspace from their
            workspace list page.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-body">
              Members · {members.length}
            </span>
            {loadingMembers && <Spinner size="sm" />}
          </div>
          {members.length === 0 && !loadingMembers ? (
            <p className="rounded border border-dashed border-line-strong px-3 py-6 text-center text-sm text-ink-soft">
              No members yet.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded border border-line">
              {members.map((m) => {
                const isSelf = Number(m.user_id) === Number(user?.id)
                return (
                  <li key={m.id} className="flex items-center gap-2 px-3 py-2">
                    <Avatar user={m.user} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {displayName(m.user)}
                        {isSelf && (
                          <span className="ml-1 text-xs text-ink-mute">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink-mute">
                        @{m.user?.username} · {m.role}
                      </p>
                    </div>
                    {isManager && !isSelf && m.role !== 'owner' && (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={busyId === m.user_id}
                        onClick={() => handleRemove(m.user)}
                      >
                        Remove
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}