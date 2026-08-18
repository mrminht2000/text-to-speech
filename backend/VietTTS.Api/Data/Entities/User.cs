using System.ComponentModel.DataAnnotations;

namespace VietTTS.Api.Data.Entities;

public enum UserTier
{
    Free = 0,
    Basic = 1,
    Pro = 2,
    Ultra = 3
}

public enum UserRole
{
    User = 0,
    Admin = 1
}

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    public string? PasswordHash { get; set; }

    [MaxLength(255)]
    public string FullName { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string? GoogleId { get; set; }

    public UserRole Role { get; set; } = UserRole.User;

    public UserTier Tier { get; set; } = UserTier.Free;

    public int DailyTokensUsed { get; set; } = 0;

    public DateOnly LastUsageDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<AudioHistory> AudioHistories { get; set; } = new List<AudioHistory>();
}
