"""HTTP boundary for StyleSense AI capabilities.

The service is intentionally stateless: Django owns users and persisted data;
this service executes AI workflows.  Every endpoint has a typed request model,
bounded input, and a small in-memory rate limit suitable for local deployment.
"""
from __future__ import annotations

import json
import os
import shutil
import tempfile
import time
from collections import defaultdict, deque
from pathlib import Path

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from agents.compatibility_agent import score_outfit
from agents.graph import run_style_graph
from agents.llm_providers import get_vision_response
from agents.style_grid import generate_style_grid
from agents.wardrobe_agent import run_wardrobe_style
from agents.weather_agent import get_weather_styling
from agents.chat.graph import chat_graph

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="StyleSense AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174"
    ).split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "Authorization"],
)

RATE_LIMIT = 30
RATE_WINDOW_SECONDS = 60
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
_requests_by_client: dict[str, deque[float]] = defaultdict(deque)


@app.middleware("http")
async def protect_api(request: Request, call_next):
    """Bound public guest traffic; use a shared limiter before public deployment."""
    if request.url.path.startswith("/api/"):
        client = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        client = client.split(",")[0].strip()
        now = time.monotonic()
        timestamps = _requests_by_client[client]
        while timestamps and now - timestamps[0] >= RATE_WINDOW_SECONDS:
            timestamps.popleft()
        if len(timestamps) >= RATE_LIMIT:
            return JSONResponse({"detail": "Too many requests. Try again shortly."}, status_code=429)
        timestamps.append(now)
    return await call_next(request)


_cloudinary_ready = all(
    os.getenv(key)
    for key in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")
)
if _cloudinary_ready:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def _upload_to_cloudinary(file_path: str) -> str | None:
    if not _cloudinary_ready:
        return None
    try:
        return cloudinary.uploader.upload(
            file_path, folder="stylesense/lookbook", resource_type="image"
        ).get("secure_url")
    except Exception:
        return None


def _parse_json_object(raw: str) -> dict:
    """Keep model-output repair inside the service instead of exposing raw text."""
    try:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(clean[clean.index("{"):clean.rindex("}") + 1])
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="The AI returned an invalid response. Please retry.") from exc


class StyleRequest(BaseModel):
    occasion: str = Field(min_length=2, max_length=200)
    style_pref: str = Field(default="frocks", max_length=100)
    budget: int = Field(default=2000, ge=0, le=1_000_000)
    notes: str = Field(default="", max_length=1_000)


class WardrobeItem(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=30)
    color: str = Field(default="", max_length=100)
    occasion: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=1_000)


class WardrobeStyleRequest(BaseModel):
    occasion: str = Field(min_length=2, max_length=200)
    budget: int = Field(default=2000, ge=0, le=1_000_000)
    notes: str = Field(default="", max_length=1_000)
    wardrobe_items: list[WardrobeItem] = Field(default_factory=list, max_length=200)


class StyleGridRequest(BaseModel):
    items: str = Field(min_length=2, max_length=1_000)
    count: int = Field(default=3, ge=1, le=3)


class WeatherStyleRequest(BaseModel):
    city: str = Field(min_length=2, max_length=100)
    occasion: str = Field(default="", max_length=200)
    style_pref: str = Field(default="frocks", max_length=100)


class CompatibilityRequest(BaseModel):
    outfit_description: str = Field(min_length=5, max_length=2_000)
    occasion: str = Field(default="general", max_length=200)
    season: str = Field(default="Summer", max_length=50)
    extra_notes: str = Field(default="", max_length=1_000)
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1_000)
    session_id: str = Field(min_length=1, max_length=100)
    wardrobe_items: list[dict] = Field(default_factory=list)


@app.post("/api/style")
def style(request: StyleRequest):
    try:
        return run_style_graph(request.occasion, request.style_pref, request.budget, request.notes)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Styling is temporarily unavailable.") from exc


@app.post("/api/feedback")
async def feedback(images: list[UploadFile] = File(...), notes: str = Form("")):
    if not 1 <= len(images) <= 4:
        raise HTTPException(status_code=400, detail="Upload between one and four images.")
    if len(notes) > 1_000:
        raise HTTPException(status_code=422, detail="Notes must be at most 1,000 characters.")
    if any(not (image.content_type or "").startswith("image/") for image in images):
        raise HTTPException(status_code=415, detail="Only image files are supported.")
    if any((image.size or 0) > MAX_UPLOAD_BYTES for image in images):
        raise HTTPException(status_code=413, detail="Each image must be 5 MB or smaller.")

    tmp_dir = tempfile.mkdtemp(prefix="stylesense-")
    try:
        paths, image_urls = [], []
        for index, image in enumerate(images):
            path = Path(tmp_dir) / f"upload-{index}.jpg"
            with path.open("wb") as output:
                shutil.copyfileobj(image.file, output)
            paths.append(str(path))
            if url := _upload_to_cloudinary(str(path)):
                image_urls.append(url)

        raw = get_vision_response(
            "You are a fashion stylist. Assess the outfit photos for colour and formality coordination. "
            f"Extra context: {notes or 'none'}. Respond only as JSON with verdict, notes (three strings), and fix.",
            paths,
        )
        result = _parse_json_object(raw)
        return {
            "verdict": str(result.get("verdict", "")),
            "notes": [str(item) for item in result.get("notes", [])][:3],
            "fix": str(result.get("fix", "")),
            "image_urls": image_urls,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Lookbook feedback is temporarily unavailable.") from exc
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@app.post("/api/wardrobe-style")
def wardrobe_style(request: WardrobeStyleRequest):
    try:
        return run_wardrobe_style(
            request.occasion, request.budget,
            [item.model_dump() for item in request.wardrobe_items], request.notes,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Wardrobe styling is temporarily unavailable.") from exc


@app.post("/api/style-grid")
def style_grid(request: StyleGridRequest):
    try:
        return {"variations": generate_style_grid(request.items, request.count)}
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Style variations are temporarily unavailable.") from exc


@app.post("/api/weather-style")
def weather_style(request: WeatherStyleRequest):
    return get_weather_styling(request.city, request.occasion, request.style_pref)


@app.post("/api/compatibility-score")
def compatibility_score(request: CompatibilityRequest):
    try:
        return score_outfit(
            request.outfit_description, request.occasion, request.season, request.extra_notes
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Outfit scoring is temporarily unavailable.") from exc


@app.get("/health")
def health():
    return {"status": "ok", "cloudinary": _cloudinary_ready}

@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        result = chat_graph.invoke(
            {"message": request.message, "wardrobe_items": request.wardrobe_items},
            config={"configurable": {"thread_id": request.session_id}},
        )
        return {"reply": result["reply"], "products": result.get("shopping_output") or []}
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=str(exc)) from exc