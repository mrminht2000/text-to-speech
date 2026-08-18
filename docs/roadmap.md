# Lộ trình Phát triển VietTTS (Phases Roadmap)

## Phase 1: MVP1 (Hoàn thành)
- Chuyển đổi văn bản tiếng Việt sang giọng nói qua Google Gemini TTS.
- Giao diện Web Dark Glassmorphism, nghe audio trực tiếp & tải MP3.
- Hỗ trợ tuỳ chỉnh tốc độ, chọn 16 giọng đọc (mặc định giọng Charon - Adam-like).
- Tích hợp Model Usage Metadata & Progress bar.

---

## Phase 2: Tích hợp Local TTS Model (Python Server + GPU)
- **Mục tiêu**: Tự chủ công nghệ, không phụ thuộc API cloud bên thứ ba, giảm chi phí vận hành.
- **Các Model mục tiêu**:
  - `F5-TTS-Vietnamese`: Kiến trúc flow matching hiện đại nhất, hỗ trợ zero-shot voice cloning (clone chuẩn giọng Adam / hot TikToker từ file mẫu 5-10s).
  - `VieNeu-TTS`: Mô hình giọng đọc tiếng Việt tối ưu tốc độ xử lý nhanh cho CPU/GPU nhỏ.
  - `viet-tts` (NTT123/light-speed): Baseline ổn định, ít tốn RAM.
- **Kiến trúc tích hợp**:
  - Service Python (FastAPI/Triton) expose cổng nội bộ (ví dụ: `http://localhost:8000/synthesize`).
  - .NET Backend hoạt động như một Gateway tiếp nhận yêu cầu từ Web và dispatch sang Python Service hoặc Cloud API.

---

## Phase 3: Quản lý Tài khoản (Auth), Lịch sử & Phân hạng (Tiers)
- **Đăng nhập đa kênh**:
  - Google OAuth2
  - Facebook Login
  - Email / Password truyền thống với JWT tokens
- **Lịch sử chuyển đổi (History)**:
  - Lưu văn bản đã đọc, thời gian, model/voice sử dụng, file audio đã tạo trong Object Storage (S3/Cloudflare R2/Local).
- **Phân hạng tài khoản (Tier-based Quotas)**:
  - **Free Tier**: Giới hạn tối đa **100 từ** / lần tạo.
  - **Basic Tier**: Giới hạn tối đa **1.000 từ** / lần tạo.
  - **Pro Tier**: Giới hạn tối đa **5.000 từ** / lần tạo.
  - **Ultra Tier**: **Không giới hạn** số lượng từ.
- **Admin Portal**:
  - Giao diện quản trị danh sách người dùng.
  - Cấp phát và nâng/hạ tier cho từng tài khoản.
  - Thống kê tổng số từ/token đã sử dụng toàn hệ thống.

---

## Phase 4: Đa Nhà Cung Cấp & BYOK (Bring Your Own Key)
- Tích hợp thêm các Speech Provider hàng đầu:
  - **OpenAI TTS** (`tts-1`, `tts-1-hd` với các voice Alloy, Echo, Fable, Onyx, Nova, Shimmer).
  - **ElevenLabs** (giọng Adam gốc `pNInz6obpgDQGcFmaJgB` với `eleven_multilingual_v2` / `eleven_flash_v2_5`).
  - **Google Cloud Neural2 / WaveNet**.
- Cho phép người dùng nhập API Key cá nhân (BYOK) để sử dụng hạn mức riêng của họ.
