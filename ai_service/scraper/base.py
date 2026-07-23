"""
base.py — shared utilities for the e-commerce scrapers.

Live scraping of Amazon/Flipkart/Myntra is inherently fragile: these sites
change their DOM structure periodically, render parts of the page with JS,
and actively rate-limit or block obvious bot traffic. This module exists to
keep that fragility contained in one place:

- a single requests.Session with browser-like headers
- a tiny on-disk JSON cache so the same query isn't re-scraped every time
- a polite delay between requests
- every scraper function returns [] on any failure instead of raising,
  so the calling agent can fall back to cached/curated suggestions cleanly.
"""
import json
import time
import hashlib
from pathlib import Path

import requests

CACHE_DIR = Path(__file__).parent / ".scrape_cache"
CACHE_DIR.mkdir(exist_ok=True)
CACHE_TTL_SECONDS = 60 * 60 * 6  # 6 hours — product listings change often enough

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
}

_session = requests.Session()
_session.headers.update(DEFAULT_HEADERS)


def _cache_key(site: str, query: str) -> Path:
    digest = hashlib.sha256(f"{site}:{query}".encode()).hexdigest()[:24]
    return CACHE_DIR / f"{digest}.json"


def cached_get(site: str, query: str):
    path = _cache_key(site, query)
    if path.exists() and (time.time() - path.stat().st_mtime) < CACHE_TTL_SECONDS:
        try:
            return json.loads(path.read_text())
        except (json.JSONDecodeError, OSError):
            return None
    return None


def cache_set(site: str, query: str, data):
    path = _cache_key(site, query)
    try:
        path.write_text(json.dumps(data))
    except OSError:
        pass  # caching is a nice-to-have, never block on it


def polite_get(url: str, params: dict | None = None, timeout: int = 8):
    """GET with a small delay, never raises — returns None on any failure."""
    try:
        time.sleep(0.6)  # don't hammer the target site
        resp = _session.get(url, params=params, timeout=timeout)
        if resp.status_code != 200:
            return None
        return resp.text
    except requests.RequestException:
        return None
