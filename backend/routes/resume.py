# backend/routes/resume.py
# =============================================================================
# POST /api/v1/resume/analyze
# Accepts PDF or DOCX upload, runs ATS analysis, auto-saves to SQLite.
# =============================================================================

import os
from fastapi  import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from resume_analyzer import analyze_resume, ResumeAnalysisResult
from database        import get_db
from routes.auth     import get_current_user
import crud
import logging

logger = logging.getLogger("skillai.resume")
router = APIRouter()

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB
ALLOWED_EXTENSIONS  = {".pdf", ".docx"}


# ── Response schemas ────────────────────────────────────────────────────────
class ScoreBreakdown(BaseModel):
    skills:     int
    sections:   int
    density:    int
    contact:    int
    formatting: int

class ContactPresence(BaseModel):
    email:    bool
    phone:    bool
    linkedin: bool
    github:   bool

class ResumeAnalysisResponse(BaseModel):
    ats_score:        int
    strength_level:   str
    extracted_skills: list[str]
    missing_skills:   list[str]
    skill_categories: dict[str, list[str]]
    has_education:    bool
    has_experience:   bool
    has_projects:     bool
    has_contact:      ContactPresence
    keyword_density:  float
    suggestions:      list[str]
    score_breakdown:  ScoreBreakdown
    word_count:       int


# ── Endpoint ────────────────────────────────────────────────────────────────
@router.post(
    "/resume/analyze",
    response_model=ResumeAnalysisResponse,
    tags=["Resume"],
    summary="Analyze a resume (PDF/DOCX) — ATS score, skills, suggestions",
)
async def analyze_resume_endpoint(
    file:         UploadFile = File(..., description="PDF or DOCX resume, max 5 MB"),
    db:           Session = Depends(get_db),
    current_user           = Depends(get_current_user),
):
    # 1 — Validate extension
    filename = file.filename or "resume"
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Upload a PDF or DOCX file.",
        )

    # 2 — Read bytes
    file_bytes = await file.read()

    # 3 — Validate size
    if len(file_bytes) == 0:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File is {len(file_bytes)/1024/1024:.1f} MB. Maximum size is 5 MB.",
        )

    # 4 — Analyze
    try:
        r: ResumeAnalysisResult = analyze_resume(file_bytes, filename)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis error: {exc}")

    # 5 — Auto-save to database — always log errors so nothing is silently lost
    try:
        logger.info("[resume] Saving analysis for user_id=%s file=%s", current_user.id, filename)
        record = crud.save_resume_analysis(db, current_user.id, filename, r)
        logger.info("[resume] Saved resume analysis id=%s ats=%s", record.id, record.ats_score)
    except Exception as exc:
        logger.error("[resume] DB save FAILED: %s", exc, exc_info=True)
        # Do NOT re-raise — the analysis result is still returned to the user

    # 6 — Return typed response
    return ResumeAnalysisResponse(
        ats_score        = r.ats_score,
        strength_level   = r.strength_level,
        extracted_skills = r.extracted_skills,
        missing_skills   = r.missing_skills,
        skill_categories = r.skill_categories,
        has_education    = r.has_education,
        has_experience   = r.has_experience,
        has_projects     = r.has_projects,
        has_contact      = ContactPresence(**r.has_contact),
        keyword_density  = r.keyword_density,
        suggestions      = r.suggestions,
        score_breakdown  = ScoreBreakdown(**r.score_breakdown),
        word_count       = r.word_count,
    )
