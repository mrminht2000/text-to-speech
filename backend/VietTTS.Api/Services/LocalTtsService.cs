using System.Net.Http.Json;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class LocalTtsService : ILocalTtsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _endpoint;

    public LocalTtsService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _endpoint = configuration["LocalTts:Endpoint"] ?? "http://localhost:8000";
    }

    public async Task<TtsResult> GenerateAudioAsync(
        string text,
        string voice,
        double speed = 1.0,
        string? model = null,
        string? referenceAudioBase64 = null,
        string? referenceText = null,
        CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient("local_tts");

        var payload = new
        {
            text,
            voice,
            speed,
            model = model ?? "f5-tts-vietnamese",
            reference_audio_base64 = referenceAudioBase64,
            reference_text = referenceText
        };

        var requestUri = $"{_endpoint.TrimEnd('/')}/synthesize";

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsJsonAsync(requestUri, payload, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new HttpRequestException(
                $"Không thể kết nối đến Local TTS Engine tại '{_endpoint}'. Vui lòng đảm bảo local_engine đang chạy.", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Local TTS Engine trả về mã lỗi {response.StatusCode}: {errorBody}");
        }

        var audioBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);

        int promptTokens = 0;
        int candidatesTokens = 0;
        int totalTokens = 0;

        if (response.Headers.TryGetValues("X-Usage-Prompt-Tokens", out var pTokens))
            _ = int.TryParse(pTokens.FirstOrDefault(), out promptTokens);
        if (response.Headers.TryGetValues("X-Usage-Candidates-Tokens", out var cTokens))
            _ = int.TryParse(cTokens.FirstOrDefault(), out candidatesTokens);
        if (response.Headers.TryGetValues("X-Usage-Total-Tokens", out var tTokens))
            _ = int.TryParse(tTokens.FirstOrDefault(), out totalTokens);

        return new TtsResult
        {
            AudioBytes = audioBytes,
            Usage = new TtsUsage
            {
                PromptTokens = promptTokens,
                CandidatesTokens = candidatesTokens,
                TotalTokens = totalTokens > 0 ? totalTokens : (promptTokens + candidatesTokens)
            }
        };
    }
}
