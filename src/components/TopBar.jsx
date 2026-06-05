import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Search, ChevronDown, Zap, LogOut, User, Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const routeLabels = {
  '/':                    { title: 'Dashboard',                subtitle: 'Overview of placement activity & analytics' },
  '/prediction':          { title: 'Placement Prediction',     subtitle: 'AI-powered company match & probability score' },
  '/skills':              { title: 'Skill Analytics',          subtitle: 'Gap analysis, demand trends & learning paths' },
  '/resume':              { title: 'Resume Upload',            subtitle: 'ATS analysis, skill extraction & scoring' },
  '/internships':         { title: 'Internship Recommendations', subtitle: 'Personalized opportunities matched to your profile' },
  '/profile':             { title: 'My Profile',              subtitle: 'Your account settings and activity summary' },
  '/history/predictions': { title: 'Prediction History',       subtitle: 'All your past placement prediction results' },
  '/history/resumes':     { title: 'Resume History',           subtitle: 'All your past ATS resume analysis results' },
}

export default function TopBar() {
  const location          = useLocation()
  const navigate          = useNavigate()
  const { user, logout }  = useAuth()
  const [searchFocused, setSearchFocused] = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const menuRef = useRef(null)

  const { title, subtitle } = routeLabels[location.pathname] || routeLabels['/']

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Build initials from user name
  const initials = (user?.full_name || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const displayName = user?.full_name
    ? user.full_name.split(' ')[0]   // first name only in the chip
    : 'Account'

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b border-white/8 backdrop-blur-sm sticky top-0 z-10"
      style={{ backgroundColor: 'rgba(10, 14, 26, 0.85)' }}
    >
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
          searchFocused
            ? 'bg-white/8 border-indigo-500/50 w-64'
            : 'bg-white/5 border-white/10 w-40'
        }`}>
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Live Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">Live</span>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-navy-800" style={{ borderColor: '#0a0e1a' }} />
        </button>

        {/* AI Credits */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">AI Ready</span>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <span className="text-xs font-medium text-slate-300 max-w-[80px] truncate hidden sm:block">
              {displayName}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in z-50"
              style={{ backgroundColor: '#141c35' }}
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-white/8">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Student'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                {user?.degree_program && (
                  <p className="text-xs text-indigo-400 mt-0.5 truncate">
                    {user.degree_program}
                    {user.specialization ? ` · ${user.specialization}` : ''}
                  </p>
                )}
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/6 hover:text-white transition-all duration-150 text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  My Profile
                </button>
                <button
                  onClick={() => { navigate('/history/predictions'); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/6 hover:text-white transition-all duration-150 text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  Settings
                </button>
              </div>

              <div className="mx-3 border-t border-white/8" />

              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
