"""
fallback.py — generates shopping search links for all 3 platforms.

Live scraping of Amazon/Flipkart is blocked in most environments (they
detect and block automated requests). Instead of returning empty results,
this generates direct search URLs for all three platforms so the user
can click through to real, current product listings.
"""
from urllib.parse import quote


def clean_results(results: list[dict]) -> list[dict]:
    """If live scraping worked, return those results. Otherwise empty → fallback."""
    return [r for r in results if r.get("url") and "Search" not in r.get("title", "")]


def curated_fallback(budget: int | None = None) -> list[dict]:
    """
    Returns placeholder — real queries come from the agent's search_queries.
    This is only called when scraping fails completely AND no query was passed.
    """
    return generate_shop_links("frocks budget outfit")


def generate_shop_links(query: str) -> list[dict]:
    """
    Given a search query, return one card per platform pointing to
    a real search results page. No scraping, no blocking, always works.
    """
    q = quote(query)
    q_hyphen = query.replace(" ", "-")

    return [
        {
            "platform": "Amazon",
            "title": f"{query}",
            "price": "Check site for prices",
            "url": f"https://www.amazon.in/s?k={q}",
        },
        {
            "platform": "Flipkart",
            "title": f"{query}",
            "price": "Check site for prices",
            "url": f"https://www.flipkart.com/search?q={q}",
        },
        {
            "platform": "Myntra",
            "title": f"{query}",
            "price": "Check site for prices",
            "url": f"https://www.myntra.com/{q_hyphen}",
        },
        {
            "platform": "Ajio",
            "title": f"{query}",
            "price": "Check site for prices",
            "url": f"https://www.ajio.com/search/?text={q}",
        },
    ]
