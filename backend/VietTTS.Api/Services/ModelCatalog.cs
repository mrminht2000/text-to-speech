using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public static class ModelCatalog
{
    public static readonly IReadOnlyList<ModelInfo> Models = new List<ModelInfo>
    {
        // 1. Google Gemini Cloud
        new()
        {
            Id = "gemini-2.5-flash-preview-tts",
            Name = "Gemini 2.5 Flash TTS",
            Provider = "Google Gemini",
            Description = "Mô hình tối ưu chi phí và độ trễ thấp, phát âm tiếng Việt tự nhiên",
            IsDefault = true,
            IsAvailable = true
        },
        new()
        {
            Id = "gemini-2.5-pro-preview-tts",
            Name = "Gemini 2.5 Pro TTS",
            Provider = "Google Gemini",
            Description = "Mô hình cao cấp, phát âm chuẩn độ chân thực cao, hỗ trợ văn bản dài",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "gemini-3.1-flash-tts-preview",
            Name = "Gemini 3.1 Flash Expressive TTS",
            Provider = "Google Gemini",
            Description = "Giàu biểu cảm, hỗ trợ audio tags [whispers], [laughs] độc quyền",
            IsDefault = false,
            IsAvailable = true
        },

        // 2. Local GPU Models
        new()
        {
            Id = "vieneu-tts",
            Name = "VieNeu-TTS (Bắc / Trung / Nam)",
            Provider = "Local GPU",
            Description = "Mô hình bản ngữ 3 miền Bắc - Trung - Nam, tốc độ cao trên GPU",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "f5-tts-vietnamese",
            Name = "F5-TTS Voice Cloning",
            Provider = "Local GPU",
            Description = "Nhân bản giọng nói tức thì từ audio mẫu 3–10 giây",
            IsDefault = false,
            IsAvailable = true
        },

        // 3. OpenAI TTS (BYOK)
        new()
        {
            Id = "tts-1",
            Name = "OpenAI TTS-1 (Standard)",
            Provider = "OpenAI",
            Description = "Mô hình TTS tiêu chuẩn của OpenAI, độ trễ thấp với 6 giọng studio",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "tts-1-hd",
            Name = "OpenAI TTS-1-HD (High Definition)",
            Provider = "OpenAI",
            Description = "Mô hình chất lượng cao sắc nét của OpenAI (Cần OpenAI Key)",
            IsDefault = false,
            IsAvailable = true
        },

        // 4. ElevenLabs TTS (BYOK)
        new()
        {
            Id = "eleven_multilingual_v2",
            Name = "ElevenLabs Multilingual v2",
            Provider = "ElevenLabs",
            Description = "Công nghệ tổng hợp giọng nói hàng đầu thế giới với âm sắc phòng thu (Cần ElevenLabs Key)",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "eleven_turbo_v2_5",
            Name = "ElevenLabs Turbo v2.5",
            Provider = "ElevenLabs",
            Description = "Mô hình đa ngôn ngữ tốc độ cao của ElevenLabs",
            IsDefault = false,
            IsAvailable = true
        }
    };
}
