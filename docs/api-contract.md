# API Contract — VietTTS Backend

## 1. GET `/api/voices`
Lấy danh sách các giọng đọc được hỗ trợ.

### Response
- **Status**: `200 OK`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "voices": [
    {
      "id": "Charon",
      "name": "Charon",
      "style": "Firm",
      "label": "Adam-like (Mặc định) ★",
      "isDefault": true
    },
    {
      "id": "Kore",
      "name": "Kore",
      "style": "Firm",
      "label": "Kore — Dứt khoát",
      "isDefault": false
    }
  ]
}
```

---

## 2. POST `/api/tts`
Chuyển đổi văn bản thành giọng nói MP3.

### Request Body
- **Content-Type**: `application/json`
```json
{
  "text": "Xin chào, đây là bản thử nghiệm giọng đọc tiếng Việt.",
  "voice": "Charon",
  "speed": 1.0
}
```

### Validation Rules
- `text`: Bắt buộc, độ dài từ 1 đến 5000 ký tự.
- `voice`: Bắt buộc, phải thuộc danh sách `VoiceCatalog`.
- `speed`: Số thực từ 0.5 đến 2.0 (mặc định: 1.0).

### Success Response
- **Status**: `200 OK`
- **Content-Type**: `audio/mpeg`
- **Headers**:
  - `Content-Disposition: attachment; filename="output.mp3"`
- **Body**: Binary stream dữ liệu MP3

### Error Responses
- **Status**: `400 Bad Request`
```json
{
  "error": "Text exceeds 5000 character limit.",
  "code": "TEXT_TOO_LONG"
}
```
- **Status**: `502 Bad Gateway`
```json
{
  "title": "TTS Provider Unavailable",
  "status": 502,
  "detail": "TTS provider error: ..."
}
```
