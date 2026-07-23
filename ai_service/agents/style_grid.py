"""
style_grid.py — outfit style grid using Pollinations.ai (free, no key needed).
Uses staggered parallel generation to avoid rate limiting.
"""
import base64
import json
import time
import requests
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from agents.llm_providers import get_text_response

POLLINATIONS_URL = "https://image.pollinations.ai/prompt/"


def _extract_clothing_items(raw_input: str) -> str:
    if len(raw_input.split()) <= 6:
        return raw_input
    prompt = f"""Extract only the clothing items from this text. Return ONLY a short comma-separated list, nothing else.
Input: "{raw_input}"
Example output: black flared jeans, dark blue denim jacket"""
    result = get_text_response(prompt)
    return result.strip().split("\n")[0][:200]


def _generate_single_image(prompt: str, delay: float = 0) -> str | None:
    try:
        if delay > 0:
            time.sleep(delay)
        encoded = urllib.parse.quote(prompt)
        # Use different seeds per image so Pollinations doesn't cache/block
        seed = int(time.time() * 1000) % 9999
        url = f"{POLLINATIONS_URL}{encoded}?width=512&height=768&seed={seed}&nologo=true&enhance=true"
        response = requests.get(url, timeout=90)
        if response.status_code != 200:
            print(f"[style_grid] Pollinations returned {response.status_code}")
            return None
        # Verify it's actually an image (not an error HTML page)
        if len(response.content) < 5000:
            print(f"[style_grid] Response too small ({len(response.content)} bytes) — likely an error")
            return None
        return base64.b64encode(response.content).decode("utf-8")
    except Exception as exc:
        print(f"[style_grid] Image failed: {exc}")
        return None


def generate_style_grid(items: str, count: int = 3) -> list[dict]:
    clean_items = _extract_clothing_items(items)

    prompt = f"""You are a fashion stylist for Indian women. Someone owns: {clean_items}

Create exactly {count} distinct outfit variations using these as the base.
Suggest what TOP and ACCESSORIES to add for each.

Respond with ONLY a raw JSON array, no markdown, no explanation:
[
  {{
    "label": "Classic Casual",
    "top": "white fitted crop tee",
    "accessories": "white sneakers, minimal gold hoops",
    "vibe": "clean effortless everyday"
  }}
]"""

    raw = get_text_response(prompt)
    try:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        variations = json.loads(clean[clean.index("["):clean.rindex("]") + 1])
    except Exception:
        variations = [
            {"label": "Classic Casual",  "top": "white fitted crop tee",  "accessories": "white sneakers, gold hoops",        "vibe": "clean casual"},
            {"label": "Effortless Chic", "top": "black satin tank top",   "accessories": "heeled ankle boots, gold necklace", "vibe": "chic evening"},
            {"label": "Street Style",    "top": "oversized graphic tee",  "accessories": "chunky sneakers, baseball cap",     "vibe": "urban streetwear"},
        ]

    def _make_variation(v, delay):
        img_prompt = (
            f"High quality fashion editorial photograph, Indian woman, full length outfit. "
            f"Clothing: {clean_items}, paired with {v.get('top', '')}, {v.get('accessories', '')}. "
            f"Aesthetic: {v.get('vibe', '')}. "
            f"Neutral studio background, professional fashion photography, photorealistic."
        )
        return {
            "label":       v.get("label", ""),
            "top":         v.get("top", ""),
            "accessories": v.get("accessories", ""),
            "vibe":        v.get("vibe", ""),
            "image_b64":   _generate_single_image(img_prompt, delay=delay),
        }

    # Stagger requests by 2s each to avoid Pollinations rate limiting
    # Still faster than sequential (total ~17s vs ~45s)
    variations = variations[:count]
    results = [None] * len(variations)

    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_idx = {
            executor.submit(_make_variation, v, i * 5): i
            for i, v in enumerate(variations)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            results[idx] = future.result()

    return [r for r in results if r is not None]