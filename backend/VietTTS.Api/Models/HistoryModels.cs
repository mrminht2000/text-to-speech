namespace VietTTS.Api.Models;

public record AudioHistoryItemDto(
    Guid Id,
    string Text,
    string Model,
    string Voice,
    float Speed,
    string ContentType,
    long FileSizeBytes,
    double DurationSeconds,
    int PromptTokens,
    int CandidateTokens,
    int TotalTokens,
    bool IsByok,
    string DownloadUrl,
    DateTime CreatedAt
);

public record HistoryListResponse(
    List<AudioHistoryItemDto> Items,
    int TotalCount
);
