namespace VietTTS.Api.Services;

/// <summary>
/// Contract for Gemini TTS audio generation.
/// </summary>
public interface IGeminiTtsService
{
    /// <summary>
    /// Generates MP3 audio bytes from Vietnamese text.
    /// </summary>
    /// <param name="text">Input text (max 5000 chars).</param>
    /// <param name="voice">Gemini voice name (e.g. "Charon").</param>
    /// <param name="speed">Speaking rate multiplier (0.5–2.0).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>MP3 audio bytes.</returns>
    Task<byte[]> GenerateAudioAsync(string text, string voice, double speed, CancellationToken cancellationToken = default);
}
