# MinhTTS — Kế Hoạch & Lộ Trình Phát Triển Chi Tiết (Roadmap)

## 📌 Phase 1: MVP Nền tảng (Hoàn thành)
- [x] **Backend .NET 10 Minimal API**: Khởi tạo kiến trúc, REST API chuẩn `/api/tts`, `/api/models`, `/api/voices`.
- [x] **Tích hợp Google Gemini TTS**: Hỗ trợ 3 models (`gemini-2.5-flash-preview-tts` giá rẻ nhất làm mặc định, `gemini-2.5-pro-preview-tts`, `gemini-3.1-flash-tts-preview`).
- [x] **Hệ thống 30 Giọng đọc chuẩn Google**: Phân loại theo Style và Provider.
- [x] **Bộ giải mã Audio Engine**: Xử lý 16-bit 24kHz Linear PCM sang MP3 chuẩn phát trực tiếp.
- [x] **Frontend React 19 + Vite**: Glassmorphism UI, Speed Slider 0.1x, Markdown Live Preview, Expressive Audio Tags, Token Usage metrics.
- [x] **Hỗ trợ BYOK (Bring Your Own Key)**: Cho phép người dùng tự điền Gemini API Key cá nhân.
- [x] **Triển khai & Tunnel**: Dockerfile, Vercel SPA Deploy, Cloudflare Tunnel script (`expose-backend.ps1`).

---

## 🚀 Phase 2: Tích hợp Local Model Tiếng Việt & Voice Cloning (Hiện tại)
- [ ] **Nghiên cứu & Chuẩn hóa 3 dòng Local Model**:
  - **F5-TTS Vietnamese** (Flow Matching SOTA, hỗ trợ Zero-shot Voice Cloning từ file audio mẫu 3–10s).
  - **VieNeu-TTS** (Chất giọng 3 miền Bắc - Trung - Nam, siêu nhanh).
  - **VietTTS Lightweight** (Chạy mượt trên CPU máy tính không cần GPU).
- [ ] **Kiến trúc Local Inference Engine**:
  - Module Python Service (FastAPI / gRPC) độc lập, giao tiếp với .NET 10 qua HTTP Client.
  - Tự động phát hiện GPU (NVIDIA CUDA / DirectML / CPU Fallback).
- [ ] **Tính năng Voice Cloning (Nhân bản giọng nói)** trên UI:
  - Cho phép người dùng tải lên 1 đoạn ghi âm giọng nói mẫu (.mp3, .wav) và nhập văn bản để model F5-TTS đọc bằng chính giọng mẫu đó.
- [ ] **Tích hợp Catalog & Dynamic Routing**:
  - Backend tự động chuyển tiếp request đến `GeminiTtsService` hoặc `LocalTtsService` tùy theo model được chọn.

---

## 👥 Phase 3: Hệ Thống Đăng Nhập, Lịch Sử & Phân Quyền Hạng Gói (Tương lai)
- [ ] **Xác thực Authentication**: Đăng nhập qua Google OAuth 2.0, Facebook OAuth, Email / Mật khẩu (JWT).
- [ ] **Cơ sở dữ liệu Database**: SQLite (nhẹ cho Local) / PostgreSQL + Entity Framework Core. Infras chạy thông qua docker.
- [ ] **Lưu lịch sử & Audio Library**: Quản lý các đoạn văn bản đã tạo, phát lại, tải xuống, quản lý giới hạn token theo từng gói, quản lý api token cá nhân.
- [ ] **Phân quyền người dùng theo Hạng (Tiers)**:
  - **Free**: Tối đa 100 từ / lượt, tổng tối đa tổng cộng 2000 token/ngày.
  - **Basic**: Tối đa 1.000 từ / lượt, tổng tối đa 10000 token/ngày.
  - **Pro**: Tối đa 5.000 từ / lượt, tổng tối đa 30000 token/ngày.
  - **Ultra**: Không giới hạn độ dài từ, không giới hạn.
  **Chú ý**: Giới hạn token không bao gồm các yêu cầu có nhãn "Sử dụng API Key cá nhân (BYOK)"
- [ ] **Trang Quản trị Admin Dashboard**: Xem danh sách người dùng, cấp quyền / nâng hạng tài khoản.

---

## 🌐 Phase 4: Mở Rộng Đa Nhà Cung Cấp Cloud (BYOK OpenAI & ElevenLabs)
- [ ] **OpenAI TTS Integration**: Hỗ trợ model `tts-1`, `tts-1-hd` với 6 giọng Alloy, Echo, Fable, Onyx, Nova, Shimmer (Người dùng tự nhập OpenAI Key).
- [ ] **ElevenLabs Integration**: Hỗ trợ `eleven_multilingual_v2` với giọng Adam gốc phòng thu (Người dùng tự nhập ElevenLabs Key).
