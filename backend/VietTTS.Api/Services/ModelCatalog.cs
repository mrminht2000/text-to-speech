using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public static class ModelCatalog
{
    public static readonly IReadOnlyList<ModelInfo> Models = new List<ModelInfo>
    {
        new()
        {
            Id = "gemini-2.5-flash-preview-tts",
            Name = "Gemini 2.5 Flash Preview TTS",
            Provider = "Google Gemini",
            Description = "Tiết kiệm token nhất (0.50$/1M tokens), độ trễ thấp, ổn định",
            IsDefault = true,
            IsAvailable = true
        },
        new()
        {
            Id = "gemini-2.5-pro-preview-tts",
            Name = "Gemini 2.5 Pro Preview TTS",
            Provider = "Google Gemini",
            Description = "Mô hình cao cấp, phát âm chuẩn độ chân thực cao, hỗ trợ văn bản dài",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "gemini-3.1-flash-tts-preview",
            Name = "Gemini 3.1 Flash TTS Preview",
            Provider = "Google Gemini",
            Description = "Thế hệ mới nhất, giàu biểu cảm, hỗ trợ audio tags [whispers], [laughs]",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "f5-tts-vietnamese",
            Name = "F5-TTS Vietnamese (Voice Cloning)",
            Provider = "Local Model",
            Description = "Mô hình Flow Matching SOTA, nhân bản mọi giọng nói từ audio mẫu 3–10 giây",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "vieneu-tts",
            Name = "VieNeu-TTS (Bắc / Trung / Nam)",
            Provider = "Local Model",
            Description = "Mô hình siêu nhẹ, hỗ trợ đọc chất giọng tự nhiên 3 miền Bắc - Trung - Nam",
            IsDefault = false,
            IsAvailable = true
        },
        new()
        {
            Id = "eleven-multilingual-v2",
            Name = "ElevenLabs Multilingual v2",
            Provider = "ElevenLabs",
            Description = "Giọng Adam gốc chất lượng phòng thu (Cần API Key riêng - Sắp ra mắt)",
            IsDefault = false,
            IsAvailable = false
        }
    };
}
