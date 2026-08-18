"""
MinhTTS — Local Python Inference Service (FastAPI) v5.0
High-Performance Modular Speech Synthesis Engine for NVIDIA RTX 3060 / CUDA 12.6.
"""

from __future__ import annotations

import asyncio
import io
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Any, Optional

import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import (
    DEFAULT_MODEL,
    DEFAULT_VOICE,
    EXECUTOR_WORKERS,
    HOST,
    MAX_TEXT_LENGTH,
    PORT,
    VOICE_MAP,
    VOICE_METADATA,
)
from core.audio_utils import decode_ref_audio, encode_wav, estimate_duration_seconds
from core.registry import get_model_registry
from models.f5tts_model import F5TTSModel
from models.vieneu_model import VieNeuModel
from models.whisper_model import WhisperASRModel

# ---------------------------------------------------------------------------
# Logging Setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("MinhTTS.Server")

# ---------------------------------------------------------------------------
# Dedicated ThreadPoolExecutor for CPU/GPU-bound tasks
# ---------------------------------------------------------------------------
_executor = ThreadPoolExecutor(
    max_workers=EXECUTOR_WORKERS,
    thread_name_prefix="minhtts-worker",
)

# ---------------------------------------------------------------------------
# Model Registry Setup
# ---------------------------------------------------------------------------
registry = get_model_registry()
registry.register(VieNeuModel())
registry.register(F5TTSModel())
registry.set_default_model(DEFAULT_MODEL)


# ---------------------------------------------------------------------------
# Lifespan Management
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app_: FastAPI):
    """
    Eagerly load and warmup default models on server startup.
    """
    logger.info("🚀 Starting MinhTTS Local Engine v5.0 (RTX 3060 Optimized)...")
    warmup_task = asyncio.create_task(registry.warmup_all(executor=_executor))
    yield
    logger.info("🛑 Shutting down MinhTTS Local Engine...")
    _executor.shutdown(wait=False)


app = FastAPI(
    title="MinhTTS Local Inference Service",
    description="GPU-accelerated Vietnamese Neural Speech Synthesis & Voice Cloning",
    version="5.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Whisper ASR Engine Singleton
# ---------------------------------------------------------------------------
_whisper_engine: Optional[WhisperASRModel] = None
_whisper_lock = asyncio.Lock()


async def get_whisper_engine() -> WhisperASRModel:
    global _whisper_engine
    if _whisper_engine is not None and _whisper_engine.is_loaded:
        return _whisper_engine

    async with _whisper_lock:
        if _whisper_engine is not None and _whisper_engine.is_loaded:
            return _whisper_engine

        loop = asyncio.get_running_loop()
        instance = WhisperASRModel(model_size="medium")
        await loop.run_in_executor(_executor, instance.load)
        _whisper_engine = instance
        return _whisper_engine


# ---------------------------------------------------------------------------
# Request & Response Schemas
# ---------------------------------------------------------------------------
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_LENGTH)
    voice: str = Field(default=DEFAULT_VOICE)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    model: str = Field(default=DEFAULT_MODEL)
    reference_audio_base64: Optional[str] = None
    reference_text: Optional[str] = None


class TranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: str = Field(default="vi")
    word_timestamps: bool = Field(default=True)
    initial_prompt: Optional[str] = None


# ---------------------------------------------------------------------------
# gTTS Fallback Provider
# ---------------------------------------------------------------------------
def _fallback_gtts(text: str) -> bytes:
    logger.warning("⚠️ Invoking gTTS network fallback for text: %.40s...", text)
    from gtts import gTTS

    buf = io.BytesIO()
    gTTS(text=text, lang="vi", slow=False).write_to_fp(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU"
    
    vram_alloc = round(torch.cuda.memory_allocated(0) / (1024 ** 2), 2) if cuda_available else 0
    vram_res = round(torch.cuda.memory_reserved(0) / (1024 ** 2), 2) if cuda_available else 0

    return {
        "status": "ready",
        "engine": "MinhTTS Modular GPU Engine v5.0",
        "device": device_name,
        "cuda": cuda_available,
        "gpu_vram_allocated_mb": vram_alloc,
        "gpu_vram_reserved_mb": vram_res,
        "models": registry.list_models(),
        "voices": list(VOICE_MAP.keys()),
        "default_voice": DEFAULT_VOICE,
        "default_model": DEFAULT_MODEL,
    }


@app.get("/models")
async def list_models():
    return {
        "default_model": DEFAULT_MODEL,
        "models": registry.list_models(),
    }


@app.get("/voices")
async def list_voices():
    return {
        "default_voice": DEFAULT_VOICE,
        "voices": [
            {
                "id": k,
                **v,
            }
            for k, v in VOICE_METADATA.items()
        ],
    }


@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    loop = asyncio.get_running_loop()
    target_model_id = req.model.lower() if req.model else DEFAULT_MODEL

    # Determine if reference audio is provided
    has_ref_audio = bool(req.reference_audio_base64 and len(req.reference_audio_base64) > 50)

    try:
        # Load or retrieve model from registry
        model = await registry.get_or_load_model(target_model_id, executor=_executor)

        ref_data: Optional[np.ndarray] = None
        ref_sr: Optional[int] = None

        if has_ref_audio:
            # Decode audio in threadpool to prevent event-loop blocking
            ref_data, ref_sr = await loop.run_in_executor(
                _executor, decode_ref_audio, req.reference_audio_base64
            )
            logger.info("🎙️ Voice clone synthesis request (ref_sr=%d Hz)...", ref_sr)

        # Run synthesis in dedicated executor
        def _execute_synthesis():
            return model.synthesize(
                text=req.text,
                voice=req.voice,
                speed=req.speed,
                reference_audio=ref_data,
                reference_sr=ref_sr,
            )

        wav_bytes, meta = await loop.run_in_executor(_executor, _execute_synthesis)

        if not wav_bytes or len(wav_bytes) < 100:
            raise ValueError("TTS engine produced empty audio output.")

        # Calculate metrics
        duration_sec = meta.get("duration_seconds") or estimate_duration_seconds(
            wav_bytes, sample_rate=meta.get("sample_rate", 48000)
        )
        prompt_tokens = len(req.text)
        candidate_tokens = int(duration_sec * 25)  # ~25 tokens per second of synthesized speech
        total_tokens = prompt_tokens + candidate_tokens

        # Ensure all HTTP header values are strict ASCII to prevent HTTP protocol / Starlette encoding issues
        voice_header = str(req.voice).encode("ascii", "ignore").decode("ascii") or "default"
        model_header = str(meta.get("model_id", target_model_id)).encode("ascii", "ignore").decode("ascii")

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "X-Usage-Prompt-Tokens": str(prompt_tokens),
                "X-Usage-Candidates-Tokens": str(candidate_tokens),
                "X-Usage-Total-Tokens": str(total_tokens),
                "X-Audio-Duration-Sec": f"{duration_sec:.2f}",
                "X-Model-Used": model_header,
                "X-Voice-Used": voice_header,
            },
        )

    except ValueError as val_err:
        logger.warning("Bad request error: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    except Exception as exc:
        logger.error("TTS inference error: %s", exc, exc_info=True)
        # Attempt fallback to gTTS
        try:
            fb_audio = await loop.run_in_executor(_executor, _fallback_gtts, req.text)
            prompt_tokens = len(req.text)
            return Response(
                content=fb_audio,
                media_type="audio/mpeg",
                headers={
                    "X-Usage-Prompt-Tokens": str(prompt_tokens),
                    "X-Usage-Candidates-Tokens": str(prompt_tokens),
                    "X-Usage-Total-Tokens": str(prompt_tokens * 2),
                    "X-Model-Used": "gtts-fallback",
                },
            )
        except Exception as fb_exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"TTS synthesis failed: {exc} | Fallback error: {fb_exc}",
            ) from exc



@app.post("/transcribe")
async def transcribe_audio(
    request: Request,
    req: Optional[TranscribeRequest] = None,
):
    """
    Transcribe audio or video payload into structured subtitle segments with word timestamps.
    Supports either JSON payload (with audio_base64) or direct multipart file upload.
    """
    loop = asyncio.get_running_loop()
    whisper = await get_whisper_engine()

    audio_bytes: Optional[bytes] = None
    language: str = "vi"
    word_timestamps: bool = True
    initial_prompt: Optional[str] = None

    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        raw = body.get("audio_base64") or ""
        if "," in raw:
            raw = raw.split(",", 1)[1]
        if raw:
            import base64
            audio_bytes = base64.b64decode(raw)
        language = body.get("language") or language
        if "word_timestamps" in body:
            word_timestamps = bool(body.get("word_timestamps"))
        initial_prompt = body.get("initial_prompt") or initial_prompt

    elif "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if uploaded_file and hasattr(uploaded_file, "read"):
            audio_bytes = await uploaded_file.read()
        language = str(form.get("language") or language)
        if "word_timestamps" in form:
            word_timestamps = str(form.get("word_timestamps")).lower() in ("true", "1")
        initial_prompt = str(form.get("initial_prompt") or initial_prompt)

    elif req is not None and req.audio_base64:
        import base64
        raw = req.audio_base64
        if "," in raw:
            raw = raw.split(",", 1)[1]
        audio_bytes = base64.b64decode(raw)
        language = req.language or language
        word_timestamps = req.word_timestamps if req.word_timestamps is not None else word_timestamps
        initial_prompt = req.initial_prompt or initial_prompt

    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid audio/video data provided for transcription.",
        )

    try:
        def _execute_transcription():
            return whisper.transcribe(
                audio_input=audio_bytes,
                language=language,
                word_timestamps=word_timestamps,
                initial_prompt=initial_prompt,
            )

        result = await loop.run_in_executor(_executor, _execute_transcription)
        return result

    except Exception as exc:
        logger.error("Transcription error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Server Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    logger.info("Starting MinhTTS server at http://%s:%d", HOST, PORT)
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        workers=1,  # Single process to preserve dedicated GPU VRAM
        loop="asyncio",
        log_level="info",
    )
