import React from 'react'
import clsx from 'clsx'

export default function ChartCard({ title, subtitle, children, className, action }) {
  return (
    <div className={clsx(
      'glass-card p-5 animate-slide-up',
      className
    )}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && (
          <div>{action}</div>
        )}
      </div>
      {children}
    </div>
  )
}
