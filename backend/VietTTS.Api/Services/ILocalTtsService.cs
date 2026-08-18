using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface ILocalTtsService
{
    Task<TtsResult> GenerateAudioAsync(
        string text,
        string voice,
        double speed = 1.0,
        string? model = null,
        string? referenceAudioBase64 = null,
        string? referenceText = null,
        CancellationToken cancellationToken = default);
}
