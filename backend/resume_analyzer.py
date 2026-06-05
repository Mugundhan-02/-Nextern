"""
backend/resume_analyzer.py
=============================================================================
SkillAI - Resume Analysis Engine

Responsibilities:
  1. Extract raw text from PDF (pdfplumber) or DOCX (python-docx)
  2. Detect skills via keyword matching against a curated skill database
  3. Detect education, experience, projects sections via regex heuristics
  4. Calculate ATS score from 5 weighted components
  5. Generate personalised improvement suggestions
  6. Return a structured ResumeAnalysisResult

ATS Score breakdown (total 100):
  Component               Weight  Max pts
  -----------------------------------------------
  Skills coverage           35%    35
  Section completeness      25%    25  (education + experience + projects)
  Keyword density           20%    20
  Contact info presence     10%    10
  Formatting quality        10%    10
=============================================================================
"""

import re
import io
import math
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# SKILL DATABASE
# Organised by category. Detection is case-insensitive full-word match.
# ---------------------------------------------------------------------------
SKILL_DB: dict[str, list[str]] = {
    "Programming Languages": [
        "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#",
        "Go", "Rust", "Kotlin", "Swift", "R", "Scala", "PHP", "Ruby",
        "MATLAB", "Bash", "Shell", "Perl", "Dart",
    ],
    "Web & Frontend": [
        "React", "Angular", "Vue", "Next.js", "Nuxt", "HTML", "CSS",
        "Tailwind", "Bootstrap", "Redux", "GraphQL", "REST", "SOAP",
        "jQuery", "Webpack", "Vite", "Svelte", "Flutter",
    ],
    "Backend & API": [
        "FastAPI", "Django", "Flask", "Spring", "Express", "Node.js",
        "NestJS", "Laravel", "ASP.NET", "Rails", "gRPC", "WebSocket",
    ],
    "Databases": [
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra",
        "SQLite", "Oracle", "DynamoDB", "Firebase", "Elasticsearch",
        "Neo4j", "Snowflake", "BigQuery",
    ],
    "Cloud & DevOps": [
        "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
        "Ansible", "Jenkins", "GitHub Actions", "CI/CD", "Linux",
        "Nginx", "Apache", "Prometheus", "Grafana", "Helm",
    ],
    "Data Science & ML": [
        "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
        "TensorFlow", "PyTorch", "Keras", "scikit-learn", "Pandas",
        "NumPy", "Matplotlib", "Seaborn", "Spark", "Hadoop", "Kafka",
        "Airflow", "MLflow", "Hugging Face", "LangChain",
    ],
    "Data Analytics": [
        "Power BI", "Tableau", "Excel", "Data Analysis", "Statistics",
        "A/B Testing", "Data Visualization", "Looker", "Metabase",
        "SPSS", "SAS", "R Studio",
    ],
    "CS Fundamentals": [
        "DSA", "Data Structures", "Algorithms", "System Design",
        "OS", "Operating Systems", "Computer Networks", "DBMS",
        "OOP", "Design Patterns", "Microservices", "REST API",
    ],
    "Tools & Platforms": [
        "Git", "GitHub", "GitLab", "Jira", "Confluence", "Postman",
        "VS Code", "IntelliJ", "Eclipse", "Linux", "Vim",
        "Figma", "Canva", "Adobe XD",
    ],
    "Business & Management": [
        "Project Management", "Agile", "Scrum", "Kanban", "PRINCE2",
        "Leadership", "Communication", "Team Management", "CRM",
        "Salesforce", "SAP", "ERP", "Tally", "GST", "Accounting",
        "Financial Modelling", "Marketing", "SEO", "Digital Marketing",
    ],
    "Certifications & Keywords": [
        "AWS Certified", "Google Cloud", "Azure Certified", "PMP",
        "Certified", "Internship", "Research", "Published", "Patent",
    ],
}

# Flat lookup: lowercase skill -> canonical form
_SKILL_LOOKUP: dict[str, str] = {}
for _cat, _skills in SKILL_DB.items():
    for _s in _skills:
        _SKILL_LOOKUP[_s.lower()] = _s

# High-value skills that employers frequently filter for
HIGH_VALUE_SKILLS = {
    "python", "machine learning", "dsa", "data structures",
    "system design", "react", "sql", "docker", "aws", "azure", "gcp",
    "kubernetes", "node.js", "fastapi", "django", "deep learning",
    "tensorflow", "pytorch", "power bi", "tableau", "java",
    "javascript", "typescript", "algorithms",
}

# ---------------------------------------------------------------------------
# SECTION PATTERNS (for education / experience / projects detection)
# ---------------------------------------------------------------------------
EDU_PATTERNS = re.compile(
    r"\b(b\.?tech|b\.?e|bca|bsc|b\.?com|bba|mca|mba|m\.?tech|m\.?e|msc|"
    r"bachelor|master|phd|degree|university|college|institute|cgpa|gpa|"
    r"10th|12th|sslc|hsc|matriculation)\b",
    re.IGNORECASE,
)

EXP_PATTERNS = re.compile(
    r"\b(intern|internship|experience|worked at|employed|engineer|developer|"
    r"analyst|consultant|manager|trainee|associate|designation|role|"
    r"company|organization|ltd|pvt|inc|llp|llc)\b",
    re.IGNORECASE,
)

PROJECT_PATTERNS = re.compile(
    r"\b(project|developed|built|implemented|designed|created|architected|"
    r"deployed|github|gitlab|portfolio|demo|live at|capstone|thesis)\b",
    re.IGNORECASE,
)

CONTACT_PATTERNS = {
    "email":    re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"),
    "phone":    re.compile(r"(\+91[\s\-]?)?[6-9]\d{9}|\(\d{3}\)\s?\d{3}[\-\s]\d{4}"),
    "linkedin": re.compile(r"linkedin\.com/in/[\w\-]+", re.IGNORECASE),
    "github":   re.compile(r"github\.com/[\w\-]+", re.IGNORECASE),
}


# ---------------------------------------------------------------------------
# RESULT DATACLASS
# ---------------------------------------------------------------------------
@dataclass
class ResumeAnalysisResult:
    ats_score:        int
    strength_level:   str          # "Excellent" | "Good" | "Fair" | "Weak"
    extracted_skills: list[str]
    missing_skills:   list[str]
    skill_categories: dict         # {category: [skills found in that category]}
    has_education:    bool
    has_experience:   bool
    has_projects:     bool
    has_contact:      dict         # {email, phone, linkedin, github} -> bool
    keyword_density:  float        # matched_keywords / total_words * 100
    suggestions:      list[str]
    score_breakdown:  dict         # component scores for UI display
    word_count:       int


# ---------------------------------------------------------------------------
# TEXT EXTRACTION
# ---------------------------------------------------------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from a PDF. Tries pdfplumber first (better layout),
    falls back to pdfminer.six (more robust on edge-case PDFs).
    """
    # --- Attempt 1: pdfplumber ---
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        text = "\n".join(text_parts).strip()
        if text:
            return text
    except Exception:
        pass  # fall through to pdfminer

    # --- Attempt 2: pdfminer.six ---
    try:
        from pdfminer.high_level import extract_text as pm_extract
        text = pm_extract(io.BytesIO(file_bytes))
        if text and text.strip():
            return text.strip()
    except Exception:
        pass

    raise RuntimeError(
        "Could not extract text from this PDF. "
        "Make sure it is a text-based PDF, not a scanned image."
    )


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except ImportError:
        raise RuntimeError("python-docx not installed. Run: pip install python-docx")
    except Exception as exc:
        raise RuntimeError(f"DOCX parsing failed: {exc}") from exc


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route to PDF or DOCX extractor based on filename extension."""
    fname = filename.lower()
    if fname.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif fname.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}. Only PDF and DOCX allowed.")


# ---------------------------------------------------------------------------
# SKILL DETECTION
# ---------------------------------------------------------------------------
def detect_skills(text: str) -> tuple[list[str], dict[str, list[str]]]:
    """
    Case-insensitive full-word skill detection.
    Returns:
        detected      - sorted list of canonical skill names
        by_category   - {category: [skills]} for UI grouping
    """
    text_lower = text.lower()
    detected   = set()
    by_cat: dict[str, list[str]] = {}

    for category, skills in SKILL_DB.items():
        cat_found = []
        for skill in skills:
            # Build a pattern: word-boundary aware, handle dots (Node.js, ASP.NET)
            escaped = re.escape(skill.lower())
            pattern = rf"(?<![a-zA-Z0-9]){escaped}(?![a-zA-Z0-9])"
            if re.search(pattern, text_lower):
                detected.add(skill)
                cat_found.append(skill)
        if cat_found:
            by_cat[category] = cat_found

    return sorted(detected), by_cat


def identify_missing_skills(detected: list[str]) -> list[str]:
    """Return high-value skills absent from the resume."""
    detected_lower = {s.lower() for s in detected}
    missing = []
    for hv in sorted(HIGH_VALUE_SKILLS):
        if hv not in detected_lower:
            # Use canonical form
            canon = _SKILL_LOOKUP.get(hv, hv.title())
            missing.append(canon)
    return missing[:10]  # cap at 10 for readability


# ---------------------------------------------------------------------------
# SECTION DETECTION
# ---------------------------------------------------------------------------
def detect_sections(text: str) -> tuple[bool, bool, bool]:
    """Return (has_education, has_experience, has_projects)."""
    edu  = bool(EDU_PATTERNS.search(text))
    exp  = bool(EXP_PATTERNS.search(text))
    proj = bool(PROJECT_PATTERNS.search(text))
    return edu, exp, proj


def detect_contact(text: str) -> dict[str, bool]:
    """Detect presence of each contact type."""
    return {k: bool(p.search(text)) for k, p in CONTACT_PATTERNS.items()}


# ---------------------------------------------------------------------------
# ATS SCORING  (100 pts total)
# ---------------------------------------------------------------------------
def compute_ats_score(
    detected_skills: list[str],
    has_education: bool,
    has_experience: bool,
    has_projects: bool,
    has_contact: dict,
    word_count: int,
) -> tuple[int, float, dict]:
    """
    ATS scoring breakdown:

    Component                 Weight  Description
    ────────────────────────────────────────────────────────
    Skills coverage             35    matched skills vs high-value benchmark
    Section completeness        25    education + experience + projects
    Keyword density             20    % of resume words that are skill keywords
    Contact completeness        10    email, phone, linkedin, github
    Length / formatting         10    word count in ideal range 300-700
    """
    scores = {}

    # 1. Skills coverage (0–35)
    detected_lower = {s.lower() for s in detected_skills}
    hv_matched     = len(detected_lower & HIGH_VALUE_SKILLS)
    hv_total       = len(HIGH_VALUE_SKILLS)
    # Partial credit: each HV skill = 35/total points, cap at 35
    scores["skills"] = min(round((hv_matched / max(hv_total, 1)) * 35 * 2.2), 35)

    # 2. Section completeness (0–25)
    section_score = 0
    if has_education:  section_score += 10
    if has_experience: section_score += 10
    if has_projects:   section_score += 5
    scores["sections"] = section_score

    # 3. Keyword density (0–20)
    # Ideal: 3–8% of words are recognised skill terms
    words     = re.findall(r"\b[a-zA-Z]{2,}\b", detected_skills.__class__.__name__ or "")
    all_words = re.findall(r"\b[a-zA-Z.#+]{2,}\b", " ".join(detected_skills))
    # Use simple proxy: number of detected skills relative to heuristic baseline
    density   = min(len(detected_skills) / 30.0, 1.0)   # 30 skills -> full score
    scores["density"] = round(density * 20)
    keyword_density = round(density * 100, 1)

    # 4. Contact completeness (0–10)
    contact_pts = sum([
        has_contact.get("email",    False) * 4,
        has_contact.get("phone",    False) * 3,
        has_contact.get("linkedin", False) * 2,
        has_contact.get("github",   False) * 1,
    ])
    scores["contact"] = contact_pts

    # 5. Formatting / length (0–10)
    if 300 <= word_count <= 800:
        fmt_score = 10
    elif 200 <= word_count < 300 or 800 < word_count <= 1200:
        fmt_score = 6
    elif word_count < 200:
        fmt_score = 2
    else:
        fmt_score = 4
    scores["formatting"] = fmt_score

    total = sum(scores.values())
    return min(total, 100), keyword_density, scores


# ---------------------------------------------------------------------------
# SUGGESTIONS ENGINE
# ---------------------------------------------------------------------------
def generate_suggestions(
    detected_skills: list[str],
    missing_skills: list[str],
    has_education: bool,
    has_experience: bool,
    has_projects: bool,
    has_contact: dict,
    word_count: int,
    ats_score: int,
) -> list[str]:
    """Generate up to 8 personalised, prioritised suggestions."""
    tips = []

    if not has_contact.get("email"):
        tips.append("Add your email address — it is required by all ATS systems.")
    if not has_contact.get("linkedin"):
        tips.append("Add your LinkedIn profile URL to strengthen credibility.")
    if not has_contact.get("github") and any(
        s.lower() in {"python", "react", "javascript", "java", "node.js"}
        for s in detected_skills
    ):
        tips.append("Include your GitHub profile link to showcase code and projects.")

    if not has_experience:
        tips.append("Add an Internship / Work Experience section — it is the #1 ATS filter.")
    if not has_projects:
        tips.append("Add a Projects section with 2-3 technical projects and GitHub links.")
    if not has_education:
        tips.append("Add your Education section with degree, institution, and CGPA.")

    top_missing = missing_skills[:4]
    if top_missing:
        tips.append(
            f"Learn these high-demand skills to improve ATS match: "
            f"{', '.join(top_missing)}."
        )

    if word_count < 250:
        tips.append(
            "Your resume is too short (< 250 words). Expand with bullet-point achievements."
        )
    elif word_count > 1100:
        tips.append(
            "Your resume may be too long (> 1100 words). Keep it to 1-2 pages for ATS."
        )

    if len(detected_skills) < 8:
        tips.append(
            "Add more relevant technical skills. Most hired candidates list 10-18 skills."
        )

    if ats_score >= 70 and len(tips) == 0:
        tips.append(
            "Strong resume! Consider tailoring skill keywords to each specific job description."
        )

    return tips[:8]


# ---------------------------------------------------------------------------
# STRENGTH LEVEL
# ---------------------------------------------------------------------------
def get_strength_level(score: int) -> str:
    if score >= 80: return "Excellent"
    if score >= 60: return "Good"
    if score >= 40: return "Fair"
    return "Weak"


# ---------------------------------------------------------------------------
# MAIN ENTRY POINT
# ---------------------------------------------------------------------------
def analyze_resume(file_bytes: bytes, filename: str) -> ResumeAnalysisResult:
    """
    Full resume analysis pipeline.

    1. Extract text (PDF or DOCX)
    2. Detect skills
    3. Detect sections and contact info
    4. Score with ATS algorithm
    5. Generate suggestions
    6. Return ResumeAnalysisResult
    """

    # 1. Text extraction
    text = extract_text(file_bytes, filename)
    if not text or len(text.strip()) < 30:
        raise ValueError(
            "Could not extract readable text from this file. "
            "Ensure the resume is not image-only / scanned."
        )

    word_count = len(re.findall(r"\b\w+\b", text))

    # 2. Skill detection
    detected_skills, by_category = detect_skills(text)
    missing_skills  = identify_missing_skills(detected_skills)

    # 3. Section & contact detection
    has_edu, has_exp, has_proj = detect_sections(text)
    has_contact = detect_contact(text)

    # 4. ATS score
    ats_score, keyword_density, score_breakdown = compute_ats_score(
        detected_skills, has_edu, has_exp, has_proj, has_contact, word_count
    )

    # 5. Suggestions
    suggestions = generate_suggestions(
        detected_skills, missing_skills,
        has_edu, has_exp, has_proj, has_contact,
        word_count, ats_score,
    )

    return ResumeAnalysisResult(
        ats_score        = ats_score,
        strength_level   = get_strength_level(ats_score),
        extracted_skills = detected_skills,
        missing_skills   = missing_skills,
        skill_categories = by_category,
        has_education    = has_edu,
        has_experience   = has_exp,
        has_projects     = has_proj,
        has_contact      = has_contact,
        keyword_density  = keyword_density,
        suggestions      = suggestions,
        score_breakdown  = score_breakdown,
        word_count       = word_count,
    )
