using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using NAudio.Wave;
using NAudio.Lame;
using VietTTS.Api.Services;

namespace VietTTS.Api.Services;

/// <summary>
/// Calls Gemini TTS API, receives raw PCM audio, converts to MP3.
/// </summary>
public class GeminiTtsService : IGeminiTtsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;

    // Gemini TTS endpoint (generateContent with audio modality)
    private const string GeminiModel = "gemini-2.5-flash-preview-tts";

    public GeminiTtsService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _apiKey = configuration["Gemini:ApiKey"]
                  ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");
    }

    public async Task<byte[]> GenerateAudioAsync(
        string text,
        string voice,
        double speed,
        CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient("gemini");
        var url = $"v1beta/models/{GeminiModel}:generateContent?key={_apiKey}";

        // Build Gemini TTS request
        var requestBody = BuildGeminiRequest(text, voice, speed);
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await client.PostAsync(url, content, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var pcmBytes = ExtractPcmFromResponse(responseJson);

        return ConvertPcmToMp3(pcmBytes);
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

        var inlineData = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("inlineData");

        var base64Audio = inlineData.GetProperty("data").GetString()
            ?? throw new InvalidOperationException("No audio data in Gemini response.");

        return Convert.FromBase64String(base64Audio);
    }

    // ── PCM → MP3 conversion ──────────────────────────────────────────────────

    /// <summary>
    /// Converts raw 16-bit PCM (24kHz mono) from Gemini to MP3 using NAudio + LAME.
    /// </summary>
    private static byte[] ConvertPcmToMp3(byte[] pcmBytes)
    {
        // Gemini outputs raw 16-bit PCM at 24kHz, mono
        var waveFormat = new WaveFormat(sampleRate: 24000, channels: 1);

        using var pcmStream = new RawSourceWaveStream(
            new MemoryStream(pcmBytes), waveFormat);

        using var mp3Stream = new MemoryStream();
        using var writer = new LameMP3FileWriter(mp3Stream, waveFormat, LAMEPreset.STANDARD);

        pcmStream.CopyTo(writer);
        writer.Flush();

        return mp3Stream.ToArray();
    }
}
