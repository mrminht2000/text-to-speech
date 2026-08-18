"""
Core components for MinhTTS Local Inference Engine.
"""

from .base_model import TTSModel, ModelMetadata
from .registry import ModelRegistry, get_model_registry
from .audio_utils import (
    encode_wav,
    decode_ref_audio,
    normalize_audio,
    estimate_duration_seconds,
)

__all__ = [
    "TTSModel",
    "ModelMetadata",
    "ModelRegistry",
    "get_model_registry",
    "encode_wav",
    "decode_ref_audio",
    "normalize_audio",
    "estimate_duration_seconds",
]
