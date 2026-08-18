using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using VietTTS.Api.Data.Entities;

namespace VietTTS.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<AudioHistory> AudioHistories => Set<AudioHistory>();
    public DbSet<TierConfig> TierConfigs => Set<TierConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.GoogleId);
        });

        modelBuilder.Entity<AudioHistory>(entity =>
        {
            entity.HasIndex(h => h.UserId);
            entity.HasIndex(h => h.CreatedAt);
        });

        modelBuilder.Entity<TierConfig>(entity =>
        {
            entity.HasKey(t => t.Tier);
        });
    }

    public static string ComputeClientHash(string rawPassword)
    {
        var data = Encoding.UTF8.GetBytes($"minhtts_salt_{rawPassword}");
        var hash = SHA256.HashData(data);
        return Convert.ToHexStringLower(hash);
    }

    public async Task SeedInitialDataAsync()
    {
        // 1. Seed Default Tier Configurations if empty
        if (!await TierConfigs.AnyAsync())
        {
            var defaultTiers = new List<TierConfig>
            {
                new()
                {
                    Tier = UserTier.Free,
                    MaxWordsPerRequest = 100,
                    DailyTokenLimit = 2000,
                    PriceVnd = 0,
                    DescriptionVi = "Dành cho trải nghiệm và chuyển đổi đoạn văn bản ngắn",
                    DescriptionEn = "For basic testing and short text-to-speech conversions",
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Tier = UserTier.Basic,
                    MaxWordsPerRequest = 1000,
                    DailyTokenLimit = 10000,
                    PriceVnd = 49000,
                    DescriptionVi = "Phù hợp cho người làm video ngắn, podcast và tin tức",
                    DescriptionEn = "Suitable for short video creators, podcasting and news reading",
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Tier = UserTier.Pro,
                    MaxWordsPerRequest = 5000,
                    DailyTokenLimit = 30000,
                    PriceVnd = 149000,
                    DescriptionVi = "Dành cho Content Creator, đọc sách nói và bài viết dài",
                    DescriptionEn = "For content creators, audiobooks, and long-form articles",
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Tier = UserTier.Ultra,
                    MaxWordsPerRequest = 20000,
                    DailyTokenLimit = 100000000, // Unlimited
                    PriceVnd = 299000,
                    DescriptionVi = "Toàn quyền không giới hạn cho doanh nghiệp & nhà xuất bản",
                    DescriptionEn = "Unlimited full power for enterprises and digital publishers",
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await TierConfigs.AddRangeAsync(defaultTiers);
            await SaveChangesAsync();
        }

        // 2. Seed Admin User if not existing
        var adminUser = await Users.FirstOrDefaultAsync(u => u.Email == "admin@minhtts.dev");
        var adminClientHash = ComputeClientHash("Admin@123456");
        var adminBcryptHash = BCrypt.Net.BCrypt.HashPassword(adminClientHash);

        if (adminUser == null)
        {
            var admin = new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@minhtts.dev",
                PasswordHash = adminBcryptHash,
                FullName = "MinhTTS Administrator",
                Role = UserRole.Admin,
                Tier = UserTier.Ultra,
                DailyTokensUsed = 0,
                LastUsageDate = DateOnly.FromDateTime(DateTime.UtcNow),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await Users.AddAsync(admin);
            await SaveChangesAsync();
        }
        else
        {
            // Ensure admin has updated double-hashed password
            adminUser.PasswordHash = adminBcryptHash;
            adminUser.Role = UserRole.Admin;
            adminUser.Tier = UserTier.Ultra;
            await SaveChangesAsync();
        }
    }
}
