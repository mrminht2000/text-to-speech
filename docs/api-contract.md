# API Contract Documentation

## Overview
Base URL: `/api`  
All API endpoints follow RESTful conventions. Standard response format uses JSON, except for audio streaming and file download endpoints.

---

## 1. Health & Server Status
### `GET /api/health`
Checks server readiness and Gemini API key status.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "hasApiKey": true,
  "apiKeySource": "environment",
  "activeKeySource": "environment",
  "timestamp": "2026-03-29T10:00:00.000Z"
}
```

---

## 2. API Key Management
### `POST /api/keys`
Sets, validates, or deletes runtime API key.

**Request Body:**
```json
{
  "apiKey": "AIzaSy..." // Or empty string / null to delete runtime key
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "API key updated successfully",
  "activeKeySource": "user"
}
```

---

## 3. Voices List
### `GET /api/voices`
Retrieves all 30 supported Gemini TTS voices with metadata, tags, and genders.

**Response:** `200 OK`
```json
{
  "voices": [
    {
      "id": "Charon",
      "name": "Charon",
      "displayName": "Charon (Adam-like TikTok Default)",
      "gender": "male",
      "style": "Informative / Firm",
      "previewUrl": "/samples/charon.mp3"
    },
    ...
  ]
}
```

---

## 4. Text-to-Speech Synthesis
### `POST /api/tts`
Converts text into speech audio. Supports single-speaker and multi-speaker podcast modes.

**Single-Speaker Request:**
```json
{
  "text": "Xin chào, đây là hệ thống chuyển văn bản thành giọng nói AI.",
  "voice": "Charon",
  "speed": 1.0,
  "pitch": 0,
  "languageCode": "vi-VN",
  "format": "mp3"
}
```

**Multi-Speaker / Podcast Request:**
```json
{
  "mode": "multi_speaker",
  "speakers": [
    { "name": "Host", "voice": "Charon" },
    { "name": "Guest", "voice": "Aoede" }
  ],
  "dialogue": [
    { "speaker": "Host", "text": "Chào mừng bạn đến với chương trình hôm nay!" },
    { "speaker": "Guest", "text": "Cảm ơn bạn đã mời tôi tham gia." }
  ],
  "format": "mp3"
}
```

**Response:** `200 OK` (Binary audio stream with headers):
- `Content-Type: audio/mpeg` (or `audio/wav`, `audio/aac`)
- `Content-Disposition: inline; filename="speech.mp3"`

---

## 5. Long-Form & Chunked TTS
### `POST /api/tts/chunked`
Synthesizes long texts (>5000 characters) by splitting into natural paragraphs, processing in parallel or batches, and concatenating seamlessly.

**Request:**
```json
{
  "text": "Nội dung văn bản dài...",
  "voice": "Charon",
  "speed": 1.0,
  "format": "mp3"
}
```

**Response:** `200 OK` (Concatenated audio stream).

---

## 6. Audio History & Management
### `GET /api/history`
Retrieves past generation history with pagination and search.

**Query Parameters:**
- `page` (optional, default: `1`)
- `limit` (optional, default: `20`)
- `query` (optional search keyword)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "hist_123456",
      "text": "Xin chào...",
      "voice": "Charon",
      "createdAt": "2026-03-29T09:30:00Z",
      "duration": 4.5,
      "audioUrl": "/api/history/hist_123456/audio",
      "fileSize": 45120
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### `DELETE /api/history/:id`
Deletes a specific generation item and its associated audio file.

---

## 7. Error Handling Contract
All API errors return appropriate HTTP status codes and structured JSON bodies:

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided Gemini API Key is invalid or quota exceeded.",
    "details": null
  }
}
```
Common status codes:
- `400 Bad Request`: Missing text, invalid voice name, or malformed parameters.
- `401 Unauthorized`: API key missing or invalid.
- `429 Too Many Requests`: Google API rate limits reached.
- `500 Internal Server Error`: Audio processing or server failure.
