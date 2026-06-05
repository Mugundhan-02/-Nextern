# ─────────────────────────────────────────────────────────────────
# backend/config.py
# Centralised configuration — reads from .env via python-dotenv.
# All other modules import from here instead of reading os.environ
# directly, so settings are always validated in one place.
# ─────────────────────────────────────────────────────────────────

import os
from dotenv import load_dotenv

# Load variables from the .env file into the environment
load_dotenv()


class Settings:
    """Application-wide settings loaded from environment variables."""

    # API version prefix used in all route paths  (e.g. /api/v1/predict)
    API_VERSION: str = os.getenv("API_VERSION", "v1")

    # Server host & port (used by uvicorn in main.py)
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Application environment — controls debug output & docs visibility
    APP_ENV: str = os.getenv("APP_ENV", "development")

    # Parse comma-separated ALLOWED_ORIGINS string into a Python list
    # e.g.  "http://localhost:5173,http://127.0.0.1:5173"
    #        → ["http://localhost:5173", "http://127.0.0.1:5173"]
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
    ]

    @property
    def is_development(self) -> bool:
        """Returns True when running in the development environment."""
        return self.APP_ENV == "development"


# Create a single shared settings instance — import this everywhere
settings = Settings()
