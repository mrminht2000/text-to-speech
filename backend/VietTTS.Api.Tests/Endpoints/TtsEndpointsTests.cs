using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using VietTTS.Api.Models;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Endpoints;

/// <summary>
/// Integration tests for TTS endpoints using WebApplicationFactory.
/// Tests validate HTTP contract: status codes, content-type, error shapes.
/// </summary>
public class TtsEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public TtsEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // ── GET /api/voices ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetVoices_ReturnsOk_WithVoiceList()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/voices");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("voices", out var voices).Should().BeTrue();
        voices.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetVoices_DefaultVoice_IsCharon()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/voices");
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var voices = doc.RootElement.GetProperty("voices").EnumerateArray();

        // Assert
        var charon = voices.FirstOrDefault(v => v.GetProperty("id").GetString() == "Charon");
        charon.ValueKind.Should().NotBe(JsonValueKind.Undefined, "Charon must exist");
        charon.GetProperty("isDefault").GetBoolean().Should().BeTrue();
    }

    // ── POST /api/tts — validation ────────────────────────────────────────────

    [Fact]
    public async Task PostTts_EmptyText_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateClientWithMockTts();
        var request = new TtsRequest { Text = "", Voice = "Charon", Speed = 1.0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/tts", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostTts_TextExceeds5000Chars_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateClientWithMockTts();
        var request = new TtsRequest { Text = new string('x', 5001), Voice = "Charon", Speed = 1.0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/tts", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostTts_InvalidVoice_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateClientWithMockTts();
        var request = new TtsRequest { Text = "Xin chào", Voice = "NotARealVoice", Speed = 1.0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/tts", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(0.4)]
    [InlineData(2.1)]
    public async Task PostTts_SpeedOutOfRange_ReturnsBadRequest(double speed)
    {
        // Arrange
        var client = CreateClientWithMockTts();
        var request = new TtsRequest { Text = "Xin chào", Voice = "Charon", Speed = speed };

        // Act
        var response = await client.PostAsJsonAsync("/api/tts", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── POST /api/tts — happy path ────────────────────────────────────────────

    [Fact]
    public async Task PostTts_ValidRequest_ReturnsAudioMpeg()
    {
        // Arrange
        var client = CreateClientWithMockTts(mockAudioBytes: [0xFF, 0xFB, 0x90, 0x00]); // MP3 header
        var request = new TtsRequest { Text = "Xin chào Việt Nam", Voice = "Charon", Speed = 1.0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/tts", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("audio/mpeg");
    }

    [Fact]
    public async Task PostTts_ValidRequest_ResponseHasDownloadHeader()
    {
        // Arrange
        var client = CreateClientWithMockTts(mockAudioBytes: [0xFF, 0xFB, 0x90, 0x00]);
        var request = new TtsRequest { Text = "Test", Voice = "Charon", Speed = 1.0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/tts", request);

        // Assert
        response.Content.Headers.ContentDisposition?.FileName.Should().Be("output.mp3");
    }

    // ── POST /api/tts — service error ─────────────────────────────────────────

    [Fact]
    public async Task PostTts_ServiceThrows_Returns502()
    {
        // Arrange
        var client = CreateClientWithMockTts(throwException: new HttpRequestException("Gemini unavailable"));
        var request = new TtsRequest { Text = "Xin chào", Voice = "Charon", Speed = 1.0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/tts", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpClient CreateClientWithMockTts(byte[]? mockAudioBytes = null, Exception? throwException = null)
    {
        var mockTtsService = Substitute.For<IGeminiTtsService>();

        if (throwException is not null)
            mockTtsService.GenerateAudioAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<double>(), Arg.Any<CancellationToken>())
                          .Returns(Task.FromException<byte[]>(throwException));
        else
            mockTtsService.GenerateAudioAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<double>(), Arg.Any<CancellationToken>())
                          .Returns(mockAudioBytes ?? [0xFF, 0xFB, 0x90, 0x00]);

        return _factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddSingleton(mockTtsService)))
            .CreateClient();
    }
}
