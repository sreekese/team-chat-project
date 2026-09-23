import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { usePendingInvite } from '../hooks/usePendingInvite'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { Input } from '../components/Input'

export function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pendingInvite = usePendingInvite()
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const inviteTarget = pendingInvite || searchParams.get('invite')
  const workspaceTarget = inviteTarget
    ? `/workspaces?invite=${encodeURIComponent(inviteTarget)}`
    : '/workspaces'
  const loginTarget = inviteTarget
    ? `/login?invite=${encodeURIComponent(inviteTarget)}`
    : '/login'

  if (isAuthenticated) {
    return <Navigate to={workspaceTarget} replace />
  }

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setFormError(null)
    try {
      await register(form)
      navigate(workspaceTarget)
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

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-2xl font-bold text-white">
            TC
          </div>
          <h1 className="text-2xl font-bold text-ink">
            Create your account
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 shadow-sm"
        >
          <ErrorMessage message={formError} />
          <Input
            label="Full name"
            name="name"
            value={form.name}
            onChange={setField('name')}
            error={errors.name?.[0]}
            autoFocus
          />
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={setField('username')}
            error={errors.username?.[0]}
            hint="Lowercase letters, numbers, dots, dashes and underscores"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={setField('email')}
            error={errors.email?.[0]}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={setField('password')}
            error={errors.password?.[0]}
            hint="At least 8 characters"
          />
          <Input
            label="Confirm password"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={setField('password_confirmation')}
            error={errors.password_confirmation?.[0]}
          />
          <Button type="submit" loading={submitting}>
            Create account
          </Button>
          <p className="text-center text-sm text-ink-soft">
            Already have an account?{' '}
            <Link to={loginTarget} className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}