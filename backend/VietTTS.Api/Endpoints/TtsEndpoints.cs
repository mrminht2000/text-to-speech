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

        // POST /api/tts
        group.MapPost("/tts", GenerateSpeech)
        .WithName("GenerateSpeech")
        .WithSummary("Chuyển đổi văn bản sang âm thanh MP3 / WAV")
        .Accepts<TtsRequest>("application/json")
        .Produces(StatusCodes.Status200OK, contentType: "audio/mpeg")
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status502BadGateway);
    }

    private static async Task<IResult> GenerateSpeech(
        TtsRequest request,
        ITtsEngineFactory engineFactory,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return Results.BadRequest(new { error = "Text is required.", code = "TEXT_REQUIRED" });

        if (request.Text.Length > 5000)
            return Results.BadRequest(new { error = "Text exceeds 5000 character limit.", code = "TEXT_TOO_LONG" });

        if (!VoiceCatalog.IsValidVoice(request.Voice))
            return Results.BadRequest(new { error = $"Voice '{request.Voice}' is not supported.", code = "INVALID_VOICE" });

        if (request.Speed < 0.5 || request.Speed > 2.0)
            return Results.BadRequest(new { error = "Speed must be between 0.5 and 2.0.", code = "INVALID_SPEED" });

        try
        {
            var result = await engineFactory.ProcessTtsRequestAsync(request, cancellationToken);

            httpContext.Response.Headers["X-Usage-Prompt-Tokens"] = result.Usage.PromptTokens.ToString();
            httpContext.Response.Headers["X-Usage-Candidates-Tokens"] = result.Usage.CandidatesTokens.ToString();
            httpContext.Response.Headers["X-Usage-Total-Tokens"] = result.Usage.TotalTokens.ToString();

            return Results.File(
                result.AudioBytes,
                contentType: "audio/mpeg",
                fileDownloadName: "output.mp3",
                enableRangeProcessing: true);
        }
        catch (HttpRequestException ex)
        {
            return Results.Json(
                new { error = "Không thể kết nối đến dịch vụ TTS Engine. Vui lòng thử lại sau.", detail = ex.Message },
                statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { error = ex.Message, code = "CONFIG_ERROR" });
        }
    }
}
