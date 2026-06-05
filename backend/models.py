# backend/models.py
# =============================================================================
# SQLAlchemy ORM models.
# Each class maps to a database table. Column types, constraints, and
# relationships are declared here.
#
# Tables:
#   users                — Student profile
#   placement_predictions — ML prediction results per user
#   resume_analyses       — Resume ATS analysis results per user
# =============================================================================

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship

from database import Base


def _now() -> datetime:
    """UTC timestamp for default created_at values."""
    return datetime.now(timezone.utc)


# ── 1. Users ──────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name      = Column(String(120), nullable=False, default="Student")
    email          = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=True)  # NULL for legacy/default user
    degree_program = Column(String(80),  nullable=False, default="BE/BTech")
    specialization = Column(String(100), nullable=True,  default="Computer Science")
    is_active      = Column(Boolean, nullable=False, default=True)
    created_at     = Column(DateTime(timezone=True), default=_now, nullable=False)

    # Relationships — lazy loaded (sqlalchemy fetches them on access)
    predictions = relationship(
        "PlacementPrediction", back_populates="user", cascade="all, delete-orphan"
    )
    resume_analyses = relationship(
        "ResumeAnalysis", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


# ── 2. PlacementPredictions ───────────────────────────────────────────────
class PlacementPrediction(Base):
    __tablename__ = "placement_predictions"

    id                  = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Input snapshot (so history shows what was submitted)
    cgpa                = Column(Float,  nullable=False)
    skills_input        = Column(Text,   nullable=False)  # JSON-encoded list[str]
    internships         = Column(Integer, nullable=False, default=0)
    projects            = Column(Integer, nullable=False, default=0)
    communication       = Column(String(20), nullable=False, default="Good")
    backlogs            = Column(Integer, nullable=False, default=0)
    leetcode_solved     = Column(Integer, nullable=False, default=0)

    # Result
    prediction_score    = Column(Integer, nullable=False)   # 0-100 probability
    status              = Column(String(80),  nullable=False)
    recommendation      = Column(Text,    nullable=False)
    company_matches     = Column(Text,    nullable=False)   # JSON-encoded list[dict]
    skill_gaps          = Column(Text,    nullable=False)   # JSON-encoded list[str]

    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    user = relationship("User", back_populates="predictions")

    def __repr__(self) -> str:
        return f"<PlacementPrediction id={self.id} user_id={self.user_id} score={self.prediction_score}>"


# ── 3. ResumeAnalyses ────────────────────────────────────────────────────
class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id                = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id           = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    resume_filename   = Column(String(260), nullable=False)
    ats_score         = Column(Integer, nullable=False)
    strength_level    = Column(String(20), nullable=False)   # Excellent / Good / Fair / Weak
    word_count        = Column(Integer, nullable=False, default=0)

    extracted_skills  = Column(Text, nullable=False)  # JSON list[str]
    missing_skills    = Column(Text, nullable=False)  # JSON list[str]
    suggestions       = Column(Text, nullable=False)  # JSON list[str]
    skill_categories  = Column(Text, nullable=False)  # JSON dict[str, list[str]]

    has_education     = Column(Boolean, nullable=False, default=False)
    has_experience    = Column(Boolean, nullable=False, default=False)
    has_projects      = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    user = relationship("User", back_populates="resume_analyses")

    def __repr__(self) -> str:
        return f"<ResumeAnalysis id={self.id} user_id={self.user_id} ats={self.ats_score}>"
