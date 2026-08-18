"""
MinhTTS — Performance & GPU Profiling Benchmark Harness
Tests latency (P50, P95, P99), Real-Time Factor (RTF), GPU memory consumption, and characters/sec.

Usage:
    python benchmark.py --model vieneu-tts --runs 10
    python benchmark.py --model vieneu-tts --runs 5 --voice north_male
    python benchmark.py --text "Trí tuệ nhân tạo đang thay đổi cách con người làm việc."
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
from typing import Any, List

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
import torch

from config import DEFAULT_MODEL, DEFAULT_VOICE, VOICE_MAP
from core.audio_utils import estimate_duration_seconds
from core.registry import get_model_registry
from models.f5tts_model import F5TTSModel
from models.vieneu_model import VieNeuModel

SAMPLE_SENTENCES = [
    "Xin chào các bạn, đây là hệ thống chuyển đổi văn bản thành giọng nói tiếng Việt.",
    "Hà Nội mùa thu đẹp nao lòng với hương hoa sữa và những con đường rợp bóng cây xanh.",
    "Đà Nẵng là thành phố đáng sống nhất Việt Nam với những cây cầu độc đáo bắc qua sông Hàn.",
    "Sài Gòn luôn nhộn nhịp, năng động và chào đón mọi người bằng tấm lòng cởi mở, ấm áp.",
    "Trí tuệ nhân tạo và học máy đang mở ra kỷ nguyên mới cho nền công nghệ toàn cầu.",
]


def run_benchmark(
    model_id: str = DEFAULT_MODEL,
    voice: str = DEFAULT_VOICE,
    runs: int = 5,
    custom_text: str | None = None,
    output_json: str | None = None,
):
    print("=" * 70)
    print("  [MINHTTS] LOCAL INFERENCE BENCHMARK HARNESS")
    print("=" * 70)

    # Initialize registry
    registry = get_model_registry()
    registry.register(VieNeuModel())
    registry.register(F5TTSModel())

    model = registry.get_model(model_id)
    if model is None:
        print(f"[ERROR] Model '{model_id}' not found.")
        return

    # Check CUDA
    has_cuda = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if has_cuda else "CPU"
    print(f"Hardware Device: {device_name}")
    if has_cuda:
        print(f"CUDA Version: {torch.version.cuda} | cuDNN: {torch.backends.cudnn.version()}")
        print(f"Initial VRAM Allocated: {torch.cuda.memory_allocated(0)/(1024**2):.2f} MB")

    # Load Model
    print(f"\nLoading model '{model_id}'...")
    start_load = time.perf_counter()
    model.load()
    load_time = time.perf_counter() - start_load
    print(f"Model loaded in {load_time:.3f} seconds.")

    # Warmup
    print("Executing warmup pass...")
    model.warmup()
    if has_cuda:
        torch.cuda.synchronize()

    # Prepare Texts
    texts = [custom_text] * runs if custom_text else (SAMPLE_SENTENCES * ((runs // len(SAMPLE_SENTENCES)) + 1))[:runs]

    latencies: List[float] = []
    durations: List[float] = []
    rtfs: List[float] = []
    char_speeds: List[float] = []

    print(f"\nRunning {runs} inference iterations (Voice: '{voice}' -> '{VOICE_MAP.get(voice, voice)}')...\n")
    print(f"{'Run':<5} | {'Chars':<6} | {'Audio Len':<10} | {'Latency (ms)':<14} | {'RTF (x Realtime)':<18} | {'Chars/sec':<10}")
    print("-" * 75)

    for i, text in enumerate(texts, 1):
        if has_cuda:
            torch.cuda.synchronize()
            
        t0 = time.perf_counter()
        wav_bytes, meta = model.synthesize(text=text, voice=voice)
        
        if has_cuda:
            torch.cuda.synchronize()
        t1 = time.perf_counter()

        latency_ms = (t1 - t0) * 1000
        latencies.append(latency_ms)

        audio_sec = meta.get("duration_seconds") or estimate_duration_seconds(
            wav_bytes, sample_rate=meta.get("sample_rate", 48000)
        )
        durations.append(audio_sec)

        # Real-time factor = audio_duration / generation_latency
        rtf = audio_sec / (latency_ms / 1000) if latency_ms > 0 else 0
        rtfs.append(rtf)

        chars_per_sec = len(text) / (latency_ms / 1000) if latency_ms > 0 else 0
        char_speeds.append(chars_per_sec)

        print(f"{i:<5} | {len(text):<6} | {audio_sec:<9.2f}s | {latency_ms:<14.2f} | {rtf:<18.2f} | {chars_per_sec:<10.1f}")

    # Summary Statistics
    p50 = statistics.median(latencies)
    p95 = np.percentile(latencies, 95) if len(latencies) > 1 else latencies[0]
    p99 = np.percentile(latencies, 99) if len(latencies) > 1 else latencies[0]
    avg_latency = statistics.mean(latencies)
    avg_rtf = statistics.mean(rtfs)
    avg_speed = statistics.mean(char_speeds)
    total_audio = sum(durations)
    total_time = sum(latencies) / 1000

    print("\n" + "=" * 70)
    print("  [BENCHMARK SUMMARY REPORT]")
    print("=" * 70)
    print(f"• Model:                  {model.name} ({model_id})")
    print(f"• Device:                 {device_name}")
    print(f"• Total Iterations:       {runs}")
    print(f"• Total Audio Generated:  {total_audio:.2f} seconds")
    print(f"• Total Compute Time:     {total_time:.2f} seconds")
    print(f"• Mean Latency:           {avg_latency:.2f} ms")
    print(f"• Median Latency (P50):   {p50:.2f} ms")
    print(f"• 95th Percentile (P95):  {p95:.2f} ms")
    print(f"• 99th Percentile (P99):  {p99:.2f} ms")
    print(f"• Average RTF:            {avg_rtf:.2f}x faster than real-time")
    print(f"• Throughput:             {avg_speed:.1f} chars/second")

    if has_cuda:
        peak_alloc = torch.cuda.max_memory_allocated(0) / (1024 ** 2)
        peak_res = torch.cuda.max_memory_reserved(0) / (1024 ** 2)
        print(f"• Peak VRAM Allocated:    {peak_alloc:.2f} MB")
        print(f"• Peak VRAM Reserved:     {peak_res:.2f} MB")

    print("=" * 70)

    if output_json:
        report_data = {
            "model_id": model_id,
            "device": device_name,
            "runs": runs,
            "avg_latency_ms": round(avg_latency, 2),
            "p50_latency_ms": round(p50, 2),
            "p95_latency_ms": round(p95, 2),
            "p99_latency_ms": round(p99, 2),
            "avg_rtf": round(avg_rtf, 2),
            "avg_chars_per_sec": round(avg_speed, 2),
            "total_audio_sec": round(total_audio, 2),
            "peak_vram_allocated_mb": round(torch.cuda.max_memory_allocated(0) / (1024 ** 2), 2) if has_cuda else 0,
        }
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        print(f"Report saved to '{output_json}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MinhTTS Local Engine Benchmark Harness")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="Model ID to benchmark")
    parser.add_argument("--voice", type=str, default=DEFAULT_VOICE, help="Voice preset key")
    parser.add_argument("--runs", type=int, default=5, help="Number of benchmark iterations")
    parser.add_argument("--text", type=str, default=None, help="Custom text for synthesis")
    parser.add_argument("--output-json", type=str, default=None, help="Path to save JSON report")
    args = parser.parse_args()

    run_benchmark(
        model_id=args.model,
        voice=args.voice,
        runs=args.runs,
        custom_text=args.text,
        output_json=args.output_json,
    )
