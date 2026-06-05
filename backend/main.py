# ─────────────────────────────────────────────────────────────────
# backend/main.py
# FastAPI application entry point for the SkillAI backend.
#
# This file:
#   1. Creates the FastAPI app instance with a lifespan handler
#   2. Configures CORS middleware (allows the React frontend to call us)
#   3. Registers all API routers
#   4. Exposes health-check and root endpoints
#   5. Starts uvicorn when run directly with: python main.py
# ─────────────────────────────────────────────────────────────────

import uvicorn
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Logging setup (must come before any module imports that use loggers) ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("skillai.main")

# Local imports
from config   import settings
from schemas  import HealthResponse
from database import init_db, SessionLocal
from routes.predict  import router as predict_router
from routes.resume   import router as resume_router
from routes.history  import router as history_router
from routes.auth     import router as auth_router
import crud
from auth_utils import hash_password


def seed_demo_account() -> None:
    """
    Ensure a demo account exists so new users can try the app without
    registering. Credentials: demo@skillai.app / demo1234
    """
    db = SessionLocal()
    try:
        email = "demo@skillai.app"
        if not crud.get_user_by_email(db, email):
            crud.create_user(
                db,
                full_name       = "Demo Student",
                email           = email,
                hashed_password = hash_password("demo1234"),
                degree_program  = "BTech",
                specialization  = "Computer Science",
            )
            logger.info("[startup] Demo account created: %s", email)
        else:
            logger.info("[startup] Demo account already exists: %s", email)
    except Exception as exc:
        logger.warning("[startup] Could not seed demo account: %s", exc)
    finally:
        db.close()


# ── 1. Lifespan handler (startup + shutdown logic) ───────────────
#
# The modern FastAPI way to run code at startup/shutdown.
# Replaces the deprecated @app.on_event("startup") decorator.
# Everything before `yield` runs at startup; after yield at shutdown.
#
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    # Initialise SQLite database — creates tables if they don't exist
    init_db()

    # Seed the demo account (idempotent — safe to call every startup)
    seed_demo_account()

    print(f"\n{'='*55}")
    print(f"  SkillAI API  \u2022  {settings.APP_ENV.upper()} mode")
    print(f"  Listening on  http://{settings.HOST}:{settings.PORT}")
    print(f"  Swagger docs  http://{settings.HOST}:{settings.PORT}/docs")
    print(f"  Auth API      http://{settings.HOST}:{settings.PORT}{f'/api/{settings.API_VERSION}'}/auth/login")
    print(f"  Predict API   http://{settings.HOST}:{settings.PORT}{f'/api/{settings.API_VERSION}'}/predict")
    print(f"  SQLite DB     skillai.db (auto-created)")
    print(f"  CORS origins  {settings.ALLOWED_ORIGINS}")
    print(f"{'='*55}\n")

    yield  # <── app runs here

    # ── Shutdown ─────────────────────────────────────────────────
    print("\nSkillAI API shutting down. Goodbye!\n")


# ── 2. Create the FastAPI application ────────────────────────────

app = FastAPI(
    lifespan=lifespan,
    title="SkillAI — Placement Intelligence API",
    description=(
        "Backend API for the SkillAI Placement & Skill Intelligence Platform. "
        "Provides ML-powered placement prediction, skill gap analysis, "
        "and company matching for engineering students."
    ),
    version="2.0.0",

    # Swagger UI available at /docs  (only in development)
    docs_url="/docs" if settings.is_development else None,

    # ReDoc available at /redoc  (only in development)
    redoc_url="/redoc" if settings.is_development else None,
)



# ── 3. CORS Middleware ────────────────────────────────────────────
#
# CORS (Cross-Origin Resource Sharing) lets the browser make requests
# from the React dev server (localhost:517x) to this API (port 8000).
#
# ── Why the OPTIONS preflight was returning 400 ───────────────────
#
#  Root cause 1 — allow_methods included "OPTIONS" explicitly.
#    FastAPI's CORSMiddleware intercepts OPTIONS internally to build
#    the preflight response. When "OPTIONS" appears in the user-supplied
#    allow_methods list, the middleware logic short-circuits and returns
#    400 instead of the expected 204/200 preflight response.
#    Fix → use allow_methods=["*"] and let the middleware handle OPTIONS.
#
#  Root cause 2 — allow_headers was an explicit list.
#    The browser preflight sends:
#      Access-Control-Request-Headers: content-type
#    If the case or spelling doesn't exactly match one of the listed
#    headers, the middleware rejects the preflight with 400.
#    Fix → use allow_headers=["*"] so any header the browser requests
#    is automatically echoed back as allowed.
#
#  allow_credentials=True is kept — it allows cookies/auth headers
#  from the React app. With explicit origins (not "*") this is safe.
#
# In production:
#   • Set ALLOWED_ORIGINS in .env to your real frontend domain.
#   • Do NOT use allow_origins=["*"] in production.
#
app.add_middleware(
    CORSMiddleware,

    # Origins allowed to make cross-origin requests (from .env)
    allow_origins=settings.ALLOWED_ORIGINS,

    # Allow cookies and Authorization headers from the frontend
    allow_credentials=True,

    # "*" lets the middleware echo back whatever method the browser
    # requests in the preflight — OPTIONS is handled automatically.
    allow_methods=["*"],

    # "*" lets the middleware echo back any requested header, which
    # prevents preflight 400s caused by header case mismatches.
    allow_headers=["*"],
)


# ── 3. Register Routers ───────────────────────────────────────────
#
# Each router handles a group of related endpoints.
# The prefix /api/v1 is prepended to every route in the router.
# So  routes/predict.py's  POST /predict  →  POST /api/v1/predict
#
API_PREFIX = f"/api/{settings.API_VERSION}"

app.include_router(auth_router,    prefix=API_PREFIX)
app.include_router(predict_router, prefix=API_PREFIX)
app.include_router(resume_router,  prefix=API_PREFIX)
app.include_router(history_router, prefix=API_PREFIX)


# ── 4. Root & Health-Check Endpoints ─────────────────────────────


@app.get(
    "/",
    summary="API Root",
    tags=["System"],
)
async def root():
    """
    GET /
    Returns a welcome message confirming the API is reachable.
    Useful for a quick sanity-check from the browser.
    """
    return {
        "message": "SkillAI Placement Intelligence API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "predict": f"{API_PREFIX}/predict",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["System"],
)
async def health_check():
    """
    GET /health
    Lightweight health-check endpoint.
    Load balancers and monitoring tools call this to confirm the
    service is alive without hitting any business logic.
    """
    return HealthResponse(
        status="ok",
        version="2.0.0",
        environment=settings.APP_ENV,
    )


# ── 5. Dev entry point ────────────────────────────────────────────
#
# Run directly:  python main.py
# Or with auto-reload:  uvicorn main:app --reload
#
if __name__ == "__main__":
    uvicorn.run(
        "main:app",          # module:app_instance
        host=settings.HOST,
        port=settings.PORT,
        reload=False,        # disabled to prevent mid-test restarts
        log_level="info",
    )
