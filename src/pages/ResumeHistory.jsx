import React, { useState, useEffect } from 'react'
import {
  FileText, RefreshCw, ChevronRight, X,
  CheckCircle2, AlertCircle, Award, Target
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import { useAuth } from '../context/AuthContext'

const API = 'http://127.0.0.1:8000/api/v1'

// ── ATS Score Arc ─────────────────────────────────────────────────────────────
function ATSArc({ score, size = 56 }) {
  const r      = (size / 2) - 5
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color  = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{score}</span>
      </div>
    </div>
  )
}

// ── Strength Badge ────────────────────────────────────────────────────────────
function StrengthBadge({ level }) {
  const cls =
    level === 'Excellent' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' :
    level === 'Good'      ? 'bg-indigo-500/15  text-indigo-300  border-indigo-500/25'  :
    level === 'Fair'      ? 'bg-amber-500/15   text-amber-300   border-amber-500/25'   :
                            'bg-red-500/15     text-red-300     border-red-500/25'
  return <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${cls}`}>{level}</span>
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ record, onClose }) {
  if (!record) return null
  const scoreColor =
    record.ats_score >= 80 ? 'text-emerald-400' :
    record.ats_score >= 60 ? 'text-indigo-400'  :
    record.ats_score >= 40 ? 'text-amber-400'   : 'text-red-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="glass-card p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white">Resume Analysis Detail</h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> {record.resume_filename}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ATS Score */}
        <div className="flex items-center gap-5 mb-5 p-4 rounded-2xl bg-white/4 border border-white/8">
          <ATSArc score={record.ats_score} size={80} />
          <div>
            <p className={`text-3xl font-black ${scoreColor}`}>{record.ats_score}<span className="text-lg text-slate-500">/100</span></p>
            <StrengthBadge level={record.strength_level} />
            <p className="text-xs text-slate-500 mt-1">{record.word_count} words in resume</p>
          </div>
        </div>

        {/* Sections */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { label: 'Education',   present: record.has_education  },
            { label: 'Experience',  present: record.has_experience },
            { label: 'Projects',    present: record.has_projects   },
          ].map(({ label, present }) => (
            <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold
              ${present ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {present ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {label}
            </div>
          ))}
        </div>

        {/* Skills */}
        {record.extracted_skills?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
              Extracted Skills ({record.extracted_skills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {record.extracted_skills.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {record.missing_skills?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Missing High-Value Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {record.missing_skills.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 flex items-center gap-1">
                  <X className="w-2.5 h-2.5" /> {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {record.suggestions?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Improvement Suggestions</p>
            <div className="space-y-2">
              {record.suggestions.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/4 border border-white/8">
                  <span className="text-xs font-bold text-indigo-400 flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-600 mt-4">
          Analyzed: {new Date(record.created_at).toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ResumeHistory() {
  const { authHeaders }         = useAuth()
  const [records,  setRecords]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/history/resumes?limit=50`, { headers: authHeaders() })
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
        <p className="text-sm text-slate-400">Loading resume history…</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {selected && <DetailDrawer record={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Resume Analysis History</h2>
          <p className="text-xs text-slate-400 mt-0.5">{records.length} analyses · auto-saved after every upload</p>
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
            <FileText className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-base font-semibold text-slate-400">No resume analyses yet</p>
          <p className="text-sm text-slate-600 text-center max-w-xs">
            Upload a PDF or DOCX resume to see your ATS analysis history here.
          </p>
          <a href="/resume" className="btn-primary text-sm px-6">Analyze Resume</a>
        </div>
      ) : (
        <ChartCard title="All Resume Analyses" subtitle="Click any row to see full details and suggestions">
          <div className="space-y-2">
            {records.map((r, i) => (
              <div key={r.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 hover:border-indigo-500/20 cursor-pointer transition-all duration-200 group"
                onClick={() => setSelected(r)}
              >
                <span className="text-xs font-bold text-slate-600 w-5 flex-shrink-0">#{i + 1}</span>

                <ATSArc score={r.ats_score} size={48} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StrengthBadge level={r.strength_level} />
                    <span className="text-xs text-slate-500 truncate max-w-[160px]">{r.resume_filename}</span>
                    <span className="text-xs text-slate-600">{r.extracted_skills?.length ?? 0} skills found</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {[
                      { ok: r.has_education,  label: 'Edu' },
                      { ok: r.has_experience, label: 'Exp' },
                      { ok: r.has_projects,   label: 'Proj' },
                    ].map(({ ok, label }) => (
                      <span key={label} className={`text-xs flex items-center gap-0.5 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ok ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />} {label}
                      </span>
                    ))}
                  </div>
                </div>

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
