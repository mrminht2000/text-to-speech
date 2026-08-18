using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public interface ISubtitleService
{
    Task<TranscribeResult> TranscribeAsync(TranscribeRequest request, CancellationToken cancellationToken = default);
}
