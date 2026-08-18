using Microsoft.EntityFrameworkCore;
using VietTTS.Api.Data;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin")
            .WithTags("Administration")
            .RequireAuthorization(policy => policy.RequireRole(nameof(UserRole.Admin)));

        // 1. Get Users list
        group.MapGet("/users", async (
            AppDbContext db,
            IQuotaService quotaService,
            string? search = null,
            string? tier = null,
            int page = 1,
            int pageSize = 20) =>
        {
            var query = db.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(u => u.Email.ToLower().Contains(s) || u.FullName.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(tier) && Enum.TryParse<UserTier>(tier, true, out var filterTier))
            {
                query = query.Where(u => u.Tier == filterTier);
            }

            var totalCount = await query.CountAsync();
            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AdminUserItemDto(
                    u.Id,
                    u.Email,
                    u.FullName,
                    u.AvatarUrl,
                    u.Role.ToString().ToLowerInvariant(),
                    u.Tier.ToString().ToLowerInvariant(),
                    u.DailyTokensUsed,
                    quotaService.GetDailyTokenLimit(u.Tier),
                    u.AudioHistories.Count,
                    u.CreatedAt
                ))
                .ToListAsync();

            return Results.Ok(new { items = users, totalCount });
        });

        // 2. Change User Tier
        group.MapPut("/users/{id:guid}/tier", async (
            Guid id,
            UpdateTierRequest req,
            AppDbContext db,
            IAuthService authService) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user == null)
            {
                return Results.NotFound(new { error = "Không tìm thấy người dùng." });
            }

            if (!Enum.TryParse<UserTier>(req.Tier, true, out var newTier))
            {
                return Results.BadRequest(new { error = "Hạng gói không hợp lệ. Chọn một trong: Free, Basic, Pro, Ultra." });
            }

            user.Tier = newTier;
            user.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(authService.MapToUserDto(user));
        });

        // 3. System Stats
        group.MapGet("/stats", async (AppDbContext db) =>
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var totalUsers = await db.Users.CountAsync();
            var totalAudios = await db.AudioHistories.CountAsync();
            
            var todayStart = DateTime.UtcNow.Date;
            var todayAudios = await db.AudioHistories.CountAsync(h => h.CreatedAt >= todayStart);
            var todayTokens = await db.Users.Where(u => u.LastUsageDate == today).SumAsync(u => (long)u.DailyTokensUsed);

            var usersByTier = await db.Users
                .GroupBy(u => u.Tier)
                .Select(g => new { Tier = g.Key.ToString().ToLowerInvariant(), Count = g.Count() })
                .ToDictionaryAsync(x => x.Tier, x => x.Count);

            return Results.Ok(new AdminStatsDto(
                TotalUsers: totalUsers,
                TotalAudiosGenerated: totalAudios,
                TotalAudiosToday: todayAudios,
                TotalTokensConsumedToday: todayTokens,
                UsersByTier: usersByTier
            ));
        });

        // 4. Get Tier Limit Configurations
        group.MapGet("/tiers", async (IQuotaService quotaService) =>
        {
            var configs = await quotaService.GetAllTierConfigsAsync();
            return Results.Ok(configs);
        });

        // 5. Update Tier Limit Configuration
        group.MapPut("/tiers/{tier}", async (
            string tier,
            UpdateTierLimitsRequest req,
            IQuotaService quotaService) =>
        {
            if (!Enum.TryParse<UserTier>(tier, true, out var parsedTier))
            {
                return Results.BadRequest(new { error = $"Hạng gói '{tier}' không hợp lệ." });
            }

            var updated = await quotaService.UpdateTierConfigAsync(parsedTier, req);
            if (updated == null)
            {
                return Results.BadRequest(new { error = "Không thể cập nhật cấu hình hạng gói." });
            }

            return Results.Ok(updated);
        });
    }
}
