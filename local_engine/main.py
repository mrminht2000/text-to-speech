"""
MinhTTS — Local Python Inference Service (FastAPI) v4.1
State-of-the-Art Vietnamese Neural Speech Synthesis & Natural Voice Cloning.

Architecture:
- VieNeu-TTS v3 Turbo (PyTorch bfloat16) chạy trên NVIDIA RTX 3060 GPU
- ONNX Speaker Encoder + Denoiser được patch sang CUDAExecutionProvider sau khi load
  (VieNeu hard-codes CPUExecutionProvider — patch này là bắt buộc để đạt tốc độ GPU thật sự)
- torch.backends.cudnn.benchmark = True — CUDA kernel auto-tune cho từng input shape
- Tensor-based In-Memory Voice Cloning (no TorchCodec / FFmpeg DLL dependency)
- Native GPU batching via VieNeu's internal batch_size=32 scheduler
- Thread-safe singleton với asyncio.Lock + double-checked locking
- Non-blocking: inference chạy trong ThreadPoolExecutor riêng, không block event loop

CUDA compatibility:
  - PyTorch:        torch >= 2.4.0+cu126
  - ONNX Runtime:   onnxruntime-gpu == 1.24.1  ← phải đúng version này cho CUDA 12.6
  - cuDNN:          9.x (đi kèm torch cu126)
"""

from __future__ import annotations

import asyncio
import base64
import io
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("MinhTTS")

# ---------------------------------------------------------------------------
# Thread pool: one dedicated thread for GPU-bound synthesis (avoid GIL contention)
# ---------------------------------------------------------------------------
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="vieneu-gpu")

# ---------------------------------------------------------------------------
# Engine singleton — loaded once, reused forever
# ---------------------------------------------------------------------------
_engine_lock = asyncio.Lock()
_vieneu: object | None | bool = None   # None = not yet loaded; False = failed


# ONNX CUDAExecutionProvider config — tuned for RTX 3060 12GB
_ORT_CUDA_PROVIDERS = [
    (
        "CUDAExecutionProvider",
        {
            "device_id": 0,
            "arena_extend_strategy": "kNextPowerOfTwo",
            "gpu_mem_limit": 2 * 1024 ** 3,   # 2 GB cap for ONNX models
            "do_copy_in_default_stream": True,
        },
    ),
    "CPUExecutionProvider",   # safe fallback
]


def _patch_onnx_sessions(engine) -> None:
    """
    VieNeu hard-codes CPUExecutionProvider for its two ONNX models.
    Rebuild both sessions with CUDAExecutionProvider so the entire
    pipeline runs on the GPU (zero CPU↔GPU round-trips during inference).

    Requires: onnxruntime-gpu==1.24.1  (compatible with CUDA 12.6)
    """
    import onnxruntime as ort  # noqa: PLC0415

    inner = engine.engine
    patched: list[str] = []

    # 1. Speaker encoder
    se = getattr(inner, "speaker_encoder", None)
    if se is not None and hasattr(se, "session") and hasattr(se, "onnx_path"):
        try:
            se.session = ort.InferenceSession(
                str(se.onnx_path), providers=_ORT_CUDA_PROVIDERS
            )
            actual = se.session.get_providers()
            if "CUDAExecutionProvider" in actual:
                patched.append(f"speaker_encoder→{actual[0]}")
        except Exception as exc:
            logger.warning("speaker_encoder CUDA patch failed: %s", exc)

    # 2. Denoiser
    d = getattr(inner, "denoiser", None)
    if d is not None and hasattr(d, "sess"):
        try:
            model_path = d.sess._model_path  # ORT stores the path internally
            d.sess = ort.InferenceSession(model_path, providers=_ORT_CUDA_PROVIDERS)
            actual = d.sess.get_providers()
            if "CUDAExecutionProvider" in actual:
                patched.append(f"denoiser→{actual[0]}")
        except Exception as exc:
            logger.warning("denoiser CUDA patch failed: %s", exc)

    if patched:
        logger.info("🔥 ONNX GPU patch applied: %s", ", ".join(patched))
    else:
        logger.warning("⚠️  ONNX GPU patch had no effect — ONNX models may still run on CPU")


def _load_engine_sync() -> object | bool:
    """Blocking model load — call only from the thread-pool executor."""
    try:
        # Enable cuDNN auto-tuner: finds the fastest conv kernels for the actual
        # input shapes used by VieNeu (one-time overhead on first run).
        torch.backends.cudnn.benchmark = True

        device = "cuda" if torch.cuda.is_available() else "cpu"
        gpu_label = torch.cuda.get_device_name(0) if device == "cuda" else "CPU"
        logger.info("🚀 Loading VieNeu on %s ...", gpu_label)

        from vieneu import Vieneu  # noqa: PLC0415

        engine = Vieneu(device=device)

        # Critical: patch ONNX sessions to run on GPU
        if device == "cuda":
            _patch_onnx_sessions(engine)

        logger.info(
            "✅ VieNeu v3 Turbo ready — %s @ %d Hz (max_batch=%d)",
            gpu_label, engine.sample_rate, engine.max_batch_size,
        )
        return engine
    except Exception as exc:
        logger.error("❌ VieNeu failed to load: %s", exc, exc_info=True)
        return False


async def get_engine() -> object:
    """Async-safe singleton getter — loads once, then returns cached instance."""
    global _vieneu
    if _vieneu is not None:
        if _vieneu is False:
            raise RuntimeError("VieNeu engine is unavailable (load failed at startup).")
        return _vieneu

    async with _engine_lock:
        # Double-checked locking
        if _vieneu is not None:
            if _vieneu is False:
                raise RuntimeError("VieNeu engine is unavailable.")
            return _vieneu

        loop = asyncio.get_running_loop()
        _vieneu = await loop.run_in_executor(_executor, _load_engine_sync)

    return _vieneu


# ---------------------------------------------------------------------------
# Regional voice presets  (20 native VieNeu speakers)
# ---------------------------------------------------------------------------
VOICE_MAP: dict[str, str] = {
    # Miền Bắc
    "north_male":    "Minh Đức",    # Nam · Bắc · Tin tức / phát thanh
    "north_female":  "Trúc Ly",     # Nữ · Bắc · Tự nhiên truyền cảm
    # Miền Trung
    "central_male":  "Quang Sơn",   # Nam · Trung · Tự nhiên
    "central_female":"Ngọc Trân",   # Nữ · Trung · Tự nhiên
    # Miền Nam
    "south_male":    "Minh Triết",  # Nam · Nam · Tin tức
    "south_female":  "Thục Đoan",   # Nữ · Nam · Kể chuyện
}
DEFAULT_VOICE = "north_female"

# Optimal inference hyper-parameters for Vietnamese natural speech
INFER_DEFAULTS = dict(
    temperature=0.72,       # Slightly higher than 0.65 for more prosodic variety
    top_k=30,               # Tight nucleus to keep pronunciation stable
    top_p=0.92,
    max_new_frames=800,     # Allow longer sentences without truncation
    repetition_penalty=1.18,
    silence_p=0.05,         # Low random-silence probability (VieNeu default=0.15)
    crossfade_p=0.06,       # Light crossfade between chunks for smooth boundaries
    apply_watermark=False,  # No watermark overhead in production
)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app_: FastAPI):  # noqa: ARG001
    """Eagerly pre-warm the GPU engine on startup so the first request is fast."""
    asyncio.create_task(_warmup())
    yield
    _executor.shutdown(wait=False)


async def _warmup():
    try:
        await get_engine()
    except Exception as exc:
        logger.warning("Warmup failed (non-fatal): %s", exc)


app = FastAPI(
    title="MinhTTS Local Inference Service",
    version="4.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    voice: str = Field(default=DEFAULT_VOICE)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    model: str = Field(default="vieneu-tts")
    reference_audio_base64: Optional[str] = None
    reference_text: Optional[str] = None   # reserved for future use


# ---------------------------------------------------------------------------
# Audio utilities
# ---------------------------------------------------------------------------
def _encode_wav(audio: np.ndarray, sample_rate: int) -> bytes:
    """Encode float32 ndarray → 16-bit PCM WAV bytes (in-memory, no temp files)."""
    buf = io.BytesIO()
    sf.write(buf, audio, sample_rate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def _decode_ref_audio(raw_b64: str) -> tuple[np.ndarray, int]:
    """
    Decode a base64-encoded audio file (any format soundfile supports) into a
    mono float32 numpy array.  Peak-normalises to -1 dBFS for consistent
    speaker-embedding quality.
    """
    if "," in raw_b64:                      # strip data-URI prefix
        raw_b64 = raw_b64.split(",", 1)[1]
    pcm_bytes = base64.b64decode(raw_b64)

    with io.BytesIO(pcm_bytes) as bio:
        data, sr = sf.read(bio, dtype="float32", always_2d=False)

    if data.ndim > 1:
        data = data.mean(axis=1)            # stereo → mono

    peak = np.max(np.abs(data))
    if peak > 0:
        data = (data / peak) * 0.98        # peak-normalise to -0.18 dBFS

    return data, sr


# ---------------------------------------------------------------------------
# Synthesis workers (synchronous — run inside the thread-pool executor)
# ---------------------------------------------------------------------------
def _synth_preset(engine, voice_name: str, text: str) -> bytes:
    """Synthesize using a VieNeu preset speaker. All chunking/batching handled internally."""
    wav: np.ndarray = engine.infer(
        text=text,
        voice=voice_name,
        **INFER_DEFAULTS,
    )
    return _encode_wav(wav, engine.sample_rate)


def _synth_clone(engine, ref_data: np.ndarray, ref_sr: int, text: str) -> bytes:
    """
    Voice-clone synthesis.
    Builds a speaker embedding once from the reference waveform tensor (avoids
    TorchCodec / file-path round-trips), then passes the voice_dict to infer().
    """
    wav_tensor = torch.from_numpy(ref_data).unsqueeze(0)   # (1, T)

    logger.info("🎙️ Pre-encoding speaker profile on GPU (sr=%d Hz) ...", ref_sr)
    speaker_emb, ref_codes = engine.engine.prepare_reference(
        wav_tensor, sr=ref_sr, denoise=True,
    )
    voice_dict = {"speaker_emb": speaker_emb, "codes": ref_codes}

    wav: np.ndarray = engine.infer(
        text=text,
        voice=voice_dict,
        **INFER_DEFAULTS,
    )
    return _encode_wav(wav, engine.sample_rate)


# ---------------------------------------------------------------------------
# Fallback: gTTS (network-only; fires only when VieNeu is broken)
# ---------------------------------------------------------------------------
def _fallback_gtts(text: str) -> bytes:
    logger.warning("⚠️  Falling back to gTTS for: %.40s ...", text)
    from gtts import gTTS  # noqa: PLC0415
    buf = io.BytesIO()
    gTTS(text=text, lang="vi", slow=False).write_to_fp(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    cuda = torch.cuda.is_available()
    return {
        "status": "ready",
        "engine": "VieNeu-TTS v3 Turbo + MinhTTS GPU v4.0",
        "device": torch.cuda.get_device_name(0) if cuda else "CPU",
        "cuda": cuda,
        "voices": list(VOICE_MAP.keys()),
        "supported_models": ["vieneu-tts", "f5-tts-vietnamese"],
    }


@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    loop = asyncio.get_running_loop()

    # Determine mode: voice cloning vs. preset regional
    is_cloning = (
        req.model == "f5-tts-vietnamese"
        or req.voice == "voice_clone_custom"
    ) and bool(req.reference_audio_base64)

    try:
        engine = await get_engine()

        if is_cloning:
            # Decode reference audio on the event-loop (fast CPU op)
            ref_data, ref_sr = _decode_ref_audio(req.reference_audio_base64)

            logger.info(
                "🎙️ Clone synth: %.40s... | %d segments | sr=%d",
                req.text, len(req.text.split(".")), ref_sr,
            )
            audio_bytes: bytes = await loop.run_in_executor(
                _executor,
                _synth_clone,
                engine, ref_data, ref_sr, req.text,
            )
            media_type = "audio/wav"

        else:
            voice_name = VOICE_MAP.get(req.voice, VOICE_MAP[DEFAULT_VOICE])
            logger.info(
                "🇻🇳 Preset synth: %.40s... | voice=%s (%s)",
                req.text, req.voice, voice_name,
            )
            audio_bytes = await loop.run_in_executor(
                _executor,
                _synth_preset,
                engine, voice_name, req.text,
            )
            media_type = "audio/wav"

        if not audio_bytes or len(audio_bytes) < 100:
            raise ValueError("Engine returned empty audio.")

        # Approximate token usage (character-based, proportional to audio length)
        char_count = len(req.text)
        return Response(
            content=audio_bytes,
            media_type=media_type,
            headers={
                "X-Usage-Prompt-Tokens": str(char_count),
                "X-Usage-Candidates-Tokens": str(char_count),
                "X-Usage-Total-Tokens": str(char_count * 2),
            },
        )

    except Exception as exc:
        logger.error("Synthesis error: %s", exc, exc_info=True)
        try:
            fb = await loop.run_in_executor(_executor, _fallback_gtts, req.text)
            char_count = len(req.text)
            return Response(
                content=fb,
                media_type="audio/mpeg",
                headers={
                    "X-Usage-Prompt-Tokens": str(char_count),
                    "X-Usage-Candidates-Tokens": str(char_count),
                    "X-Usage-Total-Tokens": str(char_count * 2),
                },
            )
        except Exception as fb_exc:
            raise HTTPException(
                status_code=500,
                detail=f"Synthesis failed: {exc} | fallback: {fb_exc}",
            ) from exc


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    logger.info("Starting MinhTTS v4.0 on port %d ...", port)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=1,           # Single worker: GPU is not shareable between processes
        loop="asyncio",
        log_level="info",
    )
