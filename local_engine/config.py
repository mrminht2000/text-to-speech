"""
MinhTTS Local Engine — Configuration & Constants
Centralized settings for GPU optimizations, dialect voice mapping, inference defaults, and runtime policies.
"""

from __future__ import annotations

import os
import torch

# ---------------------------------------------------------------------------
# Global CUDA / Tensor Core Optimizations (Ampere RTX 3060)
# ---------------------------------------------------------------------------
# Enable cuDNN auto-tuner: finds fastest convolution algorithms for current GPU
torch.backends.cudnn.benchmark = True

# Allow TensorFloat-32 (TF32) on Ampere+ GPUs (RTX 3060) for accelerated matmuls
if hasattr(torch.backends.cuda, "matmul"):
    torch.backends.cuda.matmul.allow_tf32 = True
if hasattr(torch.backends.cudnn, "allow_tf32"):
    torch.backends.cudnn.allow_tf32 = True

# ---------------------------------------------------------------------------
# Runtime & Concurrency Settings
# ---------------------------------------------------------------------------
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", 8000))
EXECUTOR_WORKERS = int(os.environ.get("EXECUTOR_WORKERS", 2))
MAX_TEXT_LENGTH = int(os.environ.get("MAX_TEXT_LENGTH", 2048))

# ---------------------------------------------------------------------------
# ONNX Runtime CUDA Provider Settings (Tuned for RTX 3060 12GB)
# ---------------------------------------------------------------------------
ORT_CUDA_PROVIDERS = [
    (
        "CUDAExecutionProvider",
        {
            "device_id": 0,
            "arena_extend_strategy": "kNextPowerOfTwo",
            "gpu_mem_limit": 2 * 1024 ** 3,  # 2 GB memory cap for ONNX components
            "do_copy_in_default_stream": True,
            "cudnn_conv_algo_search": "DEFAULT",
        },
    ),
    "CPUExecutionProvider",  # Robust fallback
]

# ---------------------------------------------------------------------------
# Regional Voice Presets (Accurate Vietnamese Accents & Dialects)
# ---------------------------------------------------------------------------
VOICE_MAP: dict[str, str] = {
    # Miền Bắc (Northern Vietnamese)
    "north_male": "Minh Đức",      # Nam · Bắc · Tin tức / phát thanh truyền cảm
    "north_female": "Trúc Ly",     # Nữ · Bắc · Tự nhiên, nhẹ nhàng, thanh lịch
    
    # Miền Trung (Central Vietnamese)
    "central_male": "Quang Sơn",   # Nam · Trung · Trầm ấm, tự nhiên
    "central_female": "Ngọc Trân", # Nữ · Trung · Ngọt ngào, truyền cảm
    
    # Miền Nam (Southern Vietnamese)
    "south_male": "Minh Triết",    # Nam · Nam · Hiện đại, rõ ràng, dứt khoát
    "south_female": "Thục Đoan",   # Nữ · Nam · Kể chuyện, dịu dàng, ấm áp
}

VOICE_METADATA: dict[str, dict[str, str]] = {
    "north_male": {
        "speaker": "Minh Đức",
        "gender": "male",
        "region": "Bắc",
        "style": "Tin tức, phát thanh viên",
        "description": "Giọng nam miền Bắc trầm ấm, dõng dạc, phát âm chuẩn",
    },
    "north_female": {
        "speaker": "Trúc Ly",
        "gender": "female",
        "region": "Bắc",
        "style": "Tự nhiên, đối thoại",
        "description": "Giọng nữ miền Bắc trẻ trung, nhẹ nhàng, tự nhiên",
    },
    "central_male": {
        "speaker": "Quang Sơn",
        "gender": "male",
        "region": "Trung",
        "style": "Tự nhiên, tự sự",
        "description": "Giọng nam miền Trung mộc mạc, truyền cảm",
    },
    "central_female": {
        "speaker": "Ngọc Trân",
        "gender": "female",
        "region": "Trung",
        "style": "Kể chuyện, đối thoại",
        "description": "Giọng nữ miền Trung ngọt ngào, duyên dáng",
    },
    "south_male": {
        "speaker": "Minh Triết",
        "gender": "male",
        "region": "Nam",
        "style": "Tin tức, năng động",
        "description": "Giọng nam miền Nam hiện đại, sôi nổi, tự nhiên",
    },
    "south_female": {
        "speaker": "Thục Đoan",
        "gender": "female",
        "region": "Nam",
        "style": "Kể chuyện, quảng cáo",
        "description": "Giọng nữ miền Nam dịu dàng, cảm xúc sâu lắng",
    },
}

DEFAULT_VOICE = "north_female"
DEFAULT_MODEL = "vieneu-tts"

# ---------------------------------------------------------------------------
# Inference Hyper-parameters for Natural Prosody
# ---------------------------------------------------------------------------
INFER_DEFAULTS = {
    "temperature": 0.72,       # Balanced prosody & expressiveness
    "top_k": 30,               # Tight nucleus for high pronunciation stability
    "top_p": 0.92,
    "max_new_frames": 1000,    # Generous frame budget for long Vietnamese sentences
    "repetition_penalty": 1.18,
    "silence_p": 0.05,         # Reduced random silence probability for smooth cadence
    "crossfade_p": 0.06,       # Sub-frame crossfade between acoustic chunks
    "apply_watermark": False,  # Zero watermark latency overhead
}
