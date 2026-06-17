// src/context/AuthContext.jsx
// ============================================================
// Global authentication context for SkillAI.
//
// Provides:
//   user          — decoded user object from the JWT / /auth/me
//   token         — raw JWT string (null if logged out)
//   loading       — true while an auth request is in-flight
//   login()       — POST /auth/login → persist token + user
//   register()    — POST /auth/register → persist token + user
//   logout()      — clear token + user from memory & localStorage
//   authHeaders() — returns headers object with Bearer token
//   refreshUser() — re-fetch /auth/me and update user state
//
// Token is persisted in localStorage so the session survives
// page reloads. On mount the token is verified against /auth/me;
// an expired/invalid token triggers an automatic logout.
// ============================================================

import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react'

const API       = 'http://127.0.0.1:8000/api/v1'
const TOKEN_KEY = 'skillai_token'
const USER_KEY  = 'skillai_user'

const AuthContext = createContext(null)

// ── Error parsing helper ──────────────────────────────────────────────────────
// FastAPI returns errors in two shapes:
//   • String detail:  { detail: "Email already registered" }
//   • Array detail:   { detail: [{ loc: [...], msg: "...", type: "..." }] }
//     (this is the pydantic 422 validation format)
// This helper always returns a human-readable string.
function parseApiError(data, fallback = 'Request failed.') {
  if (!data) return fallback
  const d = data.detail
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d.length > 0) {
    return d.map(e => e.msg || String(e)).join('; ')
  }
  return String(d) || fallback
}

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') }
    catch { return null }
  })
  const [loading,     setLoading]     = useState(false)
  // authChecked: true once the initial /auth/me verification is done.
  // Prevents a flash of the login page on page reload.
  const [authChecked, setAuthChecked] = useState(false)

  // ── Persist helpers ───────────────────────────────────────
  const persist = (tok, usr) => {
    setToken(tok)
    setUser(usr)
    localStorage.setItem(TOKEN_KEY, tok)
    localStorage.setItem(USER_KEY,  JSON.stringify(usr))
  }

  const clear = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  // ── Verify token on mount (survives page refresh) ─────────
  useEffect(() => {
    if (!token) {
      setAuthChecked(true)
      return
    }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error('Token invalid')
        return r.json()
      })
      .then(u => {
        setUser(u)
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      })
      .catch(() => clear())   // expired / invalid → log out silently
      .finally(() => setAuthChecked(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── login ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(parseApiError(data, 'Login failed.'))
      persist(data.access_token, data.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── register ──────────────────────────────────────────────
  const register = useCallback(async (fields) => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(parseApiError(data, 'Registration failed.'))
      persist(data.access_token, data.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    // Fire-and-forget to the backend (stateless JWT — mainly for future blacklisting)
    fetch(`${API}/auth/logout`, { method: 'POST' }).catch(() => {})
    clear()
  }, [clear])

  // ── refreshUser — re-fetch /auth/me and update user state ─
  const refreshUser = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { clear(); return }
      const u = await res.json()
      setUser(u)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    } catch {
      // network error — keep the stale user, don't log out
    }
  }, [token, clear])

  // ── authHeaders — inject Bearer token into fetch calls ────
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  // ── While initial auth check is running, render nothing ───
  // This prevents the PrivateRoute from redirecting to /login
  // for a brief moment on page reload before the token is verified.
  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#070b16' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Nextern…</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout, authHeaders, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
