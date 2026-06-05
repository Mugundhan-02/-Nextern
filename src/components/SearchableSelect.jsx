// ─────────────────────────────────────────────────────────────────────────────
// src/components/SearchableSelect.jsx
//
// A fully custom, keyboard-accessible searchable dropdown that matches the
// existing SkillAI dark theme.  Replaces plain <select> elements wherever a
// long list of options benefits from live filtering.
//
// Props:
//   id          {string}   — unique HTML id (for <label htmlFor>)
//   options     {string[]} — flat list of option strings
//   value       {string}   — currently selected value (controlled)
//   onChange    {fn}       — called with the new string value on selection
//   placeholder {string}   — shown when nothing is selected
//   disabled    {boolean}  — greyed-out state
//   groups      {Array}    — optional [{ label, options }] for grouped display
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, ChevronDown, X, Check } from 'lucide-react'

export default function SearchableSelect({
  id,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select…',
  disabled = false,
  groups = null,    // [{ label: 'Undergrad', options: ['BCA', ...] }]
}) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const containerRef        = useRef(null)
  const searchRef           = useRef(null)
  const listRef             = useRef(null)

  // ── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ── Focus search input when dropdown opens ──────────────────────────────
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  // ── Filter helpers ──────────────────────────────────────────────────────
  const q = query.toLowerCase().trim()

  const filteredFlat = q
    ? options.filter(o => o.toLowerCase().includes(q))
    : options

  const filteredGroups = groups
    ? groups
        .map(g => ({ label: g.label, options: q ? g.options.filter(o => o.toLowerCase().includes(q)) : g.options }))
        .filter(g => g.options.length > 0)
    : null

  const noResults =
    (groups ? filteredGroups.length === 0 : filteredFlat.length === 0) && q.length > 0

  // ── Select an option ────────────────────────────────────────────────────
  const select = useCallback((opt) => {
    onChange(opt)
    setOpen(false)
    setQuery('')
  }, [onChange])

  // ── Clear selection ─────────────────────────────────────────────────────
  const clear = useCallback((e) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setQuery('')
  }, [onChange])

  // ── Toggle open ─────────────────────────────────────────────────────────
  const toggle = () => {
    if (disabled) return
    setOpen(o => !o)
    if (!open) setQuery('')
  }

  // ── Keyboard navigation ─────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  // ── Option renderer (shared) ────────────────────────────────────────────
  const renderOption = (opt) => (
    <button
      key={opt}
      type="button"
      onMouseDown={() => select(opt)}
      className={[
        'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-100',
        'flex items-center justify-between gap-2',
        opt === value
          ? 'bg-indigo-600/30 text-indigo-200 font-semibold'
          : 'text-slate-300 hover:bg-white/8 hover:text-white',
      ].join(' ')}
    >
      <span className="truncate">{opt}</span>
      {opt === value && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
    </button>
  )

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* ── Trigger button ──────────────────────────────────────────── */}
      <button
        id={id}
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={[
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-xl',
          'border transition-all duration-200 text-left',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-white/3 border-white/10 text-slate-500'
            : open
              ? 'bg-white/8 border-indigo-500/60 text-white'
              : 'bg-white/5 border-white/15 text-white hover:bg-white/7 hover:border-white/25',
        ].join(' ')}
        style={{ minHeight: '42px' }}
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span
              onMouseDown={clear}
              className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1.5 rounded-xl border border-white/12 shadow-2xl overflow-hidden"
          style={{ backgroundColor: '#141c35', minWidth: '200px', maxHeight: '320px' }}
        >
          {/* Search box */}
          <div className="p-2 border-b border-white/8 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
            {query && (
              <button type="button" onMouseDown={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div ref={listRef} className="overflow-y-auto p-1.5" style={{ maxHeight: '260px' }}>
            {noResults ? (
              <p className="text-xs text-slate-500 text-center py-6">No match for "{query}"</p>
            ) : groups ? (
              // Grouped display (used for degree programs)
              filteredGroups.map(g => (
                <div key={g.label}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1.5 mt-1">
                    {g.label}
                  </p>
                  {g.options.map(renderOption)}
                </div>
              ))
            ) : (
              // Flat display (used for specializations)
              filteredFlat.map(renderOption)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
