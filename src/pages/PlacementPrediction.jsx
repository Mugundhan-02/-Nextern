import React, { useState } from 'react'
import {
  Brain, CheckCircle2, AlertTriangle, Loader2,
  GraduationCap, Wifi, WifiOff, Lightbulb, XCircle,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import { usePrediction } from '../hooks/usePrediction'
import {
  degreePrograms,
  specializationsByDegree,
  careerInterestsByDegree,
  companyPoolByDegree,
} from '../data/dummyData'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────────
// Company brand map — enriches the bare API response (company name,
// role, confidence, package) with a logo letter and brand colour so
// the existing card UI can render identically.
// ─────────────────────────────────────────────────────────────────
const COMPANY_BRAND = {
  'Google':          { logo: 'G', color: '#4285F4' },
  'Microsoft':       { logo: 'M', color: '#00A4EF' },
  'Amazon':          { logo: 'A', color: '#FF9900' },
  'Goldman Sachs':   { logo: 'G', color: '#0A6EBD' },
  'Razorpay':        { logo: 'R', color: '#3395FF' },
  'Zoho':            { logo: 'Z', color: '#E42527' },
  'Wipro':           { logo: 'W', color: '#8b5cf6' },
  'Infosys':         { logo: 'I', color: '#007CC3' },
  'TCS':             { logo: 'T', color: '#002244' },
  'Cognizant':       { logo: 'C', color: '#1363DF' },
  'HDFC Bank':       { logo: 'H', color: '#004C97' },
  'Deloitte':        { logo: 'D', color: '#00B300' },
  'KPMG':            { logo: 'K', color: '#00338D' },
  'PwC':             { logo: 'P', color: '#D04A02' },
  'Axis Bank':       { logo: 'A', color: '#97144D' },
  'BCG':             { logo: 'B', color: '#006600' },
  'McKinsey':        { logo: 'M', color: '#0047AB' },
  'HUL':             { logo: 'H', color: '#005799' },
  'Swiggy':          { logo: 'S', color: '#FC8019' },
  'Flipkart':        { logo: 'F', color: '#F7A12A' },
  'Freshworks':      { logo: 'F', color: '#00B8A9' },
  'Mu Sigma':        { logo: 'M', color: '#0076C0' },
  'Fractal AI':      { logo: 'F', color: '#5A5EF0' },
  'Zepto':           { logo: 'Z', color: '#8b5cf6' },
  'Nielsen':         { logo: 'N', color: '#E4002B' },
  'ICICI Bank':      { logo: 'I', color: '#F46F20' },
  'Marico':          { logo: 'M', color: '#E63329' },
  'Tech Mahindra':   { logo: 'T', color: '#00A0B0' },
  'Accenture':       { logo: 'A', color: '#A100FF' },
  'Capgemini':       { logo: 'C', color: '#0070AD' },
  'Infosys BPM':     { logo: 'I', color: '#007CC3' },
  'ISRO':            { logo: 'I', color: '#f97316' },
}

function getBrand(companyName) {
  return COMPANY_BRAND[companyName] || {
    logo: companyName.charAt(0).toUpperCase(),
    color: '#6366f1',
  }
}

// ─────────────────────────────────────────────────────────────────
// Initial form state
// ─────────────────────────────────────────────────────────────────
const initialForm = {
  degree:         'BE/BTech',
  specialization: '',
  careerInterests: [],
  cgpa:           '',
  skills:         '',
  projects:       '2',
  internships:    '1',
  backlogs:       '0',
  communication:  'Good',
  leetcode:       '',
}

// ─────────────────────────────────────────────────────────────────
// Sub-components (kept in this file for colocation)
// ─────────────────────────────────────────────────────────────────

/** Animated SVG probability ring */
function MatchMeter({ score }) {
  const radius       = 54
  const circumference = 2 * Math.PI * radius
  const offset       = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#6366f1' :
    score >= 40 ? '#f59e0b' : '#ef4444'
  const label =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good'      :
    score >= 40 ? 'Fair'      : 'Low'

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <svg className="absolute" width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: 'stroke-dashoffset 1.2s ease-out',
          }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-3xl font-bold text-white">{score}%</p>
        <p className="text-xs font-semibold" style={{ color }}>{label}</p>
      </div>
    </div>
  )
}

/** Multi-select pill toggle for career interests */
function InterestPills({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150',
              active
                ? 'bg-indigo-600/40 border-indigo-500/60 text-indigo-200'
                : 'bg-white/5 border-white/12 text-slate-400 hover:border-white/25 hover:text-slate-200'
            )}
          >
            {active && <span className="mr-1">✓</span>}
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Error banner — shown when the API call fails.
 * Distinguishes "server offline" from validation/other errors.
 */
function ErrorBanner({ message, onDismiss }) {
  const isOffline = message.toLowerCase().includes('cannot reach') ||
                    message.toLowerCase().includes('fastapi')

  return (
    <div className={clsx(
      'flex items-start gap-3 p-4 rounded-xl border',
      isOffline
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-amber-500/10 border-amber-500/30'
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {isOffline
          ? <WifiOff className="w-4 h-4 text-red-400" />
          : <AlertTriangle className="w-4 h-4 text-amber-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx(
          'text-sm font-semibold mb-1',
          isOffline ? 'text-red-300' : 'text-amber-300'
        )}>
          {isOffline ? 'Backend Offline' : 'Prediction Error'}
        </p>
        <p className="text-xs text-slate-400 whitespace-pre-line">{message}</p>
        {isOffline && (
          <div className="mt-2 p-2 rounded-lg bg-black/20 font-mono text-xs text-slate-400">
            <p className="text-slate-500 mb-0.5"># Start the backend:</p>
            <p>cd backend</p>
            <p>python main.py</p>
          </div>
        )}
      </div>
      <button onClick={onDismiss}
        className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────
export default function PlacementPrediction() {
  const [form, setForm]   = useState(initialForm)
  const { state, predict, reset } = usePrediction()

  // Derived convenience flags
  const isLoading = state.status === 'loading'
  const hasResult = state.status === 'success'
  const hasError  = state.status === 'error'

  // ── Form handlers ────────────────────────────────────────────────
  const handleDegreeChange = (e) => {
    setForm({ ...form, degree: e.target.value, specialization: '', careerInterests: [] })
    reset()
  }
  const handleChange   = (e)   => setForm({ ...form, [e.target.name]: e.target.value })
  const toggleInterest = (val) => setForm((prev) => ({
    ...prev,
    careerInterests: prev.careerInterests.includes(val)
      ? prev.careerInterests.filter((i) => i !== val)
      : [...prev.careerInterests, val],
  }))

  const handlePredict = () => predict(form)   // delegate to hook → API
  const handleReset   = () => { reset(); setForm(initialForm) }

  // ── Derived from state ───────────────────────────────────────────
  const result          = state.result                         // PredictResponse | null
  const score           = result?.probability ?? 0
  const apiCompanies    = result?.top_companies ?? []          // from backend
  const localCompanies  = companyPoolByDegree[form.degree] ?? [] // fallback

  // Merge API companies with brand info; fall back to local pool if API returns nothing
  const displayCompanies = apiCompanies.length > 0
    ? apiCompanies.map((c, i) => ({ ...c, id: i, ...getBrand(c.company) }))
    : localCompanies.slice().sort((a, b) => b.confidence - a.confidence)

  const specializations = specializationsByDegree[form.degree] ?? []
  const careerOptions   = careerInterestsByDegree[form.degree] ?? []

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL — Student Profile Form
        ══════════════════════════════════════════════════════════ */}
        <ChartCard
          title="Student Profile"
          subtitle="Fill in your academic details for AI prediction"
          className="xl:col-span-2"
        >
          <div className="space-y-4">

            {/* Degree Program */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                Degree Program <span className="text-red-400">*</span>
              </label>
              <select name="degree" value={form.degree}
                onChange={handleDegreeChange} className="select-field">
                {degreePrograms.map((d) => (
                  <option key={d.value} value={d.value} className="bg-[#141c35]">{d.label}</option>
                ))}
              </select>
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Specialization / Stream
              </label>
              <select name="specialization" value={form.specialization}
                onChange={handleChange} className="select-field">
                <option value="" className="bg-[#141c35]">— Select Specialization —</option>
                {specializations.map((s) => (
                  <option key={s} value={s} className="bg-[#141c35]">{s}</option>
                ))}
              </select>
            </div>

            {/* Career Interests */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Career Interests{' '}
                <span className="text-slate-500 font-normal">(select all that apply)</span>
              </label>
              <InterestPills
                options={careerOptions}
                selected={form.careerInterests}
                onToggle={toggleInterest}
              />
            </div>

            <div className="border-t border-white/8 pt-3" />

            {/* CGPA + Communication */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  CGPA <span className="text-red-400">*</span>
                </label>
                <input name="cgpa" type="number" step="0.1" min="0" max="10"
                  placeholder="e.g. 8.4" value={form.cgpa}
                  onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Communication</label>
                <select name="communication" value={form.communication}
                  onChange={handleChange} className="select-field">
                  {['Poor', 'Average', 'Good', 'Excellent'].map((v) => (
                    <option key={v} value={v} className="bg-[#141c35]">{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Key Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Key Skills
              </label>
              <input name="skills" placeholder="Python, React, DSA, Excel..."
                value={form.skills} onChange={handleChange} className="input-field" />
            </div>

            {/* Projects / Internships / Backlogs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'projects',    label: 'Projects',    opts: ['0','1','2','3','4','5+'] },
                { name: 'internships', label: 'Internships', opts: ['0','1','2','3+'] },
                { name: 'backlogs',    label: 'Backlogs',    opts: ['0','1','2','3+'] },
              ].map(({ name, label, opts }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
                  <select name={name} value={form[name]}
                    onChange={handleChange} className="select-field">
                    {opts.map((v) => (
                      <option key={v} value={v} className="bg-[#141c35]">{v}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* LeetCode — tech degrees only */}
            {['BE/BTech', 'BCA', 'BSc CS', 'BSc DS', 'MCA'].includes(form.degree) && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  LeetCode Solved
                </label>
                <input name="leetcode" type="number" placeholder="e.g. 250"
                  value={form.leetcode} onChange={handleChange} className="input-field" />
              </div>
            )}

            {/* Error banner (inline, above button) */}
            {hasError && (
              <ErrorBanner message={state.error} onDismiss={reset} />
            )}

            {/* Predict button */}
            <button
              onClick={handlePredict}
              disabled={isLoading || !form.cgpa}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                isLoading || !form.cgpa
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                  : 'btn-primary'
              )}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting to AI Backend...</>
              ) : (
                <><Brain className="w-4 h-4" /> Predict Placement Probability</>
              )}
            </button>

            {hasResult && (
              <button onClick={handleReset} className="w-full btn-secondary text-center">
                Reset
              </button>
            )}

            {/* Backend status indicator */}
            <div className="flex items-center justify-center gap-1.5">
              {hasError && state.error?.includes('Cannot reach') ? (
                <><WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400">Backend offline</span></>
              ) : (
                <><Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-slate-500">
                    API: <span className="text-emerald-400">127.0.0.1:8000</span>
                  </span></>
              )}
            </div>

          </div>
        </ChartCard>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL — Results or Empty State
        ══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-3 space-y-4">
          {hasResult ? (
            <>
              {/* ── Score Card ───────────────────────────────────── */}
              <ChartCard
                title="Placement Probability"
                subtitle={`AI result for ${form.degree}${form.specialization ? ` — ${form.specialization}` : ''}`}
                action={
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <Wifi className="w-3 h-3" /> Live from API
                  </span>
                }
              >
                <div className="flex items-center gap-8">
                  <MatchMeter score={score} />
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Overall Readiness',    pct: score,                  gradient: 'from-indigo-500 to-purple-500' },
                      { label: 'Technical Skills',     pct: Math.min(score + 5, 99), gradient: 'from-cyan-500 to-blue-500' },
                      { label: 'Profile Strength',     pct: Math.max(score - 8, 10), gradient: 'from-emerald-500 to-teal-500' },
                    ].map(({ label, pct, gradient }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-slate-400">{label}</span>
                          <span className="text-xs font-bold text-white">{pct}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className={`progress-fill bg-gradient-to-r ${gradient}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}

                    {/* ── Placement Status (from API) ────────────── */}
                    <div className={clsx(
                      'flex items-start gap-2 p-3 rounded-lg border',
                      score >= 70
                        ? 'bg-emerald-500/10 border-emerald-500/25'
                        : 'bg-amber-500/10 border-amber-500/25'
                    )}>
                      {score >= 70
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className={clsx(
                          'text-xs font-bold mb-0.5',
                          score >= 70 ? 'text-emerald-300' : 'text-amber-300'
                        )}>
                          {result.status}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {result.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* ── Career Interests ─────────────────────────── */}
                    {form.careerInterests.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Targeting</p>
                        <div className="flex flex-wrap gap-1.5">
                          {form.careerInterests.map((ci) => (
                            <span key={ci} className="badge badge-purple">{ci}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ChartCard>

              {/* ── Skill Gaps (from API) ────────────────────────── */}
              {result.skill_gaps?.length > 0 && (
                <ChartCard
                  title="Skill Gaps Detected"
                  subtitle="Skills identified as missing or below the industry benchmark"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-2">
                      {result.skill_gaps.map((gap) => (
                        <span key={gap}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                          ⚠ {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </ChartCard>
              )}

              {/* ── Company Matches ───────────────────────────────── */}
              <ChartCard
                title="Best Company Matches"
                subtitle={
                  apiCompanies.length > 0
                    ? `${apiCompanies.length} matches ranked by AI score`
                    : `Top opportunities for ${form.degree} graduates`
                }
              >
                <div className="space-y-2.5">
                  {displayCompanies.map((c, i) => (
                    <div key={c.id ?? i}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all duration-200 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 border"
                        style={{
                          backgroundColor: c.color + '30',
                          borderColor:     c.color + '50',
                          color:           c.color,
                        }}
                      >
                        {c.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{c.company}</p>
                          {i === 0 && <span className="badge badge-indigo">Best Match</span>}
                        </div>
                        <p className="text-xs text-slate-400">{c.role} · {c.package}</p>
                        {/* Show criteria tags if from local pool, nothing if from API */}
                        {c.criteria && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {c.criteria.map((skill) => (
                              <span key={skill}
                                className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/8">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={clsx(
                          'text-sm font-bold',
                          c.confidence >= 85 ? 'text-emerald-400' :
                          c.confidence >= 70 ? 'text-indigo-400' : 'text-amber-400'
                        )}>
                          {c.confidence}%
                        </p>
                        <div className="w-16 progress-bar mt-1">
                          <div
                            className={clsx(
                              'progress-fill',
                              c.confidence >= 85 ? 'bg-emerald-400' :
                              c.confidence >= 70 ? 'bg-indigo-400' : 'bg-amber-400'
                            )}
                            style={{ width: `${c.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          ) : (
            /* ── Empty / Loading State ─────────────────────────── */
            <div className="glass-card h-full min-h-80 flex flex-col items-center justify-center gap-4 text-center p-8">
              {isLoading ? (
                /* Loading animation */
                <>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/20 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-indigo-300 animate-spin" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Analysing Profile...</h3>
                    <p className="text-sm text-slate-400">Sending data to FastAPI backend</p>
                    <p className="text-xs text-indigo-400 font-mono mt-1">POST /api/v1/predict</p>
                  </div>
                  {/* Animated loading steps */}
                  <div className="space-y-2 w-full max-w-xs">
                    {[
                      'Computing placement score…',
                      'Matching companies by profile…',
                      'Identifying skill gaps…',
                    ].map((step, i) => (
                      <div key={step} className="flex items-center gap-2"
                        style={{ animationDelay: `${i * 0.3}s` }}>
                        <Loader2 className="w-3 h-3 text-indigo-400 animate-spin flex-shrink-0" />
                        <span className="text-xs text-slate-400">{step}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Idle empty state */
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/20 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">AI Placement Predictor</h3>
                    <p className="text-sm text-slate-400 max-w-xs">
                      Select your <span className="text-indigo-400 font-semibold">degree</span>, fill in your profile,
                      then click <span className="text-indigo-400 font-semibold">Predict</span> to call the live FastAPI backend.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {['8 Degree Programs', 'Live FastAPI Backend', 'Company Matching'].map((tag) => (
                      <span key={tag} className="badge badge-indigo">{tag}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2 w-full max-w-sm">
                    {degreePrograms.map((d) => (
                      <button key={d.value}
                        onClick={() => { setForm({ ...initialForm, degree: d.value }); reset() }}
                        className={clsx(
                          'px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                          form.degree === d.value
                            ? 'bg-indigo-600/40 border-indigo-500/60 text-indigo-200'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                        )}
                      >
                        {d.value}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
