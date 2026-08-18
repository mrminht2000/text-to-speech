"""
MinhTTS — Whisper ASR & Auto-Subtitling Model Implementation
High-accuracy Vietnamese speech recognition powered by faster-whisper (large-v3-turbo / medium) on CUDA.
Includes robust in-memory PyAV audio decoding, conversation-optimized VAD, and comprehensive YouTube hallucination scrubbing.
"""

from __future__ import annotations

import io
import logging
import os
import re
import tempfile
from typing import Any, Dict, List, Optional, Union

import numpy as np
import soundfile as sf
import torch

logger = logging.getLogger("MinhTTS.Whisper")


def decode_media_to_16k_mono(audio_input: Union[bytes, bytearray, io.BytesIO, str]) -> np.ndarray:
    """
    Decode any audio/video container (MP4, MKV, WebM, MOV, MP3, WAV, FLAC, AAC, OGG)
    into a 16kHz mono float32 NumPy array purely in-memory using PyAV.
    """
    try:
        import av

        if isinstance(audio_input, (bytes, bytearray)):
            bio = io.BytesIO(audio_input)
        elif isinstance(audio_input, io.BytesIO):
            bio = audio_input
            bio.seek(0)
        else:
            bio = audio_input  # File path string

        container = av.open(bio)
        resampler = av.AudioResampler(format="fltp", layout="mono", rate=16000)
        chunks: List[np.ndarray] = []

        for frame in container.decode(audio=0):
            for resampled_frame in resampler.resample(frame):
                chunks.append(resampled_frame.to_ndarray())

        if chunks:
            # Shape is (1, N) -> squeeze to (N,)
            audio_array = np.concatenate(chunks, axis=1).squeeze().astype(np.float32)
            return audio_array

    except Exception as av_exc:
        logger.warning("PyAV stream decode notice (%s), trying soundfile fallback...", av_exc)

    # Fallback with soundfile
    if isinstance(audio_input, (bytes, bytearray, io.BytesIO)):
        bio = io.BytesIO(audio_input) if not isinstance(audio_input, io.BytesIO) else audio_input
        bio.seek(0)
        data, sr = sf.read(bio, dtype="float32", always_2d=False)
    else:
        data, sr = sf.read(audio_input, dtype="float32", always_2d=False)

    if data.ndim > 1:
        data = data.mean(axis=1)

    if sr != 16000:
        orig_len = len(data)
        target_len = int(round(orig_len * 16000 / sr))
        orig_indices = np.linspace(0, orig_len - 1, num=orig_len)
        target_indices = np.linspace(0, orig_len - 1, num=target_len)
        data = np.interp(target_indices, orig_indices, data).astype(np.float32)

    return data


# Comprehensive patterns of YouTube training data hallucinations in Whisper
YOUTUBE_HALLUCINATION_PATTERNS = [
    r"ghi\u1ec1n\s*m\u00ec\s*g\u00f5",  # ghiền mì gõ
    r"ghien\s*mi\s*go",
    r"subscribe",
    r"\u0111\u0103ng\s*k\u00fd\s*k\u00eanh",  # đăng ký kênh
    r"\u0111\u0103ng\s*k\u00ed\s*k\u00eanh",  # đăng kí kênh
    r"like\s*v\u00e0\s*share",
    r"like\s*v\u00e0\s*subscribe",
    r"b\u1ea5m\s*chu\u00f4ng",  # bấm chuông
    r"c\u1ea3m\s*\u01a1n\s*c\u00e1c\s*b\u1ea1n\s*\u0111\u00e3\s*theo\s*d\u00f5i",  # cảm ơn các bạn đã theo dõi
    r"c\u1ea3m\s*\u01a1n\s*b\u1ea1n\s*\u0111\u00e3\s*theo\s*d\u00f5i",
    r"c\u1ea3m\s*\u01a1n\s*c\u00e1c\s*b\u1ea1n\s*\u0111\u00e3\s*l\u1eafng\s*nghe",  # cảm ơn các bạn đã lắng nghe
    r"c\u1ea3m\s*\u01a1n\s*b\u1ea1n\s*\u0111\u00e3\s*l\u1eafng\s*nghe",
    r"c\u1ea3m\s*\u01a1n\s*c\u00e1c\s*b\u1ea1n\s*\u0111\u00e3\s*xem",
    r"c\u1ea3m\s*\u01a1n\s*\u0111\u00e3\s*xem",
    r"ch\u00fac\s*c\u00e1c\s*b\u1ea1n\s*m\u1ed9t\s*ng\u00e0y\s*vui\s*v\u1ebb",
    r"t\u1ea1m\s*bi\u1ec7t\s*v\u00e0\s*h\u1eb9n\s*g\u1eb7p\s*l\u1ea1i",
    r"faptv",
    r"vtv\s*go",
]

COMPILED_HALLUCINATIONS = [re.compile(p, re.IGNORECASE) for p in YOUTUBE_HALLUCINATION_PATTERNS]


def is_hallucination(text: str, no_speech_prob: float = 0.0) -> bool:
    """
    Check if a transcribed segment is a YouTube training artifact or hallucination.
    """
    norm = text.strip()
    if not norm:
        return True

    for pattern in COMPILED_HALLUCINATIONS:
        if pattern.search(norm):
            # If the segment contains a known YouTube artifact, drop it unless speech confidence is extremely high and long
            if len(norm.split()) <= 15 or no_speech_prob > 0.2:
                return True

    return False


class WhisperASRModel:
    """
    Faster-Whisper Automatic Speech Recognition (ASR) & Subtitle Engine.
    Powered by large-v3-turbo on CUDA float16 for maximum Vietnamese accuracy and low latency.
    """

    def __init__(self, model_size: str = "large-v3-turbo"):
        self.model_id = "whisper-subtitles"
        self.name = f"Faster-Whisper ({model_size})"
        self.description = "State-of-the-art speech-to-text with precise word & segment timestamps"
        self.model_size = model_size
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        self._model = None

    def load(self) -> None:
        """
        Load Whisper model onto GPU via faster-whisper.
        """
        from faster_whisper import WhisperModel

        logger.info(
            "🚀 Loading Faster-Whisper (%s) on %s [%s]...",
            self.model_size,
            self.device.upper(),
            self.compute_type,
        )
        try:
            self._model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                cpu_threads=4,
            )
            self.is_loaded = True
            self.load_error = None
            logger.info("✅ Faster-Whisper (%s) ready.", self.model_size)
        except Exception as exc:
            self.is_loaded = False
            self.load_error = str(exc)
            logger.error("❌ Failed to load Faster-Whisper: %s", exc, exc_info=True)
            raise

    def transcribe(
        self,
        audio_input: Union[bytes, str, io.BytesIO, np.ndarray],
        language: str = "vi",
        word_timestamps: bool = True,
        initial_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribe audio/video to Vietnamese text with high precision sentence and word timestamps.
        Features conversation-tuned VAD and hallucination scrubbing.
        """
        if not self.is_loaded or self._model is None:
            self.load()

        # 1. Decode to 16kHz float32 NumPy array
        if isinstance(audio_input, np.ndarray):
            audio_array = audio_input.astype(np.float32)
        else:
            audio_array = decode_media_to_16k_mono(audio_input)

        if audio_array.size == 0:
            return {
                "text": "",
                "language": language,
                "language_probability": 0.0,
                "duration": 0.0,
                "segments": [],
            }

        duration_sec = round(len(audio_array) / 16000.0, 2)
        logger.info("🎙️ Transcribing 16kHz audio array (duration=%.2fs, lang=%s)...", duration_sec, language)

        # 2. Run Faster-Whisper with optimized conversation & anti-hallucination settings
        segments_gen, info = self._model.transcribe(
            audio_array,
            language=language if language and language != "auto" else None,
            word_timestamps=word_timestamps,
            initial_prompt=initial_prompt if initial_prompt and len(initial_prompt.strip()) > 0 else None,
            condition_on_previous_text=False,  # CRITICAL: Prevents autoregressive looping
            vad_filter=True,
            vad_parameters=dict(
                threshold=0.25,                 # More sensitive to quiet/overlapping speakers
                min_speech_duration_ms=150,     # Don't drop short quick words
                min_silence_duration_ms=350,    # Natural sentence segmentation
                speech_pad_ms=250,              # Keep sentence starts and ends
            ),
            no_speech_threshold=0.4,            # Sensitive speech detection
            log_prob_threshold=-1.0,            # Discards low-confidence guesses
            compression_ratio_threshold=2.2,    # Anti-repetition
            beam_size=5,
            temperature=[0.0, 0.2, 0.4],
        )

        segments_list = []
        full_text_parts = []

        for idx, seg in enumerate(segments_gen, 1):
            seg_text = seg.text.strip()
            if not seg_text:
                continue

            no_speech = getattr(seg, "no_speech_prob", 0.0)

            # Scrub hallucinations from YouTube dataset
            if is_hallucination(seg_text, no_speech):
                logger.info("Filtered YouTube hallucination: '%s' (no_speech_prob=%.2f)", seg_text, no_speech)
                continue

            full_text_parts.append(seg_text)

            words_data = []
            if seg.words:
                for w in seg.words:
                    w_text = w.word.strip()
                    if w_text:
                        words_data.append({
                            "word": w_text,
                            "start": round(w.start, 2),
                            "end": round(w.end, 2),
                            "probability": round(w.probability, 2),
                        })

            segments_list.append({
                "id": idx,
                "start": round(seg.start, 2),
                "end": round(seg.end, 2),
                "text": seg_text,
                "words": words_data,
            })

        result = {
            "text": " ".join(full_text_parts),
            "language": info.language if info else language,
            "language_probability": round(info.language_probability, 2) if info else 1.0,
            "duration": duration_sec,
            "segments": segments_list,
        }
        logger.info(
            "✅ Transcription completed: %d segments, %.2fs duration, text length=%d chars.",
            len(segments_list),
            result["duration"],
            len(result["text"]),
        )
        return result

    def warmup(self) -> None:
        if not self.is_loaded:
            return
        try:
            dummy_audio = np.zeros(16000, dtype=np.float32)
            self.transcribe(dummy_audio)
        except Exception:
            pass

    def health(self) -> dict[str, Any]:
        return {
            "model_id": self.model_id,
            "name": self.name,
            "is_loaded": self.is_loaded,
            "device": self.device,
            "compute_type": self.compute_type,
            "model_size": self.model_size,
            "load_error": self.load_error,
        }
