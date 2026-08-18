"""
MinhTTS — Audio Utilities
High-performance in-memory audio decoding, encoding, normalization, and resampling.
"""

from __future__ import annotations

import base64
import io
from typing import Tuple

import numpy as np
import soundfile as sf
import torch


def encode_wav(audio: np.ndarray, sample_rate: int = 48000) -> bytes:
    """
    Encode float32 ndarray into 16-bit PCM WAV bytes purely in-memory.
    """
    buf = io.BytesIO()
    # Ensure float32 in [-1.0, 1.0] range
    audio_data = np.asarray(audio, dtype=np.float32)
    if audio_data.ndim > 1:
        audio_data = audio_data.squeeze()
    sf.write(buf, audio_data, sample_rate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def decode_ref_audio(raw_b64: str) -> Tuple[np.ndarray, int]:
    """
    Decode a base64-encoded audio payload into a mono float32 numpy array.
    Normalizes audio peak to -0.18 dBFS for optimal speaker embedding fidelity.
    """
    if not raw_b64:
        raise ValueError("Empty reference audio payload provided.")

    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    pcm_bytes = base64.b64decode(raw_b64)
    with io.BytesIO(pcm_bytes) as bio:
        data, sr = sf.read(bio, dtype="float32", always_2d=False)

    if data.ndim > 1:
        data = data.mean(axis=1)  # Stereo to mono

    data = normalize_audio(data, target_peak=0.98)
    return data, sr


def normalize_audio(data: np.ndarray, target_peak: float = 0.98) -> np.ndarray:
    """
    Peak-normalize audio signal to avoid clipping and optimize acoustic embeddings.
    """
    data = np.asarray(data, dtype=np.float32)
    peak = float(np.max(np.abs(data)))
    if peak > 0:
        data = (data / peak) * target_peak
    return data


def resample_audio(data: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    """
    Resample 1D float32 audio using torchaudio or numpy linear interpolation fallback.
    """
    if orig_sr == target_sr:
        return data

    try:
        import torchaudio.functional as F
        tensor = torch.from_numpy(data).unsqueeze(0)
        resampled = F.resample(tensor, orig_freq=orig_sr, new_freq=target_sr)
        return resampled.squeeze(0).numpy()
    except Exception:
        # Fast linear interpolation fallback
        orig_len = len(data)
        target_len = int(round(orig_len * target_sr / orig_sr))
        orig_indices = np.linspace(0, orig_len - 1, num=orig_len)
        target_indices = np.linspace(0, orig_len - 1, num=target_len)
        return np.interp(target_indices, orig_indices, data).astype(np.float32)


def estimate_duration_seconds(
    audio_bytes: bytes,
    sample_rate: int = 48000,
    bits_per_sample: int = 16,
    channels: int = 1,
) -> float:
    """
    Calculate audio duration in seconds from raw WAV byte length (excluding 44-byte header).
    """
    if not audio_bytes or len(audio_bytes) <= 44:
        return 0.0
    pcm_bytes = len(audio_bytes) - 44
    bytes_per_sec = sample_rate * channels * (bits_per_sample // 8)
    return round(pcm_bytes / bytes_per_sec, 2)
