using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VietTTS.Api.Data;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Endpoints;

public static class HistoryEndpoints
{
    public static void MapHistoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/history").WithTags("Audio History");

        group.MapGet("/", async (
            ClaimsPrincipal principal,
            AppDbContext db,
            IAuthService authService,
            int page = 1,
            int pageSize = 20,
            string? model = null,
            string? search = null) =>
        {
            var user = await authService.GetUserFromClaimsAsync(principal);
            if (user == null)
            {
                return Results.Unauthorized();
            }

            var query = db.AudioHistories.Where(h => h.UserId == user.Id);

            if (!string.IsNullOrWhiteSpace(model))
            {
                query = query.Where(h => h.Model == model);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(h => h.Text.ToLower().Contains(s));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(h => h.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(h => new AudioHistoryItemDto(
                    h.Id,
                    h.Text,
                    h.Model,
                    h.Voice,
                    h.Speed,
                    h.ContentType,
                    h.FileSizeBytes,
                    h.DurationSeconds,
                    h.PromptTokens,
                    h.CandidateTokens,
                    h.TotalTokens,
                    h.IsByok,
                    $"/api/history/{h.Id}/audio",
                    h.CreatedAt
                ))
                .ToListAsync();

            return Results.Ok(new HistoryListResponse(items, totalCount));
        }).RequireAuthorization();

        group.MapGet("/{id:guid}/audio", async (
            Guid id,
            AppDbContext db,
            IAudioStorageService storageService) =>
        {
            var history = await db.AudioHistories.FindAsync(id);
            if (history == null || string.IsNullOrEmpty(history.AudioFilePath))
            {
                return Results.NotFound(new { error = "Không tìm thấy file âm thanh." });
            }

            var result = await storageService.GetAudioAsync(history.AudioFilePath);
            if (result == null)
            {
                return Results.NotFound(new { error = "File âm thanh không tồn tại trên hệ thống lưu trữ." });
            }

            var downloadFileName = $"minhtts_{history.Id.ToString()[..8]}.{(history.ContentType == "audio/wav" ? "wav" : "mp3")}";
            return Results.File(result.Value.Bytes, result.Value.ContentType, fileDownloadName: downloadFileName, enableRangeProcessing: true);
        });

        group.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            AppDbContext db,
            IAuthService authService,
            IAudioStorageService storageService) =>
        {
            var user = await authService.GetUserFromClaimsAsync(principal);
            if (user == null)
            {
                return Results.Unauthorized();
            }

            var history = await db.AudioHistories.FirstOrDefaultAsync(h => h.Id == id && h.UserId == user.Id);
            if (history == null)
            {
                return Results.NotFound(new { error = "Không tìm thấy bản ghi lịch sử." });
            }

            await storageService.DeleteAudioAsync(history.AudioFilePath);
            db.AudioHistories.Remove(history);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = "Đã xóa bản ghi âm thanh thành công." });
        }).RequireAuthorization();

        group.MapDelete("/clear", async (
            ClaimsPrincipal principal,
            AppDbContext db,
            IAuthService authService,
            IAudioStorageService storageService) =>
        {
            var user = await authService.GetUserFromClaimsAsync(principal);
            if (user == null)
            {
                return Results.Unauthorized();
            }

            var histories = await db.AudioHistories.Where(h => h.UserId == user.Id).ToListAsync();
            foreach (var h in histories)
            {
                await storageService.DeleteAudioAsync(h.AudioFilePath);
            }

            db.AudioHistories.RemoveRange(histories);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = "Đã xóa toàn bộ lịch sử âm thanh." });
        }).RequireAuthorization();
    }
}
