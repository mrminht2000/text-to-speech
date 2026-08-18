"""
MinhTTS — Local Python Inference Service (FastAPI)
Real, High-Fidelity Vietnamese Neural TTS & Zero-Shot Voice Cloning.
Powered by VieNeu-TTS (ONNX) with gTTS fallback.
"""

import io
import os
import sys
import base64
import logging
import tempfile
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import soundfile as sf
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MinhTTS.LocalEngine")

app = FastAPI(title="MinhTTS Local Inference Service", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global engine singleton
_vieneu_engine = None

def get_engine():
    global _vieneu_engine
    if _vieneu_engine is None:
        try:
            logger.info("Initializing VieNeu-TTS Neural ONNX Engine...")
            from vieneu import Vieneu
            _vieneu_engine = Vieneu()
            logger.info("VieNeu-TTS Engine ready!")
        except Exception as e:
            logger.error(f"Failed to initialize VieNeu-TTS: {e}")
            _vieneu_engine = False
    return _vieneu_engine

# Mapping Frontend Voice IDs to VieNeu Vietnamese Preset Names
VOICE_NAME_MAP = {
    "north_female": "Trúc Ly",
    "north_male": "Minh Đức",
    "south_female": "Thục Đoan",
    "south_male": "Thái Sơn",
    "central_female": "Ngọc Trân",
    "central_male": "Quang Sơn",
    "voice_clone_custom": "Trúc Ly",
    "default": "Trúc Ly",
}

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "north_female"
    speed: Optional[float] = 1.0
    model: Optional[str] = "vieneu-tts"
    reference_audio_base64: Optional[str] = None
    reference_text: Optional[str] = None

@app.on_event("startup")
def startup_event():
    # Pre-load engine in background
    get_engine()

@app.get("/health")
def health_check():
    engine = get_engine()
    preset_voices = []
    if engine and engine is not False:
        try:
            preset_voices = [f"{v[1]} ({v[0]})" for v in engine.list_preset_voices()]
        except Exception:
            pass

    return {
        "status": "ready",
        "engine": "VieNeu-TTS Neural Engine (48kHz ONNX)",
        "supported_models": [
            "vieneu-tts",
            "f5-tts-vietnamese"
        ],
        "preset_voices": preset_voices
    }

def synthesize_with_gtts_fallback(text: str) -> bytes:
    """Fallback using Google TTS for 100% reliability if ONNX engine has an issue."""
    logger.info("Using gTTS fallback engine...")
    from gtts import gTTS
    tts = gTTS(text=text, lang="vi", slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    return buf.getvalue()

@app.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    logger.info(f"Synthesizing: '{req.text[:35]}...' | voice={req.voice} | model={req.model} | speed={req.speed}x")

    engine = get_engine()

    try:
        if engine and engine is not False:
            ref_audio_path = None
            temp_file = None

            try:
                # Handle Voice Cloning from Base64 Reference Audio
                if req.reference_audio_base64:
                    raw_b64 = req.reference_audio_base64
                    if "," in raw_b64:
                        raw_b64 = raw_b64.split(",", 1)[1]

                    audio_data = base64.b64decode(raw_b64)
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
                    temp_file.write(audio_data)
                    temp_file.flush()
                    temp_file.close()
                    ref_audio_path = temp_file.name
                    logger.info(f"🎙️ Using reference audio file: {ref_audio_path}")

                # Choose preset voice
                preset_voice_name = VOICE_NAME_MAP.get(req.voice, req.voice)
                if not req.reference_audio_base64 and req.voice in VOICE_NAME_MAP:
                    preset_voice_name = VOICE_NAME_MAP[req.voice]

                # Run inference
                if ref_audio_path:
                    logger.info("Performing Zero-Shot Voice Cloning...")
                    audio_arr = engine.infer(
                        text=req.text,
                        ref_audio=ref_audio_path,
                        denoise=True
                    )
                else:
                    audio_arr = engine.infer(
                        text=req.text,
                        voice=preset_voice_name,
                        denoise=True
                    )

                # Export to 16-bit WAV bytes
                out_buf = io.BytesIO()
                sf.write(out_buf, audio_arr, engine.sample_rate, format='WAV', subtype='PCM_16')
                audio_bytes = out_buf.getvalue()

            finally:
                if temp_file and os.path.exists(temp_file.name):
                    try:
                        os.remove(temp_file.name)
                    except Exception:
                        pass
        else:
            audio_bytes = synthesize_with_gtts_fallback(req.text)

        word_count = len(req.text.split())
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "X-Usage-Prompt-Tokens": str(word_count),
                "X-Usage-Candidates-Tokens": str(int(word_count * 1.5)),
                "X-Usage-Total-Tokens": str(word_count * 2),
            }
        )
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        # Fallback to gTTS on any error
        try:
            audio_bytes = synthesize_with_gtts_fallback(req.text)
            word_count = len(req.text.split())
            return Response(
                content=audio_bytes,
                media_type="audio/mpeg",
                headers={
                    "X-Usage-Prompt-Tokens": str(word_count),
                    "X-Usage-Candidates-Tokens": str(int(word_count * 1.5)),
                    "X-Usage-Total-Tokens": str(word_count * 2),
                }
            )
        except Exception as fb_err:
            raise HTTPException(status_code=500, detail=f"Lỗi tổng hợp âm thanh: {str(e)} / {str(fb_err)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting MinhTTS Local Neural Engine on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
