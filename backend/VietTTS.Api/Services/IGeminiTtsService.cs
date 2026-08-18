using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface IGeminiTtsService
{
    Task<TtsResult> GenerateAudioAsync(
        string text,
        string voice,
        double speed = 1.0,
        string? model = null,
        string? apiKey = null,
        CancellationToken cancellationToken = default);
}
