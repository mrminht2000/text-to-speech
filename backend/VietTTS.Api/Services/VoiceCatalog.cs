using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

/// <summary>
/// Static catalog of available voices categorized by Provider (Google Gemini, Local Model).
/// </summary>
public static class VoiceCatalog
{
    public static readonly IReadOnlyList<VoiceInfo> Voices = new List<VoiceInfo>
    {
        // ── Local Model Voices (Voice Cloning & 3-Region Accents) ───────────────
        new() { Id = "voice_clone_custom", Name = "Voice Clone (Mẫu tải lên)", Style = "Custom Voice",   Label = "🎙️ Voice Cloning (Từ Audio mẫu tải lên) ★", Provider = "Local Model", IsDefault = false },
        new() { Id = "north_female",        Name = "Nữ miền Bắc (Hà Nội)",     Style = "Natural / Crisp", Label = "👩 Nữ miền Bắc — Trong trẻo, thanh thoát",    Provider = "Local Model", IsDefault = false },
        new() { Id = "north_male",          Name = "Nam miền Bắc (Hà Nội)",     Style = "Mature / Firm",   Label = "👨 Nam miền Bắc — Trầm ấm, dõng dạc",       Provider = "Local Model", IsDefault = false },
        new() { Id = "south_female",        Name = "Nữ miền Nam (Sài Gòn)",     Style = "Warm / Melodic",  Label = "👩 Nữ miền Nam — Ngọt ngào, tự nhiên",      Provider = "Local Model", IsDefault = false },
        new() { Id = "south_male",          Name = "Nam miền Nam (Sài Gòn)",     Style = "Friendly",        Label = "👨 Nam miền Nam — Thân thiện, gần gũi",     Provider = "Local Model", IsDefault = false },
        new() { Id = "central_female",      Name = "Nữ miền Trung (Huế/Đà Nẵng)", Style = "Gentle",        Label = "👩 Nữ miền Trung — Dịu dàng, truyền cảm",   Provider = "Local Model", IsDefault = false },

        // ── Google Gemini Standard Voices ──────────────────────────────────────
        new() { Id = "Charon",      Name = "Charon",      Style = "Informative / Firm", Label = "Adam-like (Mặc định TikTok) ★", Provider = "Google Gemini", IsDefault = true  },
        new() { Id = "Puck",        Name = "Puck",        Style = "Upbeat",             Label = "Puck — Vui tươi, năng động",     Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Kore",        Name = "Kore",        Style = "Firm",               Label = "Kore — Dứt khoát, chuyên nghiệp", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Fenrir",      Name = "Fenrir",      Style = "Excitable",          Label = "Fenrir — Sôi nổi, cuốn hút",      Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Aoede",       Name = "Aoede",       Style = "Breezy",             Label = "Aoede — Nhẹ nhàng, truyền cảm",  Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Zephyr",      Name = "Zephyr",      Style = "Bright",             Label = "Zephyr — Tươi sáng, ấm áp",      Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Leda",        Name = "Leda",        Style = "Youthful",           Label = "Leda — Trẻ trung, tự nhiên",     Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Orus",        Name = "Orus",        Style = "Firm",               Label = "Orus — Nam tính, mạnh mẽ",       Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Gacrux",      Name = "Gacrux",      Style = "Mature",             Label = "Gacrux — Trưởng thành, đĩnh đạc", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Schedar",     Name = "Schedar",     Style = "Even",               Label = "Schedar — Điềm tĩnh, tự sự",     Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Callirrhoe",  Name = "Callirrhoe",  Style = "Easy-going",         Label = "Callirrhoe — Dễ chịu, thư thái", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Umbriel",     Name = "Umbriel",     Style = "Easy-going",         Label = "Umbriel — Trầm ấm, thư giãn",    Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Erinome",     Name = "Erinome",     Style = "Clear",              Label = "Erinome — Rõ ràng, dõng dạc",    Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Achird",      Name = "Achird",      Style = "Friendly",           Label = "Achird — Thân thiện, gần gũi",   Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Sadachbia",   Name = "Sadachbia",   Style = "Lively",             Label = "Sadachbia — Linh hoạt, sinh động", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Enceladus",   Name = "Enceladus",   Style = "Breathy",            Label = "Enceladus — Mềm mại, thì thầm",  Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Iapetus",     Name = "Iapetus",     Style = "Authoritative",      Label = "Iapetus — Uy quyền, phóng sự",   Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Algieba",     Name = "Algieba",     Style = "Reflective",         Label = "Algieba — Suy tư, sâu lắng",     Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Despina",     Name = "Despina",     Style = "Melodic",            Label = "Despina — Du dương, êm ái",      Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Alcor",       Name = "Alcor",       Style = "Crisp",              Label = "Alcor — Trong trẻo, khúc chiết",  Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Mimas",       Name = "Mimas",       Style = "Playful",            Label = "Mimas — Hóm hỉnh, vui vẻ",       Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Thebe",       Name = "Thebe",       Style = "Polished",           Label = "Thebe — Trau chuốt, sang trọng", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Harpalyke",   Name = "Harpalyke",   Style = "Dramatic",           Label = "Harpalyke — Kịch tính, biểu cảm", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Kalyke",      Name = "Kalyke",      Style = "Gentle",             Label = "Kalyke — Dịu dàng, thủ thỉ",     Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Autonoe",     Name = "Autonoe",     Style = "Conversational",     Label = "Autonoe — Tự nhiên như trò chuyện", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Thyone",      Name = "Thyone",      Style = "Dynamic",            Label = "Thyone — Năng lượng, biến hóa",  Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Helike",      Name = "Helike",      Style = "Narrative",          Label = "Helike — Giọng kể chuyện truyền cảm", Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Ersa",        Name = "Ersa",        Style = "Radiant",            Label = "Ersa — Rạng rỡ, tươi mới",       Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Sponde",      Name = "Sponde",      Style = "Classic",            Label = "Sponde — Cổ điển, phát thanh",   Provider = "Google Gemini", IsDefault = false },
        new() { Id = "Pandia",      Name = "Pandia",      Style = "Warm",               Label = "Pandia — Ấm cúng, an tâm",       Provider = "Google Gemini", IsDefault = false },
    };

    public static bool IsValidVoice(string voiceId) =>
        Voices.Any(v => v.Id.Equals(voiceId, StringComparison.OrdinalIgnoreCase));
}
