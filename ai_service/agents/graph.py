"""
graph.py — LangGraph 5-node agent pipeline.

Flow:
    retrieve_context -> styling_advice -> shopping_research -> generate_image -> compose

shopping_research now generates direct search links for Amazon, Flipkart,
Myntra, and Ajio per query — more reliable than scraping which gets blocked.
"""
import json
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, END

from agents.rag import retrieve_styling_context
from agents.llm_providers import get_text_response
from agents.image_gen import generate_outfit_image
from scraper.fallback import generate_shop_links, clean_results


class StyleState(TypedDict):
    occasion: str
    style_pref: str
    budget: int
    notes: str
    context: Optional[str]
    tips: Optional[str]
    search_queries: Optional[list[str]]
    products: Optional[list[dict]]
    image_b64: Optional[str]
    result: Optional[dict]


def retrieve_context_node(state: StyleState) -> StyleState:
    query = f"{state['occasion']} {state['style_pref']} {state.get('notes', '')}"
    state["context"] = retrieve_styling_context(query)
    return state


def styling_advice_node(state: StyleState) -> StyleState:
    prompt = f"""You are a fashion stylist for the Indian market.

Relevant styling knowledge (use this to ground your advice, don't contradict it):
{state['context']}

Occasion: {state['occasion']}
Style preference: {state['style_pref']}
Budget: ₹{state['budget']}
Notes: {state.get('notes') or 'none'}

Respond with ONLY a raw JSON object, no markdown fences:
{{"tips": "3-4 sentences of concrete styling advice mentioning specific colours, silhouette, and one accessory tip",
  "search_queries": ["short 3-5 word product search query 1", "query 2", "query 3"]}}
"""
    raw = get_text_response(prompt)
    try:
        clean = raw.strip().strip("`").replace("json\n", "")
        parsed = json.loads(clean[clean.index("{"):clean.rindex("}") + 1])
    except Exception:
        parsed = {"tips": raw, "search_queries": [state["style_pref"]]}

    state["tips"] = parsed.get("tips", "")
    state["search_queries"] = parsed.get("search_queries", [state["style_pref"]])
    return state


def shopping_research_node(state: StyleState) -> StyleState:
    """
    Generate one set of search links per query across all 4 platforms.
    Each query produces 4 cards (Amazon, Flipkart, Myntra, Ajio).
    We take the first 2 queries → 8 cards, trim to 6.
    """
    all_results = []
    for query in state["search_queries"][:2]:
        all_results += generate_shop_links(query)

    state["products"] = all_results[:6]
    return state


def generate_image_node(state: StyleState) -> StyleState:
    state["image_b64"] = generate_outfit_image(
        occasion=state["occasion"],
        style_pref=state["style_pref"],
        tips=state.get("tips") or "",
        budget=state["budget"],
    )
    return state


def compose_node(state: StyleState) -> StyleState:
    state["result"] = {
        "tips": state["tips"],
        "products": state["products"],
        "image_b64": state.get("image_b64"),
    }
    return state


def build_graph():
    graph = StateGraph(StyleState)
    graph.add_node("retrieve_context", retrieve_context_node)
    graph.add_node("styling_advice", styling_advice_node)
    graph.add_node("shopping_research", shopping_research_node)
    graph.add_node("generate_image", generate_image_node)
    graph.add_node("compose", compose_node)

    graph.set_entry_point("retrieve_context")
    graph.add_edge("retrieve_context", "styling_advice")
    graph.add_edge("styling_advice", "shopping_research")
    graph.add_edge("shopping_research", "generate_image")
    graph.add_edge("generate_image", "compose")
    graph.add_edge("compose", END)

    return graph.compile()


_compiled_graph = None


def run_style_graph(occasion: str, style_pref: str, budget: int, notes: str = "") -> dict:
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()

    final_state = _compiled_graph.invoke({
        "occasion": occasion,
        "style_pref": style_pref,
        "budget": budget,
        "notes": notes,
        "image_b64": None,
    })
    return final_state["result"]