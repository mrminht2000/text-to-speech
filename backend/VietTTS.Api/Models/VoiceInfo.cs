namespace VietTTS.Api.Models;

public class VoiceInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Style { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Provider { get; set; } = "Google Gemini";
    public bool IsDefault { get; set; }
}
