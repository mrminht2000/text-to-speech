using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using NAudio.Wave;
using NAudio.Lame;
using VietTTS.Api.Models;
using VietTTS.Api.Services;

namespace VietTTS.Api.Services;


/// <summary>
/// Calls Gemini TTS API, receives raw PCM audio, converts to MP3.
/// </summary>
public class GeminiTtsService : IGeminiTtsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;

    private readonly string _model;

    public GeminiTtsService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _apiKey = configuration["Gemini:ApiKey"]
                  ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");
        _model = configuration["Gemini:Model"] ?? "gemini-2.5-flash-tts";
    }



    public async Task<TtsResult> GenerateAudioAsync(
        string text,
        string voice,
        double speed,
        string? model = null,
        CancellationToken cancellationToken = default)
    {
        var targetModel = !string.IsNullOrWhiteSpace(model) ? model : _model;
        var client = _httpClientFactory.CreateClient("gemini");
        var url = $"v1beta/models/{targetModel}:generateContent?key={_apiKey}";

        // Build Gemini TTS request
        var requestBody = BuildGeminiRequest(text, voice, speed);
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await client.PostAsync(url, content, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorDetails = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Gemini API returned {(int)response.StatusCode} ({response.StatusCode}): {errorDetails}");
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var pcmBytes = ExtractPcmFromResponse(responseJson);
        var usage = ExtractUsageFromResponse(responseJson);
        var audioBytes = ConvertPcmToMp3(pcmBytes);

        return new TtsResult
        {
            AudioBytes = audioBytes,
            Usage = usage
        };
    }

    private static TtsUsage ExtractUsageFromResponse(string responseJson)
    {
        var usage = new TtsUsage();
        try
        {
            using var doc = JsonDocument.Parse(responseJson);
            if (doc.RootElement.TryGetProperty("usageMetadata", out var meta) ||
                doc.RootElement.TryGetProperty("usage_metadata", out meta))
            {
                if (meta.TryGetProperty("promptTokenCount", out var p) || meta.TryGetProperty("prompt_token_count", out p))
                    usage.PromptTokens = p.GetInt32();
                if (meta.TryGetProperty("candidatesTokenCount", out var c) || meta.TryGetProperty("candidates_token_count", out c))
                    usage.CandidatesTokens = c.GetInt32();
                if (meta.TryGetProperty("totalTokenCount", out var t) || meta.TryGetProperty("total_token_count", out t))
                    usage.TotalTokens = t.GetInt32();
            }
        }
        catch
        {
            // Ignore usage parsing errors if structure changes
        }
        return usage;
    }



    // ── Request builder ───────────────────────────────────────────────────────

    private static object BuildGeminiRequest(string text, string voice, double speed)
    {
        // Style prompt: authoritative, calm — closest to "Adam" style
        var styledText = speed != 1.0
            ? $"[speaking rate {speed}x] {text}"
            : text;

        return new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = styledText }
                    }
                }
            },
            generationConfig = new
            {
                responseModalities = new[] { "AUDIO" },
                speechConfig = new
                {
                    voiceConfig = new
                    {
                        prebuiltVoiceConfig = new
                        {
                            voiceName = voice
                        }
                    }
                }
            }
        };
    }

    // ── Response parser ───────────────────────────────────────────────────────

    private static byte[] ExtractPcmFromResponse(string responseJson)
    {
        using var doc = JsonDocument.Parse(responseJson);

        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            throw new InvalidOperationException($"Gemini response has no candidates. Full response: {responseJson}");
        }

        foreach (var candidate in candidates.EnumerateArray())
        {
            if (candidate.TryGetProperty("content", out var content) &&
                content.TryGetProperty("parts", out var parts))
            {
                foreach (var part in parts.EnumerateArray())
                {
                    if (part.TryGetProperty("inlineData", out var inlineData) ||
                        part.TryGetProperty("inline_data", out inlineData))
                    {
                        if (inlineData.TryGetProperty("data", out var dataEl))
                        {
                            var base64 = dataEl.GetString();
                            if (!string.IsNullOrEmpty(base64))
                            {
                                return Convert.FromBase64String(base64);
                            }
                        }
                    }
                }
            }
        }

        throw new InvalidOperationException($"No audio inlineData found in Gemini response. Full response: {responseJson}");
    }

    // ── PCM → MP3 / WAV conversion ────────────────────────────────────────────

    /// <summary>
    /// Converts raw 16-bit PCM (24kHz mono) from Gemini to MP3 (or valid WAV stream).
    /// </summary>
    private static byte[] ConvertPcmToMp3(byte[] pcmBytes)
    {
        var waveFormat = new WaveFormat(sampleRate: 24000, channels: 1);

        try
        {
            using var pcmStream = new RawSourceWaveStream(new MemoryStream(pcmBytes), waveFormat);
            using var mp3Stream = new MemoryStream();
            using var writer = new LameMP3FileWriter(mp3Stream, waveFormat, LAMEPreset.STANDARD);

            pcmStream.CopyTo(writer);
            writer.Flush();

            return mp3Stream.ToArray();
        }
        catch
        {
            // Fallback: create standard WAV container (universal browser support)
            using var wavStream = new MemoryStream();
            using var wavWriter = new WaveFileWriter(wavStream, waveFormat);
            wavWriter.Write(pcmBytes, 0, pcmBytes.Length);
            wavWriter.Flush();
            return wavStream.ToArray();
        }
    }
}

