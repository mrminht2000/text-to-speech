namespace VietTTS.Api.Services;

public class AudioStorageService : IAudioStorageService
{
    private readonly string _storageRoot;
    private readonly ILogger<AudioStorageService> _logger;

    public AudioStorageService(IWebHostEnvironment env, ILogger<AudioStorageService> logger)
    {
        _logger = logger;
        _storageRoot = Path.Combine(env.ContentRootPath, "App_Data", "audio_library");
        if (!Directory.Exists(_storageRoot))
        {
            Directory.CreateDirectory(_storageRoot);
        }
    }

    public async Task<string> SaveAudioAsync(Guid? userId, Guid historyId, byte[] audioBytes, string extension = "mp3")
    {
        var userFolder = userId.HasValue ? userId.Value.ToString() : "anonymous";
        var dirPath = Path.Combine(_storageRoot, userFolder);
        if (!Directory.Exists(dirPath))
        {
            Directory.CreateDirectory(dirPath);
        }

        var ext = extension.TrimStart('.').ToLowerInvariant();
        var fileName = $"{historyId}.{ext}";
        var fullPath = Path.Combine(dirPath, fileName);

        await File.WriteAllBytesAsync(fullPath, audioBytes);
        return Path.Combine("App_Data", "audio_library", userFolder, fileName).Replace('\\', '/');
    }

    public async Task<(byte[] Bytes, string ContentType)?> GetAudioAsync(string? relativeFilePath)
    {
        if (string.IsNullOrEmpty(relativeFilePath)) return null;

        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), relativeFilePath);
        if (!File.Exists(fullPath))
        {
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(fullPath);
        var ext = Path.GetExtension(fullPath).ToLowerInvariant();
        var contentType = ext switch
        {
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            _ => "audio/mpeg"
        };

        return (bytes, contentType);
    }

    public Task DeleteAudioAsync(string? relativeFilePath)
    {
        if (string.IsNullOrEmpty(relativeFilePath)) return Task.CompletedTask;

        try
        {
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), relativeFilePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete audio file: {FilePath}", relativeFilePath);
        }

        return Task.CompletedTask;
    }
}
