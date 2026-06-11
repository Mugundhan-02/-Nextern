# backend/routes/jobs.py
# =============================================================================
# GET /api/v1/jobs  — Multi-source real job listings
# GET /api/v1/jobs/health — Source health check
#
# Sources (run in parallel):
#   1. Adzuna India  — India jobs (optional free key at developer.adzuna.com)
#   2. Remotive      — Global remote jobs (no key required)
#   3. Arbeitnow     — European / global fallback (no key required)
#
# Priority: India → Remote → International
# =============================================================================

import os
import re
import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
router  = APIRouter()
logger  = logging.getLogger("skillai.jobs")

# ── API config ────────────────────────────────────────────────────────────────
ADZUNA_APP_ID  = os.getenv("ADZUNA_APP_ID",  "").strip()
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "").strip()
ADZUNA_BASE    = "https://api.adzuna.com/v1/api/jobs"
REMOTIVE_BASE  = "https://remotive.com/api/remote-jobs"
ARBEITNOW_BASE = "https://www.arbeitnow.com/api/job-board-api"

# Timeout per HTTP call (seconds). Keep short so the endpoint stays responsive.
REQUEST_TIMEOUT = 10

# ── Simple in-process result cache ────────────────────────────────────────────
# Key: (source_name, cache_key_str)  →  (timestamp, list[dict])
# TTL: 60 seconds — avoids hammering APIs on rapid page loads / re-renders
_CACHE: dict[tuple, tuple] = {}
CACHE_TTL = 60   # seconds


def _cache_get(key: tuple) -> list[dict] | None:
    entry = _CACHE.get(key)
    if entry and (time.monotonic() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _cache_set(key: tuple, value: list[dict]) -> None:
    _CACHE[key] = (time.monotonic(), value)


# ── Indian geography ──────────────────────────────────────────────────────────
INDIA_CITIES = {
    "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai",
    "kolkata", "pune", "ahmedabad", "surat", "jaipur", "lucknow", "noida",
    "gurgaon", "gurugram", "kochi", "coimbatore", "nagpur", "indore",
    "bhopal", "visakhapatnam", "vadodara", "chandigarh", "bhubaneswar",
    "mysore", "mysuru", "madurai", "tiruchirappalli", "trichy", "thane",
    "navi mumbai", "thiruvananthapuram", "trivandrum", "patna", "ranchi",
    "guwahati", "hubli", "dharwad", "mangalore", "mangaluru",
}
INDIA_COUNTRY_TERMS = {"india", "bharat"}
INDIA_TERMS         = INDIA_COUNTRY_TERMS | INDIA_CITIES

_TOKEN_RE = re.compile(r"[^a-z]+")


def _is_india_location(location: str) -> bool:
    """Word-boundary match — avoids 'Berlin' → 'in' false positive."""
    tokens = set(_TOKEN_RE.split(location.lower()))
    for term in INDIA_TERMS:
        if set(term.split()).issubset(tokens):
            return True
    return False


# ── Degree / category mappings ────────────────────────────────────────────────
DEGREE_KEYWORDS: dict[str, list[str]] = {
    "bca":   ["developer", "software", "web", "python", "java", "frontend", "backend"],
    "bsc":   ["analyst", "data", "science", "research", "lab", "statistics"],
    "btech": ["engineer", "developer", "software", "backend", "frontend", "cloud", "devops"],
    "mca":   ["developer", "engineer", "software", "cloud", "full stack"],
    "mba":   ["manager", "analyst", "consultant", "business", "product", "marketing", "strategy"],
    "bcom":  ["finance", "accounting", "tax", "audit", "banking", "commerce"],
    "bba":   ["marketing", "sales", "business", "operations", "hr", "management"],
    "msc":   ["data", "analyst", "research", "scientist", "machine learning"],
}

DEGREE_TO_REMOTIVE_CAT: dict[str, str] = {
    "btech": "software-dev",
    "bca":   "software-dev",
    "mca":   "software-dev",
    "bsc":   "data",
    "msc":   "data",
    "mba":   "management",
    "bba":   "management",
    "bcom":  "finance-legal",
}


# ── Schemas ───────────────────────────────────────────────────────────────────

class JobListing(BaseModel):
    id:             str
    company_name:   str
    job_title:      str
    location:       str
    job_type:       Optional[str]
    salary:         Optional[str]
    apply_url:      str
    remote:         bool
    tags:           list[str]
    posted_date:    Optional[str]
    source:         str
    source_country: str


class SourceStatus(BaseModel):
    name:     str
    ok:       bool
    count:    int
    error:    Optional[str]


class JobsResponse(BaseModel):
    jobs:           list[JobListing]
    total:          int
    page:           int
    sources_used:   list[str]
    source_status:  list[SourceStatus]
    suggestions:    list[str]


class HealthResponse(BaseModel):
    adzuna:    SourceStatus
    remotive:  SourceStatus
    arbeitnow: SourceStatus
    adzuna_configured: bool


# ── Utilities ─────────────────────────────────────────────────────────────────

def _uid(*parts: str) -> str:
    return hashlib.md5("|".join(str(p) for p in parts).encode()).hexdigest()[:16]


def _fmt_date(value) -> str | None:
    if not value:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc).strftime("%Y-%m-%d")
        if isinstance(value, str):
            return value[:10]
    except Exception:
        pass
    return None


def _india_score(location: str) -> int:
    """2 = India, 1 = Remote/Worldwide, 0 = International."""
    if _is_india_location(location):
        return 2
    loc = location.lower()
    if "remote" in loc or "worldwide" in loc or "global" in loc:
        return 1
    return 0


def _source_country(location: str, remote: bool) -> str:
    if _is_india_location(location):
        return "IN"
    loc = location.lower()
    if remote or "remote" in loc or "worldwide" in loc or "global" in loc:
        return "REMOTE"
    return "INTL"


def _keyword_match(text: str, keyword: str) -> bool:
    """All words in keyword must appear in text (AND logic)."""
    kw = keyword.lower().strip()
    if not kw:
        return True
    txt = text.lower()
    return all(word in txt for word in kw.split())


def _build_haystack(job: dict) -> str:
    return " ".join(filter(None, [
        job.get("title", ""),
        job.get("company_name", ""),
        job.get("location", ""),
        " ".join(str(t) for t in job.get("tags", [])),
        str(job.get("job_type", "")),
        (job.get("description") or "")[:600],
    ])).lower()


def _generate_suggestions(keyword: str, degree: str) -> list[str]:
    base: list[str] = []
    if degree and degree not in ("all", ""):
        kws = DEGREE_KEYWORDS.get(degree, [])
        base += [f"{w.title()} roles in India" for w in kws[:3]]
    if keyword:
        base += [
            f"Remote {keyword} jobs",
            f"Fresher {keyword} jobs in India",
        ]
    base += [
        "Python Developer Bangalore",
        "Data Analyst Chennai",
        "Software Engineer Remote",
        "Full Stack Developer fresher",
        "Machine Learning Engineer",
    ]
    return list(dict.fromkeys(base))[:6]


# ── Source fetchers ───────────────────────────────────────────────────────────

async def _fetch_adzuna_india(
    client: httpx.AsyncClient,
    keyword: str,
    location: str,
    job_type: str,
    pages: int = 2,
) -> tuple[list[dict], str | None]:
    """
    Returns (jobs_list, error_message | None).
    Skips gracefully when API credentials are missing.
    """
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        logger.info("[jobs/adzuna] Skipped — credentials not set in .env")
        return [], "Credentials not configured (set ADZUNA_APP_ID/KEY in .env)"

    cache_key = ("adzuna", keyword[:50], location[:30], job_type)
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("[jobs/adzuna] Cache hit: %d jobs", len(cached))
        return cached, None

    results: list[dict] = []
    what  = keyword.strip() or "software engineer"
    where = location.strip() if location.lower() not in ("all", "", "remote") else ""

    contract_map = {"full_time": "permanent", "part_time": "part_time", "internship": "contract"}
    params: dict = {
        "app_id":          ADZUNA_APP_ID,
        "app_key":         ADZUNA_APP_KEY,
        "results_per_page": 20,
        "what":            what,
        "content-type":    "application/json",
    }
    if where:
        params["where"] = where
    if job_type and job_type in contract_map:
        params["contract_type"] = contract_map[job_type]

    error_msg: str | None = None
    for page in range(1, pages + 1):
        try:
            url = f"{ADZUNA_BASE}/in/search/{page}"
            r   = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            for raw in data.get("results", []):
                loc_display = raw.get("location", {}).get("display_name", "India")
                s_min = raw.get("salary_min")
                s_max = raw.get("salary_max")
                salary = None
                if s_min and s_max:
                    salary = f"₹{int(s_min/100000):.1f}L – ₹{int(s_max/100000):.1f}L/yr"
                elif s_min:
                    salary = f"From ₹{int(s_min/100000):.1f}L/yr"
                results.append({
                    "_uid":         _uid("adzuna", str(raw.get("id", ""))),
                    "company_name": raw.get("company", {}).get("display_name", "Unknown"),
                    "title":        raw.get("title", ""),
                    "location":     loc_display,
                    "job_type":     raw.get("contract_type", ""),
                    "salary":       salary,
                    "url":          raw.get("redirect_url", "#"),
                    "remote":       False,
                    "tags":         [raw.get("category", {}).get("label", "")] if raw.get("category") else [],
                    "created_at":   raw.get("created", ""),
                    "description":  raw.get("description", "")[:600],
                    "_source":      "Adzuna",
                    "_source_country": "IN",
                })
            logger.info("[jobs/adzuna] page=%d fetched=%d", page, len(data.get("results", [])))
        except httpx.HTTPStatusError as exc:
            error_msg = f"HTTP {exc.response.status_code}: {exc.response.text[:120]}"
            logger.warning("[jobs/adzuna] HTTP error page %d: %s", page, error_msg)
            break
        except httpx.TimeoutException:
            error_msg = "Request timed out"
            logger.warning("[jobs/adzuna] Timeout on page %d", page)
            break
        except Exception as exc:
            error_msg = str(exc)[:120]
            logger.warning("[jobs/adzuna] Unexpected error page %d: %s", page, exc)
            break

    if results:
        _cache_set(cache_key, results)
    return results, error_msg


async def _fetch_remotive(
    client: httpx.AsyncClient,
    keyword: str,
    degree: str,
) -> tuple[list[dict], str | None]:
    """Returns (jobs_list, error_message | None). No API key required."""
    cache_key = ("remotive", keyword[:50], degree)
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("[jobs/remotive] Cache hit: %d jobs", len(cached))
        return cached, None

    results:   list[dict] = []
    error_msg: str | None = None

    # Build params — omit category when degree is unrecognised so we get more results
    cat    = DEGREE_TO_REMOTIVE_CAT.get(degree.lower().strip(), "")
    params: dict = {"limit": 100}
    if keyword.strip():
        params["search"] = keyword.strip()
    if cat:
        params["category"] = cat

    try:
        r = await client.get(REMOTIVE_BASE, params=params)
        r.raise_for_status()
        data = r.json()
        for raw in data.get("jobs", []):
            loc  = raw.get("candidate_required_location") or "Remote / Worldwide"
            jt   = raw.get("job_type") or "full_time"
            results.append({
                "_uid":         _uid("remotive", str(raw.get("id", ""))),
                "company_name": raw.get("company_name", "Unknown"),
                "title":        raw.get("title", ""),
                "location":     loc,
                "job_type":     jt,
                "salary":       raw.get("salary") or None,
                "url":          raw.get("url", "#"),
                "remote":       True,
                "tags":         raw.get("tags", [])[:6],
                "created_at":   raw.get("publication_date", ""),
                "description":  (raw.get("description") or "")[:600],
                "_source":      "Remotive",
                "_source_country": _source_country(loc, True),
            })
        logger.info("[jobs/remotive] fetched=%d (cat=%r)", len(data.get("jobs", [])), cat or "any")
    except httpx.TimeoutException:
        error_msg = "Request timed out"
        logger.warning("[jobs/remotive] Timeout")
    except httpx.HTTPStatusError as exc:
        error_msg = f"HTTP {exc.response.status_code}"
        logger.warning("[jobs/remotive] HTTP error: %s", error_msg)
    except Exception as exc:
        error_msg = str(exc)[:120]
        logger.warning("[jobs/remotive] Unexpected error: %s", exc)

    if results:
        _cache_set(cache_key, results)
    return results, error_msg


async def _fetch_arbeitnow(
    client: httpx.AsyncClient,
    pages: int = 3,
) -> tuple[list[dict], str | None]:
    """
    Returns (jobs_list, error_message | None).
    Handles 429 Rate Limit gracefully — stops fetching but returns what it got.
    No API key required.
    """
    cache_key = ("arbeitnow", str(pages))
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("[jobs/arbeitnow] Cache hit: %d jobs", len(cached))
        return cached, None

    results:   list[dict] = []
    error_msg: str | None = None

    for page in range(1, pages + 1):
        try:
            r = await client.get(ARBEITNOW_BASE, params={"page": page})
            if r.status_code == 429:
                logger.warning("[jobs/arbeitnow] 429 Rate Limit on page %d — stopping (using %d jobs)", page, len(results))
                break
            r.raise_for_status()
            data = r.json()
            jobs = data.get("data", [])
            if not jobs:
                break
            for raw in jobs:
                loc       = raw.get("location", "")
                is_remote = bool(raw.get("remote"))
                results.append({
                    "_uid":         _uid("arbeitnow", raw.get("slug", f"{page}")),
                    "company_name": raw.get("company_name", "Unknown"),
                    "title":        raw.get("title", ""),
                    "location":     loc or ("Remote" if is_remote else "Location not specified"),
                    "job_type":     "remote" if is_remote else "full_time",
                    "salary":       None,
                    "url":          raw.get("url", "#"),
                    "remote":       is_remote,
                    "tags":         [t for t in raw.get("tags", []) if t][:6],
                    "created_at":   raw.get("created_at"),
                    "description":  (raw.get("description") or "")[:600],
                    "_source":      "Arbeitnow",
                    "_source_country": _source_country(loc, is_remote),
                })
            logger.info("[jobs/arbeitnow] page=%d fetched=%d", page, len(jobs))
        except httpx.TimeoutException:
            error_msg = "Request timed out"
            logger.warning("[jobs/arbeitnow] Timeout on page %d", page)
            break
        except httpx.HTTPStatusError as exc:
            error_msg = f"HTTP {exc.response.status_code}"
            logger.warning("[jobs/arbeitnow] HTTP error page %d: %s", page, exc.response.status_code)
            break
        except Exception as exc:
            error_msg = str(exc)[:120]
            logger.warning("[jobs/arbeitnow] Unexpected error page %d: %s", page, exc)
            break

    if results:
        _cache_set(cache_key, results)
    return results, error_msg


# ── Merge and rank ────────────────────────────────────────────────────────────

def _merge_and_rank(
    raw_lists: list[list[dict]],
    keyword:     str,
    location:    str,
    job_type:    str,
    remote_only: bool,
) -> list[dict]:
    seen_urls: set[str] = set()
    merged: list[dict] = []
    for raw_list in raw_lists:
        for job in raw_list:
            url = job.get("url", "")
            if url and url in seen_urls:
                continue
            seen_urls.add(url)
            merged.append(job)

    loc_filter = location.strip().lower()
    jt_filter  = job_type.strip().lower()
    filtered: list[dict] = []

    for job in merged:
        haystack = _build_haystack(job)

        if keyword and not _keyword_match(haystack, keyword):
            continue

        if loc_filter and loc_filter not in ("all", "remote", ""):
            if loc_filter not in job.get("location", "").lower() and loc_filter not in haystack:
                continue

        if remote_only and not job.get("remote"):
            continue

        if jt_filter and jt_filter not in ("all", ""):
            jt_raw  = job.get("job_type", "").lower().replace("_", " ")
            aliases = {
                "full time": "full", "full-time": "full",
                "part time": "part", "part-time": "part",
                "internship": "intern", "contract": "contract",
            }
            mapped = aliases.get(jt_filter, jt_filter)
            if mapped not in jt_raw and jt_filter not in jt_raw:
                continue

        filtered.append(job)

    source_rank = {"Adzuna": 0, "Remotive": 1, "Arbeitnow": 2}
    filtered.sort(key=lambda j: (
        -_india_score(j.get("location", "")),
        source_rank.get(j.get("_source", ""), 9),
    ))
    return filtered


def _shape(raw: dict) -> JobListing:
    jt = (raw.get("job_type") or "").replace("_", " ").title() or None
    return JobListing(
        id             = raw.get("_uid", _uid(raw.get("url", ""), raw.get("title", ""))),
        company_name   = raw.get("company_name", "Unknown Company"),
        job_title      = raw.get("title", "Untitled Position"),
        location       = raw.get("location", "Not specified"),
        job_type       = jt,
        salary         = raw.get("salary"),
        apply_url      = raw.get("url", "#"),
        remote         = bool(raw.get("remote")),
        tags           = [str(t) for t in raw.get("tags", []) if t][:6],
        posted_date    = _fmt_date(raw.get("created_at")),
        source         = raw.get("_source", "Unknown"),
        source_country = raw.get("_source_country", "INTL"),
    )


# ── Health endpoint ───────────────────────────────────────────────────────────

@router.get(
    "/jobs/health",
    response_model=HealthResponse,
    summary="Check connectivity to all job API sources",
    tags=["Jobs"],
)
async def jobs_health() -> HealthResponse:
    """Diagnostic endpoint. Returns status of each upstream job API source."""

    async def _ping_remotive() -> SourceStatus:
        try:
            async with httpx.AsyncClient(timeout=8) as c:
                r = await c.get(REMOTIVE_BASE, params={"limit": 1})
                r.raise_for_status()
                cnt = len(r.json().get("jobs", []))
                return SourceStatus(name="Remotive", ok=True, count=cnt, error=None)
        except Exception as e:
            return SourceStatus(name="Remotive", ok=False, count=0, error=str(e)[:80])

    async def _ping_arbeitnow() -> SourceStatus:
        try:
            async with httpx.AsyncClient(timeout=8) as c:
                r = await c.get(ARBEITNOW_BASE, params={"page": 1})
                if r.status_code == 429:
                    return SourceStatus(name="Arbeitnow", ok=True, count=0, error="Rate limited (429) — use cache")
                r.raise_for_status()
                cnt = len(r.json().get("data", []))
                return SourceStatus(name="Arbeitnow", ok=True, count=cnt, error=None)
        except Exception as e:
            return SourceStatus(name="Arbeitnow", ok=False, count=0, error=str(e)[:80])

    async def _ping_adzuna() -> SourceStatus:
        if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
            return SourceStatus(name="Adzuna", ok=False, count=0, error="Credentials not set in .env")
        try:
            async with httpx.AsyncClient(timeout=8) as c:
                r = await c.get(
                    f"{ADZUNA_BASE}/in/search/1",
                    params={"app_id": ADZUNA_APP_ID, "app_key": ADZUNA_APP_KEY,
                            "results_per_page": 1, "what": "developer"}
                )
                r.raise_for_status()
                cnt = len(r.json().get("results", []))
                return SourceStatus(name="Adzuna", ok=True, count=cnt, error=None)
        except Exception as e:
            return SourceStatus(name="Adzuna", ok=False, count=0, error=str(e)[:80])

    remotive, arbeitnow, adzuna = await asyncio.gather(
        _ping_remotive(), _ping_arbeitnow(), _ping_adzuna(),
        return_exceptions=False,
    )
    return HealthResponse(
        adzuna            = adzuna,
        remotive          = remotive,
        arbeitnow         = arbeitnow,
        adzuna_configured = bool(ADZUNA_APP_ID and ADZUNA_APP_KEY),
    )


# ── Main endpoint ─────────────────────────────────────────────────────────────

@router.get(
    "/jobs",
    response_model=JobsResponse,
    summary="Multi-source real job listings",
    description=(
        "Fetches live jobs from Adzuna India (optional), Remotive, and Arbeitnow in parallel. "
        "Results are sorted: India → Remote → International. "
        "Never fails the entire request when one source is down — returns partial results."
    ),
    tags=["Jobs"],
)
async def get_jobs(
    keyword:        str  = Query(default="",     description="Company, role, or skill"),
    location:       str  = Query(default="all",  description="City, state or country (e.g. Chennai, India)"),
    degree:         str  = Query(default="all",  description="Degree type (e.g. BTech, BCA, MBA)"),
    specialization: str  = Query(default="",     description="Specialization / skill area"),
    job_type:       str  = Query(default="all",  description="full_time | part_time | internship | remote"),
    remote_only:    bool = Query(default=False,   description="Show only remote jobs"),
    page:           int  = Query(default=1, ge=1, le=100),
    page_size:      int  = Query(default=20, ge=1, le=50),
) -> JobsResponse:

    combined_kw = " ".join(filter(None, [keyword.strip(), specialization.strip()]))
    deg_norm    = degree.strip().lower()

    logger.info(
        "[jobs] kw=%r loc=%r deg=%r type=%r remote=%s page=%d",
        combined_kw, location, deg_norm, job_type, remote_only, page,
    )

    # ── Fetch all sources in parallel ─────────────────────────────
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        results = await asyncio.gather(
            _fetch_adzuna_india(client, combined_kw, location, job_type),
            _fetch_remotive(client, combined_kw, deg_norm),
            _fetch_arbeitnow(client),
            return_exceptions=True,
        )

    # Unpack results — each is (list, error) or an Exception
    def _safe_unpack(result, name: str) -> tuple[list, str | None]:
        if isinstance(result, Exception):
            err = f"{type(result).__name__}: {result}"
            logger.error("[jobs/%s] gather exception: %s", name, err)
            return [], err
        jobs_list, err = result
        return jobs_list or [], err

    adzuna_jobs,    adzuna_err    = _safe_unpack(results[0], "adzuna")
    remotive_jobs,  remotive_err  = _safe_unpack(results[1], "remotive")
    arbeitnow_jobs, arbeitnow_err = _safe_unpack(results[2], "arbeitnow")

    # Build source status list (for frontend display)
    source_status: list[SourceStatus] = [
        SourceStatus(
            name  = "Adzuna",
            ok    = bool(adzuna_jobs),
            count = len(adzuna_jobs),
            error = adzuna_err,
        ),
        SourceStatus(
            name  = "Remotive",
            ok    = bool(remotive_jobs) or remotive_err is None,
            count = len(remotive_jobs),
            error = remotive_err,
        ),
        SourceStatus(
            name  = "Arbeitnow",
            ok    = bool(arbeitnow_jobs) or arbeitnow_err is None,
            count = len(arbeitnow_jobs),
            error = arbeitnow_err,
        ),
    ]

    raw_lists = [adzuna_jobs, remotive_jobs, arbeitnow_jobs]

    # Log summary
    logger.info(
        "[jobs] fetched: adzuna=%d remotive=%d arbeitnow=%d | errors: %s",
        len(adzuna_jobs), len(remotive_jobs), len(arbeitnow_jobs),
        {
            n: e for n, e in [("adzuna", adzuna_err), ("remotive", remotive_err), ("arbeitnow", arbeitnow_err)]
            if e
        }
    )

    # ── Merge, filter, rank ───────────────────────────────────────
    ranked = _merge_and_rank(raw_lists, combined_kw, location, job_type, remote_only)

    total_raw = len(adzuna_jobs) + len(remotive_jobs) + len(arbeitnow_jobs)

    # If ALL sources failed with exceptions (not just empty results), 503
    all_failed = (
        isinstance(results[0], Exception) and
        isinstance(results[1], Exception) and
        isinstance(results[2], Exception)
    )
    if all_failed:
        raise HTTPException(
            status_code=503,
            detail=(
                "All job data sources are currently unreachable. "
                "This is usually a temporary network issue. Please try again in a moment."
            ),
        )

    # ── Paginate ──────────────────────────────────────────────────
    total  = len(ranked)
    start  = (page - 1) * page_size
    end    = start + page_size
    paged  = ranked[start:end]

    jobs_out    = [_shape(r) for r in paged]
    sources_used = [s.name for s in source_status if s.count > 0]
    suggestions  = _generate_suggestions(combined_kw, deg_norm) if total < 5 else []

    logger.info(
        "[jobs] → %d/%d jobs | sources_used=%s",
        len(jobs_out), total, sources_used,
    )

    return JobsResponse(
        jobs          = jobs_out,
        total         = total,
        page          = page,
        sources_used  = sources_used,
        source_status = source_status,
        suggestions   = suggestions,
    )
