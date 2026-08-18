"""
MinhTTS — Model Registry & Lifecycle Manager
Thread-safe singleton registry for registering, discovering, loading, and warming up TTS engines.
"""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from typing import Dict, List, Optional, Type

from .base_model import TTSModel, ModelMetadata

logger = logging.getLogger("MinhTTS.Registry")


class ModelRegistry:
    """
    Central repository for all TTS model instances.
    Provides thread-safe lazy loading and warmup capabilities.
    """

    def __init__(self):
        self._models: Dict[str, TTSModel] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()
        self._default_model_id: str = "vieneu-tts"

    def register(self, model: TTSModel) -> None:
        """
        Register a TTS model instance into the registry.
        """
        model_id = model.model_id.lower()
        self._models[model_id] = model
        if model_id not in self._locks:
            self._locks[model_id] = asyncio.Lock()
        logger.info("Registered TTS model: %s (%s)", model.name, model_id)

    def get_model(self, model_id: Optional[str] = None) -> Optional[TTSModel]:
        """
        Get model instance by ID without loading (synchronous lookup).
        """
        target_id = (model_id or self._default_model_id).lower()
        return self._models.get(target_id)

    async def get_or_load_model(
        self,
        model_id: Optional[str] = None,
        executor: Optional[ThreadPoolExecutor] = None,
    ) -> TTSModel:
        """
        Async-safe getter with double-checked locking that loads the model on demand in an executor.
        """
        target_id = (model_id or self._default_model_id).lower()
        
        # Fast path: check if registered
        if target_id not in self._models:
            available = list(self._models.keys())
            raise ValueError(
                f"Model '{target_id}' is not registered. Available models: {available}"
            )

        model = self._models[target_id]
        if model.is_loaded:
            return model

        # Ensure lock exists for this model
        if target_id not in self._locks:
            async with self._global_lock:
                if target_id not in self._locks:
                    self._locks[target_id] = asyncio.Lock()

        # Synchronize loading per model
        async with self._locks[target_id]:
            if model.is_loaded:
                return model

            if model.load_error:
                raise RuntimeError(
                    f"Model '{target_id}' previously failed to load: {model.load_error}"
                )

            loop = asyncio.get_running_loop()
            try:
                logger.info("⏳ Loading model '%s' in thread pool...", target_id)
                await loop.run_in_executor(executor, model.load)
                logger.info("✅ Model '%s' loaded successfully.", target_id)
            except Exception as exc:
                model.load_error = str(exc)
                logger.error("❌ Failed to load model '%s': %s", target_id, exc, exc_info=True)
                raise RuntimeError(f"Failed to load model '{target_id}': {exc}") from exc

        return model

    async def warmup_all(self, executor: Optional[ThreadPoolExecutor] = None) -> None:
        """
        Eagerly load and warmup default or registered models.
        """
        for model_id, model in self._models.items():
            try:
                loaded_model = await self.get_or_load_model(model_id, executor=executor)
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(executor, loaded_model.warmup)
                logger.info("🔥 Warmup completed for '%s'", model_id)
            except Exception as exc:
                logger.warning("Warmup skipped or failed for '%s': %s", model_id, exc)

    def list_models(self) -> List[dict]:
        """
        Return list of metadata for all registered models.
        """
        results = []
        for model in self._models.values():
            meta = model.get_metadata()
            health_info = model.health()
            results.append({
                "model_id": meta.model_id,
                "name": meta.name,
                "description": meta.description,
                "sample_rate": meta.sample_rate,
                "supports_cloning": meta.supports_cloning,
                "supported_voices": meta.supported_voices,
                "backend": meta.backend,
                "device": meta.device,
                "is_loaded": model.is_loaded,
                "health": health_info,
            })
        return results

    def set_default_model(self, model_id: str) -> None:
        self._default_model_id = model_id.lower()


# Global Singleton Registry
_registry: Optional[ModelRegistry] = None


def get_model_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry
