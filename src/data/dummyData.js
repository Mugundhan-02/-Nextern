// ─────────────────────────────────────────────────────────────────────────────
// src/data/dummyData.js  — All static data for the SkillAI Platform
// Degree / Specialization data lives in degreeData.js (single source of truth).
// ─────────────────────────────────────────────────────────────────────────────

import {
  DEGREE_PROGRAMS_CLEAN as _DEG_PROGRAMS,
  DEGREE_TO_CHART_KEY,
} from './degreeData'

// ── Degree Programs — re-export in the { value, label } shape used by charts ──
export const degreePrograms = _DEG_PROGRAMS

// ── Specializations shown per degree in PlacementPrediction form ──────────────
// Uses old chart-key degrees so PlacementPrediction.jsx still works.
export const specializationsByDegree = {
  'BE/BTech': ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical Engineering', 'Civil Engineering'],
  'BTech':    ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical Engineering', 'Civil Engineering', 'AI & Data Science', 'Cyber Security'],
  'BE':       ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical Engineering', 'Civil Engineering'],
  'BCA':      ['Computer Science', 'Data Science', 'AI & ML', 'Cyber Security', 'Cloud Computing'],
  'BSc CS':   ['Computer Science', 'AI & ML', 'Cyber Security', 'Data Science', 'Information Technology'],
  'BSc DS':   ['Data Science', 'Data Analytics', 'Machine Learning', 'Business Analytics'],
  'BSc':      ['Computer Science', 'Data Science', 'AI & ML', 'Information Technology', 'Cyber Security'],
  'BCom':     ['General Commerce', 'Finance', 'Accounting & Taxation', 'Banking & Insurance', 'Business Analytics'],
  'BBA':      ['General Management', 'Marketing', 'Finance', 'Human Resources', 'Business Analytics', 'Operations'],
  'MCA':      ['Software Development', 'Data Science', 'Cloud Computing', 'Cyber Security', 'AI & ML'],
  'MSc':      ['Computer Science', 'Data Science', 'AI & ML', 'Information Technology', 'Cyber Security'],
  'MTech':    ['Computer Science', 'AI & ML', 'Data Science', 'Electronics', 'Cyber Security'],
  'MBA':      ['Finance', 'Marketing', 'Human Resources', 'Operations', 'Business Analytics', 'Entrepreneurship'],
  'ME':       ['Computer Science', 'Electronics', 'Mechanical Engineering', 'AI & ML'],
}

// ── Career Interests keyed by degree ─────────────────────────────────────────
export const careerInterestsByDegree = {
  // Old chart-key values (PlacementPrediction.jsx uses these)
  'BE/BTech': ['Software Development', 'Data Engineering', 'DevOps & Cloud', 'Product Management', 'AI & Machine Learning', 'Cybersecurity', 'Embedded Systems'],
  'BSc CS':   ['Software Engineering', 'AI & ML Research', 'Cybersecurity Analyst', 'Data Science', 'Full Stack Development'],
  'BSc DS':   ['Data Scientist', 'ML Engineer', 'Business Analyst', 'Research Analyst', 'Data Analyst'],
  // Clean degree keys (new data model)
  'BCA':   ['Software Development', 'Web Development', 'Data Analysis', 'Mobile App Development', 'UI/UX Design'],
  'BSc':   ['Software Engineering', 'AI & ML Research', 'Data Science', 'Full Stack Development', 'Cybersecurity Analyst'],
  'BTech': ['Software Development', 'Data Engineering', 'DevOps & Cloud', 'AI & Machine Learning', 'Cybersecurity', 'Embedded Systems'],
  'BE':    ['Software Development', 'Data Engineering', 'DevOps & Cloud', 'AI & Machine Learning', 'Cybersecurity', 'Embedded Systems'],
  'BCom':  ['Financial Analyst', 'Chartered Accountant (CA)', 'Banking & Finance', 'Tax Consultant', 'Auditor', 'FinTech'],
  'BBA':   ['Marketing Manager', 'Brand Manager', 'HR Manager', 'Operations Manager', 'Business Consultant', 'Entrepreneur'],
  'MCA':   ['Software Engineer', 'System Architect', 'Data Scientist', 'Cloud Engineer', 'Cybersecurity Specialist', 'Full Stack Developer'],
  'MSc':   ['Data Scientist', 'ML Engineer', 'Research Analyst', 'Software Engineer', 'AI Researcher'],
  'MTech': ['Software Development', 'AI & Machine Learning', 'Data Engineering', 'DevOps & Cloud', 'Research'],
  'MBA':   ['Management Consultant', 'Product Manager', 'Investment Banker', 'Marketing Head', 'HR Business Partner', 'Startup Founder'],
  'ME':    ['Software Development', 'AI & Machine Learning', 'Data Engineering', 'Research'],
}

// ── Skill sets keyed by degree (for Skill Analytics) ─────────────────────────
export const skillSetsByDegree = {
  'BE/BTech': ['Python', 'DSA', 'System Design', 'SQL', 'React', 'Cloud', 'Communication'],
  'BTech':    ['Python', 'DSA', 'System Design', 'SQL', 'React', 'Cloud', 'Communication'],
  'BE':       ['Python', 'DSA', 'System Design', 'SQL', 'React', 'Cloud', 'Communication'],
  'BCA':      ['Web Dev', 'Python', 'SQL', 'JavaScript', 'Networking', 'Communication', 'Excel'],
  'BSc CS':   ['Python', 'Algorithms', 'ML / AI', 'SQL', 'React', 'Linux', 'Communication'],
  'BSc DS':   ['Python', 'ML / AI', 'Statistics', 'SQL', 'Tableau / Power BI', 'R', 'Communication'],
  'BSc':      ['Python', 'Algorithms', 'ML / AI', 'SQL', 'React', 'Linux', 'Communication'],
  'BCom':     ['Accounting', 'Tally / ERP', 'MS Excel', 'GST / Taxation', 'Financial Analysis', 'Communication', 'MS Office'],
  'BBA':      ['Marketing', 'MS Excel', 'Business Analytics', 'Communication', 'CRM Tools', 'Leadership', 'Presentation'],
  'MCA':      ['Java / Python', 'DSA', 'System Design', 'SQL', 'Cloud / DevOps', 'Microservices', 'Communication'],
  'MSc':      ['Python', 'ML / AI', 'Statistics', 'SQL', 'Research Methods', 'Communication'],
  'MTech':    ['Python', 'DSA', 'System Design', 'SQL', 'Cloud', 'Research Methods', 'Communication'],
  'MBA':      ['Business Strategy', 'Financial Modelling', 'MS Excel', 'Communication', 'Leadership', 'Data Analysis', 'Presentation'],
  'ME':       ['Python', 'DSA', 'System Design', 'SQL', 'Cloud', 'Research Methods', 'Communication'],
}

// ── Chart key compat shim ─────────────────────────────────────────────────────
export { DEGREE_TO_CHART_KEY }



// ── KPI Data ──────────────────────────────────────────────────────────────────
export const kpiData = [
  {
    id: 'placement-rate',
    title: 'Placement Rate',
    value: '87.4%',
    change: '+3.2%',
    trend: 'up',
    color: 'indigo',
    icon: 'TrendingUp',
    description: 'vs last semester',
  },
  {
    id: 'avg-package',
    title: 'Avg. Package',
    value: '₹7.2 LPA',
    change: '+₹0.8L',
    trend: 'up',
    color: 'purple',
    icon: 'IndianRupee',
    description: 'across all programs',
  },
  {
    id: 'students-placed',
    title: 'Students Placed',
    value: '2,641',
    change: '+318',
    trend: 'up',
    color: 'cyan',
    icon: 'Users',
    description: 'this academic year',
  },
  {
    id: 'total-offers',
    title: 'Total Offers',
    value: '3,874',
    change: '+472',
    trend: 'up',
    color: 'green',
    icon: 'Briefcase',
    description: 'including multiple offers',
  },
]

// ── Placement Trend (Line Chart) ──────────────────────────────────────────────
export const placementTrendData = [
  { month: 'Jan', placed: 142, offers: 210, target: 150 },
  { month: 'Feb', placed: 189, offers: 270, target: 175 },
  { month: 'Mar', placed: 234, offers: 340, target: 200 },
  { month: 'Apr', placed: 198, offers: 295, target: 210 },
  { month: 'May', placed: 276, offers: 401, target: 240 },
  { month: 'Jun', placed: 312, offers: 456, target: 270 },
]

// ── Department/Program-wise Placements (Bar Chart) ────────────────────────────
export const departmentData = [
  { dept: 'BE/BTech', placed: 842, total: 980,  pct: 86 },
  { dept: 'MCA',      placed: 312, total: 360,  pct: 87 },
  { dept: 'MBA',      placed: 398, total: 440,  pct: 90 },
  { dept: 'BCA',      placed: 267, total: 320,  pct: 83 },
  { dept: 'BSc CS',   placed: 198, total: 240,  pct: 82 },
  { dept: 'BSc DS',   placed: 156, total: 190,  pct: 82 },
  { dept: 'BBA',      placed: 289, total: 360,  pct: 80 },
  { dept: 'BCom',     placed: 179, total: 260,  pct: 69 },
]

// ── Sector Distribution (Pie Chart) ──────────────────────────────────────────
export const sectorData = [
  { name: 'Software / IT',          value: 32, color: '#6366f1' },
  { name: 'Finance / BFSI',         value: 18, color: '#10b981' },
  { name: 'Consulting / Management',value: 14, color: '#8b5cf6' },
  { name: 'Data & Analytics',       value: 12, color: '#06b6d4' },
  { name: 'Core Engineering',       value: 10, color: '#f59e0b' },
  { name: 'Marketing / Sales',      value: 8,  color: '#ec4899' },
  { name: 'Others',                 value: 6,  color: '#64748b' },
]

// ── Recent Activity Feed ──────────────────────────────────────────────────────
export const recentActivity = [
  { id: 1, student: 'Arjun Sharma',    action: 'Placed at',    company: 'Google',       package: '₹28 LPA', time: '2h ago',  avatar: 'AS', color: 'indigo', degree: 'BE/BTech' },
  { id: 2, student: 'Priya Nair',      action: 'Offer from',   company: 'Deloitte',     package: '₹12 LPA', time: '3h ago',  avatar: 'PN', color: 'purple', degree: 'MBA' },
  { id: 3, student: 'Rahul Verma',     action: 'Placed at',    company: 'HDFC Bank',    package: '₹6 LPA',  time: '5h ago',  avatar: 'RV', color: 'cyan',   degree: 'BCom' },
  { id: 4, student: 'Ananya Iyer',     action: 'Offer from',   company: 'Amazon',       package: '₹18 LPA', time: '6h ago',  avatar: 'AI', color: 'green',  degree: 'MCA' },
  { id: 5, student: 'Karthik M',       action: 'Placed at',    company: 'Swiggy',       package: '₹10 LPA', time: '8h ago',  avatar: 'KM', color: 'yellow', degree: 'BCA' },
  { id: 6, student: 'Divya R',         action: 'Offer from',   company: 'BCG',          package: '₹20 LPA', time: '1d ago',  avatar: 'DR', color: 'pink',   degree: 'MBA' },
]

// ── Top Recruiters ────────────────────────────────────────────────────────────
export const topRecruiters = [
  { name: 'TCS',         offers: 312, avgPackage: '₹7 LPA',  logo: 'T', domain: 'IT' },
  { name: 'Deloitte',    offers: 198, avgPackage: '₹12 LPA', logo: 'D', domain: 'Consulting' },
  { name: 'HDFC Bank',   offers: 176, avgPackage: '₹6 LPA',  logo: 'H', domain: 'Banking' },
  { name: 'Amazon',      offers: 134, avgPackage: '₹18 LPA', logo: 'A', domain: 'IT' },
  { name: 'Google',      offers: 28,  avgPackage: '₹28 LPA', logo: 'G', domain: 'IT' },
  { name: 'BCG',         offers: 42,  avgPackage: '₹22 LPA', logo: 'B', domain: 'Consulting' },
]

// ── Skill Analytics ───────────────────────────────────────────────────────────
export const skillRadarDataByDegree = {
  'BE/BTech': [
    { skill: 'Python',        current: 78, required: 90 },
    { skill: 'ML / AI',       current: 55, required: 80 },
    { skill: 'SQL',           current: 82, required: 85 },
    { skill: 'React',         current: 70, required: 75 },
    { skill: 'DSA',           current: 60, required: 90 },
    { skill: 'System Design', current: 40, required: 70 },
    { skill: 'Cloud',         current: 52, required: 68 },
  ],
  'BCA': [
    { skill: 'Web Dev',       current: 72, required: 85 },
    { skill: 'Python',        current: 60, required: 75 },
    { skill: 'SQL',           current: 75, required: 80 },
    { skill: 'JavaScript',    current: 68, required: 82 },
    { skill: 'Networking',    current: 50, required: 65 },
    { skill: 'Excel',         current: 80, required: 80 },
    { skill: 'Communication', current: 70, required: 80 },
  ],
  'BSc CS': [
    { skill: 'Python',        current: 80, required: 90 },
    { skill: 'Algorithms',    current: 65, required: 85 },
    { skill: 'ML / AI',       current: 60, required: 78 },
    { skill: 'SQL',           current: 78, required: 82 },
    { skill: 'React',         current: 65, required: 72 },
    { skill: 'Linux',         current: 55, required: 65 },
    { skill: 'Communication', current: 72, required: 80 },
  ],
  'BSc DS': [
    { skill: 'Python',        current: 82, required: 92 },
    { skill: 'ML / AI',       current: 70, required: 88 },
    { skill: 'Statistics',    current: 75, required: 90 },
    { skill: 'SQL',           current: 80, required: 85 },
    { skill: 'Power BI',      current: 55, required: 75 },
    { skill: 'R',             current: 50, required: 70 },
    { skill: 'Communication', current: 68, required: 78 },
  ],
  'BCom': [
    { skill: 'Accounting',    current: 78, required: 88 },
    { skill: 'MS Excel',      current: 72, required: 90 },
    { skill: 'GST / Tax',     current: 65, required: 80 },
    { skill: 'Fin. Analysis', current: 60, required: 78 },
    { skill: 'Tally / ERP',   current: 55, required: 75 },
    { skill: 'Communication', current: 70, required: 82 },
    { skill: 'MS Office',     current: 80, required: 85 },
  ],
  'BBA': [
    { skill: 'Marketing',     current: 70, required: 85 },
    { skill: 'MS Excel',      current: 65, required: 82 },
    { skill: 'Biz Analytics', current: 58, required: 75 },
    { skill: 'Communication', current: 78, required: 90 },
    { skill: 'CRM Tools',     current: 50, required: 70 },
    { skill: 'Leadership',    current: 72, required: 85 },
    { skill: 'Presentation',  current: 75, required: 88 },
  ],
  'MCA': [
    { skill: 'Java / Python', current: 80, required: 92 },
    { skill: 'DSA',           current: 68, required: 88 },
    { skill: 'System Design', current: 52, required: 78 },
    { skill: 'SQL',           current: 82, required: 86 },
    { skill: 'Cloud / DevOps',current: 58, required: 75 },
    { skill: 'Microservices', current: 45, required: 70 },
    { skill: 'Communication', current: 72, required: 80 },
  ],
  'MBA': [
    { skill: 'Biz Strategy',  current: 72, required: 88 },
    { skill: 'Fin. Modelling',current: 60, required: 82 },
    { skill: 'MS Excel',      current: 75, required: 90 },
    { skill: 'Communication', current: 80, required: 95 },
    { skill: 'Leadership',    current: 70, required: 88 },
    { skill: 'Data Analysis', current: 58, required: 75 },
    { skill: 'Presentation',  current: 78, required: 90 },
  ],
}

// Default radar data (fallback)
export const skillRadarData = skillRadarDataByDegree['BE/BTech']

// ── Top Demanded Skills by Degree ─────────────────────────────────────────────
export const topDemandedSkillsByDegree = {
  'BE/BTech': [
    { skill: 'Data Structures & Algorithms', demand: 95, trend: 'stable' },
    { skill: 'Python',                       demand: 94, trend: 'up' },
    { skill: 'Machine Learning',             demand: 88, trend: 'up' },
    { skill: 'React / Next.js',              demand: 82, trend: 'up' },
    { skill: 'SQL & Databases',              demand: 79, trend: 'up' },
    { skill: 'System Design',               demand: 74, trend: 'up' },
    { skill: 'Cloud (AWS/GCP/Azure)',        demand: 71, trend: 'up' },
    { skill: 'Docker & Kubernetes',          demand: 62, trend: 'up' },
  ],
  'BCA': [
    { skill: 'JavaScript & React',           demand: 90, trend: 'up' },
    { skill: 'Python',                       demand: 85, trend: 'up' },
    { skill: 'SQL',                          demand: 82, trend: 'stable' },
    { skill: 'PHP / Node.js',               demand: 74, trend: 'up' },
    { skill: 'Excel & Data Tools',           demand: 70, trend: 'stable' },
    { skill: 'UI/UX Design Basics',          demand: 65, trend: 'up' },
    { skill: 'Networking Fundamentals',      demand: 58, trend: 'stable' },
    { skill: 'Cloud Basics',                 demand: 54, trend: 'up' },
  ],
  'BSc CS': [
    { skill: 'Python',                       demand: 93, trend: 'up' },
    { skill: 'Algorithms & Complexity',      demand: 88, trend: 'stable' },
    { skill: 'Machine Learning',             demand: 85, trend: 'up' },
    { skill: 'Full Stack Development',       demand: 80, trend: 'up' },
    { skill: 'SQL & NoSQL',                  demand: 77, trend: 'up' },
    { skill: 'Linux & Shell Scripting',      demand: 65, trend: 'stable' },
    { skill: 'Cybersecurity Basics',         demand: 60, trend: 'up' },
    { skill: 'DevOps',                       demand: 55, trend: 'up' },
  ],
  'BSc DS': [
    { skill: 'Python & Pandas',              demand: 96, trend: 'up' },
    { skill: 'Machine Learning / AI',        demand: 92, trend: 'up' },
    { skill: 'Statistics & Probability',     demand: 90, trend: 'stable' },
    { skill: 'SQL',                          demand: 88, trend: 'up' },
    { skill: 'Power BI / Tableau',           demand: 82, trend: 'up' },
    { skill: 'R Programming',               demand: 70, trend: 'stable' },
    { skill: 'NLP / Deep Learning',          demand: 68, trend: 'up' },
    { skill: 'Big Data (Spark/Hadoop)',       demand: 58, trend: 'up' },
  ],
  'BCom': [
    { skill: 'MS Excel (Advanced)',           demand: 95, trend: 'stable' },
    { skill: 'Accounting & Bookkeeping',      demand: 90, trend: 'stable' },
    { skill: 'GST & Taxation',               demand: 85, trend: 'up' },
    { skill: 'Tally / SAP ERP',              demand: 80, trend: 'stable' },
    { skill: 'Financial Analysis',           demand: 78, trend: 'up' },
    { skill: 'Business Communication',       demand: 75, trend: 'stable' },
    { skill: 'Power BI / Data Viz',          demand: 65, trend: 'up' },
    { skill: 'Banking Knowledge',            demand: 60, trend: 'stable' },
  ],
  'BBA': [
    { skill: 'Business Communication',       demand: 95, trend: 'stable' },
    { skill: 'Digital Marketing',            demand: 88, trend: 'up' },
    { skill: 'MS Excel & Analytics',         demand: 85, trend: 'up' },
    { skill: 'Leadership & Management',      demand: 82, trend: 'stable' },
    { skill: 'CRM & Sales Tools',            demand: 75, trend: 'up' },
    { skill: 'Financial Basics',             demand: 70, trend: 'stable' },
    { skill: 'Supply Chain Basics',          demand: 62, trend: 'up' },
    { skill: 'Entrepreneurship',             demand: 58, trend: 'up' },
  ],
  'MCA': [
    { skill: 'Java / Python',                demand: 94, trend: 'up' },
    { skill: 'Data Structures & Algorithms', demand: 92, trend: 'stable' },
    { skill: 'System Design',               demand: 85, trend: 'up' },
    { skill: 'SQL & NoSQL',                  demand: 82, trend: 'up' },
    { skill: 'Cloud / DevOps',               demand: 78, trend: 'up' },
    { skill: 'Microservices / REST APIs',    demand: 75, trend: 'up' },
    { skill: 'Docker & Kubernetes',          demand: 65, trend: 'up' },
    { skill: 'React / Angular',              demand: 60, trend: 'up' },
  ],
  'MBA': [
    { skill: 'Business Communication',       demand: 96, trend: 'stable' },
    { skill: 'Financial Modelling',          demand: 90, trend: 'up' },
    { skill: 'MS Excel (Advanced)',           demand: 88, trend: 'stable' },
    { skill: 'Leadership & Strategy',        demand: 85, trend: 'stable' },
    { skill: 'Data Analysis / BI Tools',     demand: 80, trend: 'up' },
    { skill: 'Consulting Frameworks',        demand: 76, trend: 'up' },
    { skill: 'Digital Marketing',            demand: 68, trend: 'up' },
    { skill: 'Project Management',           demand: 65, trend: 'up' },
  ],
}

export const topDemandedSkills = topDemandedSkillsByDegree['BE/BTech']

// ── Skill Gap Matrix (Heatmap) ────────────────────────────────────────────────
export const skillGapMatrix = [
  { department: 'BE/BTech', python: 82, dsa: 74, ml: 60, sql: 85, react: 78, cloud: 55 },
  { department: 'MCA',      python: 80, dsa: 70, ml: 62, sql: 88, react: 68, cloud: 58 },
  { department: 'BSc CS',   python: 78, dsa: 65, ml: 58, sql: 80, react: 65, cloud: 50 },
  { department: 'BCA',      python: 60, dsa: 48, ml: 35, sql: 72, react: 70, cloud: 40 },
  { department: 'BSc DS',   python: 88, dsa: 55, ml: 78, sql: 84, react: 40, cloud: 52 },
  { department: 'BBA',      python: 22, dsa: 15, ml: 18, sql: 38, react: 20, cloud: 25 },
  { department: 'BCom',     python: 18, dsa: 12, ml: 14, sql: 42, react: 15, cloud: 18 },
  { department: 'MBA',      python: 28, dsa: 18, ml: 25, sql: 45, react: 22, cloud: 30 },
]

// ── Placement Prediction — Company/Role Pools by Degree ───────────────────────
export const companyPoolByDegree = {
  'BE/BTech': [
    { id: 1, company: 'Google',        role: 'SWE L3',              confidence: 72, package: '₹24-32 LPA', logo: 'G', color: '#4285F4', criteria: ['DSA', 'System Design', 'Python'] },
    { id: 2, company: 'Microsoft',     role: 'SDE-1',               confidence: 81, package: '₹18-26 LPA', logo: 'M', color: '#00A4EF', criteria: ['OOP', 'DSA', 'System Design'] },
    { id: 3, company: 'Amazon',        role: 'SDE-1',               confidence: 78, package: '₹16-22 LPA', logo: 'A', color: '#FF9900', criteria: ['DSA', 'Leadership Principles', 'AWS'] },
    { id: 4, company: 'Infosys',       role: 'Systems Engineer',    confidence: 95, package: '₹5-7 LPA',   logo: 'I', color: '#007CC3', criteria: ['Java', 'SQL', 'Communication'] },
    { id: 5, company: 'Wipro',         role: 'Software Engineer',   confidence: 93, package: '₹5-7 LPA',   logo: 'W', color: '#8b5cf6', criteria: ['Python', 'Testing', 'Agile'] },
    { id: 6, company: 'Razorpay',      role: 'Backend Engineer',    confidence: 67, package: '₹12-16 LPA', logo: 'R', color: '#3395FF', criteria: ['Node.js', 'Microservices', 'DSA'] },
  ],
  'BCA': [
    { id: 1, company: 'Wipro',         role: 'Junior Developer',    confidence: 88, package: '₹4-6 LPA',   logo: 'W', color: '#8b5cf6', criteria: ['Web Dev', 'SQL', 'Python'] },
    { id: 2, company: 'Infosys BPM',   role: 'Process Associate',   confidence: 91, package: '₹3.5-5 LPA', logo: 'I', color: '#007CC3', criteria: ['Communication', 'MS Office', 'SQL'] },
    { id: 3, company: 'Tech Mahindra', role: 'Web Developer',       confidence: 84, package: '₹4-6 LPA',   logo: 'T', color: '#00A0B0', criteria: ['JavaScript', 'React', 'HTML/CSS'] },
    { id: 4, company: 'Zoho',          role: 'Software Engineer',   confidence: 79, package: '₹5-8 LPA',   logo: 'Z', color: '#E42527', criteria: ['Python', 'SQL', 'Problem Solving'] },
    { id: 5, company: 'Accenture',     role: 'Application Dev',     confidence: 86, package: '₹4.5-6 LPA', logo: 'A', color: '#A100FF', criteria: ['JavaScript', 'SQL', 'Agile'] },
    { id: 6, company: 'Capgemini',     role: 'IT Analyst',          confidence: 82, package: '₹4-5.5 LPA', logo: 'C', color: '#0070AD', criteria: ['Java', 'SQL', 'Communication'] },
  ],
  'BSc CS': [
    { id: 1, company: 'Google',        role: 'SWE (Associate)',     confidence: 65, package: '₹20-28 LPA', logo: 'G', color: '#4285F4', criteria: ['DSA', 'Python', 'System Design'] },
    { id: 2, company: 'Flipkart',      role: 'SDE-1',               confidence: 80, package: '₹12-18 LPA', logo: 'F', color: '#F7A12A', criteria: ['DSA', 'Python', 'SQL'] },
    { id: 3, company: 'Zoho',          role: 'Software Engineer',   confidence: 88, package: '₹6-10 LPA',  logo: 'Z', color: '#E42527', criteria: ['Python', 'Algorithms', 'SQL'] },
    { id: 4, company: 'TCS',           role: 'Digital Profile',     confidence: 92, package: '₹7-9 LPA',   logo: 'T', color: '#002244', criteria: ['Python', 'SQL', 'Communication'] },
    { id: 5, company: 'Razorpay',      role: 'Backend Dev',         confidence: 72, package: '₹10-14 LPA', logo: 'R', color: '#3395FF', criteria: ['Python', 'REST APIs', 'SQL'] },
    { id: 6, company: 'Freshworks',    role: 'Software Engineer',   confidence: 78, package: '₹8-12 LPA',  logo: 'F', color: '#00B8A9', criteria: ['Python / Ruby', 'SQL', 'Agile'] },
  ],
  'BSc DS': [
    { id: 1, company: 'Amazon',        role: 'Data Scientist',      confidence: 78, package: '₹14-20 LPA', logo: 'A', color: '#FF9900', criteria: ['ML', 'Python', 'Statistics'] },
    { id: 2, company: 'Mu Sigma',      role: 'Decision Scientist',  confidence: 90, package: '₹6-9 LPA',   logo: 'M', color: '#0076C0', criteria: ['Statistics', 'Python', 'SQL'] },
    { id: 3, company: 'Fractal AI',    role: 'Data Analyst',        confidence: 85, package: '₹8-12 LPA',  logo: 'F', color: '#5A5EF0', criteria: ['Python', 'ML', 'Power BI'] },
    { id: 4, company: 'Zepto',         role: 'ML Engineer',         confidence: 74, package: '₹10-14 LPA', logo: 'Z', color: '#8b5cf6', criteria: ['Python', 'TensorFlow', 'SQL'] },
    { id: 5, company: 'Deloitte',      role: 'Analytics Analyst',   confidence: 82, package: '₹8-11 LPA',  logo: 'D', color: '#00B300', criteria: ['Power BI', 'Python', 'SQL'] },
    { id: 6, company: 'Nielsen',       role: 'Research Analyst',    confidence: 79, package: '₹6-9 LPA',   logo: 'N', color: '#E4002B', criteria: ['Statistics', 'R / Python', 'Excel'] },
  ],
  'BCom': [
    { id: 1, company: 'HDFC Bank',     role: 'Junior Associate',    confidence: 92, package: '₹4-6 LPA',   logo: 'H', color: '#004C97', criteria: ['Banking', 'Communication', 'Excel'] },
    { id: 2, company: 'Deloitte',      role: 'Audit Associate',     confidence: 88, package: '₹6-9 LPA',   logo: 'D', color: '#00B300', criteria: ['Accounting', 'Excel', 'Tally'] },
    { id: 3, company: 'KPMG',          role: 'Tax Analyst',         confidence: 80, package: '₹5-8 LPA',   logo: 'K', color: '#00338D', criteria: ['GST', 'Taxation', 'Excel'] },
    { id: 4, company: 'Infosys BPM',   role: 'Finance Analyst',     confidence: 86, package: '₹4.5-6 LPA', logo: 'I', color: '#007CC3', criteria: ['Excel', 'Accounting', 'SAP'] },
    { id: 5, company: 'Axis Bank',     role: 'Relationship Manager',confidence: 84, package: '₹4-6 LPA',   logo: 'A', color: '#97144D', criteria: ['Banking', 'Communication', 'Sales'] },
    { id: 6, company: 'PwC',           role: 'Associate — Assurance',confidence: 78, package: '₹6-9 LPA',  logo: 'P', color: '#D04A02', criteria: ['Accounting', 'Audit', 'Excel'] },
  ],
  'BBA': [
    { id: 1, company: 'Deloitte',      role: 'Business Analyst',    confidence: 80, package: '₹7-10 LPA',  logo: 'D', color: '#00B300', criteria: ['Communication', 'Excel', 'Analytics'] },
    { id: 2, company: 'HUL',           role: 'Sales Officer',       confidence: 88, package: '₹5-8 LPA',   logo: 'H', color: '#005799', criteria: ['Sales', 'Communication', 'Marketing'] },
    { id: 3, company: 'Amazon',        role: 'Operations Mgmt',     confidence: 82, package: '₹6-9 LPA',   logo: 'A', color: '#FF9900', criteria: ['Ops', 'Excel', 'Communication'] },
    { id: 4, company: 'ICICI Bank',    role: 'Relationship Exec',   confidence: 86, package: '₹4-6 LPA',   logo: 'I', color: '#F46F20', criteria: ['Banking', 'Sales', 'Communication'] },
    { id: 5, company: 'Swiggy',        role: 'City Growth Manager', confidence: 76, package: '₹8-11 LPA',  logo: 'S', color: '#FC8019', criteria: ['Ops', 'Data Driven', 'Communication'] },
    { id: 6, company: 'Marico',        role: 'Area Sales Manager',  confidence: 84, package: '₹6-9 LPA',   logo: 'M', color: '#E63329', criteria: ['Sales', 'Marketing', 'Communication'] },
  ],
  'MCA': [
    { id: 1, company: 'Google',        role: 'SWE L3',              confidence: 70, package: '₹22-30 LPA', logo: 'G', color: '#4285F4', criteria: ['DSA', 'System Design', 'Python'] },
    { id: 2, company: 'Microsoft',     role: 'SDE-1',               confidence: 80, package: '₹16-24 LPA', logo: 'M', color: '#00A4EF', criteria: ['OOP', 'DSA', 'System Design'] },
    { id: 3, company: 'Amazon',        role: 'SDE-1',               confidence: 76, package: '₹14-20 LPA', logo: 'A', color: '#FF9900', criteria: ['DSA', 'Java/Python', 'AWS'] },
    { id: 4, company: 'TCS',           role: 'System Engineer',     confidence: 95, package: '₹6-8 LPA',   logo: 'T', color: '#002244', criteria: ['Java', 'SQL', 'Communication'] },
    { id: 5, company: 'Infosys',       role: 'Sr. Systems Eng.',    confidence: 92, package: '₹6-9 LPA',   logo: 'I', color: '#007CC3', criteria: ['Java', 'SQL', 'Microservices'] },
    { id: 6, company: 'Freshworks',    role: 'Software Engineer',   confidence: 84, package: '₹10-14 LPA', logo: 'F', color: '#00B8A9', criteria: ['Python', 'REST APIs', 'SQL'] },
  ],
  'MBA': [
    { id: 1, company: 'McKinsey',      role: 'Business Analyst',    confidence: 68, package: '₹24-35 LPA', logo: 'M', color: '#0047AB', criteria: ['Strategy', 'Communication', 'Analytics'] },
    { id: 2, company: 'BCG',           role: 'Associate Consultant',confidence: 72, package: '₹22-30 LPA', logo: 'B', color: '#006600', criteria: ['Consulting', 'Communication', 'PPT'] },
    { id: 3, company: 'Deloitte',      role: 'Sr. Business Analyst',confidence: 84, package: '₹14-20 LPA', logo: 'D', color: '#00B300', criteria: ['Strategy', 'Excel', 'Communication'] },
    { id: 4, company: 'Amazon',        role: 'Product Manager',     confidence: 78, package: '₹18-26 LPA', logo: 'A', color: '#FF9900', criteria: ['Product Sense', 'Data', 'Communication'] },
    { id: 5, company: 'Goldman Sachs', role: 'Investment Banking',  confidence: 70, package: '₹20-28 LPA', logo: 'G', color: '#0A6EBD', criteria: ['Finance', 'Fin. Modelling', 'Excel'] },
    { id: 6, company: 'HUL',           role: 'Brand Manager',       confidence: 82, package: '₹12-18 LPA', logo: 'H', color: '#005799', criteria: ['Marketing', 'Communication', 'Analytics'] },
  ],
}

// Fallback
export const companyMatches = companyPoolByDegree['BE/BTech']

// ── Internship Recommendations ────────────────────────────────────────────────
export const internships = [
  // ── Software / IT ──────────────────────────────────────────────
  {
    id: 1, company: 'Google', role: 'SWE Intern', location: 'Bangalore',
    stipend: '₹1.2L/mo', duration: '3 months', domain: 'Software',
    matchPct: 89, logo: 'G', color: '#4285F4',
    skills: ['Python', 'DSA', 'System Design'],
    deadline: 'Jun 30, 2025', isNew: true, isSaved: false,
    forDegrees: ['BE/BTech', 'MCA', 'BSc CS'],
  },
  {
    id: 2, company: 'Microsoft', role: 'Azure Cloud Intern', location: 'Hyderabad',
    stipend: '₹80K/mo', duration: '2 months', domain: 'Cloud',
    matchPct: 83, logo: 'M', color: '#00A4EF',
    skills: ['Azure', 'Python', 'Docker'],
    deadline: 'Jul 15, 2025', isNew: true, isSaved: true,
    forDegrees: ['BE/BTech', 'MCA', 'BSc CS'],
  },
  {
    id: 3, company: 'Swiggy', role: 'Frontend Intern', location: 'Bangalore',
    stipend: '₹40K/mo', duration: '4 months', domain: 'Software',
    matchPct: 85, logo: 'S', color: '#FC8019',
    skills: ['React', 'TypeScript', 'CSS'],
    deadline: 'Jul 10, 2025', isNew: false, isSaved: false,
    forDegrees: ['BE/BTech', 'BCA', 'BSc CS', 'MCA'],
  },
  {
    id: 4, company: 'Razorpay', role: 'Backend Intern', location: 'Bangalore',
    stipend: '₹60K/mo', duration: '3 months', domain: 'Fintech',
    matchPct: 76, logo: 'R', color: '#3395FF',
    skills: ['Node.js', 'PostgreSQL', 'REST APIs'],
    deadline: 'Jun 20, 2025', isNew: false, isSaved: false,
    forDegrees: ['BE/BTech', 'BCA', 'BSc CS', 'MCA'],
  },
  // ── Data Science / ML ─────────────────────────────────────────
  {
    id: 5, company: 'Zepto', role: 'ML Intern', location: 'Mumbai',
    stipend: '₹50K/mo', duration: '3 months', domain: 'Machine Learning',
    matchPct: 71, logo: 'Z', color: '#8b5cf6',
    skills: ['Python', 'TensorFlow', 'Data Analysis'],
    deadline: 'Aug 1, 2025', isNew: true, isSaved: true,
    forDegrees: ['BSc DS', 'BE/BTech', 'MCA', 'BSc CS'],
  },
  {
    id: 6, company: 'Fractal AI', role: 'Data Science Intern', location: 'Pune',
    stipend: '₹45K/mo', duration: '3 months', domain: 'Data Science',
    matchPct: 88, logo: 'F', color: '#5A5EF0',
    skills: ['Python', 'ML', 'Power BI', 'SQL'],
    deadline: 'Jul 20, 2025', isNew: true, isSaved: false,
    forDegrees: ['BSc DS', 'BE/BTech', 'MCA'],
  },
  {
    id: 7, company: 'Nielsen', role: 'Research Analyst Intern', location: 'Chennai',
    stipend: '₹30K/mo', duration: '2 months', domain: 'Data Science',
    matchPct: 79, logo: 'N', color: '#E4002B',
    skills: ['Statistics', 'Excel', 'Python'],
    deadline: 'Jul 25, 2025', isNew: false, isSaved: false,
    forDegrees: ['BSc DS', 'BSc CS'],
  },
  // ── Finance / Banking ──────────────────────────────────────────
  {
    id: 8, company: 'Goldman Sachs', role: 'Technology Analyst Intern', location: 'Bangalore',
    stipend: '₹1L/mo', duration: '2 months', domain: 'Finance',
    matchPct: 80, logo: 'G', color: '#0A6EBD',
    skills: ['Java', 'DSA', 'SQL'],
    deadline: 'Jun 25, 2025', isNew: false, isSaved: false,
    forDegrees: ['BE/BTech', 'MCA', 'MBA'],
  },
  {
    id: 9, company: 'HDFC Bank', role: 'Finance Intern', location: 'Mumbai',
    stipend: '₹20K/mo', duration: '2 months', domain: 'Banking',
    matchPct: 90, logo: 'H', color: '#004C97',
    skills: ['Excel', 'Banking Basics', 'Communication'],
    deadline: 'Jun 30, 2025', isNew: true, isSaved: false,
    forDegrees: ['BCom', 'BBA', 'MBA'],
  },
  {
    id: 10, company: 'KPMG', role: 'Tax & Audit Intern', location: 'Delhi',
    stipend: '₹25K/mo', duration: '3 months', domain: 'Finance',
    matchPct: 85, logo: 'K', color: '#00338D',
    skills: ['GST', 'Taxation', 'Tally', 'Excel'],
    deadline: 'Jul 5, 2025', isNew: false, isSaved: true,
    forDegrees: ['BCom', 'MBA'],
  },
  {
    id: 11, company: 'Deloitte', role: 'Audit Associate Intern', location: 'Bangalore',
    stipend: '₹30K/mo', duration: '2 months', domain: 'Finance',
    matchPct: 82, logo: 'D', color: '#00B300',
    skills: ['Accounting', 'Excel', 'Audit Basics'],
    deadline: 'Jul 10, 2025', isNew: false, isSaved: false,
    forDegrees: ['BCom', 'BBA', 'MBA'],
  },
  // ── Management / Consulting ────────────────────────────────────
  {
    id: 12, company: 'BCG', role: 'Business Analyst Intern', location: 'Mumbai',
    stipend: '₹80K/mo', duration: '2 months', domain: 'Consulting',
    matchPct: 75, logo: 'B', color: '#006600',
    skills: ['Strategy', 'Excel', 'Communication', 'PPT'],
    deadline: 'Aug 10, 2025', isNew: true, isSaved: false,
    forDegrees: ['MBA', 'BBA'],
  },
  {
    id: 13, company: 'Amazon', role: 'Ops Management Intern', location: 'Hyderabad',
    stipend: '₹50K/mo', duration: '3 months', domain: 'Operations',
    matchPct: 81, logo: 'A', color: '#FF9900',
    skills: ['Operations', 'Excel', 'Communication'],
    deadline: 'Jul 15, 2025', isNew: false, isSaved: false,
    forDegrees: ['BBA', 'MBA'],
  },
  {
    id: 14, company: 'HUL', role: 'Marketing Intern', location: 'Mumbai',
    stipend: '₹45K/mo', duration: '2 months', domain: 'Marketing',
    matchPct: 87, logo: 'H', color: '#005799',
    skills: ['Marketing', 'Communication', 'Excel', 'Analytics'],
    deadline: 'Jul 20, 2025', isNew: true, isSaved: false,
    forDegrees: ['BBA', 'MBA'],
  },
  // ── Core Engineering ───────────────────────────────────────────
  {
    id: 15, company: 'ISRO', role: 'Embedded Systems Intern', location: 'Chennai',
    stipend: '₹15K/mo', duration: '6 months', domain: 'Core Engineering',
    matchPct: 62, logo: 'I', color: '#f97316',
    skills: ['C/C++', 'Embedded C', 'RTOS'],
    deadline: 'Jul 1, 2025', isNew: false, isSaved: false,
    forDegrees: ['BE/BTech'],
  },
  {
    id: 16, company: 'Infosys Springboard', role: 'Data Engineer Intern', location: 'Pune',
    stipend: '₹25K/mo', duration: '3 months', domain: 'Data Engineering',
    matchPct: 68, logo: 'I', color: '#06b6d4',
    skills: ['Spark', 'Python', 'Hadoop'],
    deadline: 'Aug 15, 2025', isNew: false, isSaved: false,
    forDegrees: ['BE/BTech', 'BSc DS', 'MCA'],
  },
  // ── Web / Design ───────────────────────────────────────────────
  {
    id: 17, company: 'Zoho', role: 'Full Stack Intern', location: 'Chennai',
    stipend: '₹30K/mo', duration: '3 months', domain: 'Software',
    matchPct: 84, logo: 'Z', color: '#E42527',
    skills: ['Python / PHP', 'SQL', 'JavaScript'],
    deadline: 'Jul 30, 2025', isNew: false, isSaved: false,
    forDegrees: ['BCA', 'BSc CS', 'MCA', 'BE/BTech'],
  },
  {
    id: 18, company: 'Freshworks', role: 'SWE Intern', location: 'Chennai',
    stipend: '₹40K/mo', duration: '3 months', domain: 'Software',
    matchPct: 80, logo: 'F', color: '#00B8A9',
    skills: ['Ruby / Python', 'REST APIs', 'SQL'],
    deadline: 'Aug 5, 2025', isNew: true, isSaved: false,
    forDegrees: ['BSc CS', 'BCA', 'MCA', 'BE/BTech'],
  },
]

// ── Resume Parsed Data (dummy) ────────────────────────────────────────────────
export const parsedResume = {
  name: 'Mugundhan K',
  email: 'mugundhan@example.com',
  phone: '+91 98765 43210',
  linkedin: 'linkedin.com/in/mugundhan',
  github: 'github.com/mugundhan',
  atsScore: 74,
  education: [
    {
      degree: 'B.E. Computer Science & Engineering',
      institute: 'College of Engineering, Chennai',
      year: '2021 – 2025',
      cgpa: '8.4 / 10.0',
    },
  ],
  skills: [
    'Python', 'React', 'JavaScript', 'Node.js', 'SQL', 'Machine Learning',
    'TensorFlow', 'Git', 'Docker', 'REST API', 'DSA', 'C++',
  ],
  experience: [
    {
      role: 'ML Intern',
      company: 'Zoho Corporation',
      duration: 'May 2024 – Jul 2024',
      points: [
        'Built a sentiment analysis pipeline using BERT achieving 91% accuracy',
        'Reduced inference latency by 40% via model quantization',
      ],
    },
  ],
  projects: [
    {
      name: 'AI Resume Screener',
      tech: ['Python', 'spaCy', 'Flask', 'React'],
      description: 'End-to-end NLP pipeline that parses and scores resumes against JD requirements',
    },
    {
      name: 'Stock Price Predictor',
      tech: ['LSTM', 'TensorFlow', 'Pandas'],
      description: 'Time-series model with 82% directional accuracy on NSE stocks',
    },
  ],
  certifications: [
    'Google Associate Cloud Engineer',
    'AWS Cloud Practitioner',
    'Meta React Developer Certificate',
  ],
}
