// src/pages/InternshipRecommendations.jsx
// =============================================================
// Phase 7 – Multi-source Real Job Listings
// =============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin, ExternalLink, Search, Briefcase, RefreshCw,
  WifiOff, Globe, Tag, ChevronLeft, ChevronRight,
  GraduationCap, X, IndianRupee, Zap, CheckCircle2,
  Filter, AlertCircle, SlidersHorizontal, Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Constants ──────────────────────────────────────────────
const API_BASE  = 'http://127.0.0.1:8000/api/v1'
const PAGE_SIZE = 20

const DEGREE_OPTIONS = [
  { label: 'All',   value: 'all' },
  { label: 'BCA',   value: 'BCA' },
  { label: 'BSc',   value: 'BSc' },
  { label: 'BTech', value: 'BTech' },
  { label: 'BCom',  value: 'BCom' },
  { label: 'BBA',   value: 'BBA' },
  { label: 'MCA',   value: 'MCA' },
  { label: 'MSc',   value: 'MSc' },
  { label: 'MBA',   value: 'MBA' },
]

const JOB_TYPES = [
  { label: 'All Types',     value: 'all' },
  { label: 'Full-Time',     value: 'full_time' },
  { label: 'Part-Time',     value: 'part_time' },
  { label: 'Internship',    value: 'internship' },
  { label: 'Remote',        value: 'remote' },
  { label: 'Contract',      value: 'contract' },
]

const LOCATION_PRESETS = [
  { label: '🇮🇳 All India',    value: 'India'       },
  { label: '🌊 Chennai',        value: 'Chennai'     },
  { label: '🏙 Coimbatore',     value: 'Coimbatore'  },
  { label: '🗺 Tamil Nadu',     value: 'Tamil Nadu'  },
  { label: '🏙 Bangalore',      value: 'Bangalore'   },
  { label: '🌇 Hyderabad',      value: 'Hyderabad'   },
  { label: '🏢 Mumbai',         value: 'Mumbai'      },
  { label: '🏙 Pune',           value: 'Pune'        },
  { label: '🏛 Delhi/NCR',      value: 'Delhi'       },
  { label: '🌐 Remote (India)', value: 'remote'      },
]

const KEYWORD_PRESETS = [
  'Python Developer', 'Data Analyst', 'Machine Learning',
  'Software Engineer', 'Full Stack Developer', 'React Developer',
  'Java Developer', 'Data Science', 'DevOps Engineer',
  'Zoho', 'Freshworks', 'TCS', 'Infosys', 'Startup',
]

const PALETTE = ['#6366f1','#8b5cf6','#0ea5e9','#14b8a6','#f59e0b','#ef4444','#ec4899','#10b981']

// ── Pure helper functions ───────────────────────────────────
function pickColor(name) {
  const n = (name || 'A').toUpperCase()
  return PALETTE[n.charCodeAt(0) % PALETTE.length]
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => (w[0] || '').toUpperCase()).join('') || '?'
}

// Pill component used throughout
function Pill({ children, style, onClick }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid transparent',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }
  return onClick
    ? <button onClick={onClick} style={base}>{children}</button>
    : <span style={base}>{children}</span>
}

// ── JobCard ─────────────────────────────────────────────────
function JobCard({ job }) {
  const color = pickColor(job.company_name)

  function handleApply(e) {
    e.preventDefault()
    const url = job.apply_url
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 16,
      padding: '18px 18px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minHeight: 220,
      transition: 'border-color 0.2s, background 0.2s',
    }}>

      {/* Header: logo + title */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: color + '22', border: '1px solid ' + color + '44',
          color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
        }}>
          {initials(job.company_name)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            color: '#f1f5f9', fontWeight: 700, fontSize: 14,
            lineHeight: '1.35', overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {job.job_title || 'Untitled Position'}
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.company_name || 'Unknown Company'}
          </p>
        </div>
      </div>

      {/* Location + type */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', color: '#64748b', fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={13} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {job.location || 'Not specified'}
          </span>
        </span>
        {job.job_type && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Briefcase size={13} />
            {job.job_type}
          </span>
        )}
      </div>

      {/* Salary */}
      {job.salary && (
        <p style={{ color: '#34d399', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IndianRupee size={12} />
          {job.salary}
        </p>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <CountryBadge code={job.source_country} location={job.location} />
        <SourceBadge  source={job.source} />
        {Array.isArray(job.tags) && job.tags.slice(0, 2).map(t => (
          <Pill key={t} style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
            <Tag size={10} />
            {t}
          </Pill>
        ))}
      </div>

      {/* Apply button */}
      <button
        onClick={handleApply}
        style={{
          marginTop: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 16px', borderRadius: 12,
          background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
          color: '#fff', fontSize: 13, fontWeight: 700,
          border: 'none', cursor: 'pointer', width: '100%',
        }}
      >
        <ExternalLink size={13} />
        Apply Now
      </button>
    </div>
  )
}

function CountryBadge({ code, location }) {
  // Derive a more specific label based on city when available
  const loc = (location || '').toLowerCase()
  let label = '🌍 International'
  let bg = 'rgba(100,116,139,0.12)', border = 'rgba(100,116,139,0.28)', color = '#94a3b8'
  if (code === 'IN') {
    if (loc.includes('chennai') || loc.includes('madras'))          { label = '🌊 Chennai';    bg = 'rgba(16,185,129,0.18)'; border = 'rgba(16,185,129,0.4)';  color = '#6ee7b7' }
    else if (loc.includes('coimbatore') || loc.includes('kovai'))   { label = '🏙 Coimbatore'; bg = 'rgba(16,185,129,0.15)'; border = 'rgba(16,185,129,0.35)'; color = '#6ee7b7' }
    else if (loc.includes('tamil') || ['madurai','trichy','salem','vellore','tiruppur'].some(c => loc.includes(c))) { label = '🗺 Tamil Nadu'; bg = 'rgba(16,185,129,0.14)'; border = 'rgba(16,185,129,0.3)'; color = '#34d399' }
    else if (loc.includes('bangalore') || loc.includes('bengaluru')){ label = '🏙 Bangalore';  bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.28)'; color = '#34d399' }
    else if (loc.includes('hyderabad'))                              { label = '🌇 Hyderabad';  bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.28)'; color = '#34d399' }
    else if (loc.includes('mumbai'))                                 { label = '🏢 Mumbai';     bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.28)'; color = '#34d399' }
    else if (loc.includes('pune'))                                   { label = '🏙 Pune';       bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.28)'; color = '#34d399' }
    else if (loc.includes('delhi') || loc.includes('ncr') || loc.includes('noida') || loc.includes('gurgaon')) { label = '🏛 Delhi NCR'; bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.28)'; color = '#34d399' }
    else                                                             { label = '🇮🇳 India';     bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.28)'; color = '#34d399' }
  } else if (code === 'REMOTE') {
    label = '🌐 Remote'; bg = 'rgba(59,130,246,0.12)'; border = 'rgba(59,130,246,0.28)'; color = '#93c5fd'
  }
  return <Pill style={{ background: bg, borderColor: border, color }}>{label}</Pill>
}

function SourceBadge({ source }) {
  const map = {
    Internshala: { label: '🇮🇳 Internshala', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  color: '#6ee7b7' },
    Adzuna:      { label: '🇮🇳 Adzuna',      bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  color: '#34d399' },
    Remotive:    { label: '🌐 Remotive',     bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)', color: '#93c5fd' },
    Arbeitnow:   { label: '🌍 Arbeitnow',   bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
  }
  const m = map[source] || map.Arbeitnow
  return <Pill style={{ background: m.bg, borderColor: m.border, color: m.color }}>{m.label}</Pill>
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
      minHeight: 220, animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)', width: '75%' }} />
          <div style={{ height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '50%' }} />
        </div>
      </div>
      <div style={{ height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '60%' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[60, 78, 52].map(w => (
          <div key={w} style={{ height: 20, borderRadius: 8, background: 'rgba(255,255,255,0.04)', width: w }} />
        ))}
      </div>
      <div style={{ height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginTop: 'auto' }} />
    </div>
  )
}

// ── Main page component ─────────────────────────────────────
export default function InternshipRecommendations() {
  const { user } = useAuth()

  // State
  const [jobs,         setJobs]         = useState([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [sourcesUsed,  setSourcesUsed]  = useState([])
  const [sourceStatus, setSourceStatus] = useState([])
  const [suggestions,  setSuggestions]  = useState([])
  const [showFilters,  setShowFilters]  = useState(false)

  // Committed search filters — default location to India
  const [keyword,    setKeyword]    = useState('')
  const [location,   setLocation]   = useState('India')
  const [degree,     setDegree]     = useState('all')
  const [jobType,    setJobType]    = useState('all')
  const [remoteOnly, setRemoteOnly] = useState(false)

  // Pending (not yet committed) input values
  const [inputKw,  setInputKw]  = useState('')
  const [inputLoc, setInputLoc] = useState('India')

  const abortRef     = useRef(null)
  // Track if degree was pre-filled from profile so we only do it once
  const degreeSetRef = useRef(false)

  // ── Pre-fill degree ONCE from user profile ─────────────────
  // NOTE: This is not in a useEffect that depends on `degree`
  // to avoid triggering an extra fetch cycle.
  useEffect(() => {
    if (degreeSetRef.current) return
    if (!user?.degree_program) return
    const matched = DEGREE_OPTIONS.find(o =>
      o.value !== 'all' &&
      user.degree_program.toLowerCase().startsWith(o.value.toLowerCase())
    )
    if (matched && matched.value !== 'all') {
      degreeSetRef.current = true
      setDegree(matched.value)
    }
  }, [user])

  // ── Fetch jobs ─────────────────────────────────────────────
  // NOTE: fetchJobs does NOT depend on authHeaders (removed from deps).
  // We read authHeaders inside the function via a ref to avoid
  // re-creating fetchJobs every time the token changes, which would
  // cause an infinite useEffect loop.
  const authHeadersRef = useRef(null)
  const { authHeaders } = useAuth()
  authHeadersRef.current = authHeaders   // always up-to-date, no dep needed

  const fetchJobs = useCallback(async (kw, loc, deg, jt, ro, pg) => {
    if (abortRef.current) {
      try { abortRef.current.abort() } catch (_) {}
    }
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError('')

    const params = new URLSearchParams({
      keyword:     kw  || '',
      location:    loc || 'all',
      degree:      deg || 'all',
      job_type:    jt  || 'all',
      remote_only: String(ro),
      page:        String(pg),
      page_size:   String(PAGE_SIZE),
    })

    const url = `${API_BASE}/jobs?${params}`
    console.log('[Jobs] Fetching:', url)

    try {
      const headers = authHeadersRef.current ? authHeadersRef.current() : {}
      const res = await fetch(url, { headers, signal: ctrl.signal })

      let data
      try { data = await res.json() } catch (_) { data = null }

      if (!res.ok) {
        throw new Error(data?.detail || `HTTP ${res.status}`)
      }
      if (!data) throw new Error('Empty response from server')

      const jobList = Array.isArray(data.jobs) ? data.jobs : []

      console.log('[Jobs] Success:', {
        total: data.total,
        jobs_received: jobList.length,
        sources: data.sources_used,
        first: jobList[0] ? { title: jobList[0].job_title, company: jobList[0].company_name, source_country: jobList[0].source_country } : null,
      })

      setJobs(jobList)
      setTotal(data.total        || 0)
      setSourcesUsed(data.sources_used  || [])
      setSourceStatus(data.source_status || [])
      setSuggestions(data.suggestions   || [])

    } catch (e) {
      if (e.name === 'AbortError') {
        console.log('[Jobs] Request aborted (intentional)')
        return
      }
      console.error('[Jobs] Fetch error:', e)
      const isNet = e.message.includes('Failed to fetch') || e.message.includes('NetworkError')
      setError(isNet
        ? 'Cannot connect to backend (http://127.0.0.1:8000). Make sure the Python server is running.'
        : e.message
      )
      setJobs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  // fetchJobs has NO external deps — it reads authHeaders via ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trigger fetch on filter / page change
  useEffect(() => {
    fetchJobs(keyword, location, degree, jobType, remoteOnly, page)
  }, [fetchJobs, keyword, location, degree, jobType, remoteOnly, page])

  // Helpers
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters  = !!(keyword || location || degree !== 'all' || jobType !== 'all' || remoteOnly)

  const commitSearch = () => {
    setKeyword(inputKw.trim())
    setLocation(inputLoc.trim())
    setPage(1)
  }
  const onKey      = e => { if (e.key === 'Enter') commitSearch() }
  const clearAll   = () => {
    setKeyword(''); setLocation(''); setDegree('all')
    setJobType('all'); setRemoteOnly(false); setPage(1)
    setInputKw(''); setInputLoc('')
  }
  const applyLoc   = v => { setLocation(v); setInputLoc(v); setRemoteOnly(v === 'remote'); setPage(1) }
  const applyKw    = v => { setKeyword(v); setInputKw(v); setPage(1) }
  const onSuggest  = v => { setKeyword(v); setInputKw(v); setPage(1) }

  // Group jobs by india_score tier for section labels
  const sections = (() => {
    if (!jobs.length) return []
    const chennai = [], tn = [], india = [], remote = [], intl = []
    jobs.forEach(j => {
      const sc = j.india_score ?? 0
      const loc = (j.location || '').toLowerCase()
      if (sc >= 10 || loc.includes('chennai') || loc.includes('coimbatore') || loc.includes('madras'))
        chennai.push(j)
      else if (sc >= 9 || loc.includes('tamil') || ['madurai','trichy','salem','vellore'].some(c => loc.includes(c)))
        tn.push(j)
      else if (j.source_country === 'IN' || sc >= 7)
        india.push(j)
      else if (j.source_country === 'REMOTE' || sc >= 3)
        remote.push(j)
      else
        intl.push(j)
    })
    return [
      chennai.length ? { key: 'chennai', label: '🌊 Chennai & Coimbatore',       items: chennai } : null,
      tn.length      ? { key: 'tn',      label: '🗺 Tamil Nadu',                  items: tn      } : null,
      india.length   ? { key: 'india',   label: '🇮🇳 India',                      items: india   } : null,
      remote.length  ? { key: 'remote',  label: '🌐 Remote Opportunities',        items: remote  } : null,
      intl.length    ? { key: 'intl',    label: '🌍 International (Fallback)',    items: intl    } : null,
    ].filter(Boolean)
  })()

  // Inline styles for common elements
  const S = {
    card: {
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 20, padding: 20,
    },
    btn: (active, activeStyle, inactiveStyle) => ({
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 12, fontSize: 13,
      fontWeight: 600, border: '1px solid', cursor: 'pointer',
      transition: 'all 0.15s',
      ...(active ? activeStyle : inactiveStyle),
    }),
    pillBtn: (active) => ({
      padding: '4px 10px', borderRadius: 8, fontSize: 12,
      fontWeight: 600, border: '1px solid', cursor: 'pointer',
      background: active ? 'rgba(99,102,241,0.3)'  : 'rgba(255,255,255,0.04)',
      borderColor: active ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.08)',
      color:       active ? '#e0e7ff'               : '#64748b',
    }),
    input: {
      width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
      color: '#f1f5f9', borderRadius: 12, padding: '10px 14px 10px 36px',
      fontSize: 13, outline: 'none',
    },
    divider: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
    sectionLabel: {
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
    },
  }

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* India-first notice banner */}
      <div style={{
        background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12, padding: '10px 16px', fontSize: 12, color: '#94a3b8',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🇮🇳</span>
        <span style={{ color: '#6ee7b7', fontWeight: 700, flexShrink: 0 }}>India First:</span>
        <span style={{ color: '#64748b' }}>
          Results ranked: Chennai → Tamil Nadu → India → Remote → International.
          Powered by Internshala (India), Adzuna India, Remotive, and Arbeitnow.
        </span>
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={22} color="#818cf8" />
            Job & Internship Board
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            Live listings · Adzuna India · Remotive · Arbeitnow
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={S.btn(showFilters,
              { background: 'rgba(99,102,241,0.25)', borderColor: 'rgba(99,102,241,0.45)', color: '#c7d2fe' },
              { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }
            )}
          >
            <Filter size={14} />
            Filters
            {hasFilters && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />}
          </button>
          <button
            onClick={() => fetchJobs(keyword, location, degree, jobType, remoteOnly, page)}
            disabled={loading}
            style={S.btn(false,
              { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' },
              { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }
            )}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────── */}
      <div style={{ ...S.card, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { label: 'Total Results', value: total,                   color: '#818cf8' },
            { label: 'Showing',       value: jobs.length,             color: '#a78bfa' },
            { label: 'Page',          value: `${page} / ${totalPages}`, color: '#fbbf24' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p style={{ fontSize: 11, color: '#64748b' }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Source status — India sources shown first */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#475569' }}>Sources:</span>
          {[
            { name: 'Internshala', colors: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.4)', '#6ee7b7'], flag: '🇮🇳' },
            { name: 'Adzuna',      colors: ['rgba(16,185,129,0.10)', 'rgba(16,185,129,0.3)', '#34d399'], flag: '🇮🇳' },
            { name: 'Remotive',    colors: ['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.3)', '#93c5fd'], flag: '🌐' },
            { name: 'Arbeitnow',   colors: ['rgba(100,116,139,0.1)', 'rgba(100,116,139,0.25)', '#94a3b8'], flag: '🌍' },
          ].map(({ name: src, colors, flag }) => {
            const active = sourcesUsed.includes(src)
            const ss = sourceStatus.find(s => s.name === src)
            const err = ss && !ss.ok
            return (
              <span
                key={src}
                title={err ? ss?.error : ss ? `${ss.count} listings` : 'Not active'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  border: '1px solid',
                  background: active ? colors[0] : err ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: active ? colors[1] : err ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)',
                  color:       active ? colors[2] : err ? '#f87171' : '#334155',
                }}
              >
                {active ? <CheckCircle2 size={11} /> : err ? <AlertCircle size={11} /> : null}
                {flag} {src}
                {active && ss?.count > 0 && <span style={{ opacity: 0.6 }}>({ss.count})</span>}
                {loading && active && <span style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────── */}
      <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {/* Keyword input */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              type="text"
              placeholder="Company, role, or skill (e.g. Zoho, Python Developer)"
              value={inputKw}
              onChange={e => setInputKw(e.target.value)}
              onKeyDown={onKey}
              style={S.input}
            />
          </div>
          {/* Location input */}
          <div style={{ position: 'relative', flex: '0 1 200px' }}>
            <MapPin size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              type="text"
              placeholder="City, country (e.g. Chennai)"
              value={inputLoc}
              onChange={e => setInputLoc(e.target.value)}
              onKeyDown={onKey}
              style={S.input}
            />
          </div>
          <button
            onClick={commitSearch}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
              borderRadius: 12, background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            <Search size={14} />
            Search
          </button>
          {hasFilters && (
            <button
              onClick={clearAll}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 12, fontSize: 13, color: '#94a3b8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        {/* Keyword presets */}
        <div>
          <p style={{ fontSize: 11, color: '#334155', marginBottom: 6 }}>Quick Search:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {KEYWORD_PRESETS.map(p => (
              <button key={p} onClick={() => applyKw(p)} style={S.pillBtn(keyword === p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* Location presets */}
        <div>
          <p style={{ fontSize: 11, color: '#334155', marginBottom: 6 }}>Location:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LOCATION_PRESETS.map(({ label, value }) => (
              <button key={value} onClick={() => applyLoc(value)}
                style={{
                  ...S.pillBtn(location === value),
                  background: location === value ? 'rgba(16,185,129,0.2)'   : 'rgba(255,255,255,0.04)',
                  borderColor: location === value ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.08)',
                  color:       location === value ? '#6ee7b7'               : '#64748b',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Advanced filters ────────────────────────────── */}
      {showFilters && (
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} color="#818cf8" />
            Advanced Filters
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {/* Degree */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <GraduationCap size={12} color="#818cf8" /> DEGREE
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {DEGREE_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => { setDegree(o.value); setPage(1) }} style={S.pillBtn(degree === o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Job type */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Briefcase size={12} color="#a78bfa" /> JOB TYPE
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {JOB_TYPES.map(o => (
                  <button key={o.value} onClick={() => { setJobType(o.value); setPage(1) }}
                    style={{ ...S.pillBtn(jobType === o.value),
                      background: jobType === o.value ? 'rgba(168,85,247,0.3)'  : 'rgba(255,255,255,0.04)',
                      borderColor: jobType === o.value ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)',
                      color:       jobType === o.value ? '#e9d5ff'              : '#64748b',
                    }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Remote */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Globe size={12} color="#38bdf8" /> WORK MODE
              </p>
              <button onClick={() => { setRemoteOnly(r => !r); setPage(1) }}
                style={S.btn(remoteOnly,
                  { background: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.4)', color: '#bfdbfe' },
                  { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#64748b' }
                )}>
                <Globe size={14} />
                {remoteOnly ? '✓ Remote Only' : 'Remote Only'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Smart match tip ─────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 20,
        background: 'linear-gradient(to right, rgba(16,185,129,0.08), rgba(99,102,241,0.06))',
        border: '1px solid rgba(16,185,129,0.18)',
      }}>
        <Sparkles size={15} color="#34d399" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: '#cbd5e1' }}>
          <span style={{ color: '#6ee7b7', fontWeight: 700 }}>Smart Match (India-First): </span>
          {user?.degree_program
            ? `Matching ${user.degree_program}${user.specialization ? ` · ${user.specialization}` : ''} roles in India. Chennai → Tamil Nadu → India → Remote → International.`
            : 'Indian opportunities prioritised — Chennai, Tamil Nadu, Bangalore, Hyderabad, Pune, Mumbai, Delhi.'}
        </p>
      </div>

      {/* ── Loading ─────────────────────────────────────── */}
      {loading && (
        <div style={S.grid}>
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Error state ─────────────────────────────────── */}
      {!loading && error && (
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
          <WifiOff size={44} color="rgba(248,113,113,0.55)" />
          <div style={{ maxWidth: 420 }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18 }}>Could not load jobs</p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{error}</p>
          </div>
          <button
            onClick={() => fetchJobs(keyword, location, degree, jobType, remoteOnly, page)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
              borderRadius: 12, background: 'linear-gradient(to right,#4f46e5,#7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────── */}
      {!loading && !error && jobs.length === 0 && (
        <>
          <div style={{ ...S.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48, textAlign: 'center' }}>
            <Briefcase size={44} style={{ color: '#1e293b' }} />
            <div>
              <p style={{ color: '#64748b', fontWeight: 600 }}>No jobs found</p>
              <p style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>
                {location && location !== 'all'
                  ? `No listings in "${location}" right now. Try Remote jobs.`
                  : 'Try different keywords or clear the filters.'}
              </p>
            </div>
            {/* India hint */}
            {['india','chennai','bangalore','hyderabad','mumbai','pune','delhi','noida'].some(c => (location||'').toLowerCase().includes(c))
              && sourceStatus.some(s => s.name === 'Adzuna' && !s.ok) && (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '10px 16px', maxWidth: 360, textAlign: 'left', color: '#34d399', fontSize: 12 }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>🇮🇳 Get India jobs via Adzuna</p>
                <p style={{ color: 'rgba(52,211,153,0.75)' }}>
                  Register free at{' '}
                  <a href="https://developer.adzuna.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: '#6ee7b7', textDecoration: 'underline' }}>developer.adzuna.com</a>
                  {' '}→ add keys to <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>backend/.env</code>
                </p>
              </div>
            )}
            <button onClick={clearAll} style={{ padding: '9px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Clear All Filters
            </button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={S.card}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Zap size={14} color="#fbbf24" /> Try These Searches
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => onSuggest(s)} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fcd34d', cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          JOB CARDS — This section renders when jobs.length > 0
          ═══════════════════════════════════════════════════ */}
      {!loading && !error && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Thin-results suggestions */}
          {suggestions.length > 0 && (
            <div style={S.card}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Zap size={14} color="#fbbf24" /> Try These Searches
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => onSuggest(s)} style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fcd34d', cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/*
            CARD GRID
            - If we have sections (grouped by country), render section by section
            - If sections is empty (unexpected source_country values), render flat grid
          */}
          {sections.length > 0
            ? sections.map(sec => (
                <div key={sec.key}>
                  {/* Section header */}
                  <div style={S.sectionLabel}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>{sec.label}</h3>
                    <div style={S.divider} />
                    <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>{sec.items.length} listings</span>
                  </div>
                  {/* Cards */}
                  <div style={S.grid}>
                    {sec.items.map(job => <JobCard key={job.id} job={job} />)}
                  </div>
                </div>
              ))
            : (
              /* Flat fallback — renders even if all source_country values are unexpected */
              <div>
                <div style={S.sectionLabel}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>📋 All Listings</h3>
                  <div style={S.divider} />
                  <span style={{ fontSize: 11, color: '#475569' }}>{jobs.length} listings</span>
                </div>
                <div style={S.grid}>
                  {jobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              </div>
            )
          }

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 16px', borderRadius: 12, fontSize: 13,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: page === 1 ? '#334155' : '#94a3b8', cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={15} /> Previous
              </button>

              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const pg = start + i
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      style={{
                        width: 36, height: 36, borderRadius: 10, fontSize: 13, fontWeight: 700,
                        border: '1px solid',
                        background: pg === page ? 'rgba(99,102,241,0.4)'   : 'rgba(255,255,255,0.04)',
                        borderColor: pg === page ? 'rgba(99,102,241,0.6)'  : 'rgba(255,255,255,0.08)',
                        color:       pg === page ? '#fff'                   : '#64748b',
                        cursor: 'pointer',
                      }}>
                      {pg}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 16px', borderRadius: 12, fontSize: 13,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: page === totalPages ? '#334155' : '#94a3b8', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

    </div>
  )
}
