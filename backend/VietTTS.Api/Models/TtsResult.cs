namespace VietTTS.Api.Models;

public class TtsResult
{
    public byte[] AudioBytes { get; set; } = [];
    public TtsUsage Usage { get; set; } = new();
}

public class TtsUsage
{
    public int PromptTokens { get; set; }
    public int CandidatesTokens { get; set; }
    public int TotalTokens { get; set; }
}
