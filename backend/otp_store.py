# backend/otp_store.py
# =============================================================================
# Secure in-memory OTP store for email verification during signup.
#
# Design decisions:
#   • OTPs are SHA-256 hashed before storage — plaintext never persists.
#   • Each email can have only one active OTP at a time.
#   • Resend is rate-limited (MAX_RESEND per OTP lifecycle).
#   • After MAX_ATTEMPTS wrong guesses the record is deleted (force re-request).
#   • Records are cleaned up lazily on each operation + explicitly via cleanup().
#   • The full registration payload is stored alongside the OTP so the account
#     is only created after successful verification (no premature DB writes).
# =============================================================================

from __future__ import annotations

import hashlib
import secrets
import time
from dataclasses import dataclass, field
from threading import Lock

# ── Tunable limits ─────────────────────────────────────────────────────────
OTP_TTL       = 300   # seconds — OTP expires after 5 minutes
MAX_ATTEMPTS  = 5     # wrong guesses before record is deleted
MAX_RESEND    = 3     # maximum times a new OTP can be sent for the same email
RESEND_COOLDOWN = 60  # seconds user must wait before requesting another OTP

# ── Pending registration payload ───────────────────────────────────────────
@dataclass
class PendingRegistration:
    """All the data needed to create the account once OTP is verified."""
    full_name:       str
    email:           str
    hashed_password: str          # bcrypt hash — already done before storing
    degree_program:  str
    specialization:  str

# ── OTP record ─────────────────────────────────────────────────────────────
@dataclass
class OTPRecord:
    hashed_otp:   str                # SHA-256(otp_plaintext)
    pending:      PendingRegistration
    created_at:   float              # time.time()
    last_sent_at: float              # time of most recent send (for cooldown)
    attempts:     int = 0
    resend_count: int = 0            # how many times a fresh OTP was issued

# ── Thread-safe store ──────────────────────────────────────────────────────
_store: dict[str, OTPRecord] = {}
_lock  = Lock()


def _hash(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _generate_otp() -> str:
    """Cryptographically secure 6-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


# ── Public API ─────────────────────────────────────────────────────────────

class OTPError(Exception):
    """Raised when an OTP operation cannot proceed."""
    def __init__(self, message: str, code: str = "otp_error"):
        super().__init__(message)
        self.code = code


def create_otp(pending: PendingRegistration) -> str:
    """
    Generate a fresh OTP for *pending.email* and store it securely.

    Returns the plaintext OTP (to be emailed — never stored).

    Raises OTPError if:
      • the resend limit is reached and the previous OTP is still valid, OR
      • the resend cooldown has not elapsed.
    """
    email = pending.email.lower().strip()
    now   = time.time()

    with _lock:
        _cleanup_expired_unsafe()          # evict stale entries first

        existing = _store.get(email)

        if existing:
            age = now - existing.created_at
            if age < OTP_TTL:
                # Active record exists
                if existing.resend_count >= MAX_RESEND:
                    remaining = int(OTP_TTL - age)
                    raise OTPError(
                        f"Too many OTP requests. Please wait {remaining // 60}m "
                        f"{remaining % 60}s and try again.",
                        code="rate_limited",
                    )
                cooldown_left = int(RESEND_COOLDOWN - (now - existing.last_sent_at))
                if cooldown_left > 0:
                    raise OTPError(
                        f"Please wait {cooldown_left} seconds before requesting another OTP.",
                        code="cooldown",
                    )
                new_resend = existing.resend_count + 1
            else:
                # Old record expired — treat as fresh
                new_resend = 0
        else:
            new_resend = 0

        otp = _generate_otp()
        _store[email] = OTPRecord(
            hashed_otp   = _hash(otp),
            pending      = pending,
            created_at   = now,
            last_sent_at = now,
            resend_count = new_resend,
        )
        return otp


def verify_otp(email: str, otp: str) -> PendingRegistration:
    """
    Verify *otp* for *email*.

    Returns the PendingRegistration payload if correct so the caller can
    immediately create the user account.

    Raises OTPError on any failure (expired, wrong, too many attempts, not found).
    """
    email = email.lower().strip()
    now   = time.time()

    with _lock:
        record = _store.get(email)

        if not record:
            raise OTPError(
                "No pending verification found for this email. "
                "Please start registration again.",
                code="not_found",
            )

        if now - record.created_at > OTP_TTL:
            del _store[email]
            raise OTPError(
                "Your OTP has expired (5-minute limit). Please request a new one.",
                code="expired",
            )

        record.attempts += 1

        if _hash(otp) != record.hashed_otp:
            left = MAX_ATTEMPTS - record.attempts
            if left <= 0:
                del _store[email]
                raise OTPError(
                    "Too many incorrect attempts. Please request a new OTP.",
                    code="max_attempts",
                )
            raise OTPError(
                f"Incorrect OTP. {left} attempt{'s' if left != 1 else ''} remaining.",
                code="wrong_otp",
            )

        # ✓ Correct — remove record and return payload
        pending = record.pending
        del _store[email]
        return pending


def get_resend_info(email: str) -> dict:
    """
    Return metadata about any active OTP for *email*:
      resend_count, seconds_until_cooldown_ends, seconds_until_expiry
    Used by the frontend to show accurate timer state.
    """
    email = email.lower().strip()
    now   = time.time()
    with _lock:
        record = _store.get(email)
        if not record:
            return {"active": False}
        age = now - record.created_at
        if age >= OTP_TTL:
            return {"active": False}
        return {
            "active":           True,
            "resend_count":     record.resend_count,
            "resends_left":     MAX_RESEND - record.resend_count,
            "expires_in":       int(OTP_TTL - age),
            "cooldown_ends_in": max(0, int(RESEND_COOLDOWN - (now - record.last_sent_at))),
        }


def _cleanup_expired_unsafe():
    """Remove expired records. MUST be called while _lock is held."""
    now     = time.time()
    expired = [e for e, r in _store.items() if now - r.created_at >= OTP_TTL]
    for e in expired:
        del _store[e]


def cleanup():
    """Thread-safe cleanup — call periodically if desired."""
    with _lock:
        _cleanup_expired_unsafe()
