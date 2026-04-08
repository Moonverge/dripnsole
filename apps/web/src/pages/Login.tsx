import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export default function Login() {
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center font-goblin text-4xl font-bold">Welcome Back</h1>
        <p className="mb-8 text-center font-martian text-sm text-text-muted">
          Sign in to DripNSole
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 font-martian text-sm text-accent-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm transition-colors focus:border-brand focus:outline-none"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm transition-colors focus:border-brand focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center font-martian text-sm text-text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-brand no-underline hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
