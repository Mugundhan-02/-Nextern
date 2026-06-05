import React, { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle2, X, Star, Award,
  AlertCircle, Zap, TrendingUp, Target, BookOpen,
  ChevronRight, RefreshCw, Layers, Shield, Brain
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import clsx from 'clsx'

// ---------------------------------------------------------------------------
// ATS Score Animated Ring
// ---------------------------------------------------------------------------
function ATSRing({ score, animate }) {
  const radius = 54
  const circ   = 2 * Math.PI * radius
  const offset = circ * (1 - score / 100)

  const { color, glow, label, bg } =
    score >= 80 ? { color: '#10b981', glow: '#10b98155', label: 'Excellent', bg: 'from-emerald-600/30 to-emerald-500/10' }
    : score >= 60 ? { color: '#6366f1', glow: '#6366f155', label: 'Good',      bg: 'from-indigo-600/30 to-indigo-500/10' }
    : score >= 40 ? { color: '#f59e0b', glow: '#f59e0b55', label: 'Fair',      bg: 'from-amber-600/30 to-amber-500/10'   }
    :               { color: '#ef4444', glow: '#ef444455', label: 'Weak',      bg: 'from-red-600/30 to-red-500/10'      }

  return (
    <div className={`relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br ${bg} border border-white/10`}>
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={animate ? offset : circ}
            style={{
              filter: `drop-shadow(0 0 12px ${glow})`,
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{score}</span>
          <span className="text-xs text-slate-400 font-medium mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-base font-bold mt-3" style={{ color }}>{label} ATS Score</p>
      <p className="text-xs text-slate-400 text-center mt-1">
        Your resume matches {score}% of industry ATS criteria
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Animated Stat Bar
// ---------------------------------------------------------------------------
function StatBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-bold text-white">{value}<span className="text-slate-500">/{max}</span></span>
      </div>
      <div className="h-2 rounded-full bg-white/6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skill Badge
// ---------------------------------------------------------------------------
const BADGE_COLORS = [
  'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'bg-cyan-500/15   text-cyan-300   border-cyan-500/25',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'bg-amber-500/15  text-amber-300  border-amber-500/25',
  'bg-pink-500/15   text-pink-300   border-pink-500/25',
]

function SkillBadge({ skill, index, missing = false }) {
  const cls = missing
    ? 'bg-red-500/10 text-red-300 border-red-500/20'
    : BADGE_COLORS[index % BADGE_COLORS.length]
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium
        transition-all duration-200 hover:scale-105 cursor-default ${cls}`}
    >
      {missing && <X className="w-2.5 h-2.5" />}
      {skill}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Section Check Pill
// ---------------------------------------------------------------------------
function SectionPill({ label, present }) {
  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200',
      present
        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
        : 'bg-red-500/10 border-red-500/20 text-red-400'
    )}>
      {present
        ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        : <X className="w-3.5 h-3.5 flex-shrink-0" />}
      {label}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Suggestion Card
// ---------------------------------------------------------------------------
function SuggestionCard({ text, index }) {
  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-xl bg-white/4 border border-white/8
        hover:bg-white/7 hover:border-indigo-500/20 transition-all duration-200"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-indigo-400">{index + 1}</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ResumeUpload() {
  const [state, setState] = useState('idle') // idle | uploading | done | error
  const [progress, setProgress]   = useState(0)
  const [filename, setFilename]   = useState('')
  const [dragging, setDragging]   = useState(false)
  const [result,   setResult]     = useState(null)
  const [errMsg,   setErrMsg]     = useState('')
  const [animate,  setAnimate]    = useState(false)
  const fileInputRef = useRef()

  // ── Upload & analyze ──────────────────────────────────────────────────────
  const uploadAndAnalyze = async (file) => {
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setErrMsg('Only PDF and DOCX files are supported.')
      setState('error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrMsg(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`)
      setState('error')
      return
    }

    setFilename(file.name)
    setState('uploading')
    setProgress(0)

    // Simulate visual progress while real upload happens
    let p = 0
    const tick = setInterval(() => {
      p += Math.random() * 12 + 3
      if (p >= 88) { clearInterval(tick); p = 88 }
      setProgress(Math.min(Math.round(p), 88))
    }, 150)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // FIX (Bug #2): include JWT so the analysis is saved under the logged-in
      // user, not the legacy default user.  Only Authorization is added here —
      // do NOT set Content-Type for multipart; the browser sets it with the boundary.
      const token = localStorage.getItem('skillai_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await fetch('http://127.0.0.1:8000/api/v1/resume/analyze', {
        method: 'POST',
        headers,
        body: formData,
      })

      clearInterval(tick)
      setProgress(100)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Server error ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
      setTimeout(() => { setState('done'); setAnimate(true) }, 400)

    } catch (err) {
      clearInterval(tick)
      setErrMsg(err.message || 'Upload failed. Is the backend running?')
      setState('error')
    }
  }

  const handleFile  = (file) => uploadAndAnalyze(file)
  const handleDrop  = useCallback((e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }, [])
  const handleReset = () => { setState('idle'); setResult(null); setFilename(''); setProgress(0); setErrMsg(''); setAnimate(false) }

  // ── IDLE / UPLOADING state ────────────────────────────────────────────────
  if (state !== 'done') return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-4">
        <ChartCard title="Upload Your Resume" subtitle="AI-powered ATS scoring · Skill extraction · Gap analysis">

          {/* Drop Zone */}
          <div
            className={clsx(
              'drop-zone border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-5 cursor-pointer transition-all duration-300',
              state === 'uploading' ? 'pointer-events-none opacity-70' : '',
              dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/15 hover:border-indigo-500/50 hover:bg-white/3'
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => state !== 'uploading' && fileInputRef.current?.click()}
          >
            <div className={clsx(
              'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
              dragging ? 'bg-indigo-500/30 scale-110' : 'bg-white/5'
            )}>
              {state === 'uploading'
                ? <Zap className="w-9 h-9 text-indigo-400 animate-pulse" />
                : <Upload className={clsx('w-9 h-9 transition-colors', dragging ? 'text-indigo-300' : 'text-slate-400')} />
              }
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-white mb-1">
                {state === 'uploading' ? 'Analyzing your resume…' : dragging ? 'Drop it here!' : 'Drag & Drop your Resume'}
              </p>
              <p className="text-sm text-slate-400">
                {state === 'uploading'
                  ? 'AI is extracting skills and calculating ATS score'
                  : <>or <span className="text-indigo-400 font-semibold">browse files</span> from your computer</>}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap justify-center">
              {['AI Skill Extraction', 'ATS Score', 'Keyword Analysis', 'Gap Suggestions'].map(tag => (
                <span key={tag} className="badge badge-indigo">{tag}</span>
              ))}
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          {/* Progress Bar */}
          {state === 'uploading' && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{filename}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {progress < 90 ? 'Extracting text and detecting skills…' : 'Calculating ATS score…'}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-400 flex-shrink-0">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%`, boxShadow: '0 0 10px #6366f166' }}
                />
              </div>
              <div className="flex justify-center gap-4 text-xs text-slate-500">
                {['Parsing file', 'Detecting skills', 'Scoring ATS'].map((step, i) => (
                  <span key={step} className={clsx('flex items-center gap-1', progress > i * 33 && 'text-indigo-400')}>
                    <CheckCircle2 className="w-3 h-3" /> {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300">Upload Failed</p>
                <p className="text-xs text-slate-400 mt-1">{errMsg}</p>
              </div>
              <button onClick={handleReset} className="btn-secondary text-xs">Try Again</button>
            </div>
          )}
        </ChartCard>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Brain, label: 'AI Skill Detection',   sub: '100+ skill keywords' },
            { icon: Target, label: 'ATS Scoring',         sub: '5 weighted components' },
            { icon: Layers, label: 'Gap Analysis',        sub: 'Missing skill alerts'   },
            { icon: Shield, label: 'Format Check',        sub: 'Structure validation'   },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="glass-card p-4 flex flex-col items-center gap-2 text-center hover:border-indigo-500/20 transition-all duration-200">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <Icon className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xs font-bold text-white">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── RESULTS state ─────────────────────────────────────────────────────────
  const r = result
  const sb = r.score_breakdown

  return (
    <div className="p-6 space-y-5 animate-fade-in">

      {/* ── Top Bar ── */}
      <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/40 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white truncate max-w-xs">{filename}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Analysis complete</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{r.word_count} words · {r.extracted_skills.length} skills found</span>
            </div>
          </div>
        </div>
        <button onClick={handleReset} className="btn-secondary flex items-center gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Analyze Another
        </button>
      </div>

      {/* ── Row 1: ATS Ring + Score Breakdown + Sections ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ATS Ring */}
        <ATSRing score={r.ats_score} animate={animate} />

        {/* Score Breakdown */}
        <ChartCard title="Score Breakdown" subtitle="ATS scoring components">
          <div className="space-y-4">
            <StatBar label="Skills Coverage"    value={sb.skills}     max={35} color="#6366f1" />
            <StatBar label="Section Structure"  value={sb.sections}   max={25} color="#8b5cf6" />
            <StatBar label="Keyword Density"    value={sb.density}    max={20} color="#06b6d4" />
            <StatBar label="Contact Info"       value={sb.contact}    max={10} color="#10b981" />
            <StatBar label="Format & Length"    value={sb.formatting} max={10} color="#f59e0b" />
          </div>
        </ChartCard>

        {/* Section Checklist + Contact */}
        <ChartCard title="Resume Sections" subtitle="Required sections detected">
          <div className="space-y-2.5">
            <SectionPill label="Education"          present={r.has_education}  />
            <SectionPill label="Work / Internship"  present={r.has_experience} />
            <SectionPill label="Projects"           present={r.has_projects}   />
            <SectionPill label="Email Address"      present={r.has_contact.email}    />
            <SectionPill label="Phone Number"       present={r.has_contact.phone}    />
            <SectionPill label="LinkedIn Profile"   present={r.has_contact.linkedin} />
            <SectionPill label="GitHub Profile"     present={r.has_contact.github}   />
          </div>
        </ChartCard>
      </div>

      {/* ── Row 2: Extracted Skills + Missing Skills ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Extracted Skills */}
        <ChartCard
          title="Extracted Skills"
          subtitle={`${r.extracted_skills.length} skills detected across ${Object.keys(r.skill_categories).length} categories`}
        >
          {Object.entries(r.skill_categories).map(([cat, skills]) => (
            <div key={cat} className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <SkillBadge key={skill} skill={skill} index={i} />
                ))}
              </div>
            </div>
          ))}
          {r.extracted_skills.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">No recognizable skills detected. Try a text-based resume.</p>
          )}
        </ChartCard>

        {/* Missing Skills */}
        <ChartCard
          title="Missing High-Value Skills"
          subtitle="Skills frequently required by employers that are absent"
        >
          {r.missing_skills.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {r.missing_skills.map((skill, i) => (
                  <SkillBadge key={skill} skill={skill} index={i} missing />
                ))}
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Adding these skills to your resume (if you know them) can significantly improve
                    ATS match rate and recruiter visibility.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">Great coverage!</p>
              <p className="text-xs text-slate-500">You have most high-value skills covered.</p>
            </div>
          )}

          {/* Strength Badge */}
          <div className={clsx(
            'mt-4 p-4 rounded-2xl border text-center',
            r.strength_level === 'Excellent' ? 'bg-emerald-500/8 border-emerald-500/20' :
            r.strength_level === 'Good'      ? 'bg-indigo-500/8  border-indigo-500/20'  :
            r.strength_level === 'Fair'      ? 'bg-amber-500/8   border-amber-500/20'   :
                                               'bg-red-500/8     border-red-500/20'
          )}>
            <p className="text-xs text-slate-400 mb-1">Resume Strength</p>
            <p className={clsx(
              'text-xl font-black',
              r.strength_level === 'Excellent' ? 'text-emerald-300' :
              r.strength_level === 'Good'      ? 'text-indigo-300'  :
              r.strength_level === 'Fair'      ? 'text-amber-300'   : 'text-red-400'
            )}>{r.strength_level}</p>
            <p className="text-xs text-slate-500 mt-1">ATS Score: {r.ats_score}/100</p>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 3: Improvement Suggestions ── */}
      <ChartCard
        title="Improvement Suggestions"
        subtitle={`${r.suggestions.length} personalised tips to boost your ATS score`}
        action={<TrendingUp className="w-4 h-4 text-indigo-400" />}
      >
        {r.suggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {r.suggestions.map((tip, i) => (
              <SuggestionCard key={i} text={tip} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6">
            <Star className="w-8 h-8 text-amber-400" />
            <p className="text-sm font-semibold text-white">Outstanding Resume!</p>
            <p className="text-xs text-slate-500">No critical issues found. Tailor keywords to each job description.</p>
          </div>
        )}
      </ChartCard>

    </div>
  )
}
