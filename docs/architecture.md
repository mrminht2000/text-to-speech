# Kiến trúc Hệ thống VietTTS

## 1. Tổng quan
VietTTS là ứng dụng Text-to-Speech hỗ trợ tiếng Việt trên nền tảng Web, sử dụng Gemini TTS (`gemini-2.5-flash-preview-tts`) làm backend speech synthesis engine.

## 2. Mô hình kiến trúc

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|  - React 19 + TypeScript + Vite                             |
|  - Giao diện Dark Glassmorphism                             |
|  - Hỗ trợ chọn giọng, tốc độ đọc, nghe thử & tải MP3        |
+------------------------------+------------------------------+
                               |
                               | POST /api/tts { text, voice, speed }
                               | GET  /api/voices
                               v
+-------------------------------------------------------------+
|                  Backend (.NET 10 Web API)                  |
|  - Minimal API Endpoints (`/api/voices`, `/api/tts`)        |
|  - Validation: độ dài text (1-5000 ký tự), tốc độ (0.5-2.0) |
|  - Quản lý Gemini API Key an toàn trong cấu hình server     |
|  - Service: `GeminiTtsService`                              |
|  - Chuyển đổi PCM 16-bit 24kHz -> MP3 bằng NAudio           |
+------------------------------+------------------------------+
                               |
                               | HTTPS POST generateContent (AUDIO)
                               v
+-------------------------------------------------------------+
|                     Google Gemini API                       |
|  - Model: `gemini-2.5-flash-preview-tts`                    |
|  - Output: 24kHz 16-bit mono raw PCM (Base64)               |
+-------------------------------------------------------------+
```

## 3. Thành phần chính
- **Frontend (`/frontend`)**:
  - `useTts`: Custom React hook quản lý toàn bộ state, API calls, ObjectURL lifecycle.
  - Components: `TextInput`, `VoiceSelector`, `SpeedSlider`, `AudioPlayer`.
- **Backend (`/backend/VietTTS.Api`)**:
  - `TtsEndpoints`: Route mapping và input validation.
  - `GeminiTtsService`: Giao tiếp Gemini API, decode Base64 PCM, encode MP3 stream.
  - `VoiceCatalog`: Danh mục giọng đọc với nhãn thân thiện (Charon = Adam-like).
