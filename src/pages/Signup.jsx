// src/pages/Signup.jsx
import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Brain, User, Mail, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle2, Sparkles, XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SearchableSelect from '../components/SearchableSelect'
import {
  DEGREE_GROUPS,
  DEGREE_LIST,
} from '../data/degreeData'
import { specializationsByDegree } from '../data/dummyData'
import {
  validateEmail,
  validatePassword,
  isValidEmail,
  passwordStrengthScore,
  PASSWORD_RULES,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
  STRENGTH_TEXT,
} from '../utils/validation'

// ── Tiny rule-row component ───────────────────────────────────────────────
function RuleRow({ passed, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${passed ? 'text-emerald-400' : 'text-slate-500'}`}>
      {passed
        ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
        : <XCircle      className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
      }
      {label}
    </li>
  )
}

export default function Signup() {
  const { register } = useAuth()
  const navigate      = useNavigate()

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '',
    degree_program: '', specialization: '',
  })
  const [show,    setShow]    = useState({ password: false, confirm: false })
  const [touched, setTouched] = useState({})      // which fields the user has blurred
  const [error,   setError]   = useState('')       // global / server error
  const [loading, setLoading] = useState(false)

  // ── Derived validation state ──────────────────────────────────────────
  const emailError    = touched.email    ? validateEmail(form.email)       : null
  const passwordError = touched.password ? validatePassword(form.password)  : null
  const confirmError  = touched.confirm  && form.confirm && form.password !== form.confirm
                          ? 'Passwords do not match.' : null

  const pwScore     = passwordStrengthScore(form.password)
  const isDuplicate = error.toLowerCase().includes('already registered')

  // ── Derived specializations based on selected degree program ─────────
  const validSpecializations = useMemo(() => {
    return specializationsByDegree[form.degree_program] ?? []
  }, [form.degree_program])

  // ── Handlers ──────────────────────────────────────────────────────────
  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (error) setError('')    // clear server error when user edits any field
  }

  const blur = (k) => () => setTouched(t => ({ ...t, [k]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Touch all required fields to trigger their inline errors
    setTouched({ full_name: true, email: true, password: true, confirm: true })

    // ── Client-side guard ─────────────────────────────────────────────
    if (!form.full_name.trim())          return setError('Full name is required.')
    if (!isValidEmail(form.email))       return setError('Please enter a valid email address.')
    if (validatePassword(form.password)) return setError(validatePassword(form.password))
    if (form.password !== form.confirm)  return setError('Passwords do not match.')
    if (!form.degree_program)            return setError('Please select your degree program.')

    // ── Network call ──────────────────────────────────────────────────
    setLoading(true)
    let res
    try {
      res = await register({
        full_name:      form.full_name.trim(),
        email:          form.email.trim().toLowerCase(),
        password:       form.password,
        degree_program: form.degree_program,
        specialization: form.specialization,
      })
    } catch {
      setLoading(false)
      setError('Could not reach the server. Please try again.')
      return
    }
    setLoading(false)

    if (res && res.ok === true) {
      navigate('/', { replace: true })
    } else {
      setError((res && res.error) || 'Registration failed. Please try again.')
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────
  const fieldRing = (hasError) =>
    hasError ? 'ring-2 ring-red-500/60 border-red-500/50' : ''

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#070b16' }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-600/8 blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-glow-indigo">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Join Nextern — it's free</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/15 border border-indigo-500/25 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-indigo-300 font-medium">
              Get AI-powered placement predictions &amp; resume scoring
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Global / server error */}
            {error && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 animate-fade-in"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300">{error}</p>
                  {isDuplicate && (
                    <Link
                      to="/login"
                      className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors mt-1 inline-block"
                    >
                      → Sign in instead
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  value={form.full_name}
                  onChange={set('full_name')}
                  onBlur={blur('full_name')}
                  placeholder="Your full name"
                  autoComplete="name"
                  autoFocus
                  className="input-field pl-10"
                  style={{ backgroundColor: '#141c35' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={blur('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input-field pl-10 pr-10 transition-all duration-200 ${
                    fieldRing(emailError || isDuplicate)
                  }`}
                  style={{ backgroundColor: '#141c35' }}
                />
                {/* Live status icon */}
                {form.email && (
                  isValidEmail(form.email)
                    ? <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                    : <XCircle      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 pointer-events-none" />
                )}
              </div>
              {/* Inline field error (shown after blur) */}
              {emailError && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="signup-password"
                  type={show.password ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  onBlur={blur('password')}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`input-field pl-10 pr-11 transition-all duration-200 ${fieldRing(passwordError)}`}
                  style={{ backgroundColor: '#141c35' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, password: !s.password }))}
                  tabIndex={-1}
                  aria-label={show.password ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {show.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar + rules checklist */}
              {form.password && (
                <div className="mt-2.5 space-y-2">
                  {/* Strength bar */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= pwScore ? STRENGTH_COLORS[pwScore] : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${STRENGTH_TEXT[pwScore]}`}>
                    {STRENGTH_LABELS[pwScore]}
                  </p>

                  {/* Per-rule checklist */}
                  <ul className="space-y-1 pl-0.5">
                    {PASSWORD_RULES.map(rule => (
                      <RuleRow
                        key={rule.id}
                        passed={rule.test(form.password)}
                        label={rule.label}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm"
                className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="signup-confirm"
                  type={show.confirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  onBlur={blur('confirm')}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`input-field pl-10 pr-11 transition-all duration-200 ${fieldRing(confirmError)}`}
                  style={{ backgroundColor: '#141c35' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                  tabIndex={-1}
                  aria-label={show.confirm ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {/* Match tick — shown only when confirm is filled AND matches */}
                {form.confirm && form.password === form.confirm && (
                  <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                )}
              </div>
              {confirmError && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{confirmError}
                </p>
              )}
            </div>

            {/* Degree Program + Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Degree Program
                </label>
                <SearchableSelect
                  id="signup-degree"
                  groups={DEGREE_GROUPS}
                  options={DEGREE_LIST}
                  value={form.degree_program}
                  onChange={deg => setForm(f => ({ ...f, degree_program: deg, specialization: '' }))}
                  placeholder="e.g. BTech, BCA…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Specialization
                </label>
                <SearchableSelect
                  id="signup-spec"
                  options={validSpecializations}
                  value={form.specialization}
                  onChange={spec => setForm(f => ({ ...f, specialization: spec }))}
                  placeholder={form.degree_program ? "e.g. Data Science…" : "Select degree first"}
                  disabled={!form.degree_program}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 -mt-1">
              Select your degree type, then your area of specialization independently.
            </p>

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Nextern — Placement Intelligence Platform
        </p>
      </div>
    </div>
  )
}
