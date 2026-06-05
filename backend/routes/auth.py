# backend/routes/auth.py
# =============================================================================
# Authentication endpoints: register, login, me, logout.
#
# POST /api/v1/auth/register  — create a new user account
# POST /api/v1/auth/login     — verify credentials, return JWT
# GET  /api/v1/auth/me        — return current user from JWT
# POST /api/v1/auth/logout    — client-side only (stateless JWT)
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
import logging
import re

from database  import get_db
from auth_utils import hash_password, create_access_token, decode_access_token
import crud

router  = APIRouter(prefix="/auth", tags=["Auth"])
bearer  = HTTPBearer(auto_error=False)   # auto_error=False → we raise our own 401
logger  = logging.getLogger("skillai.auth")

# ── Shared validation constants ────────────────────────────────────────────
# Practical RFC-5321 email regex.
# Accepts:  user@gmail.com, name.tag+ext@sub.domain.co.uk
# Rejects:  abc, hello, 12345, test@, @gmail.com, a@b
_EMAIL_RE = re.compile(
    r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
)


def _validate_email_format(v: str) -> str:
    """Lowercase, strip, then assert valid email format."""
    v = v.lower().strip()
    if not _EMAIL_RE.match(v):
        raise ValueError("Please enter a valid email address.")
    return v


def _validate_password_strength(v: str) -> str:
    """
    Enforce password rules (must match frontend PASSWORD_RULES in validation.js):
      • At least 8 characters
      • At least one uppercase letter [A-Z]
      • At least one lowercase letter [a-z]
      • At least one digit [0-9]
    """
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r'[A-Z]', v):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r'[a-z]', v):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r'[0-9]', v):
        raise ValueError("Password must contain at least one number.")
    return v


# ── Request / Response schemas ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name:      str
    email:          str
    password:       str
    degree_program: str = "BTech"
    specialization: str = "Computer Science"

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty.")
        return v

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        return _validate_email_format(v)

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        return _validate_password_strength(v)


class LoginRequest(BaseModel):
    email:    str
    password: str

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        # Validate format on login too — prevents sending garbage to the DB query
        return _validate_email_format(v)



class AuthResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id:             int
    full_name:      str
    email:          str
    degree_program: str
    specialization: str
    created_at:     str | None


# ── Dependency: get current user from Bearer token ─────────────────────────

def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db:    Session = Depends(get_db),
):
    """
    FastAPI dependency — decode the JWT and return the matching User row.
    Raises 401 if the token is missing, invalid, or expired.
    """
    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(creds.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = int(payload["sub"])
    user    = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )
    return user


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db:    Session = Depends(get_db),
):
    """
    Like get_current_user but returns None instead of raising 401.
    Used by /predict and /resume/analyze so they work with or without auth.
    """
    if not creds:
        return None
    payload = decode_access_token(creds.credentials)
    if not payload or "sub" not in payload:
        return None
    try:
        return crud.get_user_by_id(db, int(payload["sub"]))
    except Exception:
        return None


# ── Helpers ────────────────────────────────────────────────────────────────

def _user_dict(user) -> dict:
    return {
        "id":             user.id,
        "full_name":      user.full_name,
        "email":          user.email,
        "degree_program": user.degree_program,
        "specialization": user.specialization,
        "created_at":     user.created_at.isoformat() if user.created_at else None,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new account and return a JWT immediately (auto-login on signup)."""
    # ── Layer 1: application-level duplicate check (fast path, before hashing) ─
    if crud.get_user_by_email(db, body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    # ── Layer 2: create user — DB-level unique constraint is the final guard ──
    try:
        user = crud.create_user(
            db,
            full_name       = body.full_name,
            email           = body.email,
            hashed_password = hash_password(body.password),
            degree_program  = body.degree_program,
            specialization  = body.specialization,
        )
    except ValueError:
        # IntegrityError caught inside crud.create_user → race condition or
        # stale session — treat as duplicate.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    token = create_access_token(user.id, {"email": user.email, "name": user.full_name})
    return AuthResponse(access_token=token, user=_user_dict(user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Verify email + password and return a JWT access token."""
    user = crud.authenticate_user(db, body.email, body.password)
    if not user:
        # Log failed attempts (without leaking the password)
        logger.warning("[auth] Login FAILED for email=%r", body.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    logger.info("[auth] Login OK for user_id=%s email=%r", user.id, user.email)
    token = create_access_token(user.id, {"email": user.email, "name": user.full_name})
    return AuthResponse(access_token=token, user=_user_dict(user))


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return _user_dict(current_user)


@router.post("/logout")
def logout():
    """
    JWT is stateless — logout is client-side (clear the token from localStorage).
    This endpoint exists as a clean hook for future token blacklisting.
    """
    return {"message": "Logged out successfully. Please clear your local token."}
