using Microsoft.AspNetCore.Mvc;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Endpoints;

public static class SubtitleEndpoints
{
    public static void MapSubtitleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/subtitles")
            .WithTags("Subtitles");

        // Transcribe audio/video to structured subtitles
        group.MapPost("/transcribe", async (
            [FromBody] TranscribeRequest request,
            [FromServices] ISubtitleService subtitleService,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.AudioBase64))
            {
                return Results.BadRequest(new { error = "Dữ liệu âm thanh (audio_base64) không được để trống." });
            }

            try
            {
                var result = await subtitleService.TranscribeAsync(request, cancellationToken);
                return Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                return Results.Problem(detail: ex.Message, statusCode: StatusCodes.Status502BadGateway);
            }
            catch (Exception ex)
            {
                return Results.Problem(detail: $"Lỗi khi nhận diện phụ đề: {ex.Message}", statusCode: StatusCodes.Status500InternalServerError);
            }
        })
        .WithName("TranscribeAudio")
        .WithSummary("Tự động nhận diện giọng nói và sinh phụ đề có timestamps (Local Whisper / Gemini / OpenAI)");

        // Export subtitles as .SRT
        group.MapPost("/export-srt", ([FromBody] ExportSubtitleRequest request) =>
        {
            var srt = SrtFormatter.FormatSrt(request.Segments);
            return Results.Text(srt, "text/plain", System.Text.Encoding.UTF8);
        })
        .WithName("ExportSrt")
        .WithSummary("Xuất danh sách phụ đề sang định dạng .SRT");

        // Export subtitles as .VTT
        group.MapPost("/export-vtt", ([FromBody] ExportSubtitleRequest request) =>
        {
            var vtt = SrtFormatter.FormatVtt(request.Segments);
            return Results.Text(vtt, "text/vtt", System.Text.Encoding.UTF8);
        })
        .WithName("ExportVtt")
        .WithSummary("Xuất danh sách phụ đề sang định dạng WebVTT (.VTT)");

        // Parse existing .SRT content into structured segments
        group.MapPost("/parse-srt", ([FromBody] string srtContent) =>
        {
            var segments = SrtFormatter.ParseSrt(srtContent);
            return Results.Ok(segments);
        })
        .WithName("ParseSrt")
        .WithSummary("Phân tích file SRT thành danh sách SubtitleSegment");
    }
}
