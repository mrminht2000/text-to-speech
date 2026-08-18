using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public class SubtitleService : ISubtitleService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SubtitleService> _logger;

    public SubtitleService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<SubtitleService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<TranscribeResult> TranscribeAsync(TranscribeRequest request, CancellationToken cancellationToken = default)
    {
        var provider = (request.Provider ?? "local-whisper").ToLowerInvariant();

        return provider switch
        {
            "local-whisper" or "local" => await TranscribeLocalAsync(request, cancellationToken),
            "gemini" => await TranscribeGeminiAsync(request, cancellationToken),
            "openai" or "whisper" => await TranscribeOpenAiAsync(request, cancellationToken),
            _ => await TranscribeLocalAsync(request, cancellationToken)
        };
    }

    private async Task<TranscribeResult> TranscribeLocalAsync(TranscribeRequest request, CancellationToken cancellationToken)
    {
        var endpoint = _configuration["LocalTts:Endpoint"] ?? "http://localhost:8000";
        var client = _httpClientFactory.CreateClient("local_subtitles");
        var requestUri = $"{endpoint.TrimEnd('/')}/transcribe";

        var payload = new
        {
            audio_base64 = request.AudioBase64,
            language = string.IsNullOrWhiteSpace(request.Language) ? "vi" : request.Language,
            word_timestamps = request.WordTimestamps,
            initial_prompt = request.InitialPrompt ?? "Phụ đề video tiếng Việt có dấu câu chuẩn."
        };

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsJsonAsync(requestUri, payload, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new HttpRequestException(
                $"Không thể kết nối đến Local Whisper Engine tại '{endpoint}'. Vui lòng đảm bảo local_engine đang chạy.", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Local Whisper trả về lỗi {response.StatusCode}: {err}");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var fullText = root.TryGetProperty("text", out var tProp) ? tProp.GetString() ?? "" : "";
        var language = root.TryGetProperty("language", out var lProp) ? lProp.GetString() ?? "vi" : "vi";
        var duration = root.TryGetProperty("duration", out var dProp) ? dProp.GetDouble() : 0.0;

        var segmentsList = new List<SubtitleSegment>();
        if (root.TryGetProperty("segments", out var segsProp) && segsProp.ValueKind == JsonValueKind.Array)
        {
            int index = 1;
            foreach (var segElem in segsProp.EnumerateArray())
            {
                var id = segElem.TryGetProperty("id", out var idProp) ? idProp.GetInt32() : index++;
                var start = segElem.TryGetProperty("start", out var sProp) ? sProp.GetDouble() : 0.0;
                var end = segElem.TryGetProperty("end", out var eProp) ? eProp.GetDouble() : 0.0;
                var text = segElem.TryGetProperty("text", out var txtProp) ? txtProp.GetString() ?? "" : "";

                var wordsList = new List<SubtitleWord>();
                if (segElem.TryGetProperty("words", out var wordsProp) && wordsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var wElem in wordsProp.EnumerateArray())
                    {
                        var wWord = wElem.TryGetProperty("word", out var wwProp) ? wwProp.GetString() ?? "" : "";
                        var wStart = wElem.TryGetProperty("start", out var wsProp) ? wsProp.GetDouble() : 0.0;
                        var wEnd = wElem.TryGetProperty("end", out var weProp) ? weProp.GetDouble() : 0.0;
                        var wProb = wElem.TryGetProperty("probability", out var wpProp) ? (double?)wpProp.GetDouble() : null;

                        if (!string.IsNullOrWhiteSpace(wWord))
                        {
                            wordsList.Add(new SubtitleWord(wWord, wStart, wEnd, wProb));
                        }
                    }
                }

                segmentsList.Add(new SubtitleSegment(id, start, end, text, wordsList));
            }
        }

        return new TranscribeResult(fullText, language, duration, "local-whisper", segmentsList);
    }

    private async Task<TranscribeResult> TranscribeOpenAiAsync(TranscribeRequest request, CancellationToken cancellationToken)
    {
        var apiKey = !string.IsNullOrWhiteSpace(request.ApiKey)
            ? request.ApiKey
            : _configuration["OpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Chưa cấu hình API Key cho OpenAI Whisper.");
        }

        var client = _httpClientFactory.CreateClient("openai_subtitles");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        byte[] audioBytes;
        try
        {
            var raw = request.AudioBase64 ?? "";
            if (raw.Contains(',')) raw = raw.Split(',', 2)[1];
            audioBytes = Convert.FromBase64String(raw);
        }
        catch (Exception ex)
        {
            throw new ArgumentException("Dữ liệu audio base64 không hợp lệ.", ex);
        }

        using var form = new MultipartFormDataContent();
        using var byteContent = new ByteArrayContent(audioBytes);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("audio/wav");
        form.Add(byteContent, "file", "audio.wav");
        form.Add(new StringContent("whisper-1"), "model");
        form.Add(new StringContent(string.IsNullOrWhiteSpace(request.Language) ? "vi" : request.Language), "language");
        form.Add(new StringContent("verbose_json"), "response_format");
        form.Add(new StringContent("segment"), "timestamp_granularities[]");
        form.Add(new StringContent("word"), "timestamp_granularities[]");

        var response = await client.PostAsync("https://api.openai.com/v1/audio/transcriptions", form, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"OpenAI Whisper trả về lỗi {response.StatusCode}: {err}");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var fullText = root.TryGetProperty("text", out var tProp) ? tProp.GetString() ?? "" : "";
        var language = root.TryGetProperty("language", out var lProp) ? lProp.GetString() ?? "vi" : "vi";
        var duration = root.TryGetProperty("duration", out var dProp) ? dProp.GetDouble() : 0.0;

        var segmentsList = new List<SubtitleSegment>();
        if (root.TryGetProperty("segments", out var segsProp) && segsProp.ValueKind == JsonValueKind.Array)
        {
            int index = 1;
            foreach (var segElem in segsProp.EnumerateArray())
            {
                var id = segElem.TryGetProperty("id", out var idProp) ? idProp.GetInt32() : index++;
                var start = segElem.TryGetProperty("start", out var sProp) ? sProp.GetDouble() : 0.0;
                var end = segElem.TryGetProperty("end", out var eProp) ? eProp.GetDouble() : 0.0;
                var text = segElem.TryGetProperty("text", out var txtProp) ? txtProp.GetString() ?? "" : "";

                segmentsList.Add(new SubtitleSegment(id, start, end, text, new List<SubtitleWord>()));
            }
        }

        return new TranscribeResult(fullText, language, duration, "openai-whisper", segmentsList);
    }

    private async Task<TranscribeResult> TranscribeGeminiAsync(TranscribeRequest request, CancellationToken cancellationToken)
    {
        var apiKey = !string.IsNullOrWhiteSpace(request.ApiKey)
            ? request.ApiKey
            : _configuration["Gemini:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Chưa cấu hình API Key cho Gemini.");
        }

        var client = _httpClientFactory.CreateClient("gemini_subtitles");
        var model = !string.IsNullOrWhiteSpace(request.Model) ? request.Model.Trim() : "gemini-flash-latest";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var rawBase64 = request.AudioBase64 ?? "";
        string mimeType = "audio/wav";

        if (rawBase64.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var metaPart = rawBase64.Substring(5, rawBase64.IndexOf(';') - 5);
            if (!string.IsNullOrWhiteSpace(metaPart))
            {
                mimeType = metaPart;
            }
            if (rawBase64.Contains(','))
            {
                rawBase64 = rawBase64.Split(',', 2)[1];
            }
        }
        else if (rawBase64.Contains(','))
        {
            rawBase64 = rawBase64.Split(',', 2)[1];
        }

        var prompt = "Hãy nhận diện và phân đoạn toàn bộ giọng nói trong file âm thanh/video này bằng tiếng Việt, tạo phụ đề có dấu câu chuẩn xác.\n" +
                     "Trả về định dạng JSON thuần túy theo schema sau:\n" +
                     "{\n" +
                     "  \"text\": \"toàn bộ văn bản đã nhận diện\",\n" +
                     "  \"duration\": 10.5,\n" +
                     "  \"segments\": [\n" +
                     "    {\n" +
                     "      \"id\": 1,\n" +
                     "      \"start\": 0.0,\n" +
                     "      \"end\": 2.5,\n" +
                     "      \"text\": \"nội dung câu phụ đề\",\n" +
                     "      \"words\": [\n" +
                     "        {\"word\": \"từ\", \"start\": 0.0, \"end\": 0.5}\n" +
                     "      ]\n" +
                     "    }\n" +
                     "  ]\n" +
                     "}";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = prompt },
                        new
                        {
                            inline_data = new
                            {
                                mime_type = mimeType,
                                data = rawBase64
                            }
                        }
                    }
                }
            },
            generationConfig = new
            {
                response_mime_type = "application/json",
                temperature = 0.1
            }
        };

        var response = await client.PostAsJsonAsync(url, payload, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Gemini Transcribe ({model}) trả về lỗi {response.StatusCode}: {err}");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var candidateText = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        using var innerDoc = JsonDocument.Parse(candidateText);
        var root = innerDoc.RootElement;

        var fullText = root.TryGetProperty("text", out var tProp) ? tProp.GetString() ?? "" : "";
        var duration = root.TryGetProperty("duration", out var dProp) ? dProp.GetDouble() : 0.0;

        var segmentsList = new List<SubtitleSegment>();
        if (root.TryGetProperty("segments", out var segsProp) && segsProp.ValueKind == JsonValueKind.Array)
        {
            int index = 1;
            foreach (var segElem in segsProp.EnumerateArray())
            {
                var id = segElem.TryGetProperty("id", out var idProp) ? idProp.GetInt32() : index++;
                var start = segElem.TryGetProperty("start", out var sProp) ? sProp.GetDouble() : 0.0;
                var end = segElem.TryGetProperty("end", out var eProp) ? eProp.GetDouble() : 0.0;
                var text = segElem.TryGetProperty("text", out var txtProp) ? txtProp.GetString() ?? "" : "";

                var wordsList = new List<SubtitleWord>();
                if (segElem.TryGetProperty("words", out var wordsProp) && wordsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var wElem in wordsProp.EnumerateArray())
                    {
                        var wWord = wElem.TryGetProperty("word", out var wwProp) ? wwProp.GetString() ?? "" : "";
                        var wStart = wElem.TryGetProperty("start", out var wsProp) ? wsProp.GetDouble() : 0.0;
                        var wEnd = wElem.TryGetProperty("end", out var weProp) ? weProp.GetDouble() : 0.0;

                        if (!string.IsNullOrWhiteSpace(wWord))
                        {
                            wordsList.Add(new SubtitleWord(wWord, wStart, wEnd));
                        }
                    }
                }

                segmentsList.Add(new SubtitleSegment(id, start, end, text, wordsList));
            }
        }

        return new TranscribeResult(fullText, "vi", duration, "gemini-2.0-flash", segmentsList);
    }
}
