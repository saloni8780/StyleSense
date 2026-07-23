"""
amazon_scraper.py — pulls a few candidate listings from amazon.in for a query.

Same caveat as flipkart_scraper.py: Amazon actively varies its markup and
will occasionally serve a CAPTCHA page to non-browser traffic, in which case
this should return [] (treated as a soft failure) rather than crash the
request. For a production version, this is the natural place to plug in a
paid scraping API (e.g. ScraperAPI/Bright Data) instead of raw requests.
"""
from bs4 import BeautifulSoup
from . import base

SEARCH_URL = "https://www.amazon.in/s"

SEARCH_CARD = "div[data-component-type='s-search-result']"
TITLE_SEL = "h2 span"
PRICE_SEL = "span.a-price > span.a-offscreen"
LINK_SEL = "h2 a"


def search_amazon(query: str, limit: int = 3) -> list[dict]:
    cached = base.cached_get("amazon", query)
    if cached is not None:
        return cached

    html = base.polite_get(SEARCH_URL, params={"k": query})
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
            if not (title_el and link_el):
                continue
            href = link_el.get("href", "")
            results.append({
                "platform": "Amazon",
                "title": title_el.get_text(strip=True),
                "price": price_el.get_text(strip=True) if price_el else "Check site",
                "url": f"https://www.amazon.in{href}" if href.startswith("/") else href,
            })
        base.cache_set("amazon", query, results)
        return results
    except Exception:
        return []
