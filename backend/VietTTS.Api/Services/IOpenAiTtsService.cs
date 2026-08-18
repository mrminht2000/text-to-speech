using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface IOpenAiTtsService
{
    Task<TtsResult> SynthesizeSpeechAsync(TtsRequest request, CancellationToken cancellationToken = default);
}
