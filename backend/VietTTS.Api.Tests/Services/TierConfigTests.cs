using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VietTTS.Api.Data;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Services;

public class TierConfigTests
{
    private static AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAllTierConfigs_WhenEmpty_ReturnsDefaultTiers()
    {
        using var db = CreateInMemoryDb();
        var quotaService = new QuotaService(db);

        var configs = await quotaService.GetAllTierConfigsAsync();

        configs.Should().HaveCount(4);
        configs.Select(c => c.Tier).Should().Contain(["free", "basic", "pro", "ultra"]);
    }

    [Fact]
    public async Task UpdateTierConfig_ShouldPersistAndApplyImmediately()
    {
        using var db = CreateInMemoryDb();
        await db.SeedInitialDataAsync();
        var quotaService = new QuotaService(db);

        // Update Free Tier from 100 words to 350 words, and 2000 tokens to 5000 tokens
        var updateReq = new UpdateTierLimitsRequest(
            MaxWordsPerRequest: 350,
            DailyTokenLimit: 5000,
            PriceVnd: 0,
            DescriptionVi: "Gói dùng thử nâng cấp",
            DescriptionEn: "Upgraded trial tier"
        );

        var result = await quotaService.UpdateTierConfigAsync(UserTier.Free, updateReq);

        result.Should().NotBeNull();
        result!.MaxWordsPerRequest.Should().Be(350);
        result.DailyTokenLimit.Should().Be(5000);

        // Check dynamic quota check uses the new limit
        quotaService.GetMaxWordsPerRequest(UserTier.Free).Should().Be(350);
        quotaService.GetDailyTokenLimit(UserTier.Free).Should().Be(5000);
    }
}
