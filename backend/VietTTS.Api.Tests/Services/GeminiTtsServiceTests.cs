using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Services;

public class GeminiTtsServiceTests
{
    // ──────────────────────────────────────────────
    // These tests define the contract for GeminiTtsService.
    // Implementation does NOT exist yet — tests will fail RED first.
    // ──────────────────────────────────────────────

    private readonly IGeminiTtsService _sut;
    private readonly IHttpClientFactory _httpClientFactory;

    public GeminiTtsServiceTests()
    {
        _httpClientFactory = Substitute.For<IHttpClientFactory>();
        // GeminiTtsService will be created once implemented
        // _sut = new GeminiTtsService(_httpClientFactory, "test-api-key");
    }

    [Fact(Skip = "RED — GeminiTtsService not implemented yet")]
    public async Task GenerateAudioAsync_ValidInput_ReturnsMp3Bytes()
    {
        // Arrange
        var fakeClient = new HttpClient(new FakePcmHttpMessageHandler());
        _httpClientFactory.CreateClient("gemini").Returns(fakeClient);

        var sut = CreateSut();

        // Act
        var result = await sut.GenerateAudioAsync("Xin chào", "Charon", 1.0);

        // Assert
        result.Should().NotBeEmpty();
        // MP3 magic bytes: FF FB or FF F3 or FF F2 or ID3
        var isValidMp3 = (result[0] == 0xFF && (result[1] == 0xFB || result[1] == 0xF3 || result[1] == 0xF2))
                         || (result[0] == 0x49 && result[1] == 0x44 && result[2] == 0x33); // ID3
        isValidMp3.Should().BeTrue("output must be valid MP3");
    }

    [Fact(Skip = "RED — GeminiTtsService not implemented yet")]
    public async Task GenerateAudioAsync_GeminiApiError_ThrowsHttpRequestException()
    {
        // Arrange
        var fakeClient = new HttpClient(new FakeErrorHttpMessageHandler(500));
        _httpClientFactory.CreateClient("gemini").Returns(fakeClient);
        var sut = CreateSut();

        // Act & Assert
        await sut.Invoking(s => s.GenerateAudioAsync("Xin chào", "Charon", 1.0))
                 .Should().ThrowAsync<HttpRequestException>();
    }

    [Fact(Skip = "RED — GeminiTtsService not implemented yet")]
    public async Task GenerateAudioAsync_CancellationRequested_ThrowsOperationCancelledException()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();
        var sut = CreateSut();

        // Act & Assert
        await sut.Invoking(s => s.GenerateAudioAsync("text", "Charon", 1.0, cts.Token))
                 .Should().ThrowAsync<OperationCanceledException>();
    }

    private IGeminiTtsService CreateSut()
    {
        // Will be replaced when GeminiTtsService is implemented:
        // return new GeminiTtsService(_httpClientFactory, "fake-api-key");
        throw new NotImplementedException("GeminiTtsService not yet implemented — RED phase");
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
