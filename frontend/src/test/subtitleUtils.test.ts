import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatSrtTime,
  formatVttTime,
  generateSrt,
  generateVtt,
  parseSrt,
  findActiveSegment,
  findActiveWordIndex,
  autoFormatSubtitleSegments,
  calculateAutoSubtitleLayout,
} from '../utils/subtitleUtils';
import { SubtitleSegment } from '../types/subtitles';

describe('subtitleUtils', () => {
  const sampleSegments: SubtitleSegment[] = [
    {
      id: 1,
      start: 1.5,
      end: 4.2,
      text: 'Chào mừng các bạn',
      words: [
        { word: 'Chào', start: 1.5, end: 2.0 },
        { word: 'mừng', start: 2.0, end: 2.5 },
        { word: 'các', start: 2.5, end: 3.2 },
        { word: 'bạn', start: 3.2, end: 4.2 },
      ],
    },
    {
      id: 2,
      start: 4.5,
      end: 8.0,
      text: 'Đến với MinhTTS Studio',
    },
  ];

  it('formats time to mm:ss.ms', () => {
    expect(formatTime(65.4)).toBe('01:05.4');
    expect(formatTime(0)).toBe('00:00.0');
  });

  it('formats SRT timestamp correctly (hh:mm:ss,ms)', () => {
    expect(formatSrtTime(3665.123)).toBe('01:01:05,123');
    expect(formatSrtTime(1.5)).toBe('00:00:01,500');
  });

  it('formats VTT timestamp correctly (hh:mm:ss.ms)', () => {
    expect(formatVttTime(1.5)).toBe('00:00:01.500');
  });

  it('generates standard SRT content', () => {
    const srt = generateSrt(sampleSegments);
    expect(srt).toContain('1\n00:00:01,500 --> 00:00:04,200\nChào mừng các bạn');
    expect(srt).toContain('2\n00:00:04,500 --> 00:00:08,000\nĐến với MinhTTS Studio');
  });

  it('generates standard VTT content', () => {
    const vtt = generateVtt(sampleSegments);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    expect(vtt).toContain('00:00:01.500 --> 00:00:04.200\nChào mừng các bạn');
  });

  it('parses SRT text back into structured SubtitleSegments', () => {
    const srtText = `1
00:00:02,000 --> 00:00:05,000
Dòng phụ đề 1

2
00:00:05,500 --> 00:00:09,250
Dòng phụ đề 2`;

    const parsed = parseSrt(srtText);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].start).toBe(2.0);
    expect(parsed[0].end).toBe(5.0);
    expect(parsed[0].text).toBe('Dòng phụ đề 1');
    expect(parsed[1].start).toBe(5.5);
    expect(parsed[1].end).toBe(9.25);
  });

  it('finds active segment at given timestamp with sync lead-in', () => {
    expect(findActiveSegment(sampleSegments, 2.0)?.id).toBe(1);
    expect(findActiveSegment(sampleSegments, 5.0)?.id).toBe(2);
    expect(findActiveSegment(sampleSegments, 10.0)).toBeNull();
  });

  it('finds active word index in segment at given timestamp with sync lead-in', () => {
    const words = sampleSegments[0].words;
    expect(findActiveWordIndex(words, 1.8)).toBe(0); // 'Chào'
    expect(findActiveWordIndex(words, 2.2)).toBe(1); // 'mừng'
    expect(findActiveWordIndex(words, 3.5)).toBe(3); // 'bạn'
    expect(findActiveWordIndex(words, 5.0)).toBe(-1);
  });

  it('auto formats long segments into compact TikTok chunks', () => {
    const longSegment: SubtitleSegment = {
      id: 1,
      start: 0.0,
      end: 6.0,
      text: 'Một hai ba bốn năm sáu bảy tám chín mười mười_một mười_hai',
      words: [
        { word: 'Một', start: 0.0, end: 0.5 },
        { word: 'hai', start: 0.5, end: 1.0 },
        { word: 'ba', start: 1.0, end: 1.5 },
        { word: 'bốn', start: 1.5, end: 2.0 },
        { word: 'năm', start: 2.0, end: 2.5 },
        { word: 'sáu', start: 2.5, end: 3.0 },
        { word: 'bảy', start: 3.0, end: 3.5 },
        { word: 'tám', start: 3.5, end: 4.0 },
        { word: 'chín', start: 4.0, end: 4.5 },
        { word: 'mười', start: 4.5, end: 5.0 },
        { word: 'mười_một', start: 5.0, end: 5.5 },
        { word: 'mười_hai', start: 5.5, end: 6.0 },
      ],
    };

    const chunks = autoFormatSubtitleSegments([longSegment], 4, 25);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].words?.length).toBeLessThanOrEqual(4);
    expect(chunks[0].start).toBe(0.0);
  });

  it('calculates auto layout by aspect ratio', () => {
    const portraitLayout = calculateAutoSubtitleLayout(1080, 1920);
    expect(portraitLayout.positionY).toBe(72);
    expect(portraitLayout.maxWidthPercent).toBe(88);

    const landscapeLayout = calculateAutoSubtitleLayout(1920, 1080);
    expect(landscapeLayout.positionY).toBe(84);
    expect(landscapeLayout.maxWidthPercent).toBe(76);
  });
});
