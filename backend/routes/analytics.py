# backend/routes/analytics.py
# =============================================================================
# GET /api/v1/analytics/summary
#
# SECURITY FIX: This endpoint now requires JWT authentication.
# All user-specific data (predictions, resumes, recent activity, scores, skills,
# score distribution) is filtered by the authenticated user's ID.
#
# Only platform-wide AGGREGATE metadata (total_users, degree_distribution) stays
# global — those contain no personal scores or activities.
#
# Root cause of the previous privacy bug:
#   The endpoint used `Depends(get_db)` only — no `Depends(get_current_user)`.
#   Every query ran against ALL rows in the database, so any logged-in user
#   could see predictions, ATS scores, and activity belonging to other accounts.
#
# Fix:
#   1. Add `current_user = Depends(get_current_user)` to the route.
#   2. Apply `.filter(...user_id == current_user.id)` to every personal query.
# =============================================================================

from __future__ import annotations

import json
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database      import get_db
from routes.auth   import get_current_user   # ← enforces JWT; raises 401 otherwise
import models

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _pj(s: str) -> list:
    """Safe JSON parse → list."""
    try:
        return json.loads(s) if s else []
    except Exception:
        return []



@router.get("/summary")
def analytics_summary(
    current_user = Depends(get_current_user),   # ← REQUIRED: valid JWT
    db: Session  = Depends(get_db),
):
    """
    Returns analytics scoped to the authenticated user.

    Platform-wide stats (total_users, degree_distribution) are global aggregate
    metrics that contain no personal data.

    All other fields (counts, scores, recent_activity, top_skills,
    score_distribution) are filtered strictly to current_user.id.
    """
    uid = current_user.id   # short alias used throughout

    # ── 1. Platform-wide aggregate counts (non-personal) ──────────────────
    total_users = db.query(func.count(models.User.id)).scalar() or 0

    # ── 2. Per-user counts ─────────────────────────────────────────────────
    total_predictions = (
        db.query(func.count(models.PlacementPrediction.id))
        .filter(models.PlacementPrediction.user_id == uid)
        .scalar() or 0
    )
    total_resumes = (
        db.query(func.count(models.ResumeAnalysis.id))
        .filter(models.ResumeAnalysis.user_id == uid)
        .scalar() or 0
    )

    # ── 3. Per-user average scores ─────────────────────────────────────────
    avg_pred_raw = (
        db.query(func.avg(models.PlacementPrediction.prediction_score))
        .filter(models.PlacementPrediction.user_id == uid)
        .scalar()
    )
    avg_prediction_score = round(float(avg_pred_raw), 1) if avg_pred_raw else 0.0

    avg_ats_raw = (
        db.query(func.avg(models.ResumeAnalysis.ats_score))
        .filter(models.ResumeAnalysis.user_id == uid)
        .scalar()
    )
    avg_ats_score = round(float(avg_ats_raw), 1) if avg_ats_raw else 0.0

    # ── 4. Platform-wide degree distribution (aggregate, no personal data) ─
    degree_rows = (
        db.query(models.User.degree_program, func.count(models.User.id))
        .group_by(models.User.degree_program)
        .order_by(func.count(models.User.id).desc())
        .all()
    )
    _short = {
        "BE/BTech": "BTech", "ME/MTech": "MTech",
        "Bachelor of Computer Applications": "BCA",
        "Bachelor of Business Administration": "BBA",
        "Bachelor of Commerce": "BCom",
        "Bachelor of Science": "BSc",
        "Master of Computer Applications": "MCA",
        "Master of Business Administration": "MBA",
    }
    degree_distribution = [
        {
            "dept":  _short.get(row[0], row[0][:8] if row[0] else "Other"),
            "full":  row[0] or "Unknown",
            "count": row[1],
        }
        for row in degree_rows
        if row[0]
    ]

    # ── 5. Top skills — ONLY from the current user's resumes ──────────────
    all_skills: list[str] = []
    skill_rows = (
        db.query(models.ResumeAnalysis.extracted_skills)
        .filter(models.ResumeAnalysis.user_id == uid)        # ← user-scoped
        .all()
    )
    for (raw,) in skill_rows:
        parsed = _pj(raw)
        if isinstance(parsed, list):
            all_skills.extend(str(s).strip() for s in parsed if s)

    skill_counts = Counter(all_skills)
    top_skills = [
        {"skill": sk, "count": cnt}
        for sk, cnt in skill_counts.most_common(10)
        if sk
    ]

    # ── 6. Score distribution — ONLY the current user's predictions ───────
    bucket_labels = ["0–20", "21–40", "41–60", "61–80", "81–100"]
    buckets = [0, 0, 0, 0, 0]
    score_rows = (
        db.query(models.PlacementPrediction.prediction_score)
        .filter(models.PlacementPrediction.user_id == uid)   # ← user-scoped
        .all()
    )
    for (score,) in score_rows:
        if score is None:
            continue
        idx = min(int(score) // 21, 4)
        buckets[idx] += 1

    score_distribution = [
        {"range": label, "count": cnt}
        for label, cnt in zip(bucket_labels, buckets)
    ]

    # ── Response ──────────────────────────────────────────────────────────
    return {
        "total_users":          total_users,           # platform-wide (no personal data)
        "total_predictions":    total_predictions,     # current user only
        "total_resumes":        total_resumes,         # current user only
        "avg_prediction_score": avg_prediction_score,  # current user only
        "avg_ats_score":        avg_ats_score,         # current user only
        "degree_distribution":  degree_distribution,   # platform-wide (no personal data)
        "top_skills":           top_skills,            # current user only
        "score_distribution":   score_distribution,    # current user only
    }
