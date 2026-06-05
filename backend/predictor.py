"""
backend/predictor.py
══════════════════════════════════════════════════════════════════════════════
Placement Prediction Engine — Phase 3: Real ML Model

This module is the single entry point called by routes/predict.py.
It delegates to the ML model (ml_predictor.py) when the trained artifact
exists, and falls back to the rule-based algorithm when it doesn't.

Flow:
  routes/predict.py
      ↓  calls
  run_prediction(data)          ← this file
      ↓  tries ML first
  ml_predictor.ml_predict(data) ← uses RandomForest trained on 100k rows
      ↓  fallback if model missing
  _rule_based_predict(data)     ← deterministic scoring formula (Phase 2)

Benefits of this design:
  • routes/predict.py never changes regardless of model version
  • Swapping to a new model = update ml_predictor.py only
  • Server starts correctly even if model file hasn't been trained yet
══════════════════════════════════════════════════════════════════════════════
"""

import logging

from schemas import PredictRequest, PredictResponse, CompanyMatch

logger = logging.getLogger("skiliai.predictor")


# ══════════════════════════════════════════════════════════════════════════════
# RULE-BASED FALLBACK
# (Phase 2 algorithm — kept intact as safety net)
# ══════════════════════════════════════════════════════════════════════════════

HIGH_VALUE_SKILLS = {
    "python", "machine learning", "dsa", "data structures",
    "system design", "react", "node.js", "sql", "docker",
    "kubernetes", "aws", "gcp", "azure", "tensorflow", "pytorch",
}

COMPANY_POOL = [
    {"company": "Google",         "role": "SWE L3",             "min_score": 85, "package": "₹24-32 LPA"},
    {"company": "Microsoft",      "role": "SDE-1",              "min_score": 78, "package": "₹18-26 LPA"},
    {"company": "Amazon",         "role": "SDE-1",              "min_score": 75, "package": "₹16-22 LPA"},
    {"company": "Goldman Sachs",  "role": "Tech Analyst",       "min_score": 72, "package": "₹14-20 LPA"},
    {"company": "Razorpay",       "role": "Backend Engineer",   "min_score": 68, "package": "₹12-16 LPA"},
    {"company": "Zoho",           "role": "Software Engineer",  "min_score": 60, "package": "₹8-12 LPA"},
    {"company": "Wipro",          "role": "Software Engineer",  "min_score": 50, "package": "₹5-7 LPA"},
    {"company": "Infosys",        "role": "Systems Engineer",   "min_score": 45, "package": "₹5-7 LPA"},
    {"company": "TCS",            "role": "Assistant Engineer", "min_score": 40, "package": "₹4-6 LPA"},
    {"company": "Cognizant",      "role": "Programmer Analyst", "min_score": 38, "package": "₹4-5 LPA"},
]

COMM_BONUS = {"Poor": -5, "Average": 0, "Good": 5, "Excellent": 10}

EXPECTED_SKILLS = ["DSA", "System Design", "SQL", "Python", "Cloud (AWS/GCP/Azure)"]


def _rule_based_predict(data: PredictRequest) -> PredictResponse:
    """Phase-2 deterministic scoring. Used as fallback if model not found."""

    skills_lower = {s.lower() for s in data.skills}

    # Score components
    cgpa_score     = round((data.cgpa / 10.0) * 45)
    skill_score    = min(len(skills_lower & HIGH_VALUE_SKILLS) * 3, 20)
    intern_score   = min(data.internships * 5, 15)
    project_score  = min(data.projects * 3, 10)
    comm_score     = COMM_BONUS.get(data.communication, 0)
    lc             = data.leetcode_solved or 0
    lc_score       = 5 if lc >= 300 else 3 if lc >= 200 else 1 if lc >= 100 else 0
    backlog_penalty = (data.backlogs or 0) * 8

    probability = max(10, min(98, cgpa_score + skill_score + intern_score
                              + project_score + comm_score + lc_score - backlog_penalty))

    # Status
    if probability >= 85:   status = "Highly Likely to be Placed 🎯"
    elif probability >= 70: status = "Likely Placed ✅"
    elif probability >= 55: status = "Moderate Chances 📈"
    elif probability >= 40: status = "Low Chances — Needs Improvement ⚠️"
    else:                   status = "At Risk — Urgent Action Needed 🚨"

    # Recommendation
    if "dsa" not in skills_lower and "data structures" not in skills_lower:
        recommendation = "Focus on Data Structures & Algorithms — tested by almost every tech company."
    elif "system design" not in skills_lower and probability < 80:
        recommendation = "Add System Design to unlock higher-package opportunities (₹12 LPA+)."
    elif data.cgpa < 7.0:
        recommendation = "Your CGPA is below the 7.0 threshold many companies require."
    elif data.internships == 0:
        recommendation = "Complete at least one internship — companies heavily value real-world experience."
    elif data.projects < 2:
        recommendation = "Build 2–3 portfolio projects with GitHub links to stand out."
    elif probability >= 80:
        recommendation = "Strong profile! Focus on mock interviews and target FAANG / top startups."
    else:
        recommendation = "Improve DSA and System Design to significantly boost your probability."

    # Skill gaps
    skill_gaps = [
        e for e in EXPECTED_SKILLS
        if not any(w in skills_lower for w in e.lower().split())
    ]

    # Company matches
    companies = []
    for c in COMPANY_POOL:
        if probability >= c["min_score"]:
            companies.append(CompanyMatch(
                company=c["company"], role=c["role"],
                confidence=min(probability - c["min_score"] + 60, 97),
                package=c["package"],
            ))
    companies.sort(key=lambda x: x.confidence, reverse=True)

    return PredictResponse(
        probability=probability,
        status=status,
        recommendation=recommendation,
        skill_gaps=skill_gaps,
        top_companies=companies[:6],
    )


# ══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def run_prediction(data: PredictRequest) -> PredictResponse:
    """
    Called by routes/predict.py for every POST /api/v1/predict request.

    Strategy:
      1. Try the trained RandomForest ML model (ml_predictor.ml_predict)
      2. If the model artifact is missing (not yet trained), fall back to
         the rule-based algorithm and log a warning.
      3. If the ML model itself crashes at runtime, fall back and log the error.
    """

    # ── Attempt ML prediction ────────────────────────────────────────────────
    try:
        from ml_predictor import ml_predict
        result = ml_predict(data)
        logger.info(
            "ML prediction: prob=%d  status=%s",
            result.probability, result.status
        )
        return result

    except FileNotFoundError as exc:
        # Model not trained yet — fall back gracefully
        logger.warning(
            "ML model not found — using rule-based fallback.\n"
            "Run  python train_model.py  to train the model.\n"
            "Details: %s", exc
        )

    except Exception as exc:
        # Unexpected ML error — fall back and surface the issue in logs
        logger.error(
            "ML prediction failed (%s: %s) — using rule-based fallback.",
            type(exc).__name__, exc
        )

    # ── Rule-based fallback ─────────────────────────────────────────────────
    return _rule_based_predict(data)
