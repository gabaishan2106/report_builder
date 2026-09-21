import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [mode, setMode] = useState<'signin' | 'reset'>('signin')

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError('Incorrect email or password. Please try again.')
    }
    // On success, useAuth's onAuthStateChange listener updates session
    // and the app router redirects to the report page.
  }

  async function handleResetRequest(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

    setLoading(false)

    if (resetError) {
      setError('Could not send reset email. Please check the address and try again.')
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark">VF</span>
          <span className="login-brand-name">Veeba Sales Analytics</span>
        </div>

        {mode === 'signin' ? (
          <>
            <h1 className="login-title">Sign in</h1>
            <p className="login-subtitle">Access your territory's sales reports.</p>

            <form onSubmit={handleSignIn} className="login-form">
              <label className="login-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <label className="login-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <button
                type="button"
                className="login-link-button"
                onClick={() => {
                  setMode('reset')
                  setError(null)
                }}
              >
                Forgot password?
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="login-title">Reset password</h1>
            <p className="login-subtitle">
              Enter your email and we'll send you a reset link.
            </p>

            {resetSent ? (
              <div className="login-success">
                If an account exists for that email, a reset link is on its way.
              </div>
            ) : (
              <form onSubmit={handleResetRequest} className="login-form">
                <label className="login-label" htmlFor="reset-email">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                {error && <div className="login-error">{error}</div>}

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            <button
              type="button"
              className="login-link-button"
              onClick={() => {
                setMode('signin')
                setError(null)
                setResetSent(false)
              }}
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
