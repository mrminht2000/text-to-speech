using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface IElevenLabsTtsService
{
    Task<TtsResult> SynthesizeSpeechAsync(TtsRequest request, CancellationToken cancellationToken = default);
}
