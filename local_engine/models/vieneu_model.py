"""
MinhTTS — VieNeu-TTS v3 Turbo Model Implementation
High-performance Vietnamese neural text-to-speech with GPU-accelerated ONNX speaker encoder.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import numpy as np
import torch

from config import (
    DEFAULT_VOICE,
    INFER_DEFAULTS,
    ORT_CUDA_PROVIDERS,
    VOICE_MAP,
    VOICE_METADATA,
)
from core.audio_utils import encode_wav, estimate_duration_seconds
from core.base_model import ModelMetadata, TTSModel

logger = logging.getLogger("MinhTTS.VieNeu")


class VieNeuModel(TTSModel):
    """
    VieNeu-TTS v3 Turbo Engine wrapper.
    Optimized for NVIDIA Ampere (RTX 3060) GPU with CUDA ONNX patch and bfloat16 inference.
    """

    def __init__(self):
        super().__init__(
            model_id="vieneu-tts",
            name="VieNeu-TTS v3 Turbo",
            description="State-of-the-art Vietnamese neural TTS with 6 regional dialect voices & zero-shot voice cloning",
        )
        self.sample_rate = 48000
        self._engine = None
        self._patched_onnx: list[str] = []

    def _patch_onnx_sessions(self) -> None:
        """
        VieNeu hard-codes CPUExecutionProvider for its ONNX components.
        We rebuild both sessions with CUDAExecutionProvider for end-to-end GPU inference.
        """
        import onnxruntime as ort

        if not hasattr(self._engine, "engine"):
            return

        inner = self._engine.engine
        self._patched_onnx.clear()

        # 1. Speaker Encoder Patch
        se = getattr(inner, "speaker_encoder", None)
        if se is not None and hasattr(se, "onnx_path") and hasattr(se, "session"):
            try:
                se.session = ort.InferenceSession(
                    str(se.onnx_path), providers=ORT_CUDA_PROVIDERS
                )
                actual_providers = se.session.get_providers()
                if "CUDAExecutionProvider" in actual_providers:
                    self._patched_onnx.append(f"speaker_encoder -> {actual_providers[0]}")
            except Exception as exc:
                logger.warning("Speaker encoder CUDA patch failed: %s", exc)

        # 2. Denoiser Patch
        d = getattr(inner, "denoiser", None)
        if d is not None and hasattr(d, "sess"):
            try:
                model_path = None
                if hasattr(d.sess, "_model_path"):
                    model_path = d.sess._model_path
                else:
                    from huggingface_hub import hf_hub_download
                    model_path = hf_hub_download("pnnbao-ump/VieNeu-TTS-v3-Turbo", "denoiser.onnx")

                if model_path:
                    d.sess = ort.InferenceSession(str(model_path), providers=ORT_CUDA_PROVIDERS)
                    actual_providers = d.sess.get_providers()
                    if "CUDAExecutionProvider" in actual_providers:
                        self._patched_onnx.append(f"denoiser -> {actual_providers[0]}")
            except Exception as exc:
                logger.warning("Denoiser CUDA patch failed: %s", exc)

        if self._patched_onnx:
            logger.info("🔥 VieNeu ONNX GPU patch active: %s", ", ".join(self._patched_onnx))
        else:
            logger.warning("⚠️ VieNeu ONNX components running on CPU fallback.")

    def load(self) -> None:
        """
        Load the VieNeu-TTS v3 Turbo engine onto GPU/CPU.
        """
        from vieneu import Vieneu

        device_str = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("🚀 Loading VieNeu-TTS on %s ...", device_str.upper())

        self._engine = Vieneu(device=device_str)

        if device_str == "cuda":
            self._patch_onnx_sessions()

        self.is_loaded = True
        self.load_error = None
        self.device = device_str
        logger.info(
            "✅ VieNeu-TTS v3 Turbo ready @ %d Hz (max_batch=%d)",
            self.sample_rate,
            getattr(self._engine, "max_batch_size", 32),
        )

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
        Execute speech synthesis using either preset regional voices or zero-shot neural cloning.
        """
        if not self.is_loaded or self._engine is None:
            raise RuntimeError("VieNeuModel is not loaded. Call load() first.")

        infer_params = dict(INFER_DEFAULTS)
        infer_params.update(kwargs)

        with torch.inference_mode():
            # Check for Voice Cloning mode
            if reference_audio is not None and reference_sr is not None:
                wav_tensor = torch.from_numpy(reference_audio).unsqueeze(0)
                if self.device == "cuda":
                    wav_tensor = wav_tensor.cuda()

                logger.info("🎙️ VieNeu Voice Cloning: encoding reference audio (sr=%d Hz)...", reference_sr)
                speaker_emb, ref_codes = self._engine.engine.prepare_reference(
                    wav_tensor, sr=reference_sr, denoise=True
                )
                voice_target = {"speaker_emb": speaker_emb, "codes": ref_codes}
                voice_used = "voice_clone_neural"
            else:
                voice_key = voice or DEFAULT_VOICE
                voice_used = VOICE_MAP.get(voice_key, VOICE_MAP[DEFAULT_VOICE])
                voice_target = voice_used

            # Run synthesis
            wav_output: np.ndarray = self._engine.infer(
                text=text,
                voice=voice_target,
                **infer_params,
            )

        wav_bytes = encode_wav(wav_output, sample_rate=self.sample_rate)
        duration_sec = estimate_duration_seconds(wav_bytes, sample_rate=self.sample_rate)

        metadata = {
            "model_id": self.model_id,
            "voice": voice_used,
            "sample_rate": self.sample_rate,
            "duration_seconds": duration_sec,
            "prompt_chars": len(text),
            "device": self.device,
        }

        return wav_bytes, metadata

    def warmup(self) -> None:
        """
        Execute warmup run to prime CUDA execution graphs and cuDNN caches.
        """
        if not self.is_loaded:
            return
        try:
            logger.info("🔥 Priming VieNeu CUDA kernels with short warmup...")
            self.synthesize("Xin chào, hệ thống giọng nói nhân tạo đã sẵn sàng.")
            if torch.cuda.is_available():
                torch.cuda.synchronize()
        except Exception as exc:
            logger.warning("VieNeu warmup notice: %s", exc)

    def health(self) -> dict[str, Any]:
        info = super().health()
        info["onnx_gpu_patches"] = self._patched_onnx
        info["max_batch_size"] = getattr(self._engine, "max_batch_size", 32) if self._engine else 0
        return info

    def get_metadata(self) -> ModelMetadata:
        return ModelMetadata(
            model_id=self.model_id,
            name=self.name,
            description=self.description,
            sample_rate=self.sample_rate,
            supports_cloning=True,
            supported_voices=list(VOICE_MAP.keys()),
            backend="pytorch+onnx-gpu",
            device=self.device,
        )
