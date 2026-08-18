using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using VietTTS.Api.Data;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class QuotaService : IQuotaService
{
    private readonly AppDbContext _db;
    private static readonly ConcurrentDictionary<UserTier, TierConfig> _tierCache = new();
    private static bool _cacheInitialized = false;
    private static readonly object _lock = new();

    public QuotaService(AppDbContext db)
    {
        _db = db;
        EnsureCacheLoaded();
    }

    private void EnsureCacheLoaded()
    {
        if (_cacheInitialized) return;

        lock (_lock)
        {
            if (_cacheInitialized) return;
            try
            {
                var configs = _db.TierConfigs.AsNoTracking().ToList();
                foreach (var c in configs)
                {
                    _tierCache[c.Tier] = c;
                }
                _cacheInitialized = true;
            }
            catch
            {
                // Fallback to defaults if DB is not ready yet
            }
        }
    }

    public int GetDailyTokenLimit(UserTier tier)
    {
        if (_tierCache.TryGetValue(tier, out var cfg))
        {
            return cfg.DailyTokenLimit;
        }

        return tier switch
        {
            UserTier.Free => 2000,
            UserTier.Basic => 10000,
            UserTier.Pro => 30000,
            UserTier.Ultra => 100000000,
            _ => 2000
        };
    }

    public int GetMaxWordsPerRequest(UserTier tier)
    {
        if (_tierCache.TryGetValue(tier, out var cfg))
        {
            return cfg.MaxWordsPerRequest;
        }

        return tier switch
        {
            UserTier.Free => 100,
            UserTier.Basic => 1000,
            UserTier.Pro => 5000,
            UserTier.Ultra => 20000,
            _ => 100
        };
    }

    public async Task EnsureDailyResetAsync(User user)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (user.LastUsageDate < today)
        {
            user.DailyTokensUsed = 0;
            user.LastUsageDate = today;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public (bool Allowed, string? ErrorMessage) ValidateRequestQuota(User? user, int wordCount, bool isByok)
    {
        // 1. BYOK Exemption: If user brings their own API Key, bypass daily token limits
        if (isByok)
        {
            var maxAllowedWords = 20000;
            if (wordCount > maxAllowedWords)
            {
                return (false, $"Văn bản quá dài ({wordCount} từ). Giới hạn tối đa một lần tạo là {maxAllowedWords} từ.");
            }
            return (true, null);
        }

        var tier = user?.Tier ?? UserTier.Free;
        var maxWords = GetMaxWordsPerRequest(tier);
        var dailyLimit = GetDailyTokenLimit(tier);

        // Check word limit per request
        if (wordCount > maxWords)
        {
            var tierName = tier.ToString();
            return (false, $"Văn bản hiện có {wordCount} từ, vượt quá giới hạn {maxWords} từ/lượt của gói {tierName}. Vui lòng nâng cấp gói hoặc sử dụng API Key cá nhân (BYOK) để không bị giới hạn.");
        }

        // Check daily token limit (approximate token check or strict remaining check)
        if (user != null && dailyLimit < 100000000)
        {
            var estimatedTokens = (int)(wordCount * 1.8);
            if (user.DailyTokensUsed + estimatedTokens > dailyLimit)
            {
                var tierName = tier.ToString();
                return (false, $"Bạn đã sử dụng {user.DailyTokensUsed:N0}/{dailyLimit:N0} token của ngày hôm nay (Gói {tierName}). Vui lòng nâng cấp gói hoặc sử dụng API Key cá nhân (BYOK) để tiếp tục tạo giọng đọc.");
            }
        }

        return (true, null);
    }

    public async Task RecordUsageAsync(User? user, int totalTokens, bool isByok)
    {
        // BYOK exemption: do not deduct tokens from platform daily quota
        if (isByok || user == null) return;

        await EnsureDailyResetAsync(user);
        user.DailyTokensUsed += totalTokens;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<List<TierConfigDto>> GetAllTierConfigsAsync()
    {
        var list = await _db.TierConfigs.AsNoTracking().OrderBy(t => t.Tier).ToListAsync();
        if (list.Count == 0)
        {
            // Return defaults if empty
            return Enum.GetValues<UserTier>().Select(t => new TierConfigDto(
                t.ToString().ToLowerInvariant(),
                GetMaxWordsPerRequest(t),
                GetDailyTokenLimit(t),
                t == UserTier.Basic ? 49000 : t == UserTier.Pro ? 149000 : t == UserTier.Ultra ? 299000 : 0,
                "Mô tả gói",
                "Tier description",
                DateTime.UtcNow
            )).ToList();
        }

        return list.Select(t => new TierConfigDto(
            t.Tier.ToString().ToLowerInvariant(),
            t.MaxWordsPerRequest,
            t.DailyTokenLimit,
            t.PriceVnd,
            t.DescriptionVi,
            t.DescriptionEn,
            t.UpdatedAt
        )).ToList();
    }

    public async Task<TierConfigDto?> UpdateTierConfigAsync(UserTier tier, UpdateTierLimitsRequest req)
    {
        var config = await _db.TierConfigs.FindAsync(tier);
        if (config == null)
        {
            config = new TierConfig { Tier = tier };
            await _db.TierConfigs.AddAsync(config);
        }

        config.MaxWordsPerRequest = req.MaxWordsPerRequest;
        config.DailyTokenLimit = req.DailyTokenLimit;
        config.PriceVnd = req.PriceVnd;
        if (!string.IsNullOrWhiteSpace(req.DescriptionVi)) config.DescriptionVi = req.DescriptionVi.Trim();
        if (!string.IsNullOrWhiteSpace(req.DescriptionEn)) config.DescriptionEn = req.DescriptionEn.Trim();
        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Update in-memory cache
        _tierCache[tier] = config;

        return new TierConfigDto(
            config.Tier.ToString().ToLowerInvariant(),
            config.MaxWordsPerRequest,
            config.DailyTokenLimit,
            config.PriceVnd,
            config.DescriptionVi,
            config.DescriptionEn,
            config.UpdatedAt
        );
    }
}
