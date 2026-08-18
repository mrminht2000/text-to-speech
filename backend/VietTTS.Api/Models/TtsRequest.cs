using System.ComponentModel.DataAnnotations;

namespace VietTTS.Api.Models;

public class TtsRequest
{
    [Required(ErrorMessage = "Text is required.")]
    [StringLength(5000, MinimumLength = 1, ErrorMessage = "Text must be between 1 and 5000 characters.")]
    public string Text { get; set; } = string.Empty;

    public string Voice { get; set; } = "Charon";

    [Range(0.5, 2.0, ErrorMessage = "Speed must be between 0.5 and 2.0.")]
    public double Speed { get; set; } = 1.0;

    public string? Model { get; set; }

    public string? ApiKey { get; set; }

    /// <summary>
    /// Base64 encoded reference audio (3-10s) for Zero-shot Voice Cloning (F5-TTS).
    /// </summary>
    public string? ReferenceAudioBase64 { get; set; }

    /// <summary>
    /// Optional transcript of the reference audio for higher cloning accuracy.
    /// </summary>
    public string? ReferenceText { get; set; }
}
