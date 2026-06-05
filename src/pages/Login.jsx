// src/pages/Login.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Brain, Mail, Lock, Eye, EyeOff,
  AlertCircle, Sparkles, Zap, XCircle, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { validateEmail, isValidEmail } from '../utils/validation'

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [show,    setShow]    = useState(false)
  const [touched, setTouched] = useState({})
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Live email validation (only shown after the field is blurred)
  const emailError = touched.email ? validateEmail(form.email) : null

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (error) setError('')   // clear error as soon as the user starts typing
  }

  const blur = (k) => () => setTouched(t => ({ ...t, [k]: true }))

  // ── Quick-fill demo credentials ────────────────────────────────────────
  const fillDemo = () => {
    setForm({ email: 'demo@skillai.app', password: 'demo1234' })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // ── Client-side validation (fast path, no network call) ──────────────
    const email    = form.email.trim().toLowerCase()
    const password = form.password

    if (!email)                    return setError('Email is required.')
    if (!isValidEmail(email))      return setError('Please enter a valid email address.')
    if (!password)                 return setError('Password is required.')

    // ── Call the backend ──────────────────────────────────────────────────
    setLoading(true)
    let res
    try {
      res = await login(email, password)
    } catch {
      // Network / unexpected error
      setLoading(false)
      setError('Could not reach the server. Please try again.')
      return
    }
    setLoading(false)

    // ── Route on result ───────────────────────────────────────────────────
    if (res && res.ok === true) {
      // Successful login — navigate to Dashboard
      navigate('/', { replace: true })
    } else {
      // Failed login — stay on page, show error
      const msg = (res && res.error) ? res.error : 'Invalid email or password'
      setError(msg)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#070b16' }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-600/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-glow-indigo">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your SkillAI account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">

          {/* AI badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/15 border border-indigo-500/25 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-indigo-300 font-medium">AI-Powered Placement Intelligence</p>
          </div>

          {/* Demo Quick-fill */}
          <button
            type="button"
            onClick={fillDemo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 text-xs text-amber-300 font-semibold hover:bg-amber-500/15 transition-all duration-200 mb-5"
          >
            <Zap className="w-3.5 h-3.5" />
            Try Demo Account — one click
          </button>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Error banner */}
            {error && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 animate-fade-in"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={blur('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className={`input-field pl-10 pr-10 transition-all duration-200 ${emailError ? 'ring-2 ring-red-500/60 border-red-500/50' : ''}`}
                  style={{ backgroundColor: '#141c35' }}
                />
                {/* Live status icon after typing */}
                {form.email && (
                  isValidEmail(form.email)
                    ? <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                    : <XCircle      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400   pointer-events-none" />
                )}
              </div>
              {emailError && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="input-field pl-10 pr-11"
                  style={{ backgroundColor: '#141c35' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          SkillAI — Placement Intelligence Platform
        </p>
      </div>
    </div>
  )
}
