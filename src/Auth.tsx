
import { useState } from 'react'
import { supabase } from './lib/supabase'
import './Auth.css'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        })
        if (error) throw error

        if (!data.session) {
          setMessage('Account created! Check your email to confirm your account, then log in.')
        } else {
          setMessage('Account created successfully!')
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">HER<span>Health</span></div>
        <p className="auth-subtitle">Your personal women's health companion</p>

        <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-description">
          {isLogin ? 'Sign in to continue to your health dashboard.' : 'Create an account to get started.'}
        </p>

        {!isLogin && (
          <label>
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>

        {message && <p className="auth-message" role="status">{message}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
        </button>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage('')
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p className="auth-privacy">
          Your health information should remain private. Never share your password.
        </p>
      </form>
    </main>
  )
}
