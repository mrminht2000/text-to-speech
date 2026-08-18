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
    }

    [Fact]
    public async Task GenerateSpeech_WithValidRequest_ReturnsAudioMpeg()
    {
        var client = CreateClientWithMockTts([0xFF, 0xFB, 0x90, 0x00]);
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

    private HttpClient CreateClientWithMockTts(byte[] mockAudioBytes)
    {
        var mockTtsService = Substitute.For<IGeminiTtsService>();
        var fakeResult = new TtsResult
        {
            AudioBytes = mockAudioBytes,
            Usage = new TtsUsage { PromptTokens = 5, CandidatesTokens = 40, TotalTokens = 45 }
        };

        mockTtsService.GenerateAudioAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<double>(), Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(fakeResult));

        return _factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddSingleton(mockTtsService)))
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
