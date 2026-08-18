namespace VietTTS.Api.Models;

public record SubtitleWord(
    string Word,
    double Start,
    double End,
    double? Probability = null
);

public record SubtitleSegment(
    int Id,
    double Start,
    double End,
    string Text,
    List<SubtitleWord>? Words = null
);

public record TranscribeRequest(
    string? AudioBase64 = null,
    string Provider = "local-whisper",
    string? Model = null,
    string Language = "vi",
    bool WordTimestamps = true,
    string? InitialPrompt = null,
    string? ApiKey = null
);

public record TranscribeResult(
    string Text,
    string Language,
    double Duration,
    string Provider,
    List<SubtitleSegment> Segments
);

public record ExportSubtitleRequest(
    List<SubtitleSegment> Segments,
    string Format = "srt"
);
