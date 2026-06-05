import React from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import {
  kpiData, placementTrendData, departmentData,
  sectorData, recentActivity, topRecruiters,
} from '../data/dummyData'

const COLORS_SECTOR = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#64748b']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#141c35] border border-white/12 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-white mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.name}: <span className="text-white font-medium">{p.value}</span></span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* AI Insight Banner */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600/25 to-purple-600/15 border border-indigo-500/30">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">AI Insight — All Programs</p>
          <p className="text-xs text-slate-400">
            Overall placement rate is up <span className="text-indigo-300 font-medium">3.2%</span> this year across all 8 degree programs.
            MBA & BE/BTech lead at 90%+ placement. Communication & Excel are the #1 gaps in BCom & BBA cohorts.
          </p>
        </div>
        <button className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 whitespace-nowrap">
          View Report <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Placement Trend - Line Chart */}
        <ChartCard
          title="Placement Trend"
          subtitle="Monthly placed vs offers vs target"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={placementTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
              <Line type="monotone" dataKey="placed" name="Placed" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="offers" name="Offers" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#8b5cf6' }} />
              <Line type="monotone" dataKey="target" name="Target" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sector Distribution - Pie Chart */}
        <ChartCard title="Offer by Sector" subtitle="Industry distribution of placements">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {sectorData.slice(0, 4).map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-slate-400 truncate">{s.name}</span>
                </div>
                <span className="text-xs font-semibold text-white">{s.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Department-wise Bar Chart */}
        <ChartCard
          title="Program-wise Placements"
          subtitle="All 8 degree programs — placed vs total eligible"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={departmentData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
              <Bar dataKey="placed" name="Placed"         fill="#6366f1"              radius={[4, 4, 0, 0]} />
              <Bar dataKey="total"  name="Total Eligible" fill="rgba(99,102,241,0.2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Activity */}
        <ChartCard title="Recent Activity" subtitle="Latest placement updates">
          <div className="space-y-3">
            {recentActivity.map((item) => {
              const colorMap = {
                indigo: 'bg-indigo-500 text-indigo-100',
                purple: 'bg-purple-500 text-purple-100',
                cyan: 'bg-cyan-500 text-cyan-100',
                green: 'bg-emerald-500 text-emerald-100',
                yellow: 'bg-amber-500 text-amber-100',
              }
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorMap[item.color]}`}>
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-semibold text-white truncate">{item.student}</p>
                      {item.degree && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-medium">{item.degree}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {item.action} <span className="text-white font-medium">{item.company}</span>
                    </p>
                    {item.package !== 'TBD' && (
                      <p className="text-xs text-emerald-400 font-semibold">{item.package}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 whitespace-nowrap">{item.time}</span>
                </div>
              )
            })}
          </div>
        </ChartCard>
      </div>

      {/* Top Recruiters */}
      <ChartCard title="Top Recruiters" subtitle="Cross-domain companies with most offers this year">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {topRecruiters.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 transition-all duration-200 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/40 to-purple-600/30 flex items-center justify-center text-sm font-bold text-white border border-white/10">
                {r.logo}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">{r.name}</p>
                <p className="text-xs text-slate-400">{r.offers} offers</p>
                <p className="text-xs text-emerald-400 font-semibold">{r.avgPackage}</p>
                {r.domain && (
                  <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25 font-medium">{r.domain}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
