using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

/// <summary>
/// Static catalog of available Gemini TTS voices.
/// </summary>
public static class VoiceCatalog
{
    public static readonly IReadOnlyList<VoiceInfo> Voices = new List<VoiceInfo>
    {
        new() { Id = "Charon",      Name = "Charon",      Style = "Firm",        Label = "Adam-like (Mặc định) ★", IsDefault = true  },
        new() { Id = "Kore",        Name = "Kore",        Style = "Firm",        Label = "Kore — Dứt khoát",       IsDefault = false },
        new() { Id = "Orus",        Name = "Orus",        Style = "Firm",        Label = "Orus — Mạnh mẽ",         IsDefault = false },
        new() { Id = "Gacrux",      Name = "Gacrux",      Style = "Mature",      Label = "Gacrux — Trưởng thành",  IsDefault = false },
        new() { Id = "Schedar",     Name = "Schedar",     Style = "Even",        Label = "Schedar — Điềm tĩnh",    IsDefault = false },
        new() { Id = "Fenrir",      Name = "Fenrir",      Style = "Excitable",   Label = "Fenrir — Sôi nổi",       IsDefault = false },
        new() { Id = "Puck",        Name = "Puck",        Style = "Upbeat",      Label = "Puck — Vui tươi",        IsDefault = false },
        new() { Id = "Aoede",       Name = "Aoede",       Style = "Breezy",      Label = "Aoede — Nhẹ nhàng",      IsDefault = false },
        new() { Id = "Zephyr",      Name = "Zephyr",      Style = "Bright",      Label = "Zephyr — Tươi sáng",     IsDefault = false },
        new() { Id = "Leda",        Name = "Leda",        Style = "Youthful",    Label = "Leda — Trẻ trung",       IsDefault = false },
        new() { Id = "Callirrhoe",  Name = "Callirrhoe",  Style = "Easy-going",  Label = "Callirrhoe — Dễ chịu",   IsDefault = false },
        new() { Id = "Umbriel",     Name = "Umbriel",     Style = "Easy-going",  Label = "Umbriel — Thư thái",     IsDefault = false },
        new() { Id = "Erinome",     Name = "Erinome",     Style = "Clear",       Label = "Erinome — Rõ ràng",      IsDefault = false },
        new() { Id = "Achird",      Name = "Achird",      Style = "Friendly",    Label = "Achird — Thân thiện",    IsDefault = false },
        new() { Id = "Sadachbia",   Name = "Sadachbia",   Style = "Lively",      Label = "Sadachbia — Linh hoạt",  IsDefault = false },
        new() { Id = "Enceladus",   Name = "Enceladus",   Style = "Breathy",     Label = "Enceladus — Nhẹ nhàng",  IsDefault = false },
    };

    public static bool IsValidVoice(string voiceId) =>
        Voices.Any(v => v.Id.Equals(voiceId, StringComparison.OrdinalIgnoreCase));
}
