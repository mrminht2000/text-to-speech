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

## 🚀 Phase 2: Tích hợp Local Model Tiếng Việt & Voice Cloning (Hoàn thành)
- [x] **Nghiên cứu & Chuẩn hóa các dòng Local Model**:
  - **VieNeu-TTS v3 Turbo**: Chất giọng chuẩn 3 miền Bắc (Minh Đức, Trúc Ly), Trung (Quang Sơn, Ngọc Trân), Nam (Minh Triết, Thục Đoan).
  - **F5-TTS Voice Cloning**: Nhân bản giọng nói từ audio mẫu 3–10s trên PyTorch Tensor Memory.
- [x] **Tăng tốc phần cứng NVIDIA GPU (RTX 3060 CUDA 12.6)**:
  - Tự động nhận diện GPU `device="cuda"`, tối ưu hóa `onnxruntime-gpu 1.24.1` (Speaker Encoder + Denoiser trên CUDA).
  - Khắc phục 100% lỗi TorchCodec / FFmpeg DLL bằng kỹ thuật Tensor-based In-Memory Speaker Embedding.
- [x] **Tính năng Voice Cloning (Nhân bản giọng nói)** trên UI:
  - Cho phép người dùng tải lên 1 đoạn ghi âm giọng nói mẫu (.mp3, .wav) và nhập văn bản để model F5-TTS đọc bằng chính giọng mẫu đó.
- [x] **Tích hợp Catalog & Dynamic Routing**:
  - Backend tự động chuyển tiếp request đến `GeminiTtsService` hoặc `LocalTtsService` tùy theo model được chọn.

---

## 👥 Phase 3: Hệ Thống Đăng Nhập, Lịch Sử & Phân Quyền Hạng Gói (Hoàn thành)
- [x] **Xác thực Authentication**: Đăng ký, Đăng nhập Email/Mật khẩu (BCrypt + JWT), Hỗ trợ Google OAuth, Tự động liên kết / hủy liên kết tài khoản Google.
- [x] **Cơ sở dữ liệu Database**: Entity Framework Core + SQLite (`minhtts.db`) / PostgreSQL, tự động tạo bảng và seed Admin (`admin@minhtts.dev`).
- [x] **Lưu lịch sử & Audio Library**:
  - Tự động lưu file âm thanh vào `App_Data/audio_library/` và quản lý danh sách lịch sử.
  - Giao diện Thư viện âm thanh (Audio Library Tab): Nghe thử trực tiếp, tải về, sao chép prompt, xóa từng bản ghi hoặc xóa tất cả.
- [x] **Phân quyền người dùng theo Hạng (Tiers)**:
  - **Free**: Tối đa 100 từ / lượt, 2.000 token / ngày.
  - **Basic**: Tối đa 1.000 từ / lượt, 10.000 token / ngày.
  - **Pro**: Tối đa 5.000 từ / lượt, 30.000 token / ngày.
  - **Ultra**: Không giới hạn số từ và số token.
  - ⚡ **Quy tắc miễn trừ BYOK**: Yêu cầu sử dụng API Key cá nhân hoàn toàn KHÔNG bị trừ vào hạn mức token hàng ngày trên mọi gói.
- [x] **Trang Quản trị Admin Dashboard**: Xem thống kê hệ thống, danh sách người dùng, cấp quyền / nâng hạng tài khoản, điều chỉnh hạn mức từ và token của từng gói.
- [x] **Giao diện Studio Dashboard Hiện Đại**: Hỗ trợ đầy đủ Dark Mode & Light Mode cực nét, song ngữ Tiếng Việt & Tiếng Anh, Dropdown menu chuẩn stacking context.

---

## 🌐 Phase 4: Mở Rộng Đa Nhà Cung Cấp Cloud (BYOK OpenAI & ElevenLabs) (Hoàn thành)
- [x] **OpenAI TTS Integration**:
  - Hỗ trợ model `tts-1` (tiêu chuẩn) và `tts-1-hd` (độ nét cao).
  - 6 Giọng đọc chuẩn studio: `Alloy`, `Echo`, `Fable`, `Onyx`, `Nova`, `Shimmer`.
  - Tích hợp `OpenAiTtsService`, tự động chuyển tiếp và cấu hình OpenAI API Key trong Tab Quản lý API Key.
- [x] **ElevenLabs TTS Integration**:
  - Hỗ trợ `eleven_multilingual_v2` và `eleven_turbo_v2_5`.
  - 8 Giọng đọc huyền thoại: `Adam` (gốc phòng thu), `Rachel`, `Antoni`, `Bella`, `Elli`, `Josh`, `Arnold`, `Sam`.
  - Tích hợp `ElevenLabsTtsService`, tự động cấu hình ElevenLabs API Key trong Tab Quản lý API Key.
- [x] **Bộ định tuyến Dynamic Routing 4 trong 1**:
  - Tự động nhận diện và chuyển tiếp request đến `GeminiTtsService`, `LocalTtsService`, `OpenAiTtsService`, hoặc `ElevenLabsTtsService`.
