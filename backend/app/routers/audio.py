import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from backend.app.config import get_settings

logger = logging.getLogger("netrasaathi.audio")
settings = get_settings()

router = APIRouter(prefix="/api/v1/audio", tags=["Audio & Speech Synthesis"])

# Simple in-memory audio cache to prevent duplicate OpenAI TTS calls for common phrases
_TTS_CACHE: dict[str, bytes] = {}


class TTSRequest(BaseModel):
    text: str
    lang: Optional[str] = "en-IN"
    speed: Optional[float] = 1.0
    voice: Optional[str] = None


@router.post("/tts", summary="Neural Text-to-Speech synthesis for regional languages")
def generate_speech(req: TTSRequest):
    """
    Synthesizes speech using OpenAI's neural TTS engine.
    Ensures that languages like Malayalam (which often lack native Windows voices)
    produce fluent, natural spoken audio.
    """
    clean_text = req.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty.",
        )

    # Check cache
    tts_voice = req.voice or getattr(settings, "OPENAI_TTS_VOICE", "nova")
    cache_key = f"{clean_text}_{req.lang}_{req.speed}_{tts_voice}"
    if cache_key in _TTS_CACHE:
        return Response(content=_TTS_CACHE[cache_key], media_type="audio/mpeg")

    api_key = settings.OPENAI_API_KEY
    if not api_key or api_key in ["mock", "test", ""] or api_key.startswith("your_openai"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API key not configured on backend.",
        )

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        tts_model = getattr(settings, "OPENAI_TTS_MODEL", "tts-1-hd")
        response = client.audio.speech.create(
            model=tts_model,
            voice=tts_voice,
            input=clean_text,
            speed=max(0.75, min(req.speed or 1.0, 1.5)),
        )

        audio_bytes = response.content
        if len(_TTS_CACHE) < 150:  # Bound cache size
            _TTS_CACHE[cache_key] = audio_bytes

        return Response(content=audio_bytes, media_type="audio/mpeg")

    except Exception as exc:
        logger.error(f"OpenAI TTS synthesis failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis error: {str(exc)}",
        )

