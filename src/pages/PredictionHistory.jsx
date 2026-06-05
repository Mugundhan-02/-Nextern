import React, { useState, useEffect } from 'react'
import {
  TrendingUp, RefreshCw, ChevronRight, X,
  CheckCircle2, AlertCircle, Zap, Filter
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import { useAuth } from '../context/AuthContext'

const API = 'http://127.0.0.1:8000/api/v1'

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }) {
  const r      = (size / 2) - 5
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color  = score >= 85 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 55 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{score}%</span>
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cls =
    status?.includes('Highly')   ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' :
    status?.includes('Likely')   ? 'bg-indigo-500/15  text-indigo-300  border-indigo-500/25'  :
    status?.includes('Moderate') ? 'bg-amber-500/15   text-amber-300   border-amber-500/25'   :
                                   'bg-red-500/15     text-red-300     border-red-500/25'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${cls}`}>{status}</span>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ record, onClose }) {
  if (!record) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="glass-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white">Prediction Detail</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(record.created_at).toLocaleString('en-IN')}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5 p-4 rounded-2xl bg-white/4 border border-white/8">
          <ScoreRing score={record.prediction_score} size={72} />
          <div>
            <StatusBadge status={record.status} />
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{record.recommendation}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'CGPA',        value: record.cgpa },
            { label: 'Internships', value: record.internships },
            { label: 'Projects',    value: record.projects },
            { label: 'LeetCode',    value: record.leetcode_solved },
            { label: 'Backlogs',    value: record.backlogs },
            { label: 'Comm.',       value: record.communication },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-white/4 border border-white/8 text-center">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {record.skills_input?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {record.skills_input.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">{s}</span>
              ))}
            </div>
          </div>
        )}

        {record.company_matches?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Company Matches</p>
            <div className="space-y-2">
              {record.company_matches.slice(0, 4).map(c => (
                <div key={c.company} className="flex items-center justify-between p-2.5 rounded-xl bg-white/4 border border-white/8">
                  <div>
                    <p className="text-xs font-bold text-white">{c.company}</p>
                    <p className="text-xs text-slate-500">{c.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-400">{c.confidence}%</p>
                    <p className="text-xs text-slate-500">{c.package}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PredictionHistory() {
  const { authHeaders }         = useAuth()
  const [records,  setRecords]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/history/predictions?limit=50`, { headers: authHeaders() })
      const data = await res.json()
      setRecords(Array.isArray(data) ? data : [])
    } catch {
      setError('Could not load history. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading prediction history…</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {selected && <DetailDrawer record={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Prediction History</h2>
          <p className="text-xs text-slate-400 mt-0.5">{records.length} records · auto-saved from every prediction run</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 flex items-center gap-3 border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={load} className="btn-secondary text-xs ml-auto">Retry</button>
        </div>
      )}

      {records.length === 0 && !error ? (
        <div className="glass-card p-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-base font-semibold text-slate-400">No predictions yet</p>
          <p className="text-sm text-slate-600 text-center max-w-xs">
            Run a placement prediction to see your history here. Every submission is auto-saved.
          </p>
          <a href="/prediction" className="btn-primary text-sm px-6">Run Prediction</a>
        </div>
      ) : (
        <ChartCard title="All Predictions" subtitle="Click any row to see full details">
          <div className="space-y-2">
            {records.map((r, i) => (
              <div key={r.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 hover:border-indigo-500/20 cursor-pointer transition-all duration-200 group"
                onClick={() => setSelected(r)}
              >
                {/* Rank */}
                <span className="text-xs font-bold text-slate-600 w-5 flex-shrink-0">#{i + 1}</span>

                {/* Score Ring */}
                <ScoreRing score={r.prediction_score} size={48} />

                {/* Status + Rec */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-slate-600">CGPA {r.cgpa}</span>
                    <span className="text-xs text-slate-600">{r.internships} intern · {r.projects} proj · {r.leetcode_solved} LC</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{r.recommendation}</p>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  )
}
