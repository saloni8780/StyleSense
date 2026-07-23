"""
image_gen.py — outfit inspiration image via Pollinations.ai.
Completely free, no API key, no signup required.
"""
import os
import re
import base64
import requests
import urllib.parse

POLLINATIONS_URL = "https://image.pollinations.ai/prompt/"


def _build_prompt(occasion: str, style_pref: str, tips: str, budget: int) -> str:
    colour_words = re.findall(
        r"\b(pastel|lilac|blush|mint|emerald|coral|mustard|navy|ivory|cream|"
        r"white|black|wine|maroon|teal|lavender|dusty rose|sage|terracotta|"
        r"gold|silver|rose gold)\b",
        tips.lower(),
    )
    palette = ", ".join(dict.fromkeys(colour_words))[:80] if colour_words else "soft elegant tones"
    return (
        f"Fashion editorial photo Indian woman full length outfit. "
        f"Style: {style_pref}. Occasion: {occasion}. "
        f"Colour palette: {palette}. "
        "Clean studio background professional lighting photorealistic high quality fashion photography."
    )


def generate_outfit_image(occasion: str, style_pref: str, tips: str, budget: int) -> str | None:
    try:
        prompt = _build_prompt(occasion, style_pref, tips, budget)
        encoded = urllib.parse.quote(prompt)
        url = f"{POLLINATIONS_URL}{encoded}?width=512&height=768&seed=42&nologo=true"
        response = requests.get(url, timeout=60)
        if response.status_code != 200:
            print(f"[image_gen] Pollinations returned {response.status_code}")
            return None
        return base64.b64encode(response.content).decode("utf-8")
    except Exception as exc:
        print(f"[image_gen] Failed (non-fatal): {exc}")
        return None