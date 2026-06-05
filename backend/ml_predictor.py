"""
backend/ml_predictor.py
=============================================================================
SkillAI - ML Inference Engine  (Phase 3, v2)

Loads the trained artifact and converts an incoming PredictRequest into
the exact same 7-feature vector used during training:

    FEATURE_COLS = [
        "cgpa",           # float  4.0-10.0    (API: cgpa)
        "skills_count",   # int    0-15        (API: len(high-value skills))
        "internships",    # int    0-5         (API: internships)
        "projects",       # int    0-8         (API: projects)
        "backlogs",       # int    0-5         (API: backlogs)
        "leetcode_solved",# int    0-500       (API: leetcode_solved)
        "communication",  # int    0-3 ordinal (API: Poor/Avg/Good/Excellent)
    ]

No approximation or distribution mismatch. Training and inference
work on exactly the same feature space.
=============================================================================
"""

import os
import math
import joblib
import numpy as np
from typing import Optional

from schemas import PredictRequest, PredictResponse, CompanyMatch

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "placement_model.pkl")

# ── Module-level artifact cache ────────────────────────────────────────────
_artifact: Optional[dict] = None


def _load_artifact() -> dict:
    """Load joblib artifact from disk (cached after first call)."""
    global _artifact
    if _artifact is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                f"Run  python train_model.py  first."
            )
        _artifact = joblib.load(MODEL_PATH)
        version = _artifact.get("schema_version", "1.0")
        print(f"[ml_predictor] Loaded model artifact v{version} from {MODEL_PATH}")
    return _artifact


# =============================================================================
# HIGH-VALUE SKILLS (for counting skills_count feature)
# =============================================================================
HIGH_VALUE_SKILLS = {
    # Core CS / Engineering
    "python", "java", "c", "c++", "javascript", "typescript",
    "machine learning", "deep learning", "ai", "artificial intelligence",
    "dsa", "data structures", "algorithms",
    "system design", "distributed systems",
    "react", "angular", "vue", "node.js", "nodejs", "express",
    "sql", "mysql", "postgresql", "mongodb", "nosql",
    "docker", "kubernetes", "k8s",
    "aws", "gcp", "azure", "cloud",
    "tensorflow", "pytorch", "keras", "scikit-learn",
    "flutter", "kotlin", "swift", "android", "ios",
    "git", "linux", "bash", "shell",
    # Data / Analytics
    "r", "statistics", "data analysis", "power bi", "tableau", "excel",
    "pandas", "numpy", "spark", "hadoop",
    # Business / Management
    "accounting", "tally", "gst", "financial modelling", "finance",
    "marketing", "crm", "seo", "digital marketing", "salesforce",
    "management", "operations", "supply chain", "erp",
    "mba", "leadership", "communication", "project management",
}

COMM_MAP = {"Poor": 0, "Average": 1, "Good": 2, "Excellent": 3}

# =============================================================================
# FEATURE BUILDER
# Produces the same 7-column vector the model was trained on.
# =============================================================================
def _build_feature_vector(data: PredictRequest, feature_cols: list) -> np.ndarray:
    """
    Map a PredictRequest to the training feature schema.

    API field         -> Feature          -> Notes
    -----------------------------------------------------------------------
    data.cgpa         -> cgpa             direct float
    data.skills       -> skills_count     count of HIGH_VALUE_SKILLS matches
    data.internships  -> internships      direct int (strips "+" suffix)
    data.projects     -> projects         direct int
    data.backlogs     -> backlogs         direct int (None -> 0)
    data.leetcode_solved -> leetcode_solved direct int (None -> 0)
    data.communication-> communication   Poor=0, Average=1, Good=2, Excellent=3
    """

    # Skills: count intersection with high-value skill set
    skills_lower  = {s.lower() for s in data.skills}
    skills_count  = len(skills_lower & HIGH_VALUE_SKILLS)

    # Communication: ordinal encoding (must match COMM_MAP used in training)
    comm_ordinal  = COMM_MAP.get(data.communication, 1)  # default: Average

    feature_map = {
        "cgpa":             data.cgpa,
        "skills_count":     float(skills_count),
        "internships":      float(data.internships),
        "projects":         float(data.projects),
        "backlogs":         float(data.backlogs or 0),
        "leetcode_solved":  float(data.leetcode_solved or 0),
        "communication":    float(comm_ordinal),
    }

    row = [feature_map[col] for col in feature_cols]
    return np.array([row], dtype=np.float64)


# =============================================================================
# POST-PREDICTION BUSINESS LOGIC
# (status label, recommendation, skill gaps, company matches)
# All of this stays Python-based — only the probability comes from the model.
# =============================================================================

COMPANY_POOL = [
    {"company": "Google",        "role": "SWE L3",             "min_score": 88, "package": "Rs.24-32 LPA"},
    {"company": "Microsoft",     "role": "SDE-1",              "min_score": 82, "package": "Rs.18-26 LPA"},
    {"company": "Amazon",        "role": "SDE-1",              "min_score": 77, "package": "Rs.16-22 LPA"},
    {"company": "Goldman Sachs", "role": "Tech Analyst",       "min_score": 73, "package": "Rs.14-20 LPA"},
    {"company": "Razorpay",      "role": "Backend Engineer",   "min_score": 68, "package": "Rs.12-16 LPA"},
    {"company": "Freshworks",    "role": "Software Engineer",  "min_score": 63, "package": "Rs.10-14 LPA"},
    {"company": "Zoho",          "role": "Software Engineer",  "min_score": 57, "package": "Rs.8-12 LPA"},
    {"company": "Wipro",         "role": "Software Engineer",  "min_score": 49, "package": "Rs.5-7 LPA"},
    {"company": "Infosys",       "role": "Systems Engineer",   "min_score": 44, "package": "Rs.5-7 LPA"},
    {"company": "TCS",           "role": "Assistant Engineer", "min_score": 38, "package": "Rs.4-6 LPA"},
    {"company": "Cognizant",     "role": "Programmer Analyst", "min_score": 33, "package": "Rs.4-5 LPA"},
]

EXPECTED_SKILLS = ["DSA", "System Design", "SQL", "Python", "Cloud (AWS/GCP/Azure)"]


def _get_status_label(prob: int) -> str:
    if   prob >= 85: return "Highly Likely to be Placed"
    elif prob >= 70: return "Likely Placed"
    elif prob >= 55: return "Moderate Chances"
    elif prob >= 40: return "Low Chances - Needs Improvement"
    else:            return "At Risk - Urgent Action Needed"


def _get_recommendation(prob: int, data: PredictRequest) -> str:
    skills_lower = {s.lower() for s in data.skills}

    if "dsa" not in skills_lower and "data structures" not in skills_lower:
        return "Focus on Data Structures & Algorithms - tested in almost every tech interview."
    if "system design" not in skills_lower and prob < 80:
        return "Add System Design skills to unlock Rs.12 LPA+ opportunities."
    if data.cgpa < 6.5:
        return "Your CGPA is below the 6.5 cutoff many companies enforce. Prioritise academics."
    if data.internships == 0:
        return "Complete at least one internship - companies value real-world experience highly."
    if data.projects < 2:
        return "Build 2-3 portfolio projects and push them to GitHub to stand out."
    if (data.leetcode_solved or 0) < 100:
        return "Solve 100+ LeetCode problems to sharpen your DSA and interview performance."
    if prob >= 85:
        return "Excellent profile! Practise mock interviews and target FAANG / top-tier startups."
    return "Strengthen core technical skills and add one more internship to significantly boost chances."


def _get_skill_gaps(data: PredictRequest) -> list[str]:
    skills_lower = {s.lower() for s in data.skills}
    return [
        expected for expected in EXPECTED_SKILLS
        if not any(word in skills_lower for word in expected.lower().split())
    ]


def _get_company_matches(prob: int) -> list[CompanyMatch]:
    matches = [
        CompanyMatch(
            company=c["company"],
            role=c["role"],
            confidence=min(prob - c["min_score"] + 58, 97),
            package=c["package"],
        )
        for c in COMPANY_POOL
        if prob >= c["min_score"]
    ]
    matches.sort(key=lambda x: x.confidence, reverse=True)
    return matches[:6]


# =============================================================================
# PUBLIC ENTRY POINT  (called by predictor.py)
# =============================================================================
def ml_predict(data: PredictRequest) -> PredictResponse:
    """
    Run ML inference on a PredictRequest and return a PredictResponse.

    Steps:
      1. Load the artifact (model + feature_cols) -- cached after first call
      2. Build a 7-element feature vector from the API request
      3. Call model.predict_proba() -> placement probability (0-100)
      4. Derive status, recommendation, skill gaps, company matches
      5. Return PredictResponse (schema unchanged -- frontend unaffected)
    """
    artifact     = _load_artifact()
    model        = artifact["model"]
    feature_cols = artifact["feature_cols"]

    # Build 1-row feature matrix
    X = _build_feature_vector(data, feature_cols)

    # predict_proba returns [[prob_not_placed, prob_placed]]
    prob_placed  = model.predict_proba(X)[0][1]
    probability  = max(10, min(98, math.floor(prob_placed * 100)))

    return PredictResponse(
        probability    = probability,
        status         = _get_status_label(probability),
        recommendation = _get_recommendation(probability, data),
        skill_gaps     = _get_skill_gaps(data),
        top_companies  = _get_company_matches(probability),
    )
