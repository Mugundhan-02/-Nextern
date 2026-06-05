# backend/database.py
# =============================================================================
# SQLAlchemy database configuration for SkillAI.
#
# Uses SQLite in development. To switch to PostgreSQL later:
#   1. pip install psycopg2-binary
#   2. Set DATABASE_URL in .env to:
#      postgresql://user:password@host:port/dbname
#   3. Remove connect_args (only needed for SQLite thread safety)
#   Everything else stays unchanged because SQLAlchemy abstracts the driver.
# =============================================================================

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ── Connection URL ─────────────────────────────────────────────────────────
# SQLite: file is created next to this module in the backend/ directory.
# Override via DATABASE_URL env var for production PostgreSQL.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{os.path.join(os.path.dirname(__file__), 'skillai.db')}"
)

# connect_args is SQLite-only: allows the same connection to be used across
# multiple threads (needed by FastAPI's async request handling).
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,          # set True to log every SQL statement (useful for debugging)
)

# Each instance of SessionLocal is a database session.
# autocommit=False: we control commits explicitly.
# autoflush=False: we flush manually before queries when needed.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models.
Base = declarative_base()


# ── FastAPI Dependency ─────────────────────────────────────────────────────
def get_db():
    """
    Yield a DB session for use in a FastAPI request, then close it.
    Usage:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Table creation + live migrations ─────────────────────────────────────
def init_db():
    """
    Create all tables and run any needed column migrations.
    SQLAlchemy's create_all() only creates missing tables — it never alters
    existing ones. We handle new columns with explicit ALTER TABLE statements
    so existing skillai.db files upgrade automatically without data loss.
    """
    import models  # noqa: F401 — registers models with Base.metadata
    from sqlalchemy import inspect, text

    Base.metadata.create_all(bind=engine)

    # ── Column migrations for the users table ─────────────────────────────
    # These run only when the column is absent (idempotent).
    with engine.connect() as conn:
        inspector = inspect(engine)
        existing  = {c["name"] for c in inspector.get_columns("users")}

        if "hashed_password" not in existing:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN hashed_password VARCHAR(200)"
            ))
            conn.commit()
            print("  [DB] Migration: added users.hashed_password")

        if "is_active" not in existing:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"
            ))
            conn.commit()
            print("  [DB] Migration: added users.is_active")
