using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface ITtsEngineFactory
{
    Task<TtsResult> ProcessTtsRequestAsync(TtsRequest request, CancellationToken cancellationToken = default);
}
