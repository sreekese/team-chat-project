import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { usePendingInvite } from '../hooks/usePendingInvite'
import { clearPendingInvite } from '../utils/invite'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Spinner } from '../components/Spinner'

export function Workspaces() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const {
    workspaces,
    loadingWorkspaces,
    loadWorkspaces,
    setCurrentWorkspace,
    createWorkspace,
    joinWorkspace,
    deleteWorkspace,
  } = useWorkspace()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [deletingWorkspace, setDeletingWorkspace] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const pendingInvite = usePendingInvite()
  const autoJoined = useRef(false)

  useEffect(() => {
    if (workspaces.length === 0) {
      loadWorkspaces()
    }
  }, [workspaces.length, loadWorkspaces])

  const performJoin = useCallback(
    async (code) => {
      setJoining(true)
      setJoinError(null)
      try {
        const ws = await joinWorkspace(code)
        setInviteCode('')
        await loadWorkspaces()
        setCurrentWorkspace(ws.id)
        toast.success(`Joined "${ws.name}"`)
        navigate(`/workspaces/${ws.id}`)
      } catch (err) {
        setJoinError(err.message)
        toast.error(err.message || 'Could not join workspace')
      } finally {
        setJoining(false)
      }
    },
    [joinWorkspace, loadWorkspaces, setCurrentWorkspace, navigate, toast],
  )

  useEffect(() => {
    if (!pendingInvite || autoJoined.current) return
    autoJoined.current = true
    setInviteCode(pendingInvite)
    performJoin(pendingInvite).finally(clearPendingInvite)
  }, [pendingInvite, performJoin])

  const openWorkspace = (ws) => {
    setCurrentWorkspace(ws.id)
    navigate(`/workspaces/${ws.id}`)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setErrors({})
    setFormError(null)
    try {
      const ws = await createWorkspace({ name: name.trim(), description: description.trim() || undefined })
      setShowCreate(false)
      setCurrentWorkspace(ws.id)
      navigate(`/workspaces/${ws.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors)
      } else {
        setFormError(err.message)
      }
      toast.error(err.message || 'Could not create workspace')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    const code = inviteCode.trim()
    if (!code) return
    clearPendingInvite()
    await performJoin(code)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleDelete = async (workspaceId) => {
    setDeletingWorkspace(workspaceId)
    setDeleteError(null)
    try {
      await deleteWorkspace(workspaceId)
      toast.success('Workspace deleted')
    } catch (err) {
      setDeleteError(err.message || 'Could not delete workspace')
      toast.error(err.message || 'Could not delete workspace')
    } finally {
      setDeletingWorkspace(null)
    }
  }

  return (
    <div className="min-h-full bg-page">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-ink">
              Hi, {user?.name?.split(' ')[0] || ''} 👋
            </h1>
            <p className="text-sm text-ink-soft">Choose a workspace</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-mute hover:text-ink"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Your workspaces</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/messages')}>
              <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Messages
            </Button>
            <Button onClick={() => setShowCreate(true)}>New workspace</Button>
          </div>
        </div>

        <form
          onSubmit={handleJoin}
          className="mb-6 flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              label="Have an invite code?"
              name="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. 482913"
            />
          </div>
          <Button type="submit" variant="secondary" loading={joining}>
            Join workspace
          </Button>
        </form>
        <ErrorMessage message={joinError} className="mb-4" />

        {loadingWorkspaces && workspaces.length === 0 ? (
          <div className="flex justify-center py-16 text-ink-mute">
            <Spinner size="lg" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface py-16 text-center">
            <p className="text-ink-soft">
              No workspaces yet. Create one to start chatting.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workspaces.map((ws) => (
              <div key={ws.id} className="relative group">
                <button
                  type="button"
                  onClick={() => openWorkspace(ws)}
                  className="rounded-lg border border-line bg-surface p-5 text-left shadow-sm transition-shadow hover:shadow-md w-full"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-lg font-bold text-white">
                    {ws.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <h3 className="font-bold text-ink group-hover:text-accent">
                    {ws.name}
                  </h3>
                  {ws.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                      {ws.description}
                    </p>
                  )}
                  {ws.members_count !== undefined && (
                    <p className="mt-1 text-xs text-ink-mute">
                      {ws.members_count} member{ws.members_count === 1 ? '' : 's'}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(ws.id)
                  }}
                  disabled={deletingWorkspace === ws.id}
                  className="absolute top-2 right-2 rounded p-1 text-ink-mute opacity-0 hover:text-red-500 hover:bg-red-500/10 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Delete workspace"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={showCreate}
        title="Create a workspace"
        onClose={() => setShowCreate(false)}
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <ErrorMessage message={formError} />
          <Input
            label="Workspace name"
            name="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name?.[0]}
            placeholder="e.g. Acme Inc"
            autoFocus
          />
          <Input
            label="Description (optional)"
            name="ws-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description?.[0]}
            placeholder="What is this workspace for?"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deletingWorkspace}
        title="Delete workspace"
        onClose={() => setDeletingWorkspace(null)}
      >
        <p className="text-ink-soft mb-4">
          Are you sure you want to delete this workspace? This action cannot be undone.
        </p>
        <ErrorMessage message={deleteError} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeletingWorkspace(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={!!deletingWorkspace} onClick={() => handleDelete(deletingWorkspace)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}