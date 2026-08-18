using FluentAssertions;
using NSubstitute;
using VietTTS.Api.Models;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Services;

public class TtsEngineFactoryTests
{
    private readonly IGeminiTtsService _geminiTtsService = Substitute.For<IGeminiTtsService>();
    private readonly ILocalTtsService _localTtsService = Substitute.For<ILocalTtsService>();
    private readonly TtsEngineFactory _factory;

    public TtsEngineFactoryTests()
    {
        _factory = new TtsEngineFactory(_geminiTtsService, _localTtsService);
    }

    [Fact]
    public async Task ProcessTtsRequestAsync_WithGeminiModel_RoutesToGeminiService()
    {
        var request = new TtsRequest
        {
            Text = "Hello",
            Voice = "Charon",
            Speed = 1.0,
            Model = "gemini-2.5-flash-preview-tts",
            ApiKey = "my_key"
        };

        var fakeResult = new TtsResult { AudioBytes = [1, 2, 3] };
        _geminiTtsService.GenerateAudioAsync(
            request.Text, request.Voice, request.Speed, request.Model, request.ApiKey, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(fakeResult));

        var result = await _factory.ProcessTtsRequestAsync(request);

        result.Should().Be(fakeResult);
        await _geminiTtsService.Received(1).GenerateAudioAsync(
            request.Text, request.Voice, request.Speed, request.Model, request.ApiKey, Arg.Any<CancellationToken>());
        await _localTtsService.DidNotReceiveWithAnyArgs().GenerateAudioAsync(default!, default!);
    }

    [Fact]
    public async Task ProcessTtsRequestAsync_WithLocalModel_RoutesToLocalService()
    {
        var request = new TtsRequest
        {
            Text = "Hello Local",
            Voice = "voice_clone_custom",
            Speed = 1.0,
            Model = "f5-tts-vietnamese",
            ReferenceAudioBase64 = "UklGRg=="
        };

        var fakeResult = new TtsResult { AudioBytes = [4, 5, 6] };
        _localTtsService.GenerateAudioAsync(
            request.Text, request.Voice, request.Speed, request.Model, request.ReferenceAudioBase64, request.ReferenceText, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(fakeResult));

        var result = await _factory.ProcessTtsRequestAsync(request);

        result.Should().Be(fakeResult);
        await _localTtsService.Received(1).GenerateAudioAsync(
            request.Text, request.Voice, request.Speed, request.Model, request.ReferenceAudioBase64, request.ReferenceText, Arg.Any<CancellationToken>());
        await _geminiTtsService.DidNotReceiveWithAnyArgs().GenerateAudioAsync(default!, default!);
    }
}
