// src/utils/validation.js
// ============================================================
// Shared validation helpers used by Login.jsx and Signup.jsx.
// Also mirrors the rules enforced by the FastAPI backend so the
// user sees client-side errors instantly, before the network call.
// ============================================================

// ── Email ──────────────────────────────────────────────────────────────────
// RFC 5321-compatible practical regex.
// Accepts:  test@gmail.com, user.name+tag@sub.domain.co.uk
// Rejects:  abc, hello, 12345, test@, @gmail.com, a@b, a@.com
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

/**
 * Returns null if the email is valid, or an error string if invalid.
 * @param {string} email
 * @returns {string|null}
 */
export function validateEmail(email) {
  const v = email.trim()
  if (!v)                  return 'Email is required.'
  if (!EMAIL_RE.test(v))   return 'Please enter a valid email address.'
  return null
}

/**
 * Returns true if the email passes format validation.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return EMAIL_RE.test(email.trim())
}


// ── Password ───────────────────────────────────────────────────────────────
// Rules (must match backend PasswordRules in auth.py):
//   • At least 8 characters
//   • At least one uppercase letter [A-Z]
//   • At least one lowercase letter [a-z]
//   • At least one digit [0-9]
//
// Example passes: Test1234, MyPass9, SecureP4ss
// Example fails:  password (no digit/uppercase), 12345678 (no letters)

export const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter (A–Z)',    test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter (a–z)',    test: (p) => /[a-z]/.test(p) },
  { id: 'digit',     label: 'One number (0–9)',              test: (p) => /[0-9]/.test(p) },
]

/**
 * Returns null if the password passes all rules, or the first failing
 * rule's error message.
 * @param {string} password
 * @returns {string|null}
 */
export function validatePassword(password) {
  if (!password) return 'Password is required.'
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      switch (rule.id) {
        case 'length':    return 'Password must be at least 8 characters.'
        case 'uppercase': return 'Password must contain at least one uppercase letter.'
        case 'lowercase': return 'Password must contain at least one lowercase letter.'
        case 'digit':     return 'Password must contain at least one number.'
        default:          return 'Password does not meet requirements.'
      }
    }
  }
  return null
}

/**
 * Returns a 0–4 strength score:
 *   0 = empty, 1 = very weak, 2 = weak, 3 = fair, 4 = strong
 * Used to drive the colour bar in the signup form.
 * @param {string} password
 * @returns {number}
 */
export function passwordStrengthScore(password) {
  if (!password) return 0
  return PASSWORD_RULES.filter(r => r.test(password)).length
}

export const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
export const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']
export const STRENGTH_TEXT   = ['', 'text-red-400', 'text-amber-400', 'text-blue-400', 'text-emerald-400']
