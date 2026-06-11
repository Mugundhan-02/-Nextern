# backend/crud.py
# =============================================================================
# Database CRUD (Create, Read, Update, Delete) operations.
# All database logic is isolated here — routes stay thin.
#
# Design:
#  - Every function takes a SQLAlchemy Session as its first argument.
#  - JSON serialisation/deserialisation for list/dict columns lives here.
#  - Callers (routes) never touch the DB session directly.
# =============================================================================

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import models
from schemas import PredictRequest, PredictResponse


def _utc_iso(dt) -> str | None:
    """Serialise a datetime → ISO 8601 string with explicit +00:00 UTC suffix.

    SQLite stores naive datetimes (no tzinfo). Python's isoformat() on a naive
    datetime emits "2026-06-11T12:30:00" — no suffix. JavaScript's Date() then
    treats it as *local* time, so IST users see timestamps 5 h 30 m too late.

    By tagging naive datetimes as UTC before calling isoformat() we get
    "2026-06-11T12:30:00+00:00", which JS always interprets as UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_USER_EMAIL = "student@skillai.local"
DEFAULT_USER_NAME  = "Mugundhan K"
DEFAULT_DEGREE     = "BE/BTech"
DEFAULT_SPEC       = "Computer Science"


def _j(obj) -> str:
    """Serialize a Python object to a compact JSON string."""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def _pj(s: str):
    """Parse a JSON string back to a Python object. Returns [] on failure."""
    try:
        return json.loads(s)
    except Exception:
        return []


# ─────────────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_default_user(db: Session) -> models.User:
    """Legacy default user — used when no JWT is present (predict/resume)."""
    from sqlalchemy.exc import IntegrityError as _IE
    user = db.query(models.User).filter_by(email=DEFAULT_USER_EMAIL).first()
    if user:
        return user
    user = models.User(
        full_name      = DEFAULT_USER_NAME,
        email          = DEFAULT_USER_EMAIL,
        degree_program = DEFAULT_DEGREE,
        specialization = DEFAULT_SPEC,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except _IE:
        db.rollback()
        user = db.query(models.User).filter_by(email=DEFAULT_USER_EMAIL).first()
    return user


def get_user_by_id(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(
        models.User.email == email.lower().strip()
    ).first()


def create_user(
    db: Session,
    full_name: str,
    email: str,
    hashed_password: str,
    degree_program: str = "BTech CSE",
    specialization: str = "Full Stack Development",
) -> models.User:
    """Create and persist a new authenticated user."""
    from sqlalchemy.exc import IntegrityError as _IE
    user = models.User(
        full_name       = full_name.strip(),
        email           = email.lower().strip(),
        hashed_password = hashed_password,
        degree_program  = degree_program,
        specialization  = specialization,
        is_active       = True,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except _IE:
        db.rollback()
        raise ValueError("Email is already registered.")
    return user


def authenticate_user(db: Session, email: str, plain_password: str) -> models.User | None:
    """Verify email + password. Returns User on success, None on failure."""
    from auth_utils import verify_password
    user = get_user_by_email(db, email)
    if not user or not user.hashed_password:
        return None
    if not verify_password(plain_password, user.hashed_password):
        return None
    return user


def update_user_profile(
    db: Session,
    user_id: int,
    full_name: str | None = None,
    degree_program: str | None = None,
    specialization: str | None = None,
) -> models.User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if full_name is not None:
        user.full_name = full_name
    if degree_program is not None:
        user.degree_program = degree_program
    if specialization is not None:
        user.specialization = specialization
    db.commit()
    db.refresh(user)
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Placement Predictions
# ─────────────────────────────────────────────────────────────────────────────

def save_prediction(
    db: Session,
    user_id: int,
    request: PredictRequest,
    response: PredictResponse,
) -> models.PlacementPrediction:
    """Persist a prediction result to the database."""
    companies_json = _j(
        [{"company": c.company, "role": c.role, "confidence": c.confidence, "package": c.package}
         for c in response.top_companies]
    )
    record = models.PlacementPrediction(
        user_id          = user_id,
        cgpa             = request.cgpa,
        skills_input     = _j(request.skills),
        internships      = request.internships,
        projects         = request.projects,
        communication    = request.communication,
        backlogs         = request.backlogs or 0,
        leetcode_solved  = request.leetcode_solved or 0,
        prediction_score = response.probability,
        status           = response.status,
        recommendation   = response.recommendation,
        company_matches  = companies_json,
        skill_gaps       = _j(response.skill_gaps),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_prediction_history(
    db: Session, user_id: int, limit: int = 20
) -> list[models.PlacementPrediction]:
    return (
        db.query(models.PlacementPrediction)
        .filter(models.PlacementPrediction.user_id == user_id)
        .order_by(models.PlacementPrediction.created_at.desc())
        .limit(limit)
        .all()
    )


def get_prediction_by_id(db: Session, pred_id: int) -> models.PlacementPrediction | None:
    return db.query(models.PlacementPrediction).filter(
        models.PlacementPrediction.id == pred_id
    ).first()


# ─────────────────────────────────────────────────────────────────────────────
# Resume Analyses
# ─────────────────────────────────────────────────────────────────────────────

def save_resume_analysis(
    db: Session,
    user_id: int,
    filename: str,
    result,   # ResumeAnalysisResult dataclass
) -> models.ResumeAnalysis:
    """Persist a resume analysis result to the database."""
    record = models.ResumeAnalysis(
        user_id          = user_id,
        resume_filename  = filename,
        ats_score        = result.ats_score,
        strength_level   = result.strength_level,
        word_count       = result.word_count,
        extracted_skills = _j(result.extracted_skills),
        missing_skills   = _j(result.missing_skills),
        suggestions      = _j(result.suggestions),
        skill_categories = _j(result.skill_categories),
        has_education    = result.has_education,
        has_experience   = result.has_experience,
        has_projects     = result.has_projects,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_resume_history(
    db: Session, user_id: int, limit: int = 20
) -> list[models.ResumeAnalysis]:
    return (
        db.query(models.ResumeAnalysis)
        .filter(models.ResumeAnalysis.user_id == user_id)
        .order_by(models.ResumeAnalysis.created_at.desc())
        .limit(limit)
        .all()
    )


def get_resume_by_id(db: Session, analysis_id: int) -> models.ResumeAnalysis | None:
    return db.query(models.ResumeAnalysis).filter(
        models.ResumeAnalysis.id == analysis_id
    ).first()


# ─────────────────────────────────────────────────────────────────────────────
# Serializers  (model → plain dict for API responses)
# ─────────────────────────────────────────────────────────────────────────────

def serialize_user(u: models.User) -> dict:
    return {
        "id":             u.id,
        "full_name":      u.full_name,
        "email":          u.email,
        "degree_program": u.degree_program,
        "specialization": u.specialization,
        "created_at":     _utc_iso(u.created_at),
        "total_predictions":    len(u.predictions),
        "total_resume_analyses": len(u.resume_analyses),
        "best_prediction_score": max(
            (p.prediction_score for p in u.predictions), default=None
        ),
        "best_ats_score": max(
            (r.ats_score for r in u.resume_analyses), default=None
        ),
    }


def serialize_prediction(p: models.PlacementPrediction) -> dict:
    return {
        "id":               p.id,
        "user_id":          p.user_id,
        "cgpa":             p.cgpa,
        "skills_input":     _pj(p.skills_input),
        "internships":      p.internships,
        "projects":         p.projects,
        "communication":    p.communication,
        "backlogs":         p.backlogs,
        "leetcode_solved":  p.leetcode_solved,
        "prediction_score": p.prediction_score,
        "status":           p.status,
        "recommendation":   p.recommendation,
        "company_matches":  _pj(p.company_matches),
        "skill_gaps":       _pj(p.skill_gaps),
        "created_at":       _utc_iso(p.created_at),
    }


def serialize_resume(r: models.ResumeAnalysis) -> dict:
    return {
        "id":               r.id,
        "user_id":          r.user_id,
        "resume_filename":  r.resume_filename,
        "ats_score":        r.ats_score,
        "strength_level":   r.strength_level,
        "word_count":       r.word_count,
        "extracted_skills": _pj(r.extracted_skills),
        "missing_skills":   _pj(r.missing_skills),
        "suggestions":      _pj(r.suggestions),
        "skill_categories": _pj(r.skill_categories),
        "has_education":    r.has_education,
        "has_experience":   r.has_experience,
        "has_projects":     r.has_projects,
        "created_at":       _utc_iso(r.created_at),
    }
