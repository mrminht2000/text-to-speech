# Danh mục Giọng đọc & Chiến lược Voice Model

## 1. Giọng mặc định trong MVP1 (Gemini TTS)
- **Voice ID**: `Charon`
- **Phong cách (Style)**: Firm / Informative
- **Mô tả**: Giọng nam trầm, chắc, đĩnh đạc — tương đương phong cách giọng "Adam" (ElevenLabs) hay dùng trên TikTok/Shorts.
- **Tuỳ biến**: Tốc độ từ 0.5x đến 2.0x.

## 2. Các giọng khác có sẵn
| ID | Phong cách | Nhãn hiển thị |
|---|---|---|
| **Charon** | Firm | Adam-like (Mặc định) ★ |
| **Kore** | Firm | Kore — Dứt khoát |
| **Orus** | Firm | Orus — Mạnh mẽ |
| **Gacrux** | Mature | Gacrux — Trưởng thành |
| **Schedar** | Even | Schedar — Điềm tĩnh |
| **Fenrir** | Excitable | Fenrir — Sôi nổi |
| **Puck** | Upbeat | Puck — Vui tươi |
| **Aoede** | Breezy | Aoede — Nhẹ nhàng |
| **Zephyr** | Bright | Zephyr — Tươi sáng |
| **Leda** | Youthful | Leda — Trẻ trung |
| **Callirrhoe** | Easy-going | Callirrhoe — Dễ chịu |
| **Umbriel** | Easy-going | Umbriel — Thư thái |
| **Erinome** | Clear | Erinome — Rõ ràng |
| **Achird** | Friendly | Achird — Thân thiện |
| **Sadachbia** | Lively | Sadachbia — Linh hoạt |
| **Enceladus** | Breathy | Enceladus — Nhẹ nhàng |

---

## 3. Lộ trình nâng cấp giọng Adam (Roadmap)

### Giai đoạn 1 (Hiện tại - MVP1)
- Dùng `Charon` trên Gemini TTS + Prompt style "authoritative, calm Vietnamese narrator".

### Giai đoạn 2 (Tích hợp ElevenLabs)
- Voice ID ElevenLabs của Adam: `pNInz6obpgDQGcFmaJgB`
- Model: `eleven_flash_v2_5` (hỗ trợ tiếng Việt).

### Giai đoạn 3 (Train / Fine-tune Local Model trên máy cá nhân)
- **Kiến trúc đề xuất**: F5-TTS Vietnamese hoặc VieNeu-TTS (hỗ trợ zero-shot voice cloning).
- **Bộ dữ liệu**: Cần thu âm 3-5 phút audio chất lượng cao của giọng Adam để làm reference/fine-tune.
- **Inference**: Chạy server Python (FastAPI/Triton) với GPU nội bộ, backend .NET proxy sang.
