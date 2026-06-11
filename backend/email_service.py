# backend/email_service.py
# =============================================================================
# SMTP email service for SkillAI.
#
# Dev mode  (SMTP_USER is blank):  OTP is printed to the backend console.
# Prod mode (SMTP_USER configured): OTP is sent via SMTP/TLS.
#
# Recommended free SMTP providers:
#   • Gmail   — smtp.gmail.com:587  (use App Password, not account password)
#   • Outlook — smtp.office365.com:587
#   • Brevo   — smtp-relay.brevo.com:587  (300 emails/day free)
#   • Mailjet — in-v3.mailjet.com:587     (200 emails/day free)
#
# Add to backend/.env:
#   SMTP_HOST=smtp.gmail.com
#   SMTP_PORT=587
#   SMTP_USER=you@gmail.com
#   SMTP_PASSWORD=your-app-password
#   FROM_EMAIL=you@gmail.com        (optional, defaults to SMTP_USER)
#   FROM_NAME=SkillAI               (optional)
# =============================================================================

from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText

logger = logging.getLogger("skillai.email")

# ── Config from env ────────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST",     "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER",     "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL    = os.getenv("FROM_EMAIL",    SMTP_USER)
FROM_NAME     = os.getenv("FROM_NAME",     "SkillAI")
APP_NAME      = "SkillAI"


# ── Email templates ────────────────────────────────────────────────────────

def _otp_html(name: str, otp: str, expires_minutes: int = 5) -> str:
    """Professional HTML email template for OTP delivery."""
    first = name.split()[0] if name else "there"
    digits = "".join(
        f'<span style="display:inline-block;width:44px;height:54px;line-height:54px;'
        f'text-align:center;font-size:26px;font-weight:800;letter-spacing:0;'
        f'background:#1e2a4a;border:2px solid #3b4a7a;border-radius:10px;'
        f'color:#a5b4fc;margin:0 4px;">{d}</span>'
        for d in otp
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your {APP_NAME} Verification Code</title></head>
<body style="margin:0;padding:0;background:#070b16;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#070b16;padding:40px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#0f1629;border:1px solid #1e2a4a;border-radius:20px;overflow:hidden;">

      <!-- Header gradient bar -->
      <tr><td style="height:4px;background:linear-gradient(to right,#6366f1,#8b5cf6);"></td></tr>

      <!-- Logo + title -->
      <tr><td style="padding:36px 40px 0;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:42px;height:42px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
               border-radius:12px;display:flex;align-items:center;justify-content:center;
               font-size:20px;">🧠</div>
          <span style="font-size:22px;font-weight:900;color:#f1f5f9;letter-spacing:-0.5px;">{APP_NAME}</span>
        </div>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#f1f5f9;">
          Verify your email address
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:#64748b;">
          Hi {first}, here is your one-time verification code.
        </p>
      </td></tr>

      <!-- OTP digits -->
      <tr><td style="padding:32px 40px;text-align:center;">
        <div style="background:#141c35;border:1px solid #1e2a4a;border-radius:16px;
             padding:28px 24px;display:inline-block;">
          {digits}
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#475569;">
          This code expires in <strong style="color:#a5b4fc;">{expires_minutes} minutes</strong>.
          Do not share it with anyone.
        </p>
      </td></tr>

      <!-- Security note -->
      <tr><td style="padding:0 40px 32px;">
        <div style="background:#1a1f35;border:1px solid #252d4a;border-radius:12px;padding:16px 20px;">
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
            🔒 <strong style="color:#64748b;">Security tip:</strong>
            {APP_NAME} will never ask for your OTP over phone or chat.
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 40px 28px;border-top:1px solid #1e2a4a;text-align:center;">
        <p style="margin:0;font-size:11px;color:#334155;">
          © 2026 {APP_NAME} · Placement Intelligence Platform
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


def _otp_text(name: str, otp: str, expires_minutes: int = 5) -> str:
    """Plain-text fallback for email clients that don't render HTML."""
    first = name.split()[0] if name else "there"
    return (
        f"Hi {first},\n\n"
        f"Your {APP_NAME} verification code is:\n\n"
        f"    {otp}\n\n"
        f"This code expires in {expires_minutes} minutes.\n"
        f"Do not share it with anyone.\n\n"
        f"If you did not request this, ignore this email.\n\n"
        f"— The {APP_NAME} Team"
    )


# ── Public send function ───────────────────────────────────────────────────

def send_otp_email(to_email: str, name: str, otp: str, expires_minutes: int = 5) -> bool:
    """
    Send the OTP to *to_email*.

    In development (SMTP_USER is empty), the OTP is printed to stdout and
    the function returns True so the flow continues uninterrupted.

    Returns True on success, False on SMTP failure (caller should surface error).
    """
    # ── Dev / no-SMTP mode ──────────────────────────────────────────────
    if not SMTP_USER or not SMTP_PASSWORD:
        border = "─" * 52
        print(f"\n{'─'*52}")
        print(f"  📧  OTP EMAIL  (dev mode — no SMTP configured)")
        print(f"{'─'*52}")
        print(f"  To   : {to_email}")
        print(f"  Name : {name}")
        print(f"  OTP  : {otp}")
        print(f"  TTL  : {expires_minutes} minutes")
        print(f"{'─'*52}\n")
        logger.info("[email] DEV — OTP for %s: %s", to_email, otp)
        return True

    # ── Production SMTP ─────────────────────────────────────────────────
    try:
        msg                   = MIMEMultipart("alternative")
        msg["Subject"]        = f"Your {APP_NAME} verification code: {otp}"
        msg["From"]           = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"]             = to_email
        msg["X-Priority"]     = "1"
        msg["X-Mailer"]       = APP_NAME

        msg.attach(MIMEText(_otp_text(name, otp, expires_minutes), "plain", "utf-8"))
        msg.attach(MIMEText(_otp_html(name, otp, expires_minutes), "html",  "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())

        logger.info("[email] OTP sent to %s", to_email)
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("[email] SMTP auth failed — check SMTP_USER / SMTP_PASSWORD in .env")
        return False
    except smtplib.SMTPException as exc:
        logger.error("[email] SMTP error sending to %s: %s", to_email, exc)
        return False
    except OSError as exc:
        logger.error("[email] Network error sending to %s: %s", to_email, exc)
        return False
