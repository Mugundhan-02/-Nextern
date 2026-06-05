// ─────────────────────────────────────────────────────────────────────────────
// src/data/degreeData.js
// Single source of truth for Degree Program + Specialization data.
//
// DATA MODEL (fixed):
//   degree_program  → the type of degree only (BCA, BSc, BTech, …)
//   specialization  → the subject area, independent of degree (Data Science, …)
//
// Imported by: UserProfile.jsx, Signup.jsx, dummyData.js
// ─────────────────────────────────────────────────────────────────────────────

// ── Degree programs — type only, no subject mixed in ─────────────────────────
export const DEGREE_PROGRAMS = [
  // Undergraduate
  { value: 'BCA',   label: 'BCA   — Bachelor of Computer Applications', group: 'Undergraduate' },
  { value: 'BSc',   label: 'BSc   — Bachelor of Science',               group: 'Undergraduate' },
  { value: 'BTech', label: 'BTech — Bachelor of Technology',            group: 'Undergraduate' },
  { value: 'BE',    label: 'BE    — Bachelor of Engineering',           group: 'Undergraduate' },
  { value: 'BCom',  label: 'BCom  — Bachelor of Commerce',              group: 'Undergraduate' },
  { value: 'BBA',   label: 'BBA   — Bachelor of Business Administration',group: 'Undergraduate' },
  { value: 'BCA',   label: 'BCA   — Bachelor of Computer Applications', group: 'Undergraduate' },
  // Postgraduate
  { value: 'MCA',   label: 'MCA   — Master of Computer Applications',   group: 'Postgraduate' },
  { value: 'MSc',   label: 'MSc   — Master of Science',                 group: 'Postgraduate' },
  { value: 'MTech', label: 'MTech — Master of Technology',              group: 'Postgraduate' },
  { value: 'MBA',   label: 'MBA   — Master of Business Administration',  group: 'Postgraduate' },
  { value: 'ME',    label: 'ME    — Master of Engineering',             group: 'Postgraduate' },
]

// Deduplicate (BCA appeared twice by accident above during data build — remove)
const _seen = new Set()
const _DEDUPED = DEGREE_PROGRAMS.filter(d => {
  if (_seen.has(d.value)) return false
  _seen.add(d.value)
  return true
})
// Re-export as the cleaned list
export const DEGREE_PROGRAMS_CLEAN = _DEDUPED

// Flat value list for SearchableSelect options prop
export const DEGREE_LIST = _DEDUPED.map(d => d.value)

// Grouped for SearchableSelect groups prop
export const DEGREE_GROUPS = [
  {
    label: 'Undergraduate',
    options: _DEDUPED.filter(d => d.group === 'Undergraduate').map(d => d.value),
  },
  {
    label: 'Postgraduate',
    options: _DEDUPED.filter(d => d.group === 'Postgraduate').map(d => d.value),
  },
]

// ── Specializations — grouped, fully independent of degree ───────────────────
// These are the subject areas / majors a student can study within any degree.
export const SPECIALIZATION_GROUPS = [
  {
    label: 'Technology',
    options: [
      'Data Science',
      'Data Analytics',
      'Artificial Intelligence',
      'Machine Learning',
      'AI & ML',
      'Deep Learning',
      'Computer Science',
      'Information Technology',
      'Software Development',
      'Full Stack Development',
      'Web Development',
      'Mobile App Development',
      'Data Engineering',
      'Cloud Computing',
      'DevOps',
      'Cyber Security',
      'Ethical Hacking',
      'Blockchain',
      'IoT',
      'UI/UX Design',
      'Embedded Systems',
      'Electronics & Communication',
      'Electrical & Electronics',
      'VLSI Design',
      'Signal Processing',
      'Robotics',
    ],
  },
  {
    label: 'Business',
    options: [
      'Business Analytics',
      'Finance',
      'Marketing',
      'Human Resources',
      'Operations',
      'Entrepreneurship',
      'Product Management',
      'Banking & Insurance',
      'Supply Chain Management',
      'International Business',
    ],
  },
  {
    label: 'Core Engineering',
    options: [
      'Mechanical Engineering',
      'Civil Engineering',
      'Automobile Engineering',
      'Manufacturing & Design',
      'Thermal Engineering',
      'Structural Engineering',
      'Environmental Engineering',
      'Transportation Engineering',
      'Power Systems',
      'Renewable Energy',
      'Industrial Engineering',
    ],
  },
]

// Flat list for simple iteration / validation
export const SPECIALIZATIONS = SPECIALIZATION_GROUPS.flatMap(g => g.options)

// ── Legacy migration map ──────────────────────────────────────────────────────
// Old DB values stored "BTech CSE" or "BCA Data Science" as degree_program.
// Parse them into { degree, specialization } so the UI can pre-fill correctly.
export const LEGACY_DEGREE_MAP = {
  // Old combined degree+spec → split
  'BCA Data Science':        { degree: 'BCA',   spec: 'Data Science' },
  'BCA AI & ML':             { degree: 'BCA',   spec: 'AI & ML' },
  'BCA Cyber Security':      { degree: 'BCA',   spec: 'Cyber Security' },
  'BCA Cloud Computing':     { degree: 'BCA',   spec: 'Cloud Computing' },
  'BSc Computer Science':    { degree: 'BSc',   spec: 'Computer Science' },
  'BSc Data Science':        { degree: 'BSc',   spec: 'Data Science' },
  'BSc Information Technology': { degree: 'BSc', spec: 'Information Technology' },
  'BSc AI & ML':             { degree: 'BSc',   spec: 'AI & ML' },
  'BSc Cyber Security':      { degree: 'BSc',   spec: 'Cyber Security' },
  'BCom Computer Applications': { degree: 'BCom', spec: 'Computer Science' },
  'BBA Business Analytics':  { degree: 'BBA',   spec: 'Business Analytics' },
  'BTech CSE':               { degree: 'BTech', spec: 'Computer Science' },
  'BTech IT':                { degree: 'BTech', spec: 'Information Technology' },
  'BTech AI & Data Science': { degree: 'BTech', spec: 'Data Science' },
  'BTech AI & ML':           { degree: 'BTech', spec: 'AI & ML' },
  'BTech Cyber Security':    { degree: 'BTech', spec: 'Cyber Security' },
  'BTech Data Science':      { degree: 'BTech', spec: 'Data Science' },
  'BTech ECE':               { degree: 'BTech', spec: 'Electronics & Communication' },
  'BTech EEE':               { degree: 'BTech', spec: 'Electrical & Electronics' },
  'BTech Mechanical':        { degree: 'BTech', spec: 'Mechanical Engineering' },
  'BTech Civil':             { degree: 'BTech', spec: 'Civil Engineering' },
  'MSc Computer Science':    { degree: 'MSc',   spec: 'Computer Science' },
  'MSc Data Science':        { degree: 'MSc',   spec: 'Data Science' },
  'MBA Business Analytics':  { degree: 'MBA',   spec: 'Business Analytics' },
  'BE/BTech':                { degree: 'BTech', spec: 'Computer Science' },
}

/**
 * Given a raw DB `degree_program` string, returns { degree, spec } using the
 * legacy migration map when the value is an old combined string.
 * If the value is already a valid clean degree, returns it as-is with no spec override.
 */
export function parseLegacyDegree(rawDegree, rawSpec) {
  // Already a clean degree value (BCA, BSc, BTech, …)
  if (DEGREE_LIST.includes(rawDegree)) {
    return { degree: rawDegree, spec: rawSpec || '' }
  }
  // Attempt to parse a legacy combined value
  const mapped = LEGACY_DEGREE_MAP[rawDegree]
  if (mapped) {
    return {
      degree: mapped.degree,
      // Only override spec if the DB spec is blank or still the legacy combined value
      spec: rawSpec && rawSpec !== rawDegree ? rawSpec : mapped.spec,
    }
  }
  // Completely unknown — keep as-is, user must update
  return { degree: rawDegree || '', spec: rawSpec || '' }
}

// ── Chart-key compatibility shim (for dummyData.js charts) ───────────────────
// Maps clean degree values → old chart keys used in skillRadarDataByDegree etc.
export const DEGREE_TO_CHART_KEY = {
  'BCA':   'BCA',
  'BSc':   'BSc CS',
  'BTech': 'BE/BTech',
  'BE':    'BE/BTech',
  'BCom':  'BCom',
  'BBA':   'BBA',
  'MCA':   'MCA',
  'MSc':   'BSc CS',
  'MTech': 'BE/BTech',
  'MBA':   'MBA',
  'ME':    'BE/BTech',
}
