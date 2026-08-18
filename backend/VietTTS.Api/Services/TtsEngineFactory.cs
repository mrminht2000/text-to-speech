using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class TtsEngineFactory : ITtsEngineFactory
{
    private readonly IGeminiTtsService _geminiTtsService;
    private readonly ILocalTtsService _localTtsService;

    public TtsEngineFactory(IGeminiTtsService geminiTtsService, ILocalTtsService localTtsService)
    {
        _geminiTtsService = geminiTtsService;
        _localTtsService = localTtsService;
    }

    public async Task<TtsResult> ProcessTtsRequestAsync(TtsRequest request, CancellationToken cancellationToken = default)
    {
        var modelId = request.Model ?? "gemini-2.5-flash-preview-tts";
        var modelInfo = ModelCatalog.Models.FirstOrDefault(m => m.Id.Equals(modelId, StringComparison.OrdinalIgnoreCase))
                        ?? ModelCatalog.Models.First(m => m.IsDefault);

        if (modelInfo.Provider.Equals("Local Model", StringComparison.OrdinalIgnoreCase))
        {
            return await _localTtsService.GenerateAudioAsync(
                request.Text,
                request.Voice,
                request.Speed,
                modelInfo.Id,
                request.ReferenceAudioBase64,
                request.ReferenceText,
                cancellationToken);
        }

        // Default to Google Gemini Provider
        return await _geminiTtsService.GenerateAudioAsync(
            request.Text,
            request.Voice,
            request.Speed,
            modelInfo.Id,
            request.ApiKey,
            cancellationToken);
    }
}
