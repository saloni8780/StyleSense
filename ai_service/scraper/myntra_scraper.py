"""
myntra_scraper.py — attempts to pull listings from Myntra.

IMPORTANT LIMITATION (worth saying out loud in a viva): Myntra's search
results are rendered client-side by a JS bundle — the raw HTML returned by
a plain `requests.get()` does not contain product cards the way Flipkart's
does. A static BeautifulSoup scraper genuinely cannot read them reliably.

Two honest options instead of pretending this works:
  1. Use a headless browser (Selenium/Playwright) to render the page first,
     then parse with BeautifulSoup — left as a documented extension point
     (see render_with_headless_browser below) rather than implemented here,
     since it adds a browser-binary dependency that's overkill for most
     deployments of this project.
  2. Fall back to a direct search link so the user can check Myntra
     themselves — this is what search_myntra() does today.

This file is intentionally simple as a result. Don't read the empty list
as "the scraper is broken" — it's a known, documented constraint of the
target site.
"""
from urllib.parse import quote


def search_myntra(query: str, limit: int = 3) -> list[dict]:
    """
    No reliable static-HTML scrape is possible (see module docstring), so
    this returns a single 'search on Myntra' pointer instead of fabricated
    product data.
    """
    return [{
        "platform": "Myntra",
        "title": f"Search Myntra for: {query}",
        "price": "—",
        "url": f"https://www.myntra.com/{quote(query.replace(' ', '-'))}",
    }]


def render_with_headless_browser(query: str):
    """
    Extension point for a future version: use Playwright to load
    https://www.myntra.com/search?q=<query>, wait for the product grid to
    render, then hand soup.select(...) the fully-rendered HTML. Not
    implemented here to keep this service's dependencies lightweight.
    """
    raise NotImplementedError("Plug in Playwright/Selenium here if needed.")
