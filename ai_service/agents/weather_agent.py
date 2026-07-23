"""
weather_agent.py — weather-aware outfit styling.

Uses wttr.in for weather data — completely free, no API key, no signup.
Passes real weather conditions to Groq for grounded styling advice.
"""
import requests
from agents.llm_providers import get_text_response


def fetch_weather(city: str) -> dict | None:
    """
    Fetch current weather from wttr.in (free, no key).
    Returns a clean dict or None on failure.
    """
    try:
        url = f"https://wttr.in/{requests.utils.quote(city)}?format=j1"
        resp = requests.get(url, timeout=8, headers={"User-Agent": "StyleSense/1.0"})
        if resp.status_code != 200:
            return None
        data = resp.json()

        current = data["current_condition"][0]
        weather = data["weather"][0]

        feels_like = int(current["FeelsLikeC"])
        temp_c     = int(current["temp_C"])
        humidity   = int(current["humidity"])
        desc       = current["weatherDesc"][0]["value"]
        wind_kmph  = int(current["windspeedKmph"])
        uv_index   = int(current.get("uvIndex", 0))

        # Max and min for the day
        max_c = int(weather["maxtempC"])
        min_c = int(weather["mintempC"])

        return {
            "city":       city,
            "temp_c":     temp_c,
            "feels_like": feels_like,
            "max_c":      max_c,
            "min_c":      min_c,
            "humidity":   humidity,
            "desc":       desc,
            "wind_kmph":  wind_kmph,
            "uv_index":   uv_index,
        }
    except Exception as exc:
        print(f"[weather_agent] Weather fetch failed: {exc}")
        return None


def get_weather_styling(city: str, occasion: str = "", style_pref: str = "frocks") -> dict:
    """
    Fetch weather for city and return weather-aware styling advice.
    """
    weather = fetch_weather(city)

    if not weather:
        return {
            "error": f"Couldn't fetch weather for {city}. Check the city name.",
            "weather": None,
            "advice": None,
        }

    # Build weather context string
    w = weather
    weather_context = (
        f"City: {w['city']}\n"
        f"Current: {w['temp_c']}°C (feels like {w['feels_like']}°C)\n"
        f"Today's range: {w['min_c']}°C – {w['max_c']}°C\n"
        f"Condition: {w['desc']}\n"
        f"Humidity: {w['humidity']}%\n"
        f"Wind: {w['wind_kmph']} km/h\n"
        f"UV Index: {w['uv_index']}"
    )

    # Determine weather tier for prompt
    if w["feels_like"] >= 35:
        tier = "extremely hot and humid — prioritise breathable fabrics"
    elif w["feels_like"] >= 28:
        tier = "warm and sunny — light fabrics, UV protection matters"
    elif w["feels_like"] >= 20:
        tier = "pleasant — most outfits work, light layering optional"
    elif w["feels_like"] >= 12:
        tier = "cool — a light jacket or layer is recommended"
    else:
        tier = "cold — warmth is a priority, style around outerwear"

    rainy = any(word in w["desc"].lower() for word in ["rain", "drizzle", "shower", "thunder", "mist"])
    sunny = any(word in w["desc"].lower() for word in ["sunny", "clear", "bright"])

    prompt = f"""You are a practical fashion stylist. Give weather-aware outfit advice for an Indian woman.

Weather right now:
{weather_context}

Weather assessment: {tier}
Rainy/wet conditions: {"Yes — account for this" if rainy else "No"}
Bright sun: {"Yes — UV and heat management matter" if sunny else "No"}

User's style preference: {style_pref}
Occasion: {occasion or "general day out"}

Give:
1. One clear sentence on what the weather means for dressing today.
2. Exactly 3 specific outfit suggestions that work for this weather. Each must mention:
   - The specific fabric/material (e.g. cotton, linen, chiffon — not just "light fabric")
   - One concrete colour that suits the weather vibe
   - One practical accessory for the conditions (umbrella, sunglasses, light scarf etc.)
3. One "avoid today" warning — what NOT to wear in this weather.

Respond with ONLY raw JSON, no markdown:
{{
  "weather_line": "one sentence about dressing for today",
  "outfits": [
    {{
      "name": "outfit name",
      "description": "specific outfit with fabric, colour, accessory",
      "why": "one line why this works for the weather"
    }}
  ],
  "avoid": "what to avoid today and why"
}}"""

    import json
    raw = get_text_response(prompt)
    try:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        advice = json.loads(clean[clean.index("{"):clean.rindex("}") + 1])
    except Exception:
        advice = {
            "weather_line": f"At {w['temp_c']}°C in {w['desc'].lower()} conditions, dress for comfort.",
            "outfits": [],
            "avoid": "Check the forecast before heading out.",
        }

    return {
        "weather": weather,
        "advice":  advice,
        "error":   None,
    }