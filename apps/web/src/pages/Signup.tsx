import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export default function Signup() {
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [wantToSell, setWantToSell] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'sell-prompt'>('form')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await register({ name, email, password })
      setStep('sell-prompt')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  function handleSellChoice(sell: boolean) {
    setWantToSell(sell)
    if (sell) {
      navigate('/store-setup')
    } else {
      navigate('/')
    }
  }

  if (step === 'sell-prompt') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-2 font-goblin text-3xl font-bold">You're In!</h1>
          <p className="mb-8 font-martian text-sm text-text-muted">
            Welcome to DripNSole. One more thing...
          </p>
          <div className="rounded-2xl border border-border p-8">
            <h2 className="mb-2 font-martian text-lg font-bold">Want to sell on DripNSole?</h2>
            <p className="mb-6 font-martian text-sm text-text-muted">
              Set up your store and start listing your drips.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSellChoice(true)}
                className="w-full cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black"
              >
                Yes, Set Up My Store
              </button>
              <button
                onClick={() => handleSellChoice(false)}
                className="w-full cursor-pointer rounded-full border border-border bg-white py-3.5 font-martian text-sm font-medium text-text-secondary transition-colors hover:bg-surface-light"
              >
                Maybe Later — Just Browse
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center font-goblin text-4xl font-bold">Join DripNSole</h1>
        <p className="mb-8 text-center font-martian text-sm text-text-muted">Your thrift. Your store. Everywhere.</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 font-martian text-sm text-accent-red">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-martian text-xs font-medium text-text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-border px-4 py-3 font-martian text-sm focus:border-brand focus:outline-none"
              placeholder="Min. 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full cursor-pointer rounded-full bg-brand py-3.5 font-martian text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center font-martian text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand no-underline hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
