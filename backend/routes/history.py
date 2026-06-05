# backend/routes/history.py
# =============================================================================
# History & Profile API endpoints — all routes require authentication.
#
# Endpoints:
#   GET  /api/v1/user/profile             — current user profile + stats
#   PUT  /api/v1/user/profile             — update profile fields
#   GET  /api/v1/history/predictions      — last 20 prediction records
#   GET  /api/v1/history/predictions/{id} — single prediction detail
#   GET  /api/v1/history/resumes          — last 20 resume analysis records
#   GET  /api/v1/history/resumes/{id}     — single resume analysis detail
#   GET  /api/v1/history/stats            — aggregated dashboard stats
# =============================================================================

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database    import get_db
from routes.auth import get_current_user   # requires valid JWT — raises 401 otherwise
import crud

logger = logging.getLogger("skillai.history")
router = APIRouter()


# ── Pydantic models for PUT /user/profile ─────────────────────────────────
class ProfileUpdateRequest(BaseModel):
    full_name:      Optional[str] = None
    degree_program: Optional[str] = None
    specialization: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# User Profile
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/user/profile", tags=["Profile"])
def get_profile(
    current_user = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Return the current user's profile and aggregate stats."""
    logger.info("[profile] GET profile for user_id=%s", current_user.id)
    return crud.serialize_user(current_user)


@router.put("/user/profile", tags=["Profile"])
def update_profile(
    body:        ProfileUpdateRequest,
    current_user = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Update editable profile fields for the current user."""
    updated = crud.update_user_profile(
        db,
        user_id        = current_user.id,
        full_name      = body.full_name,
        degree_program = body.degree_program,
        specialization = body.specialization,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    logger.info("[profile] PUT profile updated for user_id=%s", current_user.id)
    return crud.serialize_user(updated)


# ─────────────────────────────────────────────────────────────────────────────
# Prediction History
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/history/predictions", tags=["History"])
def list_predictions(
    limit:       int = 20,
    current_user     = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Return the last `limit` prediction records for the current user."""
    records = crud.get_prediction_history(db, current_user.id, limit=min(limit, 100))
    logger.info("[history] predictions for user_id=%s: %d records", current_user.id, len(records))
    return [crud.serialize_prediction(r) for r in records]


@router.get("/history/predictions/{pred_id}", tags=["History"])
def get_prediction(
    pred_id:     int,
    current_user     = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Return a single prediction record by ID (must belong to current user)."""
    record = crud.get_prediction_by_id(db, pred_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Prediction {pred_id} not found.")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return crud.serialize_prediction(record)


# ─────────────────────────────────────────────────────────────────────────────
# Resume History
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/history/resumes", tags=["History"])
def list_resumes(
    limit:       int = 20,
    current_user     = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Return the last `limit` resume analysis records for the current user."""
    records = crud.get_resume_history(db, current_user.id, limit=min(limit, 100))
    logger.info("[history] resumes for user_id=%s: %d records", current_user.id, len(records))
    return [crud.serialize_resume(r) for r in records]


@router.get("/history/resumes/{analysis_id}", tags=["History"])
def get_resume_analysis(
    analysis_id: int,
    current_user     = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Return a single resume analysis record by ID (must belong to current user)."""
    record = crud.get_resume_by_id(db, analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Resume analysis {analysis_id} not found.")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return crud.serialize_resume(record)


# ─────────────────────────────────────────────────────────────────────────────
# Aggregated Stats
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/history/stats", tags=["History"])
def get_stats(
    current_user = Depends(get_current_user),
    db: Session  = Depends(get_db),
):
    """Return aggregated statistics for the current user."""
    predictions = crud.get_prediction_history(db, current_user.id, limit=500)
    resumes     = crud.get_resume_history(db, current_user.id, limit=500)

    pred_scores = [p.prediction_score for p in predictions]
    ats_scores  = [r.ats_score         for r in resumes]

    logger.info(
        "[history] stats for user_id=%s: %d predictions, %d resumes",
        current_user.id, len(predictions), len(resumes),
    )
    return {
        "total_predictions":     len(predictions),
        "total_resume_analyses": len(resumes),
        "best_prediction_score": max(pred_scores, default=None),
        "avg_prediction_score":  round(sum(pred_scores) / len(pred_scores), 1) if pred_scores else None,
        "best_ats_score":        max(ats_scores, default=None),
        "avg_ats_score":         round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else None,
        "latest_prediction":     crud.serialize_prediction(predictions[0]) if predictions else None,
        "latest_resume":         crud.serialize_resume(resumes[0]) if resumes else None,
    }
