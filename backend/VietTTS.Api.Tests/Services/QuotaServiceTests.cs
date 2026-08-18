using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VietTTS.Api.Data;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Services;

namespace VietTTS.Api.Tests.Services;

public class QuotaServiceTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Theory]
    [InlineData(UserTier.Free, 100, 2000)]
    [InlineData(UserTier.Basic, 1000, 10000)]
    [InlineData(UserTier.Pro, 5000, 30000)]
    [InlineData(UserTier.Ultra, 20000, 100000000)]
    public void QuotaLimits_ShouldMatchTierSpecs(UserTier tier, int expectedWords, int expectedTokens)
    {
        using var db = CreateInMemoryDb();
        var quotaService = new QuotaService(db);

        quotaService.GetMaxWordsPerRequest(tier).Should().Be(expectedWords);
        quotaService.GetDailyTokenLimit(tier).Should().Be(expectedTokens);
    }

    [Fact]
    public void ValidateRequestQuota_WhenWordCountExceedsFreeTierLimit_ShouldReject()
    {
        using var db = CreateInMemoryDb();
        var quotaService = new QuotaService(db);
        var user = new User { Tier = UserTier.Free, DailyTokensUsed = 0 };

        var result = quotaService.ValidateRequestQuota(user, wordCount: 150, isByok: false);

        result.Allowed.Should().BeFalse();
        result.ErrorMessage.Should().Contain("vượt quá giới hạn 100 từ/lượt");
    }

    [Fact]
    public void ValidateRequestQuota_WhenIsByok_ShouldBypassTierWordAndTokenLimits()
    {
        using var db = CreateInMemoryDb();
        var quotaService = new QuotaService(db);
        var user = new User { Tier = UserTier.Free, DailyTokensUsed = 2500 }; // Exceeded free quota

        // 500 words is over Free limit of 100, and user already used 2500 tokens
        var result = quotaService.ValidateRequestQuota(user, wordCount: 500, isByok: true);

        result.Allowed.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public void ValidateRequestQuota_WhenDailyTokenLimitExceeded_ShouldReject()
    {
        using var db = CreateInMemoryDb();
        var quotaService = new QuotaService(db);
        var user = new User { Tier = UserTier.Free, DailyTokensUsed = 1950 };

        // 50 words ≈ 90 tokens, 1950 + 90 > 2000 limit
        var result = quotaService.ValidateRequestQuota(user, wordCount: 50, isByok: false);

        result.Allowed.Should().BeFalse();
        result.ErrorMessage.Should().Contain("token của ngày hôm nay");
    }

    [Fact]
    public async Task RecordUsage_WhenIsByok_ShouldNotDeductFromDailyTokens()
    {
        using var db = CreateInMemoryDb();
        var quotaService = new QuotaService(db);
        var user = new User { Tier = UserTier.Free, DailyTokensUsed = 100 };
        await db.Users.AddAsync(user);
        await db.SaveChangesAsync();

        await quotaService.RecordUsageAsync(user, totalTokens: 500, isByok: true);

        user.DailyTokensUsed.Should().Be(100); // Unchanged!
    }

    [Fact]
    public async Task RecordUsage_WhenNormalTier_ShouldDeductFromDailyTokens()
    {
        using var db = CreateInMemoryDb();
        var quotaService = new QuotaService(db);
        var user = new User { Tier = UserTier.Free, DailyTokensUsed = 100 };
        await db.Users.AddAsync(user);
        await db.SaveChangesAsync();

        await quotaService.RecordUsageAsync(user, totalTokens: 350, isByok: false);

        user.DailyTokensUsed.Should().Be(450);
    }
}
