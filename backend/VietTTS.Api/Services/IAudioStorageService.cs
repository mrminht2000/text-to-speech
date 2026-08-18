namespace VietTTS.Api.Services;

public interface IAudioStorageService
{
    Task<string> SaveAudioAsync(Guid? userId, Guid historyId, byte[] audioBytes, string extension = "mp3");
    Task<(byte[] Bytes, string ContentType)?> GetAudioAsync(string? filePath);
    Task DeleteAudioAsync(string? filePath);
}
