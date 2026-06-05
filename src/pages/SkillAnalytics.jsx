import React, { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Minus, BookOpen, Zap, Target, GraduationCap } from 'lucide-react'
import ChartCard from '../components/ChartCard'
import {
  skillRadarDataByDegree,
  topDemandedSkillsByDegree,
  skillGapMatrix,
  degreePrograms,
} from '../data/dummyData'
import clsx from 'clsx'

function GapCell({ value }) {
  const color =
    value >= 80 ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40' :
    value >= 60 ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/40' :
    value >= 40 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
    'bg-red-500/20 text-red-300 border-red-500/40'
  return (
    <td className="py-3 px-3 text-center">
      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold border ${color}`}>
        {value}%
      </span>
    </td>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#141c35] border border-white/12 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-white mb-2">{payload[0]?.payload?.skill || payload[0]?.payload?.name}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <span>{p.name}: <span className="text-white font-medium">{p.value}</span></span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function SkillAnalytics() {
  const [selectedDegree, setSelectedDegree] = useState('BE/BTech')
  const [selectedDept, setSelectedDept]     = useState('All')

  const radarData    = skillRadarDataByDegree[selectedDegree] || skillRadarDataByDegree['BE/BTech']
  const demandData   = topDemandedSkillsByDegree[selectedDegree] || topDemandedSkillsByDegree['BE/BTech']
  const mastered     = radarData.filter((s) => s.current >= s.required).length
  const avgScore     = Math.round(radarData.reduce((a, s) => a + s.current, 0) / radarData.length)
  const topGap       = radarData
    .map((s) => ({ ...s, gap: s.required - s.current }))
    .sort((a, b) => b.gap - a.gap)[0]

  const depts = ['All', ...skillGapMatrix.map((r) => r.department)]

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Degree Selector */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-white flex-shrink-0">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          View Skills For:
        </div>
        <div className="flex flex-wrap gap-2">
          {degreePrograms.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDegree(d.value)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150',
                selectedDegree === d.value
                  ? 'bg-indigo-600/40 border-indigo-500/60 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
              )}
            >
              {d.value}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Skills Mastered',  value: `${mastered} / ${radarData.length}`, icon: Target,       color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
          { label: 'Avg. Skill Score', value: `${avgScore}%`,                       icon: Zap,          color: 'text-cyan-400',   bg: 'bg-cyan-500/15' },
          { label: 'Top Skill Gap',    value: topGap?.skill || '—',                 icon: BookOpen,     color: 'text-amber-400',  bg: 'bg-amber-500/15' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-lg font-bold text-white truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Radar Chart */}
        <ChartCard title="Skill Radar" subtitle={`${selectedDegree} — Proficiency vs Industry Requirements`}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Required"    dataKey="required" stroke="#475569" fill="#475569" fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 3" />
              <Radar name="Your Skills" dataKey="current"  stroke="#6366f1" fill="#6366f1" fillOpacity={0.28} strokeWidth={2.5} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-6 justify-center mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-0.5 bg-indigo-500 rounded" /> Your Skills
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-0.5 bg-slate-500 rounded" /> Required
            </div>
          </div>

          {/* Progress bars */}
          <div className="mt-4 space-y-2.5">
            {radarData.map((s) => {
              const gap = s.required - s.current
              return (
                <div key={s.skill}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300 font-medium">{s.skill}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-semibold">{s.current}%</span>
                      {gap > 0
                        ? <span className="text-xs text-amber-400 font-semibold">−{gap}</span>
                        : <span className="text-xs text-emerald-400 font-semibold">✓</span>
                      }
                    </div>
                  </div>
                  <div className="relative progress-bar">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60 rounded z-10"
                      style={{ left: `${s.required}%` }} />
                    <div className="progress-fill" style={{
                      width: `${s.current}%`,
                      background: s.current >= s.required
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>

        {/* Top Demanded Skills */}
        <ChartCard title="Top Demanded Skills" subtitle={`Most requested by ${selectedDegree} recruiters in 2025`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={demandData}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} width={145} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="demand" name="Demand %" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {demandData.slice(0, 5).map((s) => (
              <div key={s.skill} className="flex items-center justify-between p-2.5 rounded-lg bg-white/4 border border-white/8">
                <div className="flex items-center gap-2">
                  {s.trend === 'up'
                    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <Minus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  }
                  <span className="text-xs text-slate-300 truncate max-w-[140px]">{s.skill}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 progress-bar">
                    <div className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${s.demand}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white w-8 text-right">{s.demand}%</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Skill Gap Heatmap — Tech columns only, all programs */}
      <ChartCard
        title="Institution-Wide Skill Gap Heatmap"
        subtitle="Technical skill proficiency across all degree programs"
        action={
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-white/5 border border-white/15 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50"
          >
            {depts.map((d) => <option key={d} value={d} className="bg-[#141c35]">{d}</option>)}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr>
                <th className="py-3 px-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Program</th>
                {['Python', 'DSA', 'ML / AI', 'SQL', 'React / Web', 'Cloud'].map((label) => (
                  <th key={label} className="py-3 px-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {skillGapMatrix
                .filter((r) => selectedDept === 'All' || r.department === selectedDept)
                .map((row) => (
                  <tr key={row.department} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-3">
                      <span className="text-xs font-bold text-white">{row.department}</span>
                    </td>
                    <GapCell value={row.python} />
                    <GapCell value={row.dsa} />
                    <GapCell value={row.ml} />
                    <GapCell value={row.sql} />
                    <GapCell value={row.react} />
                    <GapCell value={row.cloud} />
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {[
            { label: '≥ 80% — Excellent',    color: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40' },
            { label: '60–79% — Good',         color: 'bg-indigo-500/25 text-indigo-300 border-indigo-500/40' },
            { label: '40–59% — Fair',         color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
            { label: '< 40% — Needs Work',    color: 'bg-red-500/20 text-red-300 border-red-500/40' },
          ].map(({ label, color }) => (
            <div key={label} className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${color}`}>{label}</div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
