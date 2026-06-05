# ─────────────────────────────────────────────────────────────────
# backend/schemas.py
# Pydantic models that define the shape of API request and response
# bodies.  FastAPI uses these models to:
#   • Automatically validate incoming JSON
#   • Generate the OpenAPI / Swagger documentation
#   • Serialise outgoing responses
# ─────────────────────────────────────────────────────────────────

from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ── Request Body ──────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Schema for the POST /predict request body.
    The frontend sends these fields from the student profile form.
    """

    cgpa: float = Field(
        ...,                        # "..." means the field is required
        ge=0.0,                     # greater-than-or-equal to 0
        le=10.0,                    # less-than-or-equal to 10
        description="CGPA on a 10-point scale",
        example=8.4,
    )

    skills: list[str] = Field(
        default=[],
        description="List of technical skills the student has",
        example=["Python", "React", "DSA", "Machine Learning"],
    )

    internships: int = Field(
        default=0,
        ge=0,
        le=10,
        description="Number of internships completed",
        example=1,
    )

    projects: int = Field(
        default=0,
        ge=0,
        le=20,
        description="Number of technical projects completed",
        example=2,
    )

    communication: str = Field(
        default="Good",
        description="Self-assessed communication level",
        example="Good",
    )

    backlogs: Optional[int] = Field(
        default=0,
        ge=0,
        description="Number of academic backlogs / arrears",
        example=0,
    )

    leetcode_solved: Optional[int] = Field(
        default=0,
        ge=0,
        description="Number of LeetCode problems solved",
        example=250,
    )

    # Validate that 'communication' is one of the allowed values
    @field_validator("communication")
    @classmethod
    def validate_communication(cls, v: str) -> str:
        allowed = {"Poor", "Average", "Good", "Excellent"}
        if v not in allowed:
            raise ValueError(f"communication must be one of {allowed}")
        return v


# ── Response Body ─────────────────────────────────────────────────

class CompanyMatch(BaseModel):
    """A single company recommendation with a confidence score."""

    company: str = Field(..., description="Company name", example="Infosys")
    role: str = Field(..., description="Job role title", example="Systems Engineer")
    confidence: int = Field(..., ge=0, le=100, description="Match confidence %", example=95)
    package: str = Field(..., description="Expected package range", example="₹5-7 LPA")


class PredictResponse(BaseModel):
    """
    Schema for the POST /predict response body.
    Returned to the frontend after the prediction engine runs.
    """

    probability: int = Field(
        ...,
        ge=0,
        le=100,
        description="Overall placement probability as a percentage (0–100)",
        example=87,
    )

    status: str = Field(
        ...,
        description="Human-readable placement likelihood label",
        example="Likely Placed",
    )

    recommendation: str = Field(
        ...,
        description="Personalised tip to improve placement chances",
        example="Improve DSA and System Design",
    )

    top_companies: list[CompanyMatch] = Field(
        default=[],
        description="Ranked list of company matches for this student profile",
    )

    skill_gaps: list[str] = Field(
        default=[],
        description="Skills identified as missing or below industry standard",
        example=["System Design", "Kubernetes"],
    )


# ── Health-Check Response ─────────────────────────────────────────

class HealthResponse(BaseModel):
    """Simple health-check response to confirm the API is alive."""
    status: str = "ok"
    version: str
    environment: str
