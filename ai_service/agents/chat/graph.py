# ai_service/agents/chat/graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .nodes import (
    ChatState, planner_node, rag_node, weather_node,
    wardrobe_node, shopping_node, compatibility_node, compose_node,
)


def route_after_planner(state: ChatState):
    needs = state.get("needs", {})
    active = [n for n, flag in [
        ("rag", needs.get("rag")), ("weather", needs.get("weather")),
        ("wardrobe", needs.get("wardrobe")), ("shopping", needs.get("shopping")),
        ("compatibility", needs.get("compatibility")),
    ] if flag]
    return active or ["compose"]


graph = StateGraph(ChatState)
graph.add_node("planner", planner_node)
graph.add_node("rag", rag_node)
graph.add_node("weather", weather_node)
graph.add_node("wardrobe", wardrobe_node)
graph.add_node("shopping", shopping_node)
graph.add_node("compatibility", compatibility_node)
graph.add_node("compose", compose_node)

graph.set_entry_point("planner")
graph.add_conditional_edges(
    "planner", route_after_planner,
    ["rag", "weather", "wardrobe", "shopping", "compatibility", "compose"],
)
for n in ["rag", "weather", "wardrobe", "shopping", "compatibility"]:
    graph.add_edge(n, "compose")
graph.add_edge("compose", END)

checkpointer = MemorySaver()
chat_graph = graph.compile(checkpointer=checkpointer)