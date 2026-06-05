# backend/auth_utils.py
# =============================================================================
# JWT creation / verification and password hashing utilities.
#
# Uses the `bcrypt` library directly — no passlib wrapper — to avoid the
# passlib + bcrypt 4.x incompatibility that causes:
#   "(trapped) error reading bcrypt version"
# and silently broken verification in some environments.
#
# API is identical to before; every call site is unchanged:
#   hash_password(plain)          → bcrypt hash string
#   verify_password(plain, hashed) → bool
#   create_access_token(user_id)  → JWT string
#   decode_access_token(token)    → payload dict | None
# =============================================================================

import os
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

# ── Configuration ──────────────────────────────────────────────────────────
SECRET_KEY: str = os.getenv(
    "SECRET_KEY", "skillai-super-secret-dev-key-change-in-production"
)
ALGORITHM:              str = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS: int = 7      # 7-day expiry (generous for dev)
BCRYPT_ROUNDS:          int = 12       # cost factor — ≈250 ms on modern hardware


# ── Password hashing ───────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """
    Return a bcrypt hash of the plain-text password.

    Uses bcrypt directly (not through passlib) to avoid the passlib/bcrypt-4.x
    version-detection bug.  The hash format is standard `$2b$12$...` and is
    fully compatible with hashes produced by passlib.
    """
    salt   = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(plain.encode("utf-8"), salt)
    return hashed.decode("utf-8")   # store as str in VARCHAR column


def verify_password(plain: str, hashed: str) -> bool:
    """
    Return True if `plain` matches the bcrypt `hashed` string.

    Handles both str and bytes for `hashed` (defensive — SQLAlchemy always
    returns str from a VARCHAR column, but guard against edge cases).
    Always returns False on any exception rather than leaking errors.
    """
    try:
        hashed_bytes = hashed.encode("utf-8") if isinstance(hashed, str) else hashed
        plain_bytes  = plain.encode("utf-8")  if isinstance(plain,  str) else plain
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        # bcrypt raises ValueError for malformed hashes — treat as mismatch.
        return False


# ── JWT helpers ────────────────────────────────────────────────────────────

def create_access_token(user_id: int, extra: dict | None = None) -> str:
    """
    Create a signed HS256 JWT for `user_id`.

    Payload fields:
      sub — subject (user_id as string, per JWT convention)
      exp — expiry timestamp
      + any extra fields (e.g. email, name for frontend convenience)
    """
    expire  = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    Returns the payload dict on success, or None if invalid / expired.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
