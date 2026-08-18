using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class TtsEngineFactory : ITtsEngineFactory
{
    private readonly IGeminiTtsService _geminiTtsService;
    private readonly ILocalTtsService _localTtsService;
    private readonly IOpenAiTtsService _openAiTtsService;
    private readonly IElevenLabsTtsService _elevenLabsTtsService;

    public TtsEngineFactory(
        IGeminiTtsService geminiTtsService,
        ILocalTtsService localTtsService,
        IOpenAiTtsService openAiTtsService,
        IElevenLabsTtsService elevenLabsTtsService)
    {
        _geminiTtsService = geminiTtsService;
        _localTtsService = localTtsService;
        _openAiTtsService = openAiTtsService;
        _elevenLabsTtsService = elevenLabsTtsService;
    }

    public async Task<TtsResult> ProcessTtsRequestAsync(TtsRequest request, CancellationToken cancellationToken = default)
    {
        var modelId = request.Model ?? "gemini-2.5-flash-preview-tts";
        var modelInfo = ModelCatalog.Models.FirstOrDefault(m => m.Id.Equals(modelId, StringComparison.OrdinalIgnoreCase))
                        ?? ModelCatalog.Models.First(m => m.IsDefault);

        // 1. Local GPU Models
        if (modelInfo.Provider.Equals("Local GPU", StringComparison.OrdinalIgnoreCase) ||
            modelInfo.Provider.Equals("Local Model", StringComparison.OrdinalIgnoreCase))
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

        // 2. OpenAI TTS
        if (modelInfo.Provider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase) || modelId.StartsWith("tts-1"))
        {
            return await _openAiTtsService.SynthesizeSpeechAsync(request, cancellationToken);
        }

        // 3. ElevenLabs TTS
        if (modelInfo.Provider.Equals("ElevenLabs", StringComparison.OrdinalIgnoreCase) || modelId.StartsWith("eleven_"))
        {
            return await _elevenLabsTtsService.SynthesizeSpeechAsync(request, cancellationToken);
        }

        // 4. Default: Google Gemini Provider
        return await _geminiTtsService.GenerateAudioAsync(
            request.Text,
            request.Voice,
            request.Speed,
            modelInfo.Id,
            request.ApiKey,
            cancellationToken);
    }
}
