"""
compatibility_agent.py — outfit compatibility scoring with explained reasoning.

Scores an outfit across 5 dimensions and explains why each score was given.
Uses Groq for fast structured output.
"""
import json
from agents.llm_providers import get_text_response


DIMENSIONS = [
    {"key": "color_harmony",     "label": "Color Harmony",     "max": 30},
    {"key": "occasion_fit",      "label": "Occasion Fit",      "max": 30},
    {"key": "formality_match",   "label": "Formality Match",   "max": 20},
    {"key": "accessory_balance", "label": "Accessory Balance", "max": 10},
    {"key": "season_suitability","label": "Season Check",      "max": 10},
]


def score_outfit(
    outfit_description: str,
    occasion: str = "general",
    season: str = "current",
    extra_notes: str = "",
) -> dict:
    dim_format = "\n".join(
        f'    "{d["key"]}": {{"score": <0-{d["max"]}>, "reason": "<one sentence why>", "tip": "<one concrete improvement or null>"}}'
        for d in DIMENSIONS
    )

    prompt = f"""You are an expert fashion stylist and outfit evaluator for the Indian market.

Evaluate this outfit:
"{outfit_description}"

Occasion: {occasion}
Season: {season}
Extra context: {extra_notes or "none"}

Score honestly across 5 dimensions. A mediocre outfit should score mediocre.

Scoring guide:
- Color Harmony (0-30): Do colours work together? Complementary = high. Clashing = low.
- Occasion Fit (0-30): Is this right for the stated occasion? Perfect match = 30.
- Formality Match (0-20): Do all pieces match in formality? Mixing levels = low.
- Accessory Balance (0-10): Appropriate accessories — not too much, not too little.
- Season Check (0-10): Practical for the season? Right fabrics?

Respond with ONLY raw JSON, no markdown:
{{
  "dimensions": {{
{dim_format}
  }},
  "headline": "<one punchy sentence overall verdict>",
  "fix": "<the single most impactful change to improve this outfit>"
}}"""

    raw = get_text_response(prompt)
    try:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean[clean.index("{"):clean.rindex("}") + 1])
    except Exception:
        return {
            "overall": 0, "grade": "?",
            "headline": "Couldn't evaluate — describe the outfit in more detail.",
            "dimensions": [], "fix": "",
        }

    dims_out = []
    total = 0
    max_total = sum(d["max"] for d in DIMENSIONS)

    for d in DIMENSIONS:
        raw_dim = parsed.get("dimensions", {}).get(d["key"], {})
        score = min(max(int(raw_dim.get("score", 0)), 0), d["max"])
        total += score
        dims_out.append({
            "key":    d["key"],
            "label":  d["label"],
            "score":  score,
            "max":    d["max"],
            "reason": raw_dim.get("reason", ""),
            "tip":    raw_dim.get("tip"),
        })

    overall = round((total / max_total) * 100)
    grade = "A" if overall >= 85 else "B" if overall >= 70 else "C" if overall >= 55 else "D"

    return {
        "overall":    overall,
        "grade":      grade,
        "headline":   parsed.get("headline", ""),
        "dimensions": dims_out,
        "fix":        parsed.get("fix", ""),
    }