# backend/routes/jobs.py
# =============================================================================
# GET /api/v1/jobs          — Multi-source real job listings
# GET /api/v1/jobs/health   — Source health check
#
# ── SOURCES ──────────────────────────────────────────────────────────────────
#   1. Adzuna India   — Real India jobs (free key at developer.adzuna.com)
#                       Set ADZUNA_APP_ID / ADZUNA_APP_KEY in backend/.env
#   2. Internshala    — India-only internships (no key, JSON API)
#                       Best India source when Adzuna key is absent.
#   3. Remotive       — Global remote jobs (no key, kept as REMOTE fallback)
#   4. Arbeitnow      — European / global fallback (no key, last resort)
#
# ── WHY INTERNATIONAL JOBS WERE APPEARING FIRST ──────────────────────────────
#   • Adzuna India requires credentials → silently skipped → 0 India jobs.
#   • Remotive returns ~100 global remote jobs → filled the top of the list.
#   • Arbeitnow is EU-focused → Germany, Poland, Netherlands dominated.
#   • _india_score only had 3 levels; without IN jobs it had no effect.
#
# ── NEW RANKING SYSTEM ────────────────────────────────────────────────────────
#   Score 10 — Chennai / Coimbatore (Tamil Nadu priority cities)
#   Score  9 — Tamil Nadu (other TN cities: Madurai, Trichy, …)
#   Score  8 — Bangalore, Hyderabad, Pune, Mumbai, Delhi/NCR
#   Score  7 — Any other Indian city / "India" / "Bharat"
#   Score  5 — "Remote India" or hybrid India
#   Score  3 — Generic remote / worldwide (Remotive)
#   Score  1 — International (Arbeitnow / non-India)
#   Score  0 — Location unknown
#
#   Sorted descending, so Chennai startups beat Netherlands MNCs.
#
# ── FALLBACK CHAIN ────────────────────────────────────────────────────────────
#   Chennai → Tamil Nadu → India → Remote → International
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
router = APIRouter()
logger = logging.getLogger("skillai.jobs")

# ── API config ────────────────────────────────────────────────────────────────
ADZUNA_APP_ID  = os.getenv("ADZUNA_APP_ID",  "").strip()
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "").strip()
ADZUNA_BASE    = "https://api.adzuna.com/v1/api/jobs"
REMOTIVE_BASE  = "https://remotive.com/api/remote-jobs"
ARBEITNOW_BASE = "https://www.arbeitnow.com/api/job-board-api"

# Internshala public JSON endpoint (no auth required)
# Supports keyword search; returns India internships only.
INTERNSHALA_BASE = "https://internshala.com/internships/matching-preferences"
# We use their search API which returns JSON when Accept: application/json
INTERNSHALA_SEARCH = "https://internshala.com/internships/search"

REQUEST_TIMEOUT = 12   # seconds per HTTP call

# ── Cache ─────────────────────────────────────────────────────────────────────
_CACHE: dict[tuple, tuple] = {}
CACHE_TTL = 90  # seconds (longer for India sources to reduce hammering)


def _cache_get(key: tuple) -> list[dict] | None:
    entry = _CACHE.get(key)
    if entry and (time.monotonic() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _cache_set(key: tuple, value: list[dict]) -> None:
    _CACHE[key] = (time.monotonic(), value)


# ── Indian geography — granular scoring ───────────────────────────────────────

# Priority-1: Tamil Nadu cities (score 10 for Chennai/Coimbatore, 9 for others)
CHENNAI_TERMS  = {"chennai", "madras"}
COIMBATORE_TERMS = {"coimbatore", "kovai"}
TAMILNADU_CITIES = {
    "madurai", "tiruchirappalli", "trichy", "salem", "tirunelveli",
    "tiruppur", "vellore", "erode", "thoothukudi", "tuticorin",
    "dindigul", "thanjavur", "cuddalore", "kanyakumari", "nagercoil",
    "sivakasi", "karur", "namakkal", "hosur", "kumbakonam",
}
TAMILNADU_TERMS = {"tamil nadu", "tamilnadu", "tn"} | CHENNAI_TERMS | COIMBATORE_TERMS | TAMILNADU_CITIES

# Priority-2: Major non-TN tech hubs (score 8)
TIER1_CITIES = {
    "bangalore", "bengaluru", "hyderabad", "pune", "mumbai",
    "delhi", "ncr", "noida", "gurgaon", "gurugram", "new delhi",
}

# All India cities (score 7)
INDIA_CITIES = TIER1_CITIES | TAMILNADU_CITIES | {
    "kolkata", "ahmedabad", "surat", "jaipur", "lucknow", "kochi",
    "nagpur", "indore", "bhopal", "visakhapatnam", "vadodara",
    "chandigarh", "bhubaneswar", "mysore", "mysuru", "thane",
    "navi mumbai", "thiruvananthapuram", "trivandrum", "patna",
    "ranchi", "guwahati", "hubli", "dharwad", "mangalore", "mangaluru",
    "raipur", "agra", "meerut", "nashik", "faridabad", "ghaziabad",
    "rajkot", "kalyan", "vasai", "aurangabad", "amritsar",
    "jabalpur", "warangal", "coimbatore", "madurai",
}
INDIA_COUNTRY_TERMS = {"india", "bharat", "pan india", "anywhere in india"}
INDIA_TERMS = INDIA_COUNTRY_TERMS | INDIA_CITIES

_TOKEN_RE = re.compile(r"[^a-z]+")


def _tokens(text: str) -> set[str]:
    return set(filter(None, _TOKEN_RE.split(text.lower())))


def _term_in_tokens(term: str, tok: set[str]) -> bool:
    """All words in multi-word term must be present (order-independent)."""
    return set(term.split()).issubset(tok)


def _india_detail_score(location: str) -> int:
    """
    Returns a granular India priority score (higher = more preferred):
      10 = Chennai / Coimbatore
       9 = Tamil Nadu (other TN cities)
       8 = Bangalore / Hyderabad / Pune / Mumbai / Delhi NCR
       7 = Other Indian city / 'India' / 'Bharat'
       5 = Remote India / Hybrid India
       3 = Generic remote / worldwide
       1 = International
       0 = Unknown / empty
    """
    if not location:
        return 0
    loc  = location.lower()
    tok  = _tokens(loc)

    # Chennai / Coimbatore — highest priority
    if any(_term_in_tokens(t, tok) for t in CHENNAI_TERMS):
        return 10
    if any(_term_in_tokens(t, tok) for t in COIMBATORE_TERMS):
        return 10

    # Tamil Nadu other cities
    if any(_term_in_tokens(t, tok) for t in TAMILNADU_TERMS):
        return 9

    # Tier-1 Indian cities
    if any(_term_in_tokens(t, tok) for t in TIER1_CITIES):
        return 8

    # Any India city / country term
    if any(_term_in_tokens(t, tok) for t in INDIA_TERMS):
        return 7

    # "Remote, India" or "India (Remote)" or "Work from home" (Indian context)
    if ("remote" in tok or "hybrid" in tok or "wfh" in tok or "work from home" in loc) \
            and any(_term_in_tokens(t, tok) for t in INDIA_COUNTRY_TERMS | INDIA_CITIES):
        return 5

    # Generic remote / worldwide
    if "remote" in tok or "worldwide" in tok or "global" in tok or "work from home" in loc:
        return 3

    # International / unknown
    return 1


def _is_india_location(location: str) -> bool:
    tok = _tokens(location)
    return any(_term_in_tokens(t, tok) for t in INDIA_TERMS)


def _source_country(location: str, remote: bool) -> str:
    if _is_india_location(location):
        return "IN"
    loc = location.lower()
    if remote or "remote" in loc or "worldwide" in loc or "global" in loc:
        return "REMOTE"
    return "INTL"


# ── Degree / category mappings ────────────────────────────────────────────────

DEGREE_KEYWORDS: dict[str, list[str]] = {
    "bca":   ["developer", "software", "web", "python", "java", "frontend", "backend"],
    "bsc":   ["analyst", "data", "science", "research", "statistics"],
    "btech": ["engineer", "developer", "software", "backend", "frontend", "cloud", "devops"],
    "mca":   ["developer", "engineer", "software", "cloud", "full stack"],
    "mba":   ["manager", "analyst", "consultant", "business", "product", "marketing"],
    "bcom":  ["finance", "accounting", "tax", "audit", "banking"],
    "bba":   ["marketing", "sales", "business", "operations", "hr"],
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

# Default keyword injected when no keyword is provided (makes Adzuna/Internshala
# return relevant Indian fresher jobs instead of a random firehose)
DEGREE_DEFAULT_KW: dict[str, str] = {
    "bca":   "software developer intern",
    "bsc":   "data analyst intern",
    "btech": "software engineer fresher",
    "mca":   "software developer fresher",
    "mba":   "management trainee",
    "bcom":  "finance intern",
    "bba":   "marketing intern",
    "msc":   "data scientist intern",
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
    india_score:    int   # exposed so frontend can show ranking reason


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
        (job.get("description") or "")[:800],
    ])).lower()


def _generate_suggestions(keyword: str, degree: str) -> list[str]:
    base: list[str] = []
    if degree and degree not in ("all", ""):
        kws = DEGREE_KEYWORDS.get(degree, [])
        base += [f"{w.title()} intern Chennai" for w in kws[:2]]
        base += [f"{w.title()} jobs Bangalore" for w in kws[:2]]
    if keyword:
        base += [
            f"{keyword} internship Chennai",
            f"{keyword} jobs India",
            f"Remote {keyword} fresher",
        ]
    base += [
        "Python Developer Chennai",
        "Data Analyst Bangalore",
        "Software Engineer fresher India",
        "Full Stack Developer internship",
        "Machine Learning intern",
    ]
    return list(dict.fromkeys(base))[:6]


# ── Source 1: Adzuna India ────────────────────────────────────────────────────

async def _fetch_adzuna_india(
    client: httpx.AsyncClient,
    keyword: str,
    location: str,
    job_type: str,
    pages: int = 2,
) -> tuple[list[dict], str | None]:
    """Real India jobs via Adzuna India API. Requires ADZUNA_APP_ID/KEY in .env."""
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        logger.info("[jobs/adzuna] Skipped — credentials not set in .env")
        return [], "Credentials not configured (get free key at developer.adzuna.com)"

    cache_key = ("adzuna", keyword[:50], location[:30], job_type)
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("[jobs/adzuna] Cache hit: %d jobs", len(cached))
        return cached, None

    results: list[dict] = []
    what  = keyword.strip() or "software engineer"
    where = location.strip() if location.lower() not in ("all", "", "remote") else "India"

    contract_map = {"full_time": "permanent", "part_time": "part_time", "internship": "contract"}
    params: dict = {
        "app_id":           ADZUNA_APP_ID,
        "app_key":          ADZUNA_APP_KEY,
        "results_per_page": 20,
        "what":             what,
        "content-type":     "application/json",
    }
    if where and where.lower() != "all":
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
                score = _india_detail_score(loc_display)
                results.append({
                    "_uid":         _uid("adzuna", str(raw.get("id", ""))),
                    "company_name": raw.get("company", {}).get("display_name", "Unknown"),
                    "title":        raw.get("title", ""),
                    "location":     loc_display,
                    "job_type":     raw.get("contract_type", "Full Time"),
                    "salary":       salary,
                    "url":          raw.get("redirect_url", "#"),
                    "remote":       False,
                    "tags":         [raw.get("category", {}).get("label", "")] if raw.get("category") else [],
                    "created_at":   raw.get("created", ""),
                    "description":  raw.get("description", "")[:800],
                    "_source":      "Adzuna",
                    "_source_country": "IN",
                    "_india_score": max(score, 7),  # Adzuna is India API — minimum score 7
                })
            logger.info("[jobs/adzuna] page=%d fetched=%d", page, len(data.get("results", [])))
        except httpx.HTTPStatusError as exc:
            error_msg = f"HTTP {exc.response.status_code}: {exc.response.text[:120]}"
            logger.warning("[jobs/adzuna] HTTP error page %d: %s", page, error_msg)
            break
        except (httpx.TimeoutException, httpx.ConnectError):
            error_msg = "Request timed out"
            logger.warning("[jobs/adzuna] Timeout on page %d", page)
            break
        except Exception as exc:
            error_msg = str(exc)[:120]
            logger.warning("[jobs/adzuna] Error page %d: %s", page, exc)
            break

    if results:
        _cache_set(cache_key, results)
    return results, error_msg


# ── Source 2: Internshala (India-only, no key needed) ────────────────────────

async def _fetch_internshala(
    client: httpx.AsyncClient,
    keyword: str,
    location: str,
) -> tuple[list[dict], str | None]:
    """
    Internshala provides India-only internships.
    Uses their public listing API with JSON response.
    No API key required.

    Docs / endpoint discovered via network inspection:
      GET https://internshala.com/internships/keywords-<keyword>/
      with Accept: application/json returns structured data.
    """
    # Build a safe keyword string
    kw_safe = re.sub(r"[^a-z0-9 ]", "", keyword.lower().strip()).strip()
    if not kw_safe:
        kw_safe = "software developer"

    # Internshala location filter
    loc_lower = location.lower().strip()
    city_param = ""
    if loc_lower not in ("all", "", "remote", "india"):
        city_param = loc_lower.replace(" ", "-")

    cache_key = ("internshala", kw_safe[:40], city_param[:20])
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("[jobs/internshala] Cache hit: %d jobs", len(cached))
        return cached, None

    results: list[dict] = []
    error_msg: str | None = None

    # Internshala public search endpoint
    # Accepts: keywords-<kw>/location-<city>  with JSON header
    path_parts = [f"keywords-{kw_safe.replace(' ', '-')}"]
    if city_param:
        path_parts.append(f"location-{city_param}")
    url = f"https://internshala.com/internships/{'%2C'.join(path_parts)}/"

    headers = {
        "Accept":          "application/json, text/javascript, */*",
        "X-Requested-With": "XMLHttpRequest",
        "Referer":         "https://internshala.com/internships/",
        "User-Agent":      "Mozilla/5.0 (compatible; SkillAI/1.0)",
    }

    try:
        r = await client.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if r.status_code == 200:
            try:
                data = r.json()
            except Exception:
                data = {}

            # Internshala JSON shape: {"internships_meta": {...}, "internship_ids": [...], "internships": {...}}
            internships_map = data.get("internships_meta", {}) or data.get("internships", {})
            ids             = data.get("internship_ids", list(internships_map.keys()))

            for iid in ids:
                raw = internships_map.get(str(iid), {})
                if not raw:
                    continue

                # Extract fields
                title   = raw.get("title", "") or raw.get("profile_name", "")
                company = raw.get("company_name", "") or raw.get("employer_name", "Unknown")
                loc_raw = raw.get("location_names", []) or raw.get("locations", [])
                loc_str = ", ".join(loc_raw) if isinstance(loc_raw, list) else str(loc_raw or "India")
                if not loc_str.strip():
                    loc_str = "India"
                is_wfh  = bool(raw.get("work_from_home") or raw.get("is_wfh"))
                if is_wfh:
                    loc_str = "Remote (India)" if not loc_str else f"{loc_str} / Remote"
                stipend = raw.get("stipend", {})
                salary  = None
                if isinstance(stipend, dict):
                    sal_val = stipend.get("salary") or stipend.get("salaryValue", "")
                    if sal_val:
                        salary = f"₹{sal_val}/month"
                elif isinstance(stipend, str) and stipend:
                    salary = stipend

                url_slug = raw.get("url", "") or raw.get("id", str(iid))
                apply_url = (
                    f"https://internshala.com/internship/detail/{url_slug}"
                    if not url_slug.startswith("http") else url_slug
                )
                tags = []
                for sk in (raw.get("skills", []) or [])[:4]:
                    if isinstance(sk, str):
                        tags.append(sk)
                    elif isinstance(sk, dict):
                        tags.append(sk.get("name", ""))
                tags = [t for t in tags if t][:4]

                score = _india_detail_score(loc_str)
                results.append({
                    "_uid":            _uid("internshala", str(iid)),
                    "company_name":    company,
                    "title":           title,
                    "location":        loc_str,
                    "job_type":        "Internship",
                    "salary":          salary,
                    "url":             apply_url,
                    "remote":          is_wfh,
                    "tags":            tags,
                    "created_at":      raw.get("start_date", ""),
                    "description":     (raw.get("about_company") or raw.get("other_instructions") or "")[:400],
                    "_source":         "Internshala",
                    "_source_country": "IN" if not is_wfh else "IN",  # always IN
                    "_india_score":    max(score, 7),  # Internshala is India-only
                })

            logger.info("[jobs/internshala] fetched=%d from %s", len(results), url)
        else:
            error_msg = f"HTTP {r.status_code}"
            logger.warning("[jobs/internshala] status=%d url=%s", r.status_code, url)
    except (httpx.TimeoutException, httpx.ConnectError):
        error_msg = "Internshala request timed out"
        logger.warning("[jobs/internshala] Timeout")
    except Exception as exc:
        error_msg = str(exc)[:120]
        logger.warning("[jobs/internshala] Error: %s", exc)

    # If JSON parsing gave nothing, try Naukri/LinkedIn-style fallback for India
    # (Internshala may change their API shape) — we just return what we have
    if results:
        _cache_set(cache_key, results)
    return results, error_msg


# ── Source 3: Remotive (global remote — India fallback) ───────────────────────

async def _fetch_remotive(
    client: httpx.AsyncClient,
    keyword: str,
    degree: str,
) -> tuple[list[dict], str | None]:
    """Global remote jobs. No key needed. Used as Remote fallback."""
    cache_key = ("remotive", keyword[:50], degree)
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("[jobs/remotive] Cache hit: %d jobs", len(cached))
        return cached, None

    results:   list[dict] = []
    error_msg: str | None = None

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
            loc = raw.get("candidate_required_location") or "Remote / Worldwide"
            jt  = raw.get("job_type") or "full_time"
            score = _india_detail_score(loc)
            results.append({
                "_uid":            _uid("remotive", str(raw.get("id", ""))),
                "company_name":    raw.get("company_name", "Unknown"),
                "title":           raw.get("title", ""),
                "location":        loc,
                "job_type":        jt,
                "salary":          raw.get("salary") or None,
                "url":             raw.get("url", "#"),
                "remote":          True,
                "tags":            raw.get("tags", [])[:6],
                "created_at":      raw.get("publication_date", ""),
                "description":     (raw.get("description") or "")[:800],
                "_source":         "Remotive",
                "_source_country": _source_country(loc, True),
                "_india_score":    score,
            })
        logger.info("[jobs/remotive] fetched=%d (cat=%r)", len(data.get("jobs", [])), cat or "any")
    except (httpx.TimeoutException, httpx.ConnectError):
        error_msg = "Request timed out"
        logger.warning("[jobs/remotive] Timeout")
    except httpx.HTTPStatusError as exc:
        error_msg = f"HTTP {exc.response.status_code}"
        logger.warning("[jobs/remotive] HTTP error: %s", error_msg)
    except Exception as exc:
        error_msg = str(exc)[:120]
        logger.warning("[jobs/remotive] Error: %s", exc)

    if results:
        _cache_set(cache_key, results)
    return results, error_msg


# ── Source 4: Arbeitnow (EU / global — last resort) ──────────────────────────

async def _fetch_arbeitnow(
    client: httpx.AsyncClient,
    pages: int = 2,
) -> tuple[list[dict], str | None]:
    """European / global fallback. Used only when no other source has results."""
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
                logger.warning("[jobs/arbeitnow] 429 rate limit page %d", page)
                break
            r.raise_for_status()
            data = r.json()
            jobs = data.get("data", [])
            if not jobs:
                break
            for raw in jobs:
                loc       = raw.get("location", "")
                is_remote = bool(raw.get("remote"))
                score     = _india_detail_score(loc)
                results.append({
                    "_uid":            _uid("arbeitnow", raw.get("slug", f"{page}")),
                    "company_name":    raw.get("company_name", "Unknown"),
                    "title":           raw.get("title", ""),
                    "location":        loc or ("Remote" if is_remote else "Location not specified"),
                    "job_type":        "remote" if is_remote else "full_time",
                    "salary":          None,
                    "url":             raw.get("url", "#"),
                    "remote":          is_remote,
                    "tags":            [t for t in raw.get("tags", []) if t][:6],
                    "created_at":      raw.get("created_at"),
                    "description":     (raw.get("description") or "")[:800],
                    "_source":         "Arbeitnow",
                    "_source_country": _source_country(loc, is_remote),
                    "_india_score":    score,
                })
            logger.info("[jobs/arbeitnow] page=%d fetched=%d", page, len(jobs))
        except (httpx.TimeoutException, httpx.ConnectError):
            error_msg = "Timed out"
            logger.warning("[jobs/arbeitnow] Timeout page %d", page)
            break
        except httpx.HTTPStatusError as exc:
            error_msg = f"HTTP {exc.response.status_code}"
            logger.warning("[jobs/arbeitnow] HTTP error page %d: %s", page, exc.response.status_code)
            break
        except Exception as exc:
            error_msg = str(exc)[:120]
            logger.warning("[jobs/arbeitnow] Error page %d: %s", page, exc)
            break

    if results:
        _cache_set(cache_key, results)
    return results, error_msg


# ── Merge, deduplicate and rank ───────────────────────────────────────────────

def _merge_and_rank(
    raw_lists: list[list[dict]],
    keyword:     str,
    location:    str,
    job_type:    str,
    remote_only: bool,
) -> list[dict]:
    """
    Merge all source results, deduplicate by URL, apply filters, then sort by:
      1. _india_score DESC  (Chennai/TN/India/Remote/INTL)
      2. Source priority DESC  (Internshala > Adzuna > Remotive > Arbeitnow)
      3. Posted date DESC (newer first within same tier)
    """
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

        # Keyword filter
        if keyword and not _keyword_match(haystack, keyword):
            continue

        # Location filter — "all" and "india" are handled specially
        if loc_filter and loc_filter not in ("all", ""):
            if loc_filter == "india":
                # Must be an India job
                if job.get("_source_country") not in ("IN",) and not _is_india_location(job.get("location", "")):
                    continue
            elif loc_filter == "remote":
                if not job.get("remote") and "remote" not in job.get("location", "").lower():
                    continue
            else:
                # Specific city filter (e.g. chennai, bangalore)
                job_loc = job.get("location", "").lower()
                if loc_filter not in job_loc and loc_filter not in haystack:
                    continue

        if remote_only and not job.get("remote"):
            continue

        # Job-type filter
        if jt_filter and jt_filter not in ("all", ""):
            jt_raw = job.get("job_type", "").lower().replace("_", " ")
            aliases = {
                "full time": "full", "full-time": "full",
                "part time": "part", "part-time": "part",
                "internship": "intern", "contract": "contract",
                "remote": "remote",
            }
            mapped = aliases.get(jt_filter, jt_filter)
            if mapped not in jt_raw and jt_filter not in jt_raw:
                continue

        filtered.append(job)

    # ── Source priority tie-breaker (lower = better) ──────────────────────────
    source_rank = {"Internshala": 0, "Adzuna": 1, "Remotive": 2, "Arbeitnow": 3}

    filtered.sort(key=lambda j: (
        -j.get("_india_score", 0),            # Primary: India geo score DESC
        source_rank.get(j.get("_source", ""), 9),  # Secondary: source priority ASC
        # Tertiary: date (newer first) — we skip full parse and just sort string DESC
        -(0 if not j.get("created_at") else 1),
    ))

    return filtered


def _shape(raw: dict) -> JobListing:
    jt = (raw.get("job_type") or "").replace("_", " ").title() or None
    sc = raw.get("_source_country", "INTL")
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
        source_country = sc,
        india_score    = raw.get("_india_score", 0),
    )


# ── Health endpoint ───────────────────────────────────────────────────────────

@router.get(
    "/jobs/health",
    response_model=HealthResponse,
    summary="Check connectivity to all job API sources",
    tags=["Jobs"],
)
async def jobs_health() -> HealthResponse:
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
                    return SourceStatus(name="Arbeitnow", ok=True, count=0, error="Rate limited")
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
    summary="India-first multi-source job listings",
    description=(
        "Fetches live jobs from Internshala (India-only, no key), "
        "Adzuna India (optional free key), Remotive (global remote), "
        "and Arbeitnow (EU fallback) in parallel. "
        "Results are ranked: Chennai/TN → India → Remote → International. "
        "Never fails when one source is down."
    ),
    tags=["Jobs"],
)
async def get_jobs(
    keyword:        str  = Query(default="",    description="Company, role, or skill"),
    location:       str  = Query(default="India", description="City, state or country (default: India)"),
    degree:         str  = Query(default="all", description="Degree type (e.g. BTech, BCA, MBA)"),
    specialization: str  = Query(default="",    description="Specialization / skill area"),
    job_type:       str  = Query(default="all", description="full_time | part_time | internship | remote"),
    remote_only:    bool = Query(default=False,  description="Show only remote jobs"),
    page:           int  = Query(default=1, ge=1, le=100),
    page_size:      int  = Query(default=20, ge=1, le=50),
) -> JobsResponse:

    deg_norm = degree.strip().lower()

    # ── Build effective keyword ────────────────────────────────────────────────
    # Priority: explicit keyword > specialization > degree default
    kw_parts = [p for p in [keyword.strip(), specialization.strip()] if p]
    combined_kw = " ".join(kw_parts)
    if not combined_kw and deg_norm in DEGREE_DEFAULT_KW:
        combined_kw = DEGREE_DEFAULT_KW[deg_norm]

    # ── Effective location ────────────────────────────────────────────────────
    # Default to "India" so Internshala + Adzuna return relevant results
    eff_loc = location.strip() if location.strip() else "India"

    logger.info(
        "[jobs] kw=%r loc=%r deg=%r type=%r remote=%s page=%d",
        combined_kw, eff_loc, deg_norm, job_type, remote_only, page,
    )

    # ── Fetch all sources in parallel ─────────────────────────────────────────
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        results = await asyncio.gather(
            _fetch_adzuna_india(client, combined_kw, eff_loc, job_type),
            _fetch_internshala(client, combined_kw, eff_loc),
            _fetch_remotive(client, combined_kw, deg_norm),
            _fetch_arbeitnow(client, pages=2),
            return_exceptions=True,
        )

    def _safe_unpack(result, name: str) -> tuple[list, str | None]:
        if isinstance(result, Exception):
            err = f"{type(result).__name__}: {result}"
            logger.error("[jobs/%s] gather exception: %s", name, err)
            return [], err
        jobs_list, err = result
        return jobs_list or [], err

    adzuna_jobs,      adzuna_err      = _safe_unpack(results[0], "adzuna")
    internshala_jobs, internshala_err = _safe_unpack(results[1], "internshala")
    remotive_jobs,    remotive_err    = _safe_unpack(results[2], "remotive")
    arbeitnow_jobs,   arbeitnow_err   = _safe_unpack(results[3], "arbeitnow")

    # ── Source status ──────────────────────────────────────────────────────────
    source_status: list[SourceStatus] = [
        SourceStatus(name="Internshala", ok=bool(internshala_jobs), count=len(internshala_jobs), error=internshala_err),
        SourceStatus(name="Adzuna",      ok=bool(adzuna_jobs),      count=len(adzuna_jobs),      error=adzuna_err),
        SourceStatus(name="Remotive",    ok=bool(remotive_jobs) or remotive_err is None, count=len(remotive_jobs), error=remotive_err),
        SourceStatus(name="Arbeitnow",   ok=bool(arbeitnow_jobs) or arbeitnow_err is None, count=len(arbeitnow_jobs), error=arbeitnow_err),
    ]

    logger.info(
        "[jobs] fetched: internshala=%d adzuna=%d remotive=%d arbeitnow=%d",
        len(internshala_jobs), len(adzuna_jobs), len(remotive_jobs), len(arbeitnow_jobs),
    )

    # ── Fallback chain ────────────────────────────────────────────────────────
    # If specific India city search yields nothing, fall back progressively
    india_count = len(internshala_jobs) + len(adzuna_jobs)
    if india_count == 0 and eff_loc.lower() not in ("all", "india", "remote", ""):
        # Try broader India search
        logger.info("[jobs] No India results for %r — falling back to India-wide search", eff_loc)
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            fb_adzuna, _     = await _fetch_adzuna_india(client, combined_kw, "India", job_type)
            fb_internshala, _ = await _fetch_internshala(client, combined_kw, "India")
        adzuna_jobs      = fb_adzuna or adzuna_jobs
        internshala_jobs = fb_internshala or internshala_jobs

    # ── Merge, filter, rank ───────────────────────────────────────────────────
    raw_lists = [internshala_jobs, adzuna_jobs, remotive_jobs, arbeitnow_jobs]
    ranked    = _merge_and_rank(raw_lists, combined_kw, eff_loc, job_type, remote_only)

    all_failed = all(isinstance(r, Exception) for r in results)
    if all_failed:
        raise HTTPException(
            status_code=503,
            detail="All job data sources are unreachable. Please try again shortly.",
        )

    # ── Paginate ──────────────────────────────────────────────────────────────
    total  = len(ranked)
    start  = (page - 1) * page_size
    end    = start + page_size
    paged  = ranked[start:end]

    jobs_out     = [_shape(r) for r in paged]
    sources_used = [s.name for s in source_status if s.count > 0]
    suggestions  = _generate_suggestions(combined_kw, deg_norm) if total < 5 else []

    logger.info(
        "[jobs] → %d/%d jobs | sources_used=%s | india_score_top=%s",
        len(jobs_out), total, sources_used,
        paged[0].get("_india_score") if paged else "—",
    )

    return JobsResponse(
        jobs          = jobs_out,
        total         = total,
        page          = page,
        sources_used  = sources_used,
        source_status = source_status,
        suggestions   = suggestions,
    )
