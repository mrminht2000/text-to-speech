using System.ComponentModel.DataAnnotations;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Endpoints;

public static class TtsEndpoints
{
    public static void MapTtsEndpoints(this WebApplication app)
    {
        app.MapGet("/api/voices", GetVoices)
           .WithName("GetVoices")
           .WithTags("TTS");

        app.MapPost("/api/tts", GenerateSpeech)
           .WithName("GenerateSpeech")
           .WithTags("TTS");
    }

    // ── GET /api/voices ───────────────────────────────────────────────────────

    private static IResult GetVoices()
    {
        return Results.Ok(new { voices = VoiceCatalog.Voices });
    }

    // ── POST /api/tts ─────────────────────────────────────────────────────────

    private static async Task<IResult> GenerateSpeech(
        TtsRequest request,
        IGeminiTtsService ttsService,
        CancellationToken cancellationToken)
    {
        // Validate text length (DataAnnotations not auto-run on minimal API)
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
            var mp3Bytes = await ttsService.GenerateAudioAsync(
                request.Text, request.Voice, request.Speed, cancellationToken);

            return Results.File(
                mp3Bytes,
                contentType: "audio/mpeg",
                fileDownloadName: "output.mp3");
        }
        catch (HttpRequestException ex)
        {
            return Results.Problem(
                detail: $"TTS provider error: {ex.Message}",
                statusCode: StatusCodes.Status502BadGateway,
                title: "TTS Provider Unavailable");
        }
        catch (OperationCanceledException)
        {
            return Results.StatusCode(StatusCodes.Status499ClientClosedRequest);
        }
    }
}
