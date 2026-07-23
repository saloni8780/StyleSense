"""
llm_providers.py

Text:   Groq (Llama 3.3 70B) — styling advice
Vision: Gemini (gemini-flash-latest) — lookbook image feedback
        (Groq deprecated both of its vision models — Llama 4 Scout
        and Maverick — in 2026, with no free-tier vision replacement)
Image:  Hugging Face FLUX.1-schnell — outfit inspiration image
"""
import os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from groq import Groq
import google.generativeai as genai
import PIL.Image

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

genai.configure(api_key=os.getenv("GOOGLE_AI_STUDIO_KEY"))

_groq_llm    = None
_groq_client = None
_gemini_vision_model = None


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


def _gemini_vision():
    global _gemini_vision_model
    if _gemini_vision_model is None:
        _gemini_vision_model = genai.GenerativeModel("gemini-flash-latest")
    return _gemini_vision_model


def get_text_response(prompt: str) -> str:
    """Fast text generation via Groq Llama 3.3."""
    response = _groq().invoke([HumanMessage(content=prompt)])
    return response.content


def get_vision_response(prompt: str, image_paths: list[str]) -> str:
    """
    Lookbook coordination feedback via Gemini Vision.
    Requires GOOGLE_AI_STUDIO_KEY in .env.
    """
    images = [PIL.Image.open(p) for p in image_paths]
    response = _gemini_vision().generate_content([prompt, *images])
    return response.text