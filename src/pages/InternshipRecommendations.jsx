import React, { useState } from 'react'
import {
  MapPin, Clock, IndianRupee, Bookmark, BookmarkCheck,
  ExternalLink, Search, Sparkles, SlidersHorizontal, GraduationCap
} from 'lucide-react'
import { internships, degreePrograms } from '../data/dummyData'
import clsx from 'clsx'

const ALL_DOMAINS = [
  'All', 'Software', 'Cloud', 'Data Science', 'Machine Learning',
  'Fintech', 'Finance', 'Banking', 'Consulting', 'Operations',
  'Marketing', 'Core Engineering', 'Data Engineering',
]

const ALL_LOCATIONS = ['All', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Chennai', 'Delhi']

const SORT_OPTIONS = ['Best Match', 'Highest Stipend', 'Newest', 'Deadline Soon']

const AI_TIPS = {
  'BE/BTech': 'Based on your profile, Google SWE Intern and Razorpay Backend Intern are your top tech matches.',
  'BCA':      'Zoho Full Stack and Swiggy Frontend Intern align well with your web development skills.',
  'BSc CS':   'Freshworks SWE and TCS Digital are strong matches — build 2 more projects to boost eligibility.',
  'BSc DS':   'Fractal AI Data Science and Zepto ML Intern are excellent fits for your analytics profile.',
  'BCom':     'KPMG Tax Intern and HDFC Bank Finance Intern are top picks for your commerce background.',
  'BBA':      'HUL Marketing Intern and Amazon Ops Management align perfectly with your management skills.',
  'MCA':      'Microsoft Azure and Amazon SDE roles are strong matches — sharpen DSA for FAANG readiness.',
  'MBA':      'BCG Business Analyst and Deloitte Senior Analyst are top matches for MBA graduates.',
}

function MatchBadge({ pct }) {
  const gradient =
    pct >= 85 ? 'from-emerald-500 to-teal-500' :
    pct >= 70 ? 'from-indigo-500 to-purple-500' :
    'from-amber-500 to-orange-500'
  return (
    <div className={`px-2.5 py-1 rounded-lg bg-gradient-to-r ${gradient} text-white text-xs font-bold shadow-sm`}>
      {pct}% match
    </div>
  )
}

export default function InternshipRecommendations() {
  const [savedIds,  setSavedIds]  = useState(internships.filter((i) => i.isSaved).map((i) => i.id))
  const [applied,   setApplied]   = useState([])
  const [domain,    setDomain]    = useState('All')
  const [location,  setLocation]  = useState('All')
  const [sort,      setSort]      = useState('Best Match')
  const [search,    setSearch]    = useState('')
  const [degFilter, setDegFilter] = useState('All')

  const toggleSave  = (id) => setSavedIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id])
  const toggleApply = (id) => setApplied((p)  => p.includes(id) ? p.filter((i) => i !== id) : [...p, id])

  const filtered = internships
    .filter((i) => domain    === 'All' || i.domain    === domain)
    .filter((i) => location  === 'All' || i.location  === location)
    .filter((i) => degFilter === 'All' || (i.forDegrees && i.forDegrees.includes(degFilter)))
    .filter((i) =>
      !search ||
      i.company.toLowerCase().includes(search.toLowerCase()) ||
      i.role.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'Best Match')    return b.matchPct - a.matchPct
      if (sort === 'Deadline Soon') return a.deadline.localeCompare(b.deadline)
      if (sort === 'Newest')        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
      return 0
    })

  const aiTip = AI_TIPS[degFilter] || 'Select your degree program above to get personalised internship recommendations.'

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Listings', value: internships.length,  color: 'text-indigo-400' },
          { label: 'Saved',          value: savedIds.length,      color: 'text-purple-400' },
          { label: 'Applied',        value: applied.length,       color: 'text-emerald-400' },
          { label: 'Shown',          value: filtered.length,      color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 flex flex-col gap-1">
            <p className="text-xs text-slate-400">{label}</p>
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Degree Filter */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 flex-shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            My Degree:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDegFilter('All')}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150',
                degFilter === 'All'
                  ? 'bg-indigo-600/40 border-indigo-500/60 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
              )}
            >
              All Programs
            </button>
            {degreePrograms.map((d) => (
              <button
                key={d.value}
                onClick={() => setDegFilter(d.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150',
                  degFilter === d.value
                    ? 'bg-indigo-600/40 border-indigo-500/60 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
                )}
              >
                {d.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Domain/Location Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center flex-1 min-w-[200px]">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-8"
            />
          </div>

          <select value={domain}   onChange={(e) => setDomain(e.target.value)}   className="select-field min-w-[130px]">
            {ALL_DOMAINS.map((d) => <option key={d} value={d} className="bg-[#141c35]">{d}</option>)}
          </select>

          <select value={location} onChange={(e) => setLocation(e.target.value)} className="select-field min-w-[130px]">
            {ALL_LOCATIONS.map((l) => <option key={l} value={l} className="bg-[#141c35]">{l}</option>)}
          </select>

          <select value={sort}     onChange={(e) => setSort(e.target.value)}     className="select-field min-w-[140px]">
            {SORT_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#141c35]">{s}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {filtered.length} results
          </div>
        </div>
      </div>

      {/* AI Tip */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/15 border border-purple-500/25">
        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p className="text-sm text-slate-300">
          <span className="text-purple-300 font-semibold">AI Tip: </span>
          {aiTip}
        </p>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center gap-3 text-center">
          <Search className="w-10 h-10 text-slate-600" />
          <p className="text-slate-400 font-medium">No internships match your current filters</p>
          <button
            onClick={() => { setDomain('All'); setLocation('All'); setSearch(''); setDegFilter('All') }}
            className="btn-secondary"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((intern) => {
            const isSaved   = savedIds.includes(intern.id)
            const isApplied = applied.includes(intern.id)

            return (
              <div
                key={intern.id}
                className={clsx(
                  'glass-card-hover p-5 flex flex-col gap-4 relative group',
                  isApplied && 'border-emerald-500/30'
                )}
              >
                {/* Badges */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  {intern.isNew && !isApplied && <span className="badge badge-cyan">New</span>}
                  {isApplied            && <span className="badge badge-green">Applied ✓</span>}
                </div>

                {/* Header */}
                <div className="flex items-start gap-3 pr-16">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border"
                    style={{ backgroundColor: intern.color + '25', borderColor: intern.color + '45', color: intern.color }}
                  >
                    {intern.logo}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white leading-tight">{intern.role}</p>
                    <p className="text-xs text-slate-400 font-medium">{intern.company}</p>
                  </div>
                </div>

                {/* Match badge */}
                <MatchBadge pct={intern.matchPct} />

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> {intern.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {intern.duration}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <IndianRupee className="w-3 h-3" /> {intern.stipend}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-slate-500">Due:</span>
                    <span className="text-amber-400 font-medium">{intern.deadline.split(',')[0]}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {intern.skills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 border border-white/8">
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Domain + Eligible degrees */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge badge-indigo">{intern.domain}</span>
                  {intern.forDegrees?.slice(0, 3).map((d) => (
                    <span key={d} className="badge badge-purple text-xs">{d}</span>
                  ))}
                  {intern.forDegrees?.length > 3 && (
                    <span className="badge badge-purple">+{intern.forDegrees.length - 3}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/8">
                  <button
                    onClick={() => toggleApply(intern.id)}
                    className={clsx(
                      'flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                      isApplied
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'btn-primary'
                    )}
                  >
                    {isApplied ? '✓ Applied' : 'Apply Now'}
                  </button>
                  <button
                    onClick={() => toggleSave(intern.id)}
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border',
                      isSaved
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    )}
                    title={isSaved ? 'Unsave' : 'Save'}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
