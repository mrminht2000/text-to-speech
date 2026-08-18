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
            Name = "F5-TTS Vietnamese (Local GPU)",
            Provider = "Local Model",
            Description = "Mô hình Flow Matching nội bộ, hỗ trợ Voice Cloning (Sắp ra mắt)",
            IsDefault = false,
            IsAvailable = false
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
