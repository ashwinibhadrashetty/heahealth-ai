
import { useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import './Auth.css'
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage('')
    setErrorMessage('')
    setLoading(true)

    try {
      const cleanEmail = email.trim()

      if (isLogin) {
        // Log in an existing user
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) throw error

        setMessage('Login successful! Welcome to HERHealth.')
        // App.tsx will display the dashboard when the session updates.
      } else {
        // Register a new user
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        })

        if (error) throw error

        if (data.session) {
          setMessage('Account created successfully! Welcome to HERHealth.')
        } else {
          setMessage(
            'Account created! Please check your email to confirm your account before logging in.'
          )
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'

      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setIsLogin((current) => !current)
    setMessage('')
    setErrorMessage('')
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">
            H<span>+</span>
          </span>
          <div>
            <strong>HERHealth</strong>
            <small>WOMEN'S WELLNESS</small>
          </div>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR PERSONAL WELLNESS SPACE</span>

          <h1>
            {isLogin ? (
              <>
                Welcome <span>back.</span>
              </>
            ) : (
              <>
                Your journey <span>starts here.</span>
              </>
            )}
          </h1>

          <p>
            {isLogin
              ? 'Sign in to continue your wellness journey.'
              : 'Create your account and take a step toward understanding your health.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email address</label>

          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="auth-password">Password</label>

          <input
            id="auth-password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder={
              isLogin ? 'Enter your password' : 'Create a password'
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          {!isLogin && (
            <p className="auth-hint">
              Use at least 6 characters, or follow any stronger password
              requirements configured for your Supabase project.
            </p>
          )}

          {errorMessage && (
            <div className="auth-message auth-error" role="alert">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="auth-message auth-success" role="status">
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Login to HERHealth'
                : 'Create my account'}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="auth-divider">
          <span>YOUR WELLNESS, YOUR WAY</span>
        </div>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={switchMode}>
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>

        <p className="auth-privacy">
          ♡ Your health journey deserves care and respect.
        </p>

        <p className="auth-disclaimer">
          HERHealth provides general educational information, not a medical
          diagnosis or a substitute for professional care.
        </p>
      </section>
    </main>
  )
}
