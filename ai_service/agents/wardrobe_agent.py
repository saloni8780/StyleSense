"""
wardrobe_agent.py — styling agent that uses the user's existing wardrobe.

Flow:
1. Receive occasion + budget + list of wardrobe items
2. RAG retrieval for styling context
3. Groq LLM:
   - First tries to build outfits from existing wardrobe items
   - Only suggests shopping for genuinely missing pieces
4. Returns: outfit combinations from wardrobe + shopping gaps

This is what separates StyleSense from generic fashion chatbots —
recommendations are grounded in what the user actually owns.
"""
import json
from agents.rag import retrieve_styling_context
from agents.llm_providers import get_text_response


def run_wardrobe_style(
    occasion: str,
    budget: int,
    wardrobe_items: list[dict],
    notes: str = "",
) -> dict:
    """
    wardrobe_items: list of {name, category, color, occasion, notes}
    Returns: {
        outfits: [ {name, items_used, missing, buy_suggestion, confidence} ],
        tips: str,
        wardrobe_used: bool
    }
    """
    # RAG context
    query = f"{occasion} {notes} outfit styling"
    context = retrieve_styling_context(query)

    # Format wardrobe for the prompt
    if wardrobe_items:
        wardrobe_str = "\n".join(
            f"- [{item['category']}] {item['name']}"
            f"{' | Color: ' + item['color'] if item.get('color') else ''}"
            f"{' | Occasion: ' + item['occasion'] if item.get('occasion') else ''}"
            for item in wardrobe_items
        )
    else:
        wardrobe_str = "No wardrobe items uploaded yet."

    prompt = f"""You are a personal fashion stylist with access to the user's wardrobe.

Styling knowledge:
{context}

User's wardrobe:
{wardrobe_str}

Request:
- Occasion: {occasion}
- Budget for new purchases: ₹{budget}
- Notes: {notes or 'none'}

Your job:
1. First try to build 2-3 outfit combinations using ONLY items from the wardrobe above.
2. For each outfit, identify what (if anything) is genuinely missing.
3. Only suggest buying something if it's truly absent from the wardrobe.
4. Give 2-3 sentences of overall styling advice.

Respond with ONLY raw JSON, no markdown:
{{
  "tips": "overall 2-3 sentence styling advice",
  "outfits": [
    {{
      "name": "Outfit name e.g. Classic Evening Look",
      "items_used": ["item name from wardrobe", "another item"],
      "missing": "one thing they don't have (or null if complete)",
      "buy_suggestion": "specific short search query for the missing piece (or null)",
      "confidence": "High / Medium / Low",
      "reason": "one sentence why this works for the occasion"
    }}
  ],
  "wardrobe_sufficient": true
}}

If the wardrobe has nothing relevant, set wardrobe_sufficient to false and suggest 2 outfits to buy entirely.
"""

    raw = get_text_response(prompt)
    try:
        clean = raw.strip().strip("`").replace("json\n", "")
        result = json.loads(clean[clean.index("{"):clean.rindex("}") + 1])
    except Exception:
        result = {
            "tips": raw,
            "outfits": [],
            "wardrobe_sufficient": False,
        }

    return result
