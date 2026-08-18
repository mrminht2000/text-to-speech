using VietTTS.Api.Models;
using VietTTS.Api.Services;
using Xunit;

namespace VietTTS.Api.Tests.Services;

public class SubtitleServiceTests
{
    [Fact]
    public void FormatSrt_Produces_Valid_Srt_Output()
    {
        // Arrange
        var segments = new List<SubtitleSegment>
        {
            new(1, 1.25, 3.50, "Xin chào các bạn"),
            new(2, 3.75, 6.00, "Đây là phụ đề tiếng Việt")
        };

        // Act
        var srt = SrtFormatter.FormatSrt(segments);

        // Assert
        Assert.Contains("1", srt);
        Assert.Contains("00:00:01,250 --> 00:00:03,500", srt);
        Assert.Contains("Xin chào các bạn", srt);
        Assert.Contains("2", srt);
        Assert.Contains("00:00:03,750 --> 00:00:06,000", srt);
        Assert.Contains("Đây là phụ đề tiếng Việt", srt);
    }

    [Fact]
    public void FormatVtt_Produces_Valid_WebVtt_Output()
    {
        // Arrange
        var segments = new List<SubtitleSegment>
        {
            new(1, 0.0, 2.123, "Phụ đề WebVTT")
        };

        // Act
        var vtt = SrtFormatter.FormatVtt(segments);

        // Assert
        Assert.StartsWith("WEBVTT", vtt);
        Assert.Contains("00:00:00.000 --> 00:00:02.123", vtt);
        Assert.Contains("Phụ đề WebVTT", vtt);
    }

    [Fact]
    public void ParseSrt_Parses_Srt_String_Into_Segments()
    {
        // Arrange
        var srt = @"1
00:00:01,500 --> 00:00:04,200
Chào mừng bạn đến với MinhTTS

2
00:00:04,500 --> 00:00:07,800
Hệ thống tạo giọng nói và phụ đề AI";

        // Act
        var segments = SrtFormatter.ParseSrt(srt);

        // Assert
        Assert.Equal(2, segments.Count);
        Assert.Equal(1.5, segments[0].Start);
        Assert.Equal(4.2, segments[0].End);
        Assert.Equal("Chào mừng bạn đến với MinhTTS", segments[0].Text);

        Assert.Equal(4.5, segments[1].Start);
        Assert.Equal(7.8, segments[1].End);
        Assert.Equal("Hệ thống tạo giọng nói và phụ đề AI", segments[1].Text);
    }

    [Fact]
    public void ParseTimestamp_Handles_Various_Formats()
    {
        Assert.Equal(61.5, SrtFormatter.ParseTimestamp("00:01:01,500"));
        Assert.Equal(3665.25, SrtFormatter.ParseTimestamp("01:01:05.250"));
        Assert.Equal(0.0, SrtFormatter.ParseTimestamp("invalid"));
    }
}
