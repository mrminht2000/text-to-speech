using System.Security.Claims;
using VietTTS.Api.Data;
using VietTTS.Api.Data.Entities;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Endpoints;

public static class TtsEndpoints
{
    public static void MapTtsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api");

        // GET /api/voices
        group.MapGet("/voices", () =>
        {
            return Results.Ok(new
            {
                voices = VoiceCatalog.Voices,
                defaultVoice = VoiceCatalog.Voices.FirstOrDefault(v => v.IsDefault)?.Id ?? "Charon"
            });
        })
        .WithName("GetVoices")
        .WithSummary("Danh sách giọng đọc AI hỗ trợ (Cloud & Local)")
        .Produces(StatusCodes.Status200OK);

        // GET /api/models
        group.MapGet("/models", () =>
        {
            return Results.Ok(new
            {
                models = ModelCatalog.Models,
                defaultModel = ModelCatalog.Models.FirstOrDefault(m => m.IsDefault)?.Id ?? "gemini-2.5-flash-preview-tts"
            });
        })
        .WithName("GetModels")
        .WithSummary("Danh sách mô hình TTS hỗ trợ")
        .Produces(StatusCodes.Status200OK);

        // GET /api/tiers (Public for Pricing page)
        group.MapGet("/tiers", async (IQuotaService quotaService) =>
        {
            var tiers = await quotaService.GetAllTierConfigsAsync();
            return Results.Ok(tiers);
        })
        .WithName("GetTiers")
        .WithSummary("Danh sách cấu hình các gói dịch vụ")
        .Produces(StatusCodes.Status200OK);

        // POST /api/tts
        group.MapPost("/tts", GenerateSpeech)
        .WithName("GenerateSpeech")
        .WithSummary("Chuyển đổi văn bản sang âm thanh MP3 / WAV")
        .Accepts<TtsRequest>("application/json")
        .Produces(StatusCodes.Status200OK, contentType: "audio/mpeg")
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status502BadGateway);
    }

    private static async Task<IResult> GenerateSpeech(
        TtsRequest request,
        ITtsEngineFactory engineFactory,
        IQuotaService quotaService,
        IAuthService authService,
        IAudioStorageService audioStorageService,
        AppDbContext db,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return Results.BadRequest(new { error = "Vui lòng nhập văn bản cần đọc.", code = "TEXT_REQUIRED" });

        if (!VoiceCatalog.IsValidVoice(request.Voice))
            return Results.BadRequest(new { error = $"Giọng đọc '{request.Voice}' không hợp lệ.", code = "INVALID_VOICE" });

        if (request.Speed < 0.5 || request.Speed > 2.0)
            return Results.BadRequest(new { error = "Tốc độ phải từ 0.5x đến 2.0x.", code = "INVALID_SPEED" });

        // 1. Resolve User and Validate Tier Quotas
        var user = await authService.GetUserFromClaimsAsync(httpContext.User);
        var isByok = !string.IsNullOrWhiteSpace(request.ApiKey);
        var wordCount = request.Text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;

        var quotaValidation = quotaService.ValidateRequestQuota(user, wordCount, isByok);
        if (!quotaValidation.Allowed)
        {
            return Results.Json(new { error = quotaValidation.ErrorMessage, code = "QUOTA_EXCEEDED" }, statusCode: StatusCodes.Status403Forbidden);
        }

        try
        {
            var result = await engineFactory.ProcessTtsRequestAsync(request, cancellationToken);

            httpContext.Response.Headers["X-Usage-Prompt-Tokens"] = result.Usage.PromptTokens.ToString();
            httpContext.Response.Headers["X-Usage-Candidates-Tokens"] = result.Usage.CandidatesTokens.ToString();
            httpContext.Response.Headers["X-Usage-Total-Tokens"] = result.Usage.TotalTokens.ToString();

            // 2. Record Token Usage
            await quotaService.RecordUsageAsync(user, result.Usage.TotalTokens, isByok);

            // 3. Save Audio History Record and Physical File
            var historyId = Guid.NewGuid();
            var isWav = request.Model == "vieneu-tts" || request.Model == "f5-tts-vietnamese";
            var ext = isWav ? "wav" : "mp3";
            var contentType = isWav ? "audio/wav" : "audio/mpeg";

            var relativePath = await audioStorageService.SaveAudioAsync(user?.Id, historyId, result.AudioBytes, ext);

            var historyRecord = new AudioHistory
            {
                Id = historyId,
                UserId = user?.Id,
                Text = request.Text,
                Model = request.Model ?? "gemini-2.5-flash-preview-tts",
                Voice = request.Voice,
                Speed = (float)request.Speed,
                AudioFilePath = relativePath,
                ContentType = contentType,
                FileSizeBytes = result.AudioBytes.Length,
                DurationSeconds = Math.Round((double)result.AudioBytes.Length / (isWav ? 96000 : 16000), 2),
                PromptTokens = result.Usage.PromptTokens,
                CandidateTokens = result.Usage.CandidatesTokens,
                TotalTokens = result.Usage.TotalTokens,
                IsByok = isByok,
                CreatedAt = DateTime.UtcNow
            };

            await db.AudioHistories.AddAsync(historyRecord, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            httpContext.Response.Headers["X-Audio-History-Id"] = historyId.ToString();

            return Results.File(
                result.AudioBytes,
                contentType: contentType,
                fileDownloadName: $"minhtts_{historyId.ToString()[..8]}.{ext}",
                enableRangeProcessing: true);
        }
        catch (HttpRequestException ex)
        {
            return Results.Json(
                new { error = "Không thể kết nối đến dịch vụ TTS Engine. Vui lòng kiểm tra lại dịch vụ cục bộ.", detail = ex.Message },
                statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { error = ex.Message, code = "CONFIG_ERROR" });
        }
    }
}
