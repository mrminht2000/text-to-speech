"""
MinhTTS — Base TTS Model Interface
Abstract Base Class defining the contract for all local text-to-speech engines.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

import numpy as np
import torch


@dataclass
class ModelMetadata:
    model_id: str
    name: str
    description: str
    sample_rate: int = 48000
    supports_cloning: bool = False
    supported_voices: list[str] = field(default_factory=list)
    backend: str = "pytorch"
    device: str = "cpu"
    version: str = "1.0.0"


class TTSModel(ABC):
    """
    Abstract Base Class for all TTS models in MinhTTS.
    Implementations must be thread-safe for inference after loading.
    """

    def __init__(self, model_id: str, name: str, description: str):
        self.model_id = model_id
        self.name = name
        self.description = description
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.device: str = "cuda" if torch.cuda.is_available() else "cpu"
        self.sample_rate: int = 48000

    @abstractmethod
    def load(self) -> None:
        """
        Synchronous model loading and GPU tensor initialization.
        Must set self.is_loaded = True on success or raise an exception.
        """
        pass

    @abstractmethod
    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0,
        reference_audio: Optional[np.ndarray] = None,
        reference_sr: Optional[int] = None,
        **kwargs: Any,
    ) -> tuple[bytes, dict[str, Any]]:
        """
        Synthesize speech from text.

        Args:
            text: Vietnamese text to synthesize.
            voice: Voice preset key or identifier.
            speed: Playback speed multiplier (0.5 to 2.0).
            reference_audio: Mono float32 numpy array for voice cloning.
            reference_sr: Sample rate of reference audio.
            **kwargs: Model-specific hyper-parameters.

        Returns:
            Tuple of (WAV audio bytes, synthesis metadata dict).
        """
        pass

    def warmup(self) -> None:
        """
        Optional warmup call to compile CUDA graphs or prime cuDNN kernels.
        Default implementation synthesizes a short Vietnamese greeting.
        """
        if not self.is_loaded:
            return
        try:
            self.synthesize("Xin chào.")
        except Exception:
            pass

    def unload(self) -> None:
        """
        Unload model weights from memory and free GPU VRAM.
        """
        self.is_loaded = False
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def health(self) -> dict[str, Any]:
        """
        Return diagnostic health information about this model.
        """
        info: dict[str, Any] = {
            "model_id": self.model_id,
            "name": self.name,
            "is_loaded": self.is_loaded,
            "device": self.device,
            "sample_rate": self.sample_rate,
            "load_error": self.load_error,
        }
        if torch.cuda.is_available() and self.device.startswith("cuda"):
            info["gpu_name"] = torch.cuda.get_device_name(0)
            info["gpu_vram_allocated_mb"] = round(torch.cuda.memory_allocated(0) / (1024 ** 2), 2)
            info["gpu_vram_reserved_mb"] = round(torch.cuda.memory_reserved(0) / (1024 ** 2), 2)
        return info

    def get_metadata(self) -> ModelMetadata:
        """
        Return metadata schema for this model.
        """
        return ModelMetadata(
            model_id=self.model_id,
            name=self.name,
            description=self.description,
            sample_rate=self.sample_rate,
            supports_cloning=False,
            supported_voices=[],
            backend="pytorch",
            device=self.device,
        )
