using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class OpenAiTtsService : IOpenAiTtsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<OpenAiTtsService> _logger;

    public OpenAiTtsService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<OpenAiTtsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<TtsResult> SynthesizeSpeechAsync(TtsRequest request, CancellationToken cancellationToken = default)
    {
        var apiKey = !string.IsNullOrWhiteSpace(request.ApiKey)
            ? request.ApiKey.Trim()
            : _config["OpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Vui lòng cung cấp OpenAI API Key trong Cài đặt (BYOK) để sử dụng mô hình OpenAI TTS.");
        }

        var client = _httpClientFactory.CreateClient("openai");
        var model = string.IsNullOrWhiteSpace(request.Model) || !request.Model.StartsWith("tts-1")
            ? "tts-1"
            : request.Model;

        var voice = string.IsNullOrWhiteSpace(request.Voice)
            ? "alloy"
            : request.Voice.ToLowerInvariant();

        var speed = Math.Clamp(request.Speed, 0.25, 4.0);

        var payload = new
        {
            model = model,
            input = request.Text,
            voice = voice,
            speed = speed,
            response_format = "mp3"
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/audio/speech");
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpRequest.Content = jsonContent;

        _logger.LogInformation("Sending TTS request to OpenAI TTS: model={Model}, voice={Voice}, speed={Speed}", model, voice, speed);

        var response = await client.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("OpenAI TTS API Error ({StatusCode}): {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException($"OpenAI TTS Error ({response.StatusCode}): {errorBody}");
        }

        var audioBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);

        // Approximate token calculation for OpenAI TTS (char-based prompt tokens)
        var wordCount = request.Text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
        var approxTokens = (int)Math.Ceiling(wordCount * 1.3);

        return new TtsResult
        {
            AudioBytes = audioBytes,
            Usage = new TtsUsage
            {
                PromptTokens = approxTokens,
                CandidatesTokens = (int)(audioBytes.Length / 100),
                TotalTokens = approxTokens
            }
        };
    }
}
