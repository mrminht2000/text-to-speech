using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using VietTTS.Api.Models;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Endpoints;

public class TtsEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public TtsEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetVoices_ReturnsOk_WithVoiceList()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/voices");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<VoicesResponse>();
        json.Should().NotBeNull();
        json!.Voices.Should().NotBeEmpty();
        json.DefaultVoice.Should().Be("Charon");
    }

    [Fact]
    public async Task GetModels_ReturnsOk_WithModelList()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/models");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<ModelsResponse>();
        json.Should().NotBeNull();
        json!.Models.Should().NotBeEmpty();
        json!.Models.Should().Contain(m => m.Id == "f5-tts-vietnamese" && m.IsAvailable);
    }

    [Fact]
    public async Task GenerateSpeech_WithValidRequest_ReturnsAudioMpeg()
    {
        var client = CreateClientWithMockEngine([0xFF, 0xFB, 0x90, 0x00]);
        var request = new TtsRequest { Text = "Xin chào", Voice = "Charon", Speed = 1.0 };

        var response = await client.PostAsJsonAsync("/api/tts", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("audio/mpeg");
    }

    [Fact]
    public async Task GenerateSpeech_WithEmptyText_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var request = new TtsRequest { Text = "", Voice = "Charon" };

        var response = await client.PostAsJsonAsync("/api/tts", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GenerateSpeech_WithInvalidVoice_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var request = new TtsRequest { Text = "Hello", Voice = "NonExistentVoice" };

        var response = await client.PostAsJsonAsync("/api/tts", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GenerateSpeech_WithLocalModelAndVoiceCloning_ReturnsSuccess()
    {
        var client = CreateClientWithMockEngine([0x52, 0x49, 0x46, 0x46]);
        var request = new TtsRequest
        {
            Text = "Xin chào từ mô hình Local F5-TTS",
            Voice = "voice_clone_custom",
            Model = "f5-tts-vietnamese",
            ReferenceAudioBase64 = "UklGRgAAAABXQVZFZm10"
        };

        var response = await client.PostAsJsonAsync("/api/tts", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private HttpClient CreateClientWithMockEngine(byte[] mockAudioBytes)
    {
        var mockEngineFactory = Substitute.For<ITtsEngineFactory>();
        var fakeResult = new TtsResult
        {
            AudioBytes = mockAudioBytes,
            Usage = new TtsUsage { PromptTokens = 5, CandidatesTokens = 40, TotalTokens = 45 }
        };

        mockEngineFactory.ProcessTtsRequestAsync(Arg.Any<TtsRequest>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(fakeResult));

        return _factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddSingleton(mockEngineFactory)))
            .CreateClient();
    }

    private class VoicesResponse
    {
        public List<VoiceInfo> Voices { get; set; } = [];
        public string DefaultVoice { get; set; } = "";
    }

    private class ModelsResponse
    {
        public List<ModelInfo> Models { get; set; } = [];
        public string DefaultModel { get; set; } = "";
    }
}
