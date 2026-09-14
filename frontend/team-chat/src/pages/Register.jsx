import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { Input } from '../components/Input'

export function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
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

  if (isAuthenticated) {
    return <Navigate to="/workspaces" replace />
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
      navigate('/workspaces')
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
    <div className="flex min-h-full items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-2xl font-bold text-white">
            TC
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Create your account
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
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
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}