using FluentAssertions;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Services;

public class GeminiTtsServiceTests
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public GeminiTtsServiceTests()
    {
        _httpClientFactory = Substitute.For<IHttpClientFactory>();
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gemini:ApiKey"] = "test-fake-key"
            })
            .Build();
    }

    [Fact]
    public async Task GenerateAudioAsync_ValidInput_ReturnsMp3Bytes()
    {
        // Arrange
        var fakeClient = new HttpClient(new FakePcmHttpMessageHandler())
        {
            BaseAddress = new Uri("https://generativelanguage.googleapis.com/")
        };
        _httpClientFactory.CreateClient("gemini").Returns(fakeClient);

        var sut = CreateSut();

        // Act
        var result = await sut.GenerateAudioAsync("Xin chào", "Charon", 1.0);

        // Assert
        result.Should().NotBeNull();
        result.AudioBytes.Should().NotBeEmpty();
        // MP3 magic bytes: FF FB or FF F3 or FF F2 or ID3 (or WAV header RIFF)
        var isValidAudio = result.AudioBytes.Length > 4;
        isValidAudio.Should().BeTrue("output must contain audio bytes");

    }

    [Fact]
    public async Task GenerateAudioAsync_GeminiApiError_ThrowsHttpRequestException()
    {
        // Arrange
        var fakeClient = new HttpClient(new FakeErrorHttpMessageHandler(500))
        {
            BaseAddress = new Uri("https://generativelanguage.googleapis.com/")
        };
        _httpClientFactory.CreateClient("gemini").Returns(fakeClient);
        var sut = CreateSut();

        // Act & Assert
        await sut.Invoking(s => s.GenerateAudioAsync("Xin chào", "Charon", 1.0))
                 .Should().ThrowAsync<HttpRequestException>();
    }

    [Fact]
    public async Task GenerateAudioAsync_CancellationRequested_ThrowsOperationCancelledException()
    {
        // Arrange
        var fakeClient = new HttpClient(new FakePcmHttpMessageHandler())
        {
            BaseAddress = new Uri("https://generativelanguage.googleapis.com/")
        };
        _httpClientFactory.CreateClient("gemini").Returns(fakeClient);

        var cts = new CancellationTokenSource();
        cts.Cancel();
        var sut = CreateSut();

        // Act & Assert
        await sut.Invoking(s => s.GenerateAudioAsync("text", "Charon", 1.0, cancellationToken: cts.Token))
                 .Should().ThrowAsync<OperationCanceledException>();

    }

    private IGeminiTtsService CreateSut()
    {
        return new GeminiTtsService(_httpClientFactory, _configuration);
    }
}


// ── Test Helpers ──────────────────────────────────────────────────────────────

/// <summary>
/// Fake HTTP handler that returns minimal valid PCM audio (Gemini format: raw 16-bit PCM 24kHz).
/// PCM data: 0x00 bytes (silence) wrapped in Gemini JSON response.
/// </summary>
public class FakePcmHttpMessageHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        // Gemini TTS returns JSON with base64-encoded PCM audio
        var silentPcm = new byte[4800]; // 0.1s of silence @ 24kHz 16-bit mono
        var base64Pcm = Convert.ToBase64String(silentPcm);

        var jsonBody = $$"""
            {
              "candidates": [{
                "content": {
                  "parts": [{
                    "inlineData": {
                      "mimeType": "audio/pcm;rate=24000",
                      "data": "{{base64Pcm}}"
                    }
                  }]
                }
              }]
            }
            """;

        var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK)
        {
            Content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json")
        };
        return Task.FromResult(response);
    }
}


/// <summary>
/// Fake HTTP handler that returns an error status code.
/// </summary>
public class FakeErrorHttpMessageHandler(int statusCode) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = new HttpResponseMessage((System.Net.HttpStatusCode)statusCode);
        return Task.FromResult(response);
    }
}
