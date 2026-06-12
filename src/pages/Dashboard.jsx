// src/pages/Dashboard.jsx  ── SkillAI Career Intelligence Dashboard
// =============================================================================
// SECTIONS (in order):
//   1. Hero / Welcome           — animated, personalized greeting
//   2. About SkillAI            — modern card-based explanation
//   3. Feature Showcase         — 4 hover-animated feature cards
//   4. How It Works             — 3-step timeline
//   5. Personal Career Stats    — REAL user data (ATS, prediction, profile)
//   6. Skill Gap Insights       — from actual resume analysis
//   7. AI Recommendations       — context-aware coaching tips
//   8. Recommended Internships  — live jobs from /api/v1/jobs
//
// Data sources:
//   GET /api/v1/history/stats  — latest ATS, prediction, counts
//   GET /api/v1/jobs           — internship cards (no auth needed)
//   user object from AuthContext — name, degree, specialization
// =============================================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  BrainCircuit, FileText, TrendingUp, Briefcase,
  Zap, Target, CheckCircle2, ArrowRight, Star,
  GraduationCap, Layers, ChevronRight, Sparkles,
  BookOpen, Award, AlertCircle, Loader2, ExternalLink,
  BarChart2, Shield, Lightbulb, Rocket,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = 'http://127.0.0.1:8000/api/v1'

// ── Helpers ──────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref  = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function ScoreRing({ value, max = 100, color = '#6366f1', size = 100 }) {
  const r = 38, cx = 50, cy = 50
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, Math.min(value ?? 0, max)) / max
  const dash = circ * pct
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
      />
    </svg>
  )
}

// ── Section 1: Hero ───────────────────────────────────────────────────────────
function HeroSection({ user }) {
  const first = user?.full_name?.split(' ')[0] || 'there'
  const hour  = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const pills = [
    { icon: BrainCircuit, label: 'AI-Powered',    color: 'text-indigo-400' },
    { icon: Target,       label: 'Career-Focused', color: 'text-purple-400' },
    { icon: Zap,          label: 'Real-Time Data', color: 'text-cyan-400'   },
  ]

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1225] via-[#0f1630] to-[#0a0e1a] border border-white/8 p-8 sm:p-12 mb-6">
      {/* Ambient glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          {/* Greeting pill */}
          <div className="anim-slide-up-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-indigo-300 font-medium">{greeting}, {first}!</span>
          </div>

          <h1 className="anim-slide-up-1 text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-3">
            Welcome to{' '}
            <span className="gradient-text-hero">SkillAI</span>
          </h1>

          <p className="anim-slide-up-2 text-lg sm:text-xl text-slate-300 font-medium mb-2">
            Your AI-Powered Placement Intelligence Platform
          </p>

          <p className="anim-slide-up-3 text-sm text-slate-500 max-w-xl mb-8 leading-relaxed">
            SkillAI combines Machine Learning, ATS Resume Analysis, and Career Intelligence
            to help you understand your placement readiness and land your dream role.
          </p>

          {/* Feature pills */}
          <div className="anim-slide-up-4 flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
            {pills.map(({ icon: Icon, label, color }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                <Icon size={13} className={color} />{label}
              </span>
            ))}
          </div>

          {/* CTA row */}
          <div className="anim-slide-up-5 flex flex-wrap justify-center lg:justify-start gap-3">
            <a href="/prediction" className="btn-primary flex items-center gap-2">
              <BrainCircuit size={16} /> Predict My Chances
            </a>
            <a href="/resume" className="btn-secondary flex items-center gap-2">
              <FileText size={16} /> Analyze Resume <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Floating icon cluster */}
        <div className="anim-slide-up-3 relative w-56 h-56 flex-shrink-0 hidden lg:flex items-center justify-center">
          <div className="anim-float absolute w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/40 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center shadow-glow-indigo">
            <BrainCircuit className="w-9 h-9 text-indigo-300" />
          </div>
          <div className="anim-float-slow absolute top-4 right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/25 flex items-center justify-center" style={{ animationDelay: '1s' }}>
            <FileText className="w-6 h-6 text-cyan-300" />
          </div>
          <div className="anim-float-slow absolute bottom-4 left-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-600/20 border border-emerald-500/25 flex items-center justify-center" style={{ animationDelay: '2s' }}>
            <TrendingUp className="w-6 h-6 text-emerald-300" />
          </div>
          <div className="anim-float absolute bottom-6 right-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600/30 to-orange-600/20 border border-amber-500/25 flex items-center justify-center" style={{ animationDelay: '0.5s' }}>
            <Briefcase className="w-5 h-5 text-amber-300" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 2: About ──────────────────────────────────────────────────────────
function AboutSection() {
  const [ref, visible] = useInView()
  const pillars = [
    { icon: BrainCircuit, title: 'Machine Learning',   desc: 'Placement predictions trained on real placement data and student profiles.',          color: 'from-indigo-600/25 to-indigo-600/5',  border: 'border-indigo-500/25', icon_c: 'text-indigo-400'  },
    { icon: FileText,     title: 'ATS Resume Scoring', desc: 'Parses and scores your resume against industry-standard ATS criteria.',              color: 'from-cyan-600/25 to-cyan-600/5',      border: 'border-cyan-500/25',   icon_c: 'text-cyan-400'    },
    { icon: Target,       title: 'Skill Gap Analysis', desc: 'Identifies missing competencies by comparing your profile to job requirements.',      color: 'from-purple-600/25 to-purple-600/5',  border: 'border-purple-500/25', icon_c: 'text-purple-400'  },
    { icon: Briefcase,    title: 'Career Intelligence', desc: 'Recommends live internships and jobs matched to your degree and specialization.',    color: 'from-emerald-600/25 to-emerald-600/5', border: 'border-emerald-500/25', icon_c: 'text-emerald-400' },
  ]
  return (
    <section ref={ref} className="mb-6">
      <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
          <h2 className="text-xl font-bold text-white">What is SkillAI?</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6 ml-4">
          An intelligent career platform built for students and freshers — not just another analytics dashboard.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {pillars.map(({ icon: Icon, title, desc, color, border, icon_c }, i) => (
          <div
            key={title}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} border ${border} p-5
                        hover:-translate-y-1 hover:shadow-card transition-all duration-300`}
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.55s ease ${0.08 * i + 0.1}s` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-5 h-5 ${icon_c}`} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Section 3: Feature Showcase ───────────────────────────────────────────────
function FeatureShowcase() {
  const [ref, visible] = useInView()
  const features = [
    {
      icon: BrainCircuit, title: 'Placement Prediction',
      desc: 'Our ML model evaluates your CGPA, skills, projects, internships, and communication to predict placement readiness with a percentage score.',
      href: '/prediction', cta: 'Run Prediction',
      gradient: 'from-indigo-600 to-purple-600',
      glow: 'rgba(99,102,241,0.3)',
      tags: ['ML Model', 'Instant Results', 'Skill-Based'],
    },
    {
      icon: FileText, title: 'Resume ATS Analysis',
      desc: 'Upload your resume and get an ATS compatibility score, extracted skills, section completeness analysis, and actionable improvement tips.',
      href: '/resume', cta: 'Analyze Resume',
      gradient: 'from-cyan-600 to-blue-600',
      glow: 'rgba(6,182,212,0.3)',
      tags: ['ATS Score', 'Skill Extraction', 'Section Check'],
    },
    {
      icon: Target, title: 'Skill Gap Analysis',
      desc: 'Compare your current skill set against your latest prediction and resume analysis to identify exactly what you need to improve.',
      href: '/prediction-history', cta: 'View Insights',
      gradient: 'from-purple-600 to-pink-600',
      glow: 'rgba(147,51,234,0.3)',
      tags: ['Gap Detection', 'Prioritized', 'Actionable'],
    },
    {
      icon: Briefcase, title: 'Internship Discovery',
      desc: 'Browse curated internships and jobs from multiple live sources — filtered by your degree, location, and specialization.',
      href: '/internships', cta: 'Find Opportunities',
      gradient: 'from-emerald-600 to-teal-600',
      glow: 'rgba(16,185,129,0.3)',
      tags: ['Live Listings', 'India + Remote', 'Multi-Source'],
    },
  ]
  return (
    <section ref={ref} className="mb-6">
      <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-cyan-500" />
          <h2 className="text-xl font-bold text-white">Platform Features</h2>
        </div>
        <p className="text-sm text-slate-400 ml-4">Everything you need to prepare for placement — in one place.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map(({ icon: Icon, title, desc, href, cta, gradient, glow, tags }, i) => (
          <div
            key={title}
            className="group relative overflow-hidden rounded-2xl bg-[#0d1225] border border-white/8 p-6
                       hover:-translate-y-1.5 transition-all duration-350 cursor-pointer"
            style={{
              opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(22px)',
              transition: `all 0.55s ease ${0.1 * i + 0.1}s`,
              boxShadow: `0 0 0 0 ${glow}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 40px ${glow}` }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 0 transparent' }}
          >
            {/* Top gradient strip */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0
                              group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-0.5">{title}</h3>
                <div className="flex flex-wrap gap-1">
                  {tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/6 text-slate-500 border border-white/8">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-5">{desc}</p>

            <a
              href={href}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl
                          bg-gradient-to-r ${gradient} text-white hover:opacity-90 transition-opacity`}
            >
              {cta} <ChevronRight size={13} />
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Section 4: How It Works ───────────────────────────────────────────────────
function HowItWorks() {
  const [ref, visible] = useInView()
  const steps = [
    { n: '01', icon: GraduationCap, title: 'Create Your Profile',   desc: 'Enter your degree, specialization, and academic details to personalise your experience.', color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' },
    { n: '02', icon: FileText,      title: 'Upload Your Resume',     desc: 'Get an instant ATS score, skill extraction, and section-level feedback on your resume.', color: 'text-cyan-400',   border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10'   },
    { n: '03', icon: Sparkles,      title: 'Get AI Career Insights', desc: 'Receive placement predictions, gap analysis, and personalised internship recommendations.', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  ]
  return (
    <section ref={ref} className="mb-6">
      <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-cyan-500 to-emerald-500" />
          <h2 className="text-xl font-bold text-white">How It Works</h2>
        </div>
        <p className="text-sm text-slate-400 ml-4">Three steps to career clarity.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map(({ n, icon: Icon, title, desc, color, border, bg }, i) => (
          <div
            key={n}
            className={`relative overflow-hidden rounded-2xl bg-[#0d1225] border ${border} p-6
                        hover:-translate-y-1 transition-all duration-300`}
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.55s ease ${0.12 * i + 0.1}s` }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <span className={`text-3xl font-black ${color} opacity-20`}>{n}</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute -right-px top-1/2 -translate-y-1/2 z-10">
                <ArrowRight className="w-4 h-4 text-slate-700" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Section 5: Personal Career Stats ─────────────────────────────────────────
function PersonalStats({ stats, user }) {
  const [ref, visible] = useInView()

  const latestATS  = stats?.latest_resume?.ats_score ?? null
  const latestPred = stats?.latest_prediction?.prediction_score ?? null
  const totalPreds = stats?.total_predictions ?? 0
  const totalResumes = stats?.total_resume_analyses ?? 0

  // Profile completion
  const hasName  = !!user?.full_name
  const hasDeg   = !!user?.degree_program
  const hasSpec  = !!user?.specialization
  const profilePct = Math.round(([hasName, hasDeg, hasSpec].filter(Boolean).length / 3) * 100)

  const scoreColor = (v) => v >= 80 ? '#10b981' : v >= 60 ? '#6366f1' : v >= 40 ? '#f59e0b' : '#ef4444'
  const scoreLabel = (v) => v >= 80 ? 'Excellent' : v >= 60 ? 'Good' : v >= 40 ? 'Fair' : 'Needs Work'

  return (
    <section ref={ref} className="mb-6">
      <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-cyan-500" />
            <h2 className="text-xl font-bold text-white">Your Career Dashboard</h2>
          </div>
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
          </span>
        </div>
        <p className="text-sm text-slate-400 ml-4 mt-1">Real data from your account only.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* ATS Score */}
        <div
          className="group relative overflow-hidden rounded-2xl bg-[#0d1225] border border-white/8 p-5 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.55s ease 0.05s' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">ATS Score</p>
              <p className="text-xs text-slate-600 mt-0.5">Latest resume</p>
            </div>
            <div className="relative w-[72px] h-[72px]">
              <ScoreRing value={latestATS} color={latestATS !== null ? scoreColor(latestATS) : '#334155'} size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-white">{latestATS !== null ? `${latestATS}` : '—'}</span>
              </div>
            </div>
          </div>
          {latestATS !== null ? (
            <>
              <p className="text-lg font-black text-white">{latestATS}<span className="text-sm text-slate-500">/100</span></p>
              <p className="text-xs mt-0.5" style={{ color: scoreColor(latestATS) }}>{scoreLabel(latestATS)}</p>
            </>
          ) : (
            <a href="/resume" className="text-xs text-cyan-400 hover:underline">Upload resume →</a>
          )}
        </div>

        {/* Prediction Score */}
        <div
          className="group relative overflow-hidden rounded-2xl bg-[#0d1225] border border-white/8 p-5 hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.55s ease 0.12s' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Placement Score</p>
              <p className="text-xs text-slate-600 mt-0.5">Latest prediction</p>
            </div>
            <div className="relative w-[72px] h-[72px]">
              <ScoreRing value={latestPred} color={latestPred !== null ? scoreColor(latestPred) : '#334155'} size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-white">{latestPred !== null ? `${latestPred}` : '—'}</span>
              </div>
            </div>
          </div>
          {latestPred !== null ? (
            <>
              <p className="text-lg font-black text-white">{latestPred}<span className="text-sm text-slate-500">%</span></p>
              <p className="text-xs mt-0.5" style={{ color: scoreColor(latestPred) }}>{scoreLabel(latestPred)}</p>
            </>
          ) : (
            <a href="/prediction" className="text-xs text-indigo-400 hover:underline">Run prediction →</a>
          )}
        </div>

        {/* Profile Completion */}
        <div
          className="group relative overflow-hidden rounded-2xl bg-[#0d1225] border border-white/8 p-5 hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.55s ease 0.20s' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Profile</p>
              <p className="text-xs text-slate-600">Completion</p>
            </div>
          </div>
          <p className="text-2xl font-black text-white mb-1">{profilePct}%</p>
          <div className="h-1.5 rounded-full bg-white/6 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 progress-animated"
              style={{ width: `${profilePct}%` }}
            />
          </div>
          <div className="space-y-0.5">
            {[['Name', hasName], ['Degree', hasDeg], ['Specialization', hasSpec]].map(([label, done]) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px]">
                <span className={done ? 'text-emerald-400' : 'text-slate-600'}>
                  {done ? '✓' : '○'}
                </span>
                <span className={done ? 'text-slate-400' : 'text-slate-600'}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Degree & Activity */}
        <div
          className="group relative overflow-hidden rounded-2xl bg-[#0d1225] border border-white/8 p-5 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.55s ease 0.28s' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">My Program</p>
              <p className="text-xs text-slate-600">Degree info</p>
            </div>
          </div>
          <p className="text-sm font-bold text-white leading-tight mb-0.5">
            {user?.degree_program || <span className="text-slate-600">Not set</span>}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {user?.specialization || <span className="text-slate-600">No specialization set</span>}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Predictions', value: totalPreds, c: 'text-indigo-400' },
              { label: 'Resumes',     value: totalResumes, c: 'text-cyan-400' },
            ].map(({ label, value, c }) => (
              <div key={label} className="text-center p-2 rounded-xl bg-white/4 border border-white/6">
                <p className={`text-lg font-black ${c}`}>{value}</p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 6: Skill Gap Insights ─────────────────────────────────────────────
function SkillGapInsights({ stats }) {
  const [ref, visible] = useInView()
  const extracted   = stats?.latest_resume?.extracted_skills ?? []
  const skillGaps   = stats?.latest_prediction?.skill_gaps   ?? []

  // Skills to improve: from prediction's skill_gaps, supplemented with common gaps if empty
  const defaultGaps = ['SQL', 'Power BI', 'Aptitude & Reasoning', 'Communication Skills', 'Data Structures', 'System Design']
  const toImprove   = skillGaps.length > 0 ? skillGaps : defaultGaps

  const categoryColors = [
    { bg: 'bg-indigo-500/12', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    { bg: 'bg-purple-500/12', border: 'border-purple-500/20', text: 'text-purple-400' },
    { bg: 'bg-cyan-500/12',   border: 'border-cyan-500/20',   text: 'text-cyan-400'   },
    { bg: 'bg-amber-500/12',  border: 'border-amber-500/20',  text: 'text-amber-400'  },
    { bg: 'bg-pink-500/12',   border: 'border-pink-500/20',   text: 'text-pink-400'   },
    { bg: 'bg-emerald-500/12',border: 'border-emerald-500/20',text: 'text-emerald-400'},
  ]

  return (
    <section ref={ref} className="mb-6">
      <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
          <h2 className="text-xl font-bold text-white">Skill Gap Insights</h2>
        </div>
        <p className="text-sm text-slate-400 ml-4">Based on your latest prediction and resume analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Skills to improve */}
        <div
          className="rounded-2xl bg-[#0d1225] border border-amber-500/20 p-6"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.55s ease 0.05s' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Skills to Improve</p>
              <p className="text-xs text-slate-500">
                {skillGaps.length > 0 ? 'From your latest prediction' : 'Common gaps for your field'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {toImprove.slice(0, 8).map((skill, i) => {
              const c = categoryColors[i % categoryColors.length]
              return (
                <span key={skill} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${c.bg} ${c.border} ${c.text}`}>
                  {skill}
                </span>
              )
            })}
          </div>
        </div>

        {/* Skills you have */}
        <div
          className="rounded-2xl bg-[#0d1225] border border-emerald-500/20 p-6"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.55s ease 0.15s' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Skills You Have</p>
              <p className="text-xs text-slate-500">
                {extracted.length > 0 ? 'Extracted from your resume' : 'Upload a resume to see your skills'}
              </p>
            </div>
          </div>
          {extracted.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {extracted.slice(0, 10).map((skill, i) => (
                <span key={skill}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  ✓ {skill}
                </span>
              ))}
              {extracted.length > 10 && (
                <span className="px-3 py-1.5 rounded-xl text-xs text-slate-500 bg-white/4 border border-white/8">
                  +{extracted.length - 10} more
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <FileText className="w-8 h-8 text-slate-700" />
              <a href="/resume" className="text-xs text-cyan-400 hover:underline">Analyze resume to see your skills →</a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Section 7: AI Recommendations ────────────────────────────────────────────
function AIRecommendations({ stats, user }) {
  const [ref, visible] = useInView()

  const hasResume  = (stats?.total_resume_analyses ?? 0) > 0
  const hasPred    = (stats?.total_predictions ?? 0) > 0
  const predScore  = stats?.latest_prediction?.prediction_score ?? 0
  const atsScore   = stats?.latest_resume?.ats_score ?? 0
  const hasSpec    = !!user?.specialization

  // Build personalised recommendations from real data
  const recs = []

  if (!hasResume)
    recs.push({ icon: FileText,      text: 'Upload your resume to unlock ATS scoring and skill extraction.',         priority: 'high',   href: '/resume' })
  if (!hasPred)
    recs.push({ icon: BrainCircuit,  text: 'Run your first placement prediction to see your AI readiness score.',    priority: 'high',   href: '/prediction' })
  if (hasResume && atsScore < 60)
    recs.push({ icon: Target,        text: `Your ATS score is ${atsScore}% — improve resume sections and add relevant keywords.`, priority: 'high', href: '/resume' })
  if (hasPred && predScore < 60)
    recs.push({ icon: TrendingUp,    text: `Prediction score is ${predScore}%. Work on skill gaps and add more projects.`, priority: 'medium', href: '/prediction' })
  if (!hasSpec)
    recs.push({ icon: GraduationCap, text: 'Set your specialization in your profile to receive better recommendations.', priority: 'medium', href: '/profile' })
  if (hasPred && predScore >= 60 && predScore < 80)
    recs.push({ icon: Lightbulb,     text: 'You\'re on track! Complete 1–2 more projects to boost your score above 80%.', priority: 'medium', href: '/prediction' })
  if (hasResume && atsScore >= 70)
    recs.push({ icon: Briefcase,     text: 'Great ATS score! Start applying to internships matched to your profile.',  priority: 'low',    href: '/internships' })
  if (hasPred && predScore >= 80)
    recs.push({ icon: Rocket,        text: 'Excellent placement score! Explore top company opportunities now.',         priority: 'low',    href: '/internships' })

  // Pad with universal tips if short
  const universal = [
    { icon: BookOpen,   text: 'Practice aptitude and reasoning — commonly tested in campus drives.',          priority: 'low', href: null },
    { icon: Shield,     text: 'Update your resume regularly after every new project or skill acquisition.',   priority: 'low', href: null },
    { icon: Star,       text: 'Aim for a CGPA above 7.5 to meet shortlisting criteria for most companies.',  priority: 'low', href: null },
    { icon: Award,      text: 'Add a certification (AWS, Google, HackerRank) to strengthen your profile.',  priority: 'low', href: null },
  ]
  while (recs.length < 4) recs.push(universal[recs.length % universal.length])

  const priorityStyle = {
    high:   { badge: 'bg-red-500/15 text-red-400 border-red-500/20',    dot: 'bg-red-400'    },
    medium: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
    low:    { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  }

  return (
    <section ref={ref} className="mb-6">
      <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
          <h2 className="text-xl font-bold text-white">AI Career Coach</h2>
        </div>
        <p className="text-sm text-slate-400 ml-4">Personalised recommendations based on your profile and activity.</p>
      </div>

      <div
        className="rounded-2xl bg-gradient-to-br from-[#0d1225] to-[#0a0d1e] border border-purple-500/20 p-6"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.55s ease 0.05s' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/6">
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">SkillAI Coach</p>
            <p className="text-xs text-slate-500">Here are your next steps, {user?.full_name?.split(' ')[0] || 'Student'}:</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />AI-Powered
          </div>
        </div>

        {/* Recommendation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recs.slice(0, 6).map(({ icon: Icon, text, priority, href }, i) => {
            const ps = priorityStyle[priority]
            const content = (
              <div
                key={i}
                className="group flex items-start gap-3 p-4 rounded-xl bg-white/4 border border-white/6
                          hover:bg-white/6 hover:border-white/12 transition-all duration-200 cursor-pointer"
                style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(15px)', transition: `all 0.5s ease ${0.07 * i + 0.2}s` }}
              >
                <div className={`w-8 h-8 rounded-xl ${ps.badge.split(' ').slice(0,1).join(' ')} bg-opacity-20 border ${ps.badge.split(' ').slice(2).join(' ')} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4" style={{ color: ps.dot === 'bg-red-400' ? '#f87171' : ps.dot === 'bg-amber-400' ? '#fbbf24' : '#34d399' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
                </div>
                <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${ps.badge}`}>
                  {priority}
                </span>
              </div>
            )
            return href ? <a key={i} href={href} className="block">{content}</a> : <div key={i}>{content}</div>
          })}
        </div>
      </div>
    </section>
  )
}

// ── Section 8: Recommended Internships ───────────────────────────────────────
function RecommendedInternships({ user }) {
  const [ref, visible] = useInView()
  const [jobs, setJobs]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const kw  = user?.specialization || user?.degree_program || 'software developer intern'
    const deg = user?.degree_program || 'all'
    // Always default location to India so Internshala / Adzuna India results surface first
    const params = new URLSearchParams({
      keyword:   kw,
      degree:    deg,
      location:  'India',
      page_size: '4',
    })
    fetch(`${API}/jobs?${params}`)
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(d => { setJobs((d.jobs || []).slice(0, 4)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.specialization, user?.degree_program])

  const typeColor = (t) => {
    const s = (t || '').toLowerCase()
    if (s.includes('intern')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    if (s.includes('remote')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  }

  return (
    <section ref={ref} className="mb-6">
      <div className={`mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
            <h2 className="text-xl font-bold text-white">Recommended Opportunities</h2>
          </div>
          <a href="/internships" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            View all <ChevronRight size={13} />
          </a>
        </div>
        <p className="text-sm text-slate-400 ml-4 mt-1">
          {user?.specialization ? `Matched to "${user.specialization}"` : 'Live opportunities from multiple sources'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 gap-2">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-sm text-slate-500">Loading opportunities…</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl bg-[#0d1225] border border-white/8 p-8 flex flex-col items-center gap-3">
          <Briefcase className="w-10 h-10 text-slate-700" />
          <p className="text-sm text-slate-500">No jobs found for your profile right now</p>
          <a href="/internships" className="btn-secondary text-xs">Browse all internships</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {jobs.map((job, i) => (
            <div
              key={job.id ?? i}
              className="group relative overflow-hidden rounded-2xl bg-[#0d1225] border border-white/8 p-5
                        hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.55s ease ${0.1 * i + 0.05}s` }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/60 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                    {job.title || 'Role'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{job.company || 'Company'}</p>
                </div>
                <span className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-lg border font-semibold ${typeColor(job.job_type)}`}>
                  {job.job_type || 'Job'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.location && (
                  <span className="text-[10px] text-slate-500 bg-white/4 px-2 py-0.5 rounded-lg border border-white/6">
                    📍 {job.location}
                  </span>
                )}
                {job.source && (
                  <span className="text-[10px] text-slate-600 bg-white/4 px-2 py-0.5 rounded-lg border border-white/6">
                    {job.source}
                  </span>
                )}
              </div>
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Apply Now <ExternalLink size={11} />
                </a>
              ) : (
                <a href="/internships" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  View Details <ChevronRight size={11} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Root Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, authHeaders } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/history/stats`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) { setStats(d); setStatsLoading(false) } })
      .catch(() => { if (!cancelled) setStatsLoading(false) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your career dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <HeroSection user={user} />
      <AboutSection />
      <FeatureShowcase />
      <HowItWorks />
      <PersonalStats stats={stats} user={user} />
      <SkillGapInsights stats={stats} />
      <AIRecommendations stats={stats} user={user} />
      <RecommendedInternships user={user} />
      <DashboardFooter />
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function DashboardFooter() {
  return (
    <footer className="mt-8 mb-2">
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

      <div className="flex flex-col items-center gap-4 text-center">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">SkillAI</span>
          <span className="text-xs text-slate-600 font-medium">v1.0</span>
        </div>

        {/* Developer credit */}
        <p className="text-xs text-slate-500">
          Built and Developed by{' '}
          <span className="text-slate-300 font-semibold">Mugundhan G</span>
        </p>

        {/* Connect section */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold">
            Connect with Me
          </p>
          <div className="flex items-center gap-3">

            {/* GitHub */}
            <a
              href="https://github.com/Mugundhan-02"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8', textDecoration: 'none',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.09)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                e.currentTarget.style.color = '#f1f5f9'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#94a3b8'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'currentColor', flexShrink: 0 }} aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>

            {/* Separator */}
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/mugundhan-g"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8', textDecoration: 'none',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(10,102,194,0.15)'
                e.currentTarget.style.borderColor = 'rgba(10,102,194,0.4)'
                e.currentTarget.style.color = '#7ab4f5'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#94a3b8'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'currentColor', flexShrink: 0 }} aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>

        {/* Copyright */}
        <p style={{ fontSize: 10, color: '#334155', paddingBottom: 8 }}>
          © 2026 SkillAI · AI-Powered Career Intelligence Platform
        </p>
      </div>
    </footer>
  )
}
