// ─────────────────────────────────────────────────────────────────────────────
// src/api/predictApi.js
//
// Thin API client for the FastAPI backend.
// All network logic lives here — the React components stay clean.
//
// Backend endpoint:  POST http://127.0.0.1:8000/api/v1/predict
//
// FIX (Bug #1): Always include the JWT Authorization header when a token is
// present in localStorage.  Without this, predictions were saved under the
// legacy default user (id=1) instead of the logged-in user, so they never
// appeared in the authenticated user's Prediction History page.
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_URL = 'http://127.0.0.1:8000/api/v1'

/**
 * Read the JWT from localStorage (set by AuthContext after login/register).
 * Returns a partial headers object so it can be spread into fetch() options.
 */
function authHeader() {
  const token = localStorage.getItem('skillai_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Transform the raw React form state into the shape the FastAPI backend expects.
 *
 * Form field        → API field
 * ────────────────────────────────────────────────────
 * form.cgpa         → cgpa           (float)
 * form.skills       → skills         (comma-string → string[])
 * form.internships  → internships    ("3+" → 3, int)
 * form.projects     → projects       ("5+" → 5, int)
 * form.backlogs     → backlogs       (int)
 * form.communication→ communication  (string, validated server-side)
 * form.leetcode     → leetcode_solved (int, 0 if blank)
 */
function buildPayload(form) {
  // Strip "+" from dropdown values like "5+" or "3+"
  const parseIntSafe = (val) => parseInt(String(val).replace('+', ''), 10) || 0

  const skillsArray = form.skills
    ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return {
    cgpa:            parseFloat(form.cgpa) || 0,
    skills:          skillsArray,
    internships:     parseIntSafe(form.internships),
    projects:        parseIntSafe(form.projects),
    backlogs:        parseIntSafe(form.backlogs),
    communication:   form.communication || 'Good',
    leetcode_solved: parseInt(form.leetcode, 10) || 0,
  }
}

/**
 * POST /api/v1/predict — runs the AI placement prediction.
 *
 * @param {Object} form - raw React form state
 * @returns {Promise<Object>} { probability, status, recommendation, top_companies, skill_gaps }
 * @throws {Error} with a human-readable message
 */
export async function predictPlacement(form) {
  const payload = buildPayload(form)

  let response
  try {
    response = await fetch(`${BASE_URL}/predict`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
        ...authHeader(),   // ← FIX: include JWT so save is attributed to logged-in user
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // fetch() rejects only on network failure / CORS block
    throw new Error(
      'Cannot reach the backend server. Make sure FastAPI is running:\n  python main.py  (inside the /backend folder)'
    )
  }

  if (!response.ok) {
    let detail = `Server error ${response.status}`
    try {
      const err = await response.json()
      detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
    } catch { /* non-JSON body */ }
    throw new Error(detail)
  }

  return response.json()
}

/**
 * GET /health — quick liveness check before showing a stale-server error.
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch('http://127.0.0.1:8000/health')
    return res.ok
  } catch {
    return false
  }
}
