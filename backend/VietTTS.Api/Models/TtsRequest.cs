using System.ComponentModel.DataAnnotations;

namespace VietTTS.Api.Models;

public class TtsRequest
{
    [Required]
    [StringLength(5000, MinimumLength = 1, ErrorMessage = "Text must be between 1 and 5000 characters.")]
    public string Text { get; set; } = string.Empty;

    [Required]
    public string Voice { get; set; } = "Charon";

    [Range(0.5, 2.0, ErrorMessage = "Speed must be between 0.5 and 2.0.")]
    public double Speed { get; set; } = 1.0;
}
