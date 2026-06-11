// src/utils/formatDate.js
// =============================================================================
// Shared timestamp helpers for the SkillAI frontend.
//
// ROOT CAUSE OF THE BUG:
//   SQLite stores timestamps without timezone info (e.g. "2026-06-11T12:30:00").
//   When the backend serialises with Python's .isoformat() it may omit the
//   +00:00 suffix, so JavaScript's new Date() treats the string as LOCAL time
//   instead of UTC — shifting all times by +05:30 for IST users.
//
// FIX:
//   • Backend: always append 'Z' / '+00:00' to isoformat output (see analytics.py).
//   • Frontend: this utility ensures any ISO string without a timezone suffix is
//     treated as UTC by appending 'Z' before parsing, then converts to IST for
//     display.
//
// USAGE:
//   import { formatTimestamp, formatShortDate, formatFullDatetime } from '../utils/formatDate'
//
//   formatTimestamp("2026-06-11T08:00:00")  →  "1:30 PM"        (today, IST)
//   formatTimestamp("2026-06-10T12:00:00")  →  "1 day ago"
//   formatTimestamp("2026-06-05T12:00:00")  →  "5 Jun 2026, 5:30 PM"
// =============================================================================

const TZ = 'Asia/Kolkata'   // IST — UTC+5:30

/**
 * Ensure an ISO string is treated as UTC by JavaScript's Date parser.
 * Strings from SQLite / Python isoformat() may lack a timezone suffix.
 *
 * "2026-06-11T12:30:00"          → "2026-06-11T12:30:00Z"   (UTC assumed)
 * "2026-06-11T12:30:00+05:30"    → unchanged                 (already tz-aware)
 * "2026-06-11T12:30:00Z"         → unchanged
 */
function toUTCDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  // Already has timezone info → parse as-is
  if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s)
  }
  // No suffix → treat as UTC
  return new Date(s + 'Z')
}

/**
 * Smart formatter — the primary function to use throughout the app.
 *
 * Rules (all times shown in Asia/Kolkata):
 *   < 60 seconds  → "just now"
 *   < 60 minutes  → "N min ago"  (e.g. "5 mins ago")
 *   < 24 hours    → "N hour ago" (e.g. "2 hours ago")
 *   today (same calendar day in IST) → "11:45 AM"
 *   yesterday     → "Yesterday, 3:15 PM"
 *   older         → "10 Jun 2026, 3:15 PM"
 *
 * @param {string|null} raw - ISO 8601 timestamp string from the API
 * @returns {string}
 */
export function formatTimestamp(raw) {
  const dt = toUTCDate(raw)
  if (!dt || isNaN(dt.getTime())) return '—'

  const now      = new Date()
  const diffMs   = now - dt
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHrs  = Math.floor(diffMins / 60)

  // Very recent
  if (diffSecs < 60)  return 'just now'
  if (diffMins < 60)  return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
  if (diffHrs  < 24)  return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`

  // Compare calendar dates in IST
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone: TZ }))
  const dtIST  = new Date(dt.toLocaleString('en-US',  { timeZone: TZ }))

  const todayDate     = nowIST.toDateString()
  const yesterdayDate = new Date(nowIST - 86400000).toDateString()
  const itemDate      = dtIST.toDateString()

  const timeStr = dt.toLocaleTimeString('en-IN', {
    timeZone:    TZ,
    hour:        '2-digit',
    minute:      '2-digit',
    hour12:      true,
  })

  if (itemDate === todayDate)     return timeStr
  if (itemDate === yesterdayDate) return `Yesterday, ${timeStr}`

  const dateStr = dt.toLocaleDateString('en-IN', {
    timeZone: TZ,
    day:      'numeric',
    month:    'short',
    year:     'numeric',
  })
  return `${dateStr}, ${timeStr}`
}

/**
 * Short date only — used in history list rows.
 * e.g. "10 Jun 2026"
 *
 * @param {string|null} raw
 * @returns {string}
 */
export function formatShortDate(raw) {
  const dt = toUTCDate(raw)
  if (!dt || isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-IN', {
    timeZone: TZ,
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
  })
}

/**
 * Short time only — used in history list rows alongside formatShortDate.
 * e.g. "03:45 PM"
 *
 * @param {string|null} raw
 * @returns {string}
 */
export function formatShortTime(raw) {
  const dt = toUTCDate(raw)
  if (!dt || isNaN(dt.getTime())) return '—'
  return dt.toLocaleTimeString('en-IN', {
    timeZone: TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  })
}

/**
 * Full readable datetime — used in detail drawers / modals.
 * e.g. "11 June 2026, 11:45 AM"
 *
 * @param {string|null} raw
 * @returns {string}
 */
export function formatFullDatetime(raw) {
  const dt = toUTCDate(raw)
  if (!dt || isNaN(dt.getTime())) return '—'
  const date = dt.toLocaleDateString('en-IN', {
    timeZone: TZ,
    day:      'numeric',
    month:    'long',
    year:     'numeric',
  })
  const time = dt.toLocaleTimeString('en-IN', {
    timeZone: TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  })
  return `${date}, ${time}`
}
