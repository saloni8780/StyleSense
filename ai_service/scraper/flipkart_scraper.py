"""
flipkart_scraper.py — pulls a few candidate listings for a search query.

NOTE ON SELECTORS: Flipkart's CSS class names are obfuscated/rotated and can
change without notice. The selectors below were correct at the time of
writing but should be treated as the first thing to check if this returns
an empty list — inspect a live search results page and update SEARCH_CARD,
TITLE_SEL, PRICE_SEL, LINK_SEL accordingly. This fragility is exactly why
agents/graph.py never depends on a scraper succeeding.
"""
from bs4 import BeautifulSoup
from . import base

SEARCH_URL = "https://www.flipkart.com/search"

# These selectors target the product grid card on a Flipkart search page.
SEARCH_CARD = "div._1AtVbE"
TITLE_SEL = "div._4rR01T, a.s1Q9rs"
PRICE_SEL = "div._30jeq3"
LINK_SEL = "a"


def search_flipkart(query: str, limit: int = 3) -> list[dict]:
    cached = base.cached_get("flipkart", query)
    if cached is not None:
        return cached

    html = base.polite_get(SEARCH_URL, params={"q": query})
    if not html:
        return []

    try:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select(SEARCH_CARD)[:limit]
        results = []
        for card in cards:
            title_el = card.select_one(TITLE_SEL)
            price_el = card.select_one(PRICE_SEL)
            link_el = card.select_one(LINK_SEL)
            if not (title_el and price_el and link_el):
                continue
            href = link_el.get("href", "")
            results.append({
                "platform": "Flipkart",
                "title": title_el.get_text(strip=True),
                "price": price_el.get_text(strip=True),
                "url": f"https://www.flipkart.com{href}" if href.startswith("/") else href,
            })
        base.cache_set("flipkart", query, results)
        return results
    except Exception:
        # Parsing broke (DOM changed) — fail soft, let the caller fall back.
        return []
