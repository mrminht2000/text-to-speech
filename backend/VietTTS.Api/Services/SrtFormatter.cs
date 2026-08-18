using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using VietTTS.Api.Models;

namespace VietTTS.Api.Services;

public static class SrtFormatter
{
    public static string FormatSrt(IEnumerable<SubtitleSegment> segments)
    {
        var sb = new StringBuilder();
        int counter = 1;

        foreach (var seg in segments)
        {
            sb.AppendLine(counter.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine($"{FormatSrtTime(seg.Start)} --> {FormatSrtTime(seg.End)}");
            sb.AppendLine(seg.Text.Trim());
            sb.AppendLine();
            counter++;
        }

        return sb.ToString();
    }

    public static string FormatVtt(IEnumerable<SubtitleSegment> segments)
    {
        var sb = new StringBuilder();
        sb.AppendLine("WEBVTT");
        sb.AppendLine();

        foreach (var seg in segments)
        {
            sb.AppendLine($"{FormatVttTime(seg.Start)} --> {FormatVttTime(seg.End)}");
            sb.AppendLine(seg.Text.Trim());
            sb.AppendLine();
        }

        return sb.ToString();
    }

    public static List<SubtitleSegment> ParseSrt(string srtContent)
    {
        var list = new List<SubtitleSegment>();
        if (string.IsNullOrWhiteSpace(srtContent))
            return list;

        var blocks = Regex.Split(srtContent.Trim(), @"\r?\n\r?\n+");
        int index = 1;

        foreach (var block in blocks)
        {
            var lines = block.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length < 2) continue;

            int timeIndex = lines[0].Contains("-->", StringComparison.Ordinal) ? 0 : 1;
            if (lines.Length <= timeIndex) continue;

            var timeLine = lines[timeIndex];
            var timeMatch = Regex.Match(timeLine, @"(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})");
            if (!timeMatch.Success) continue;

            double start = ParseTimestamp(timeMatch.Groups[1].Value);
            double end = ParseTimestamp(timeMatch.Groups[2].Value);

            var textLines = lines.Skip(timeIndex + 1);
            string text = string.Join(" ", textLines).Trim();

            if (!string.IsNullOrWhiteSpace(text))
            {
                list.Add(new SubtitleSegment(index++, start, end, text));
            }
        }

        return list;
    }

    public static string FormatSrtTime(double totalSeconds)
    {
        if (totalSeconds < 0) totalSeconds = 0;
        var ts = TimeSpan.FromSeconds(totalSeconds);
        return $"{(int)ts.TotalHours:D2}:{ts.Minutes:D2}:{ts.Seconds:D2},{ts.Milliseconds:D3}";
    }

    public static string FormatVttTime(double totalSeconds)
    {
        if (totalSeconds < 0) totalSeconds = 0;
        var ts = TimeSpan.FromSeconds(totalSeconds);
        return $"{(int)ts.TotalHours:D2}:{ts.Minutes:D2}:{ts.Seconds:D2}.{ts.Milliseconds:D3}";
    }

    public static double ParseTimestamp(string timeStr)
    {
        timeStr = timeStr.Replace(',', '.').Trim();
        var parts = timeStr.Split(':');
        if (parts.Length != 3) return 0.0;

        if (double.TryParse(parts[0], NumberStyles.Any, CultureInfo.InvariantCulture, out double hours) &&
            double.TryParse(parts[1], NumberStyles.Any, CultureInfo.InvariantCulture, out double minutes) &&
            double.TryParse(parts[2], NumberStyles.Any, CultureInfo.InvariantCulture, out double seconds))
        {
            return (hours * 3600) + (minutes * 60) + seconds;
        }

        return 0.0;
    }
}
