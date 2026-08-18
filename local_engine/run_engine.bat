@echo off
title MinhTTS Local Inference Engine v4
echo ============================================================
echo  MinhTTS Local GPU Engine (VieNeu v3 Turbo on RTX 3060)
echo  API: http://localhost:8000
echo ============================================================

cd /d "%~dp0"
python main.py
pause
