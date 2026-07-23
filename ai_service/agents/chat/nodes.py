# ai_service/agents/chat/nodes.py
import json
from typing import TypedDict, Optional

from agents.llm_providers import get_text_response
from agents.rag import retrieve_styling_context
from agents.weather_agent import get_weather_styling
from agents.wardrobe_agent import run_wardrobe_style
from agents.compatibility_agent import score_outfit
from scraper.fallback import generate_shop_links


class ChatState(TypedDict):
    message: str
    occasion: Optional[str]
    city: Optional[str]
    budget: Optional[int]
    style_pref: Optional[str]
    outfit_description: Optional[str]
    wardrobe_items: Optional[list[dict]]
    needs: dict
    rag_output: Optional[str]
    weather_output: Optional[dict]
    wardrobe_output: Optional[dict]
    shopping_output: Optional[list[dict]]
    compatibility_output: Optional[dict]
    reply: Optional[str]


def planner_node(state: ChatState) -> dict:
    # Show the LLM what's already known from prior turns (thanks to the checkpointer),
    # so it only needs to extract what's NEW in this message.
    known = f"""Already known from earlier in this conversation (keep unless this message changes it):
occasion={state.get('occasion')}, city={state.get('city')}, budget={state.get('budget')},
style_pref={state.get('style_pref')}, outfit_description={state.get('outfit_description')}"""

    prompt = f"""Extract styling intent from this message. Respond with ONLY raw JSON.

{known}

New message: "{state['message']}"

Only include a field in your JSON if this new message actually mentions or changes it —
use null for anything not mentioned here, so we don't overwrite what's already known.

{{"occasion": "<string or null>", "city": "<string or null>", "budget": <int or null>,
  "style_pref": "<string or null>", "outfit_description": "<string or null, only if they're describing an existing outfit to rate>",
  "needs": {{"rag": bool, "weather": bool, "wardrobe": bool, "shopping": bool, "compatibility": bool}}}}"""

    raw = get_text_response(prompt)
    try:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean[clean.index("{"):clean.rindex("}") + 1])
    except Exception:
        parsed = {"needs": {"rag": True}}

    updates = {"needs": parsed.get("needs", {"rag": True})}
    for field in ["occasion", "city", "budget", "style_pref", "outfit_description"]:
        if parsed.get(field) is not None:
            updates[field] = parsed[field]
        elif state.get(field) is not None:
            updates[field] = state[field]  # explicitly carry forward what was already known
    return updates


def rag_node(state: ChatState) -> dict:
    query = f"{state.get('occasion','')} {state.get('style_pref','')}"
    return {"rag_output": retrieve_styling_context(query)}


def weather_node(state: ChatState) -> dict:
    if not state.get("city"):
        return {"weather_output": {"error": "no city given"}}
    return {"weather_output": get_weather_styling(
        state["city"], state.get("occasion", ""), state.get("style_pref", "frocks")
    )}


def wardrobe_node(state: ChatState) -> dict:
    return {"wardrobe_output": run_wardrobe_style(
        state.get("occasion", ""), state.get("budget") or 2000,
        state.get("wardrobe_items") or [], ""
    )}


def shopping_node(state: ChatState) -> dict:
    query = f"{state.get('style_pref', 'outfit')} {state.get('occasion', '')}".strip()
    return {"shopping_output": generate_shop_links(query)[:4]}


def compatibility_node(state: ChatState) -> dict:
    if not state.get("outfit_description"):
        return {"compatibility_output": None}
    return {"compatibility_output": score_outfit(
        state["outfit_description"], state.get("occasion", "general")
    )}


def compose_node(state: ChatState) -> dict:
    parts = []
    if state.get("occasion") or state.get("city"):
        parts.append(f"Context so far: occasion={state.get('occasion')}, city={state.get('city')}, budget={state.get('budget')}")
    if state.get("rag_output"):
        parts.append(f"Styling knowledge: {state['rag_output']}")
    if state.get("weather_output") and not state["weather_output"].get("error"):
        parts.append(f"Weather advice: {state['weather_output']['advice']}")
    if state.get("wardrobe_output"):
        parts.append(f"Wardrobe-based suggestions: {state['wardrobe_output']}")
    if state.get("shopping_output"):
        parts.append(f"{len(state['shopping_output'])} shopping options were found — mention they're shown below, don't describe or invent specific items or links.")
    if state.get("compatibility_output"):
        parts.append(f"Outfit score: {state['compatibility_output']}")

    prompt = f"""You are a friendly fashion stylist chatting with a user across multiple turns.
Combine this into one natural, concise reply (3-5 sentences), staying consistent with the
context so far (occasion, city, budget) even if this message didn't repeat them.
User's latest message: "{state['message']}"

{chr(10).join(parts) if parts else "No extra context available — answer from general styling knowledge."}"""

    return {"reply": get_text_response(prompt)}