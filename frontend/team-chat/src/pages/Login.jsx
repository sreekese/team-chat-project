import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { usePendingInvite } from '../hooks/usePendingInvite'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { Input } from '../components/Input'

export function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pendingInvite = usePendingInvite()
  const [loginField, setLoginField] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const inviteTarget = pendingInvite || searchParams.get('invite')
  const workspaceTarget = inviteTarget
    ? `/workspaces?invite=${encodeURIComponent(inviteTarget)}`
    : '/workspaces'
  const registerTarget = inviteTarget
    ? `/register?invite=${encodeURIComponent(inviteTarget)}`
    : '/register'

  if (isAuthenticated) {
    return <Navigate to={workspaceTarget} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setFormError(null)
    try {
      await login({ login: loginField.trim(), password })
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
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-2xl font-bold text-white">
            TC
          </div>
          <h1 className="text-2xl font-bold text-ink">Sign in to Team Chat</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Use your username or email
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 shadow-sm"
        >
          <ErrorMessage message={formError} />
          <Input
            label="Username or email"
            name="login"
            value={loginField}
            onChange={(e) => setLoginField(e.target.value)}
            error={errors.login?.[0]}
            autoFocus
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password?.[0]}
          />
          <Button type="submit" loading={submitting}>
            Sign in
          </Button>
          <p className="text-center text-sm text-ink-soft">
            No account?{' '}
            <Link to={registerTarget} className="font-semibold text-accent hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}