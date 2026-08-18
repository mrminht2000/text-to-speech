using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface IQuotaService
{
    int GetDailyTokenLimit(UserTier tier);
    int GetMaxWordsPerRequest(UserTier tier);
    Task EnsureDailyResetAsync(User user);
    (bool Allowed, string? ErrorMessage) ValidateRequestQuota(User? user, int wordCount, bool isByok);
    Task RecordUsageAsync(User? user, int totalTokens, bool isByok);
    Task<List<TierConfigDto>> GetAllTierConfigsAsync();
    Task<TierConfigDto?> UpdateTierConfigAsync(UserTier tier, UpdateTierLimitsRequest req);
}
