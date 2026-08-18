using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VietTTS.Api.Data.Entities;

public class AudioHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public string Text { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Voice { get; set; } = string.Empty;

    public float Speed { get; set; } = 1.0f;

    [MaxLength(500)]
    public string? AudioFilePath { get; set; }

    [MaxLength(50)]
    public string ContentType { get; set; } = "audio/mpeg";

    public long FileSizeBytes { get; set; } = 0;

    public double DurationSeconds { get; set; } = 0;

    public int PromptTokens { get; set; } = 0;

    public int CandidateTokens { get; set; } = 0;

    public int TotalTokens { get; set; } = 0;

    public bool IsByok { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
