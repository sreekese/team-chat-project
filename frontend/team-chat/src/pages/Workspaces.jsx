import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Spinner } from '../components/Spinner'

export function Workspaces() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    workspaces,
    loadingWorkspaces,
    loadWorkspaces,
    setCurrentWorkspace,
    createWorkspace,
  } = useWorkspace()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (workspaces.length === 0) {
      loadWorkspaces()
    }
  }, [workspaces.length, loadWorkspaces])

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
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Hi, {user?.name?.split(' ')[0] || ''} 👋
            </h1>
            <p className="text-sm text-slate-500">Choose a workspace</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-700">Your workspaces</h2>
          <Button onClick={() => setShowCreate(true)}>New workspace</Button>
        </div>

        {loadingWorkspaces && workspaces.length === 0 ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Spinner size="lg" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-slate-500">
              No workspaces yet. Create one to start chatting.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => openWorkspace(ws)}
                className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-lg font-bold text-white">
                  {ws.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-accent">
                  {ws.name}
                </h3>
                {ws.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {ws.description}
                  </p>
                )}
              </button>
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
    </div>
  )
}