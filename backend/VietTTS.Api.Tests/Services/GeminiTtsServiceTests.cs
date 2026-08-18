using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Services;

public class GeminiTtsServiceTests
{
    private readonly IHttpClientFactory _httpClientFactory = Substitute.For<IHttpClientFactory>();
    private readonly IConfiguration _configuration = Substitute.For<IConfiguration>();

    public GeminiTtsServiceTests()
    {
        _configuration["Gemini:ApiKey"].Returns("test_api_key");
        _configuration["Gemini:Model"].Returns("gemini-2.5-flash-preview-tts");
    }

    [Fact]
    public void Constructor_WithoutApiKey_ThrowsInvalidOperationException()
    {
        var emptyConfig = Substitute.For<IConfiguration>();
        emptyConfig["Gemini:ApiKey"].Returns((string?)null);

        var act = () => new GeminiTtsService(_httpClientFactory, emptyConfig);

        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*Gemini:ApiKey*");
    }

    [Fact]
    public async Task GenerateAudioAsync_WithValidPcmResponse_ReturnsMp3AudioBytes()
    {
        // 24000 samples of 16-bit PCM = 48000 bytes
        var pcmBytes = new byte[48000];
        for (int i = 0; i < pcmBytes.Length; i += 2)
        {
            short sample = (short)(Math.Sin(2 * Math.PI * 440 * (i / 2) / 24000) * 16000);
            pcmBytes[i] = (byte)(sample & 0xFF);
            pcmBytes[i + 1] = (byte)((sample >> 8) & 0xFF);
        }

        var base64Audio = Convert.ToBase64String(pcmBytes);

        var mockGeminiResponse = new
        {
            candidates = new[]
            {
                new
                {
                    content = new
                    {
                        parts = new object[]
                        {
                            new
                            {
                                inlineData = new
                                {
                                    mimeType = "audio/x-pcm",
                                    data = base64Audio
                                }
                            }
                        }
                    }
                }
            },
            usageMetadata = new
            {
                promptTokenCount = 12,
                candidatesTokenCount = 80,
                totalTokenCount = 92
            }
        };

        var responseJson = JsonSerializer.Serialize(mockGeminiResponse);
        var handler = new MockHttpMessageHandler(HttpStatusCode.OK, responseJson);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://generativelanguage.googleapis.com/") };
        _httpClientFactory.CreateClient("gemini").Returns(httpClient);


        var service = new GeminiTtsService(_httpClientFactory, _configuration);

        var result = await service.GenerateAudioAsync("Xin chào", "Charon", 1.0);

        result.Should().NotBeNull();
        result.AudioBytes.Should().NotBeEmpty();
        result.Usage.PromptTokens.Should().Be(12);
        result.Usage.CandidatesTokens.Should().Be(80);
        result.Usage.TotalTokens.Should().Be(92);
    }

    private class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _statusCode;
        private readonly string _responseContent;

        public MockHttpMessageHandler(HttpStatusCode statusCode, string responseContent)
        {
            _statusCode = statusCode;
            _responseContent = responseContent;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(_statusCode)
            {
                Content = new StringContent(_responseContent, System.Text.Encoding.UTF8, "application/json")
            });
        }
    }
}
