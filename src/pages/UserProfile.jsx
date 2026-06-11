import React, { useState, useEffect } from 'react'
import {
  Mail, TrendingUp, FileText, Award, Edit3,
  Check, X, Star, Calendar, Zap, GraduationCap, Layers,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import SearchableSelect from '../components/SearchableSelect'
import { useAuth } from '../context/AuthContext'
import {
  DEGREE_GROUPS,
  DEGREE_LIST,
  SPECIALIZATION_GROUPS,
  SPECIALIZATIONS,
  parseLegacyDegree,
} from '../data/degreeData'
import { formatFullDatetime, formatShortDate } from '../utils/formatDate'

const API = 'http://127.0.0.1:8000/api/v1'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value ?? '—'}</p>
        <p className="text-xs font-semibold text-slate-300 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function strengthClass(score) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-indigo-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

// ── Field label + input wrapper ───────────────────────────────────────────────
function FieldLabel({ children, hint }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
      {hint && <span className="ml-2 normal-case font-normal text-indigo-400/80">{hint}</span>}
    </label>
  )
}

export default function UserProfile() {
  const { authHeaders } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [loadErr, setLoadErr] = useState('')

  // Edit form state — degree and specialization are always separate fields
  const [form, setForm] = useState({ full_name: '', degree_program: '', specialization: '' })

  // ── Load profile ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true); setLoadErr('')
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${API}/user/profile`,  { headers: authHeaders() }),
        fetch(`${API}/history/stats`, { headers: authHeaders() }),
      ])
      const p = await pRes.json()
      const s = await sRes.json()
      setProfile(p)
      setStats(s)

      // Migrate legacy combined DB values (e.g. "BTech CSE") into clean fields
      const { degree, spec } = parseLegacyDegree(p.degree_program, p.specialization)
      setForm({ full_name: p.full_name || '', degree_program: degree, specialization: spec })
    } catch {
      setLoadErr('Could not load profile. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  // ── Cancel edit — restore form from current profile ───────────────────────
  const cancelEdit = () => {
    if (profile) {
      const { degree, spec } = parseLegacyDegree(profile.degree_program, profile.specialization)
      setForm({ full_name: profile.full_name || '', degree_program: degree, specialization: spec })
    }
    setEditing(false)
    setSaveErr('')
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.full_name.trim()) { setSaveErr('Full name is required.'); return }
    if (!form.degree_program)   { setSaveErr('Please select a degree program.'); return }
    setSaving(true); setSaveErr('')
    try {
      const res = await fetch(`${API}/user/profile`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({
          full_name:      form.full_name,
          degree_program: form.degree_program,
          specialization: form.specialization,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const p = await res.json()
      setProfile(p)
      setEditing(false)
    } catch {
      setSaveErr('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading profile…</p>
      </div>
    </div>
  )

  if (loadErr) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="glass-card p-6 text-center max-w-sm">
        <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-300 font-semibold">{loadErr}</p>
        <button onClick={load} className="btn-primary mt-4 text-xs">Retry</button>
      </div>
    </div>
  )

  const initials = (profile?.full_name || 'S')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // Display values — use migrated form values for consistency
  const { degree: displayDegree, spec: displaySpec } = parseLegacyDegree(
    profile?.degree_program, profile?.specialization
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* ── Profile Card ──────────────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-lg flex-shrink-0">
            {initials}
          </div>

          {/* View mode */}
          {!editing && (
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white">{profile?.full_name}</h2>

              {/* Degree + Specialization shown as two separate pill-badges */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {displayDegree && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-xs font-semibold text-indigo-300">
                    <GraduationCap className="w-3 h-3" />
                    {displayDegree}
                  </span>
                )}
                {displaySpec && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/25 text-xs font-semibold text-purple-300">
                    <Layers className="w-3 h-3" />
                    {displaySpec}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {profile?.email}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Member since {profile?.created_at
                  ? formatShortDate(profile.created_at)
                  : '—'}
              </p>
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div className="flex-1 min-w-0 space-y-4">

              {/* Save error */}
              {saveErr && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300">
                  <X className="w-3.5 h-3.5 flex-shrink-0" /> {saveErr}
                </div>
              )}

              {/* Full name */}
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your full name"
                  className="input-field"
                />
              </div>

              {/* Degree program — type only */}
              <div>
                <FieldLabel hint="select the degree type">Degree Program</FieldLabel>
                <SearchableSelect
                  id="profile-degree"
                  groups={DEGREE_GROUPS}
                  options={DEGREE_LIST}
                  value={form.degree_program}
                  onChange={deg => setForm(f => ({ ...f, degree_program: deg }))}
                  placeholder="e.g. BTech, BCA, MBA…"
                />
              </div>

              {/* Specialization — independent subject area */}
              <div>
                <FieldLabel hint="the subject you study">Specialization</FieldLabel>
                <SearchableSelect
                  id="profile-spec"
                  groups={SPECIALIZATION_GROUPS}
                  options={SPECIALIZATIONS}
                  value={form.specialization}
                  onChange={spec => setForm(f => ({ ...f, specialization: spec }))}
                  placeholder="e.g. Data Science, AI & ML…"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-primary flex items-center gap-1.5 text-xs px-4 py-2 disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn-secondary flex items-center gap-1.5 text-xs px-4 py-2"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Edit button (view mode only) */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-1.5 text-xs flex-shrink-0 self-start"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Predictions Run"    value={stats?.total_predictions}     color="bg-gradient-to-br from-indigo-500 to-purple-600" />
        <StatCard icon={FileText}   label="Resumes Analyzed"   value={stats?.total_resume_analyses} color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatCard icon={Star}       label="Best Prediction"    value={stats?.best_prediction_score != null ? `${stats.best_prediction_score}%` : '—'} color="bg-gradient-to-br from-emerald-500 to-green-600" />
        <StatCard icon={Award}      label="Best ATS Score"     value={stats?.best_ats_score != null ? `${stats.best_ats_score}/100` : '—'} color="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Latest Prediction */}
        <ChartCard title="Latest Prediction" subtitle="Most recent placement prediction result">
          {stats?.latest_prediction ? (() => {
            const p = stats.latest_prediction
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-black ${strengthClass(p.prediction_score)}`}>{p.prediction_score}%</p>
                    <p className="text-sm text-slate-300 font-semibold mt-0.5">{p.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">CGPA</p>
                    <p className="text-lg font-bold text-white">{p.cgpa}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${p.prediction_score}%`, transition: 'width 1s ease' }} />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{p.recommendation}</p>
                <p className="text-xs text-slate-600">{formatFullDatetime(p.created_at)}</p>
              </div>
            )
          })() : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Zap className="w-8 h-8 text-slate-600" />
              <p className="text-sm text-slate-500">No predictions yet</p>
              <a href="/prediction" className="text-xs text-indigo-400 hover:underline">Run your first prediction →</a>
            </div>
          )}
        </ChartCard>

        {/* Latest Resume */}
        <ChartCard title="Latest Resume Analysis" subtitle="Most recent ATS scoring result">
          {stats?.latest_resume ? (() => {
            const r = stats.latest_resume
            const scoreColor =
              r.ats_score >= 80 ? 'text-emerald-400' :
              r.ats_score >= 60 ? 'text-indigo-400' :
              r.ats_score >= 40 ? 'text-amber-400' : 'text-red-400'
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-black ${scoreColor}`}>{r.ats_score}<span className="text-lg text-slate-500">/100</span></p>
                    <p className="text-sm text-slate-300 font-semibold mt-0.5">{r.strength_level}</p>
                  </div>
                  <span className="badge badge-indigo text-xs truncate max-w-[120px]">{r.resume_filename}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${r.ats_score}%`, transition: 'width 1s ease' }} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(r.extracted_skills || []).slice(0, 6).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">{s}</span>
                  ))}
                  {(r.extracted_skills || []).length > 6 && (
                    <span className="text-xs text-slate-500">+{r.extracted_skills.length - 6} more</span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{formatFullDatetime(r.created_at)}</p>
              </div>
            )
          })() : (
            <div className="flex flex-col items-center gap-2 py-8">
              <FileText className="w-8 h-8 text-slate-600" />
              <p className="text-sm text-slate-500">No resume analyzed yet</p>
              <a href="/resume" className="text-xs text-indigo-400 hover:underline">Analyze your resume →</a>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
