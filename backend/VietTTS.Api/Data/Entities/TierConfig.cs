using System.ComponentModel.DataAnnotations;

namespace VietTTS.Api.Data.Entities;

public class TierConfig
{
    [Key]
    public UserTier Tier { get; set; }

    public int MaxWordsPerRequest { get; set; }

    public int DailyTokenLimit { get; set; }

    public long PriceVnd { get; set; } = 0;

    [MaxLength(500)]
    public string DescriptionVi { get; set; } = string.Empty;

    [MaxLength(500)]
    public string DescriptionEn { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
