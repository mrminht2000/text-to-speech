@echo off
title MinhTTS Local Inference Engine
echo ========================================================
echo Starting MinhTTS Local Engine (FastAPI) on Port 8000
echo ========================================================
python -m pip install -r requirements.txt
python main.py
pause
