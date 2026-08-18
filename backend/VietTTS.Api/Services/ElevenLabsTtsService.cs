using System.Text;
using System.Text.Json;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class ElevenLabsTtsService : IElevenLabsTtsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ElevenLabsTtsService> _logger;

    private static readonly Dictionary<string, string> VoiceIdMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Adam"] = "pNInz6obpgDQGcFmaJgB",
        ["Rachel"] = "21m00Tcm4TlvDq8ikWAM",
        ["Antoni"] = "ErXwobaYiN019PkySvjV",
        ["Bella"] = "EXAVITQu4vr4xnSDxMaL",
        ["Elli"] = "MF3mGyEYCl7XYWbV9V6O",
        ["Josh"] = "TxGEqnHWrfWFTfGW9XjX",
        ["Arnold"] = "VR6AewLTigWG44pfwG65",
        ["Sam"] = "yoZ06aMxZJJ28mfd3POQ"
    };

    public ElevenLabsTtsService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<ElevenLabsTtsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<TtsResult> SynthesizeSpeechAsync(TtsRequest request, CancellationToken cancellationToken = default)
    {
        var apiKey = !string.IsNullOrWhiteSpace(request.ApiKey)
            ? request.ApiKey.Trim()
            : _config["ElevenLabs:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Vui lòng cung cấp ElevenLabs API Key trong Cài đặt (BYOK) để sử dụng mô hình ElevenLabs.");
        }

        var client = _httpClientFactory.CreateClient("elevenlabs");

        // Determine Voice ID
        var voiceName = request.Voice ?? "Adam";
        var voiceId = VoiceIdMap.TryGetValue(voiceName, out var mappedId) ? mappedId : voiceName;

        var modelId = string.IsNullOrWhiteSpace(request.Model) || !request.Model.StartsWith("eleven_")
            ? "eleven_multilingual_v2"
            : request.Model;

        var payload = new
        {
            text = request.Text,
            model_id = modelId,
            voice_settings = new
            {
                stability = 0.5,
                similarity_boost = 0.75,
                style = 0.0,
                use_speaker_boost = true
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var httpRequest = new HttpRequestMessage(
            HttpMethod.Post, 
            $"https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128");

        httpRequest.Headers.Add("xi-api-key", apiKey);
        httpRequest.Headers.Add("Accept", "audio/mpeg");
        httpRequest.Content = jsonContent;

        _logger.LogInformation("Sending TTS request to ElevenLabs: model={Model}, voice={Voice} ({VoiceId})", modelId, voiceName, voiceId);

        var response = await client.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("ElevenLabs API Error ({StatusCode}): {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException($"ElevenLabs Error ({response.StatusCode}): {errorBody}");
        }

        var audioBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);

        var wordCount = request.Text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
        var approxTokens = (int)Math.Ceiling(wordCount * 1.5);

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
