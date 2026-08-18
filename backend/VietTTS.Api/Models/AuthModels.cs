using System.ComponentModel.DataAnnotations;

namespace VietTTS.Api.Models;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password, // Client-hashed or plain
    [MaxLength(100)] string FullName
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password // Client-hashed or plain
);

public record GoogleAuthRequest(
    [Required] string Credential, // Google ID token / JWT / Auth0 token
    string? Email,
    string? FullName,
    string? AvatarUrl
);

public record AuthResponse(
    string Token,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string? AvatarUrl,
    bool IsGoogleLinked,
    string Role,
    string Tier,
    int DailyTokensUsed,
    int DailyTokenLimit,
    int MaxWordsPerRequest,
    int RemainingTokensToday,
    DateTime CreatedAt
);

public record UpdateTierRequest(
    [Required] string Tier
);

public record TierConfigDto(
    string Tier,
    int MaxWordsPerRequest,
    int DailyTokenLimit,
    long PriceVnd,
    string DescriptionVi,
    string DescriptionEn,
    DateTime UpdatedAt
);

public record UpdateTierLimitsRequest(
    [Range(10, 100000)] int MaxWordsPerRequest,
    [Range(100, 1000000000)] int DailyTokenLimit,
    [Range(0, 100000000)] long PriceVnd,
    string? DescriptionVi,
    string? DescriptionEn
);

public record AdminUserItemDto(
    Guid Id,
    string Email,
    string FullName,
    string? AvatarUrl,
    string Role,
    string Tier,
    int DailyTokensUsed,
    int DailyTokenLimit,
    int TotalAudiosGenerated,
    DateTime CreatedAt
);

public record AdminStatsDto(
    int TotalUsers,
    int TotalAudiosGenerated,
    int TotalAudiosToday,
    long TotalTokensConsumedToday,
    Dictionary<string, int> UsersByTier
);
