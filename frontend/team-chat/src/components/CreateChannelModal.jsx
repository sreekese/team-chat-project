import { useState } from 'react'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { Input } from './Input'
import { Modal } from './Modal'
import { useToast } from '../context/ToastContext'

export function CreateChannelModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('public')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const reset = () => {
    setName('')
    setType('public')
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const channel = await onCreate({ name: name.trim(), type })
      reset()
      onClose()
      return channel
    } catch (err) {
      setError(err.message)
      toast.error(err.message || 'Could not create channel')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} title="Create a channel" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Channel name"
          name="channel-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. design"
          autoFocus
        />
        <div>
          <label className="text-sm font-medium text-ink-body">
            Channel type
          </label>
          <div className="mt-1.5 flex gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-body">
              <input
                type="radio"
                name="channel-type"
                value="public"
                checked={type === 'public'}
                onChange={() => setType('public')}
              />
              <span className="rounded bg-surface-mute px-1.5">#</span> Public
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-body">
              <input
                type="radio"
                name="channel-type"
                value="private"
                checked={type === 'private'}
                onChange={() => setType('private')}
              />
              Locked
            </label>
          </div>
        </div>
        <ErrorMessage message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}