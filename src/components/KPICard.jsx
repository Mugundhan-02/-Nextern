import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'
import * as LucideIcons from 'lucide-react'

const colorConfig = {
  indigo: {
    icon: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/25',
    glow: 'shadow-glow-indigo',
    badge: 'bg-indigo-500/20 text-indigo-300',
    gradient: 'from-indigo-600/20 to-transparent',
  },
  purple: {
    icon: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/25',
    glow: 'shadow-glow-purple',
    badge: 'bg-purple-500/20 text-purple-300',
    gradient: 'from-purple-600/20 to-transparent',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/25',
    glow: 'shadow-glow-cyan',
    badge: 'bg-cyan-500/20 text-cyan-300',
    gradient: 'from-cyan-600/20 to-transparent',
  },
  green: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/25',
    glow: '',
    badge: 'bg-emerald-500/20 text-emerald-300',
    gradient: 'from-emerald-600/20 to-transparent',
  },
}

export default function KPICard({ title, value, change, trend, color = 'indigo', icon, description }) {
  const cfg = colorConfig[color] || colorConfig.indigo
  const Icon = LucideIcons[icon] || LucideIcons.Activity
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={clsx(
      'relative overflow-hidden rounded-2xl p-5 border bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white/8 shine-effect',
      cfg.border,
    )}>
      {/* Background gradient orb */}
      <div className={clsx('absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-40 blur-2xl bg-gradient-radial', cfg.gradient)} />

      <div className="relative z-10">
        {/* Icon + Title */}
        <div className="flex items-start justify-between mb-4">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
            <Icon className={clsx('w-5 h-5', cfg.icon)} />
          </div>
          <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold', cfg.badge)}>
            <TrendIcon className="w-3 h-3" />
            {change}
          </div>
        </div>

        {/* Value */}
        <div className="mb-1">
          <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        </div>

        {/* Title + Description */}
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
