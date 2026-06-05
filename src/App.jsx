import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Sidebar    from './components/Sidebar'
import TopBar     from './components/TopBar'
import Login      from './pages/Login'
import Signup     from './pages/Signup'
import Dashboard  from './pages/Dashboard'
import PlacementPrediction       from './pages/PlacementPrediction'
import SkillAnalytics            from './pages/SkillAnalytics'
import ResumeUpload              from './pages/ResumeUpload'
import InternshipRecommendations from './pages/InternshipRecommendations'
import UserProfile               from './pages/UserProfile'
import PredictionHistory         from './pages/PredictionHistory'
import ResumeHistory             from './pages/ResumeHistory'

// ── Private Route guard ───────────────────────────────────────────────────────
// Redirects unauthenticated users to /login.
// Renders children when a JWT token is present.
function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

// ── Public Route guard ────────────────────────────────────────────────────────
// Redirects already-authenticated users away from /login and /signup to home.
function PublicRoute({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/" replace /> : children
}

// ── App shell (sidebar + topbar + protected routes) ───────────────────────────
// The entire shell is only rendered when the user is authenticated.
function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#070b16' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#070b16' }}>
          <Routes>
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/prediction"          element={<PlacementPrediction />} />
            <Route path="/skills"              element={<SkillAnalytics />} />
            <Route path="/resume"              element={<ResumeUpload />} />
            <Route path="/internships"         element={<InternshipRecommendations />} />
            <Route path="/profile"             element={<UserProfile />} />
            <Route path="/history/predictions" element={<PredictionHistory />} />
            <Route path="/history/resumes"     element={<ResumeHistory />} />
            {/* Catch-all → home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth pages — redirect to / if already logged in */}
          <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Every other route requires authentication */}
          <Route path="/*" element={<PrivateRoute><AppShell /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
