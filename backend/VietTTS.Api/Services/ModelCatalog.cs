using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public static class ModelCatalog
{
    public static readonly IReadOnlyList<ModelInfo> Models = new List<ModelInfo>
    {
        new()
        {
            Id = "gemini-3.1-flash-tts-preview",
            Name = "Gemini 3.1 Flash TTS",
            Provider = "Google Gemini",
            Description = "Mô hình TTS thế hệ mới, hỗ trợ 70+ ngôn ngữ, giàu biểu cảm",
            IsDefault = true,
            IsAvailable = true
        },
        new()
        {
            Id = "gemini-2.5-flash-tts",
            Name = "Gemini 2.5 Flash TTS",
            Provider = "Google Gemini",
            Description = "Tối ưu độ trễ thấp, ổn định cho giọng đọc tiếng Việt",
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
