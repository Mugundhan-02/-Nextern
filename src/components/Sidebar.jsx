import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, BarChart3, FileText,
  Briefcase, ChevronLeft, ChevronRight, Brain, Sparkles,
  LogOut, User, ClipboardList,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/prediction',  icon: TrendingUp,      label: 'Placement Prediction' },
  { path: '/skills',      icon: BarChart3,       label: 'Skill Analytics' },
  { path: '/resume',      icon: FileText,        label: 'Resume Upload' },
  { path: '/internships', icon: Briefcase,       label: 'Internships' },
]

const historyItems = [
  { path: '/profile',             icon: User,          label: 'My Profile' },
  { path: '/history/predictions', icon: TrendingUp,    label: 'Prediction History' },
  { path: '/history/resumes',     icon: ClipboardList, label: 'Resume History' },
]

function NavItem({ path, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer group',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/30'
            : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx('flex-shrink-0 transition-colors', isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300')} size={18} />
          {!collapsed && <span>{label}</span>}
          {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const initials = (user?.full_name || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen border-r border-white/8 transition-all duration-300 z-20',
        collapsed ? 'sidebar-width-collapsed' : 'sidebar-width'
      )}
      style={{ backgroundColor: '#0f1629' }}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-white/8', collapsed && 'justify-center px-2')}>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-indigo">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 animate-pulse" style={{ borderColor: '#0f1629' }} />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Nextern</h1>
            <p className="text-xs text-slate-400 leading-tight">Placement Intelligence</p>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600/80 transition-all duration-200 z-30"
        style={{ backgroundColor: '#141c35' }}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* AI Badge */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/15 border border-indigo-500/25 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-300">AI-Powered Insights</p>
            <p className="text-xs text-slate-500">Gemini 2.0 Flash</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
        )}
        {navItems.map(item => <NavItem key={item.path} {...item} collapsed={collapsed} />)}

        {!collapsed && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mt-5 mb-2">My History</p>
        )}
        {collapsed && <div className="border-t border-white/8 my-2" />}
        {historyItems.map(item => <NavItem key={item.path} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-white/8 mb-3" />

      {/* User + Logout */}
      <div className="px-3 pb-4 space-y-1">
        {/* User avatar → profile */}
        <NavLink
          to="/profile"
          title={collapsed ? (user?.full_name || 'Profile') : undefined}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
            collapsed && 'justify-center px-0',
            isActive ? 'bg-white/8' : 'hover:bg-white/6'
          )}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          {!collapsed && user && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.degree_program}</p>
            </div>
          )}
          {!collapsed && !user && (
            <span className="text-xs text-slate-400">Profile</span>
          )}
        </NavLink>

        {/* Logout */}
        {user && (
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all duration-200',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        )}
      </div>
    </aside>
  )
}
