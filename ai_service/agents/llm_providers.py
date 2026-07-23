"""
llm_providers.py

Text:   Groq (Llama 3.3 70B) — styling advice
Vision: Groq (Llama 4 Scout) — lookbook image feedback
Image:  Hugging Face FLUX.1-schnell — outfit inspiration image

All on free tiers, no Google needed.
"""
import os
import base64
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from groq import Groq

GROQ_MODEL        = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

_groq_llm    = None
_groq_client = None


def _groq():
    global _groq_llm
    if _groq_llm is None:
        _groq_llm = ChatGroq(model=GROQ_MODEL, temperature=0.6)
    return _groq_llm


def _groq_client_instance():
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq_client


def get_text_response(prompt: str) -> str:
    """Fast text generation via Groq Llama 3.3."""
    response = _groq().invoke([HumanMessage(content=prompt)])
    return response.content


def get_vision_response(prompt: str, image_paths: list[str]) -> str:
    """
    Lookbook coordination feedback via Groq Llama 4 Scout (vision).
    Same GROQ_API_KEY — no extra setup needed.
    """
    client = _groq_client_instance()

    # Build content with images as base64
    content = []
    for path in image_paths:
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
        })

    # Add text prompt last
    content.append({"type": "text", "text": prompt})

    response = client.chat.completions.create(
        model=GROQ_VISION_MODEL,
        messages=[{"role": "user", "content": content}],
        max_tokens=500,
    )
    return response.choices[0].message.content