import { SubtitlePreset, SubtitleSegment, SubtitleStyle, SubtitleWord } from '../types/subtitles';

export interface FontOption {
  name: string;
  family: string;
  category: string;
  badge?: string;
  previewText?: string;
}

export const VIETNAMESE_FONTS: FontOption[] = [
  // 1. 🔥 TikTok / Shorts / CapCut Viral Fonts
  { name: 'Montserrat Black', family: "'Montserrat', sans-serif", category: '🔥 TikTok Viral', badge: 'Hot', previewText: 'VIRAL TIKTOK' },
  { name: 'Anton Impact', family: "'Anton', sans-serif", category: '🔥 TikTok Viral', badge: 'Popular', previewText: 'ANTON BOLD' },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", category: '🔥 TikTok Viral', previewText: 'BEBAS NEUE' },
  { name: 'Oswald Heavy', family: "'Oswald', sans-serif", category: '🔥 TikTok Viral', previewText: 'OSWALD HEADLINE' },
  { name: 'Teko Condensed', family: "'Teko', sans-serif", category: '🔥 TikTok Viral', previewText: 'TEKO CONDENSED' },

  // 2. 🎨 Display & Cách Điệu Độc Đáo
  { name: 'Righteous Cyber', family: "'Righteous', cursive", category: '🎨 Cách Điệu', badge: 'Unique', previewText: 'Righteous Cyber' },
  { name: 'Russo One 3D Block', family: "'Russo One', sans-serif", category: '🎨 Cách Điệu', previewText: 'RUSSO ONE' },
  { name: 'Alfa Slab One Heavy', family: "'Alfa Slab One', serif", category: '🎨 Cách Điệu', previewText: 'ALFA SLAB' },
  { name: 'Syne Dynamic', family: "'Syne', sans-serif", category: '🎨 Cách Điệu', previewText: 'Syne Dynamic' },
  { name: 'Audiowide Sci-Fi', family: "'Audiowide', cursive", category: '🎨 Cách Điệu', previewText: 'AUDIOWIDE' },

  // 3. 🍿 Comic & Meme Hoạt Hình
  { name: 'Fredoka Bubble', family: "'Fredoka', sans-serif", category: '🍿 Comic & Meme', badge: 'Fun', previewText: 'Fredoka Bubble' },
  { name: 'Titan One 3D', family: "'Titan One', cursive", category: '🍿 Comic & Meme', previewText: 'TITAN ONE' },
  { name: 'Baloo 2 Chữ Tròn', family: "'Baloo 2', cursive", category: '🍿 Comic & Meme', previewText: 'Baloo 2 Tròn' },
  { name: 'Coiny Pop Art', family: "'Coiny', cursive", category: '🍿 Comic & Meme', previewText: 'Coiny Pop Art' },
  { name: 'Comfortaa Rounded', family: "'Comfortaa', cursive", category: '🍿 Comic & Meme', previewText: 'Comfortaa Soft' },

  // 4. ⚡ Cyberpunk & Công Nghệ
  { name: 'Orbitron Neon', family: "'Orbitron', sans-serif", category: '⚡ Cyberpunk', previewText: 'ORBITRON TECH' },

  // 5. 🎬 Điện Ảnh & Thanh Lịch (Cinematic)
  { name: 'Be Vietnam Pro', family: "'Be Vietnam Pro', sans-serif", category: '🎬 Điện Ảnh', badge: 'Standard', previewText: 'Be Vietnam Pro' },
  { name: 'Cinzel Imperial', family: "'Cinzel', serif", category: '🎬 Điện Ảnh', previewText: 'CINZEL IMPERIAL' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: '🎬 Điện Ảnh', previewText: 'Playfair Display' },
  { name: 'Inter Clean UI', family: "'Inter', sans-serif", category: '🎬 Điện Ảnh', previewText: 'Inter Clean UI' },
  { name: 'Roboto Classic', family: "'Roboto', sans-serif", category: '🎬 Điện Ảnh', previewText: 'Roboto Classic' },
  { name: 'Nunito Soft', family: "'Nunito', sans-serif", category: '🎬 Điện Ảnh', previewText: 'Nunito Soft' },

  // 6. ✍️ Chữ Viết Tay & Vlogger (Handwriting)
  { name: 'Caveat Ký Tên', family: "'Caveat', cursive", category: '✍️ Viết Tay', badge: 'Signature', previewText: 'Caveat Hand' },
  { name: 'Dancing Script Nghệ Thuật', family: "'Dancing Script', cursive", category: '✍️ Viết Tay', previewText: 'Dancing Script' },
];

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 32,
  textColor: '#FFFFFF',
  fontWeight: '900',
  fontStyle: 'normal',
  textTransform: 'uppercase',
  strokeColor: '#000000',
  strokeWidth: 3.5,
  shadowColor: 'rgba(0, 0, 0, 0.9)',
  shadowBlur: 4,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  boxColor: '#000000',
  boxOpacity: 0,
  borderRadius: 0,
  paddingX: 12,
  paddingY: 6,
  positionX: 50, // center (50%)
  positionY: 80, // near bottom (80%)
  maxWidthPercent: 88,
  textAlign: 'center',
  animationType: 'karaoke-pop',
  activeWordColor: '#FFE600', // Electric Bright Yellow
  activeWordBg: 'transparent',
  activeWordScale: 1.22,
  rotation: 0,
  audioSyncOffset: -0.12, // 120ms acoustic lookahead sync
};

export const SUBTITLE_PRESETS: SubtitlePreset[] = [
  {
    id: 'tiktok_hormozi',
    name: 'TikTok Hormozi Viral',
    description: 'Chữ in hoa viền đen siêu nét, từ đang nói NẢY TO (Pop) màu vàng chanh rực rỡ',
    icon: '⚡',
    recommendedFonts: [
      "'Montserrat', sans-serif",
      "'Anton', sans-serif",
      "'Bebas Neue', sans-serif",
      "'Oswald', sans-serif",
      "'Teko', sans-serif",
    ],
    style: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 34,
      textColor: '#FFFFFF',
      fontWeight: '900',
      textTransform: 'uppercase',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: '#000000',
      shadowBlur: 2,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      boxColor: '#000000',
      boxOpacity: 0,
      animationType: 'karaoke-pop',
      activeWordColor: '#FFE600',
      activeWordBg: 'transparent',
      activeWordScale: 1.25,
      positionY: 78,
      rotation: 0,
      audioSyncOffset: -0.12,
    },
  },
  {
    id: 'capcut_neon_pulse',
    name: 'CapCut Neon Glow',
    description: 'Phong cách Cyberpunk Cyan nổi bật với từ đang nói phát sáng rực rỡ sắc Hồng Neon',
    icon: '🔮',
    recommendedFonts: [
      "'Righteous', cursive",
      "'Russo One', sans-serif",
      "'Audiowide', cursive",
      "'Syne', sans-serif",
      "'Orbitron', sans-serif",
      "'Alfa Slab One', serif",
    ],
    style: {
      fontFamily: "'Righteous', cursive",
      fontSize: 32,
      textColor: '#00F0FF',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      strokeColor: '#050D1A',
      strokeWidth: 3,
      shadowColor: '#00F0FF',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      boxColor: '#000000',
      boxOpacity: 0,
      animationType: 'karaoke-glow',
      activeWordColor: '#FF0055',
      activeWordBg: 'transparent',
      activeWordScale: 1.2,
      positionY: 80,
      rotation: 0,
      audioSyncOffset: -0.12,
    },
  },
  {
    id: 'mrbeast_comic_boom',
    name: 'MrBeast Comic Pop',
    description: 'Font chữ hoạt hình 3D dày dặn, từ đang nói đổi màu Xanh Lá Cực Quang bật lên',
    icon: '💥',
    recommendedFonts: [
      "'Fredoka', sans-serif",
      "'Titan One', cursive",
      "'Baloo 2', cursive",
      "'Coiny', cursive",
      "'Comfortaa', cursive",
    ],
    style: {
      fontFamily: "'Fredoka', sans-serif",
      fontSize: 34,
      textColor: '#FFFFFF',
      fontWeight: '900',
      textTransform: 'none',
      strokeColor: '#111111',
      strokeWidth: 4.5,
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      boxColor: '#000000',
      boxOpacity: 0,
      animationType: 'karaoke-bounce',
      activeWordColor: '#00FF66',
      activeWordBg: 'transparent',
      activeWordScale: 1.25,
      positionY: 78,
      rotation: -2,
      audioSyncOffset: -0.14,
    },
  },
  {
    id: 'capcut_pill_capsule',
    name: 'CapCut Pill Capsule',
    description: 'Từ đang nói xuất hiện viên nhộng gradient tím hồng sang trọng phong cách CapCut',
    icon: '💊',
    recommendedFonts: [
      "'Be Vietnam Pro', sans-serif",
      "'Inter', sans-serif",
      "'Roboto', sans-serif",
      "'Nunito', sans-serif",
      "'Montserrat', sans-serif",
    ],
    style: {
      fontFamily: "'Be Vietnam Pro', sans-serif",
      fontSize: 28,
      textColor: '#FFFFFF',
      fontWeight: '700',
      textTransform: 'none',
      strokeColor: '#000000',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 4,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      boxColor: '#000000',
      boxOpacity: 0,
      animationType: 'karaoke-pill',
      activeWordColor: '#FFFFFF',
      activeWordBg: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
      activeWordScale: 1.1,
      positionY: 82,
      rotation: 0,
      audioSyncOffset: -0.12,
    },
  },
  {
    id: 'netflix_cinematic',
    name: 'Netflix Cinematic',
    description: 'Phụ đề điện ảnh chuẩn quốc tế, tinh tế, sang trọng và không gây mỏi mắt',
    icon: '🎬',
    recommendedFonts: [
      "'Be Vietnam Pro', sans-serif",
      "'Cinzel', serif",
      "'Playfair Display', serif",
      "'Inter', sans-serif",
      "'Roboto', sans-serif",
      "'Nunito', sans-serif",
    ],
    style: {
      fontFamily: "'Be Vietnam Pro', sans-serif",
      fontSize: 25,
      textColor: '#FFFFFF',
      fontWeight: '600',
      textTransform: 'none',
      strokeColor: '#000000',
      strokeWidth: 1.5,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 3,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      boxColor: '#000000',
      boxOpacity: 0.35,
      borderRadius: 6,
      paddingX: 14,
      paddingY: 6,
      animationType: 'none',
      activeWordColor: '#FFFFFF',
      activeWordBg: 'transparent',
      positionY: 86,
      rotation: 0,
      audioSyncOffset: 0,
    },
  },
  {
    id: 'vlog_handwritten',
    name: 'Vlog Chữ Viết Tay',
    description: 'Chữ viết tay nghệ thuật phóng khoáng, ấm áp cho video du lịch, ẩm thực, tâm sự',
    icon: '✍️',
    recommendedFonts: [
      "'Caveat', cursive",
      "'Dancing Script', cursive",
      "'Comfortaa', cursive",
    ],
    style: {
      fontFamily: "'Caveat', cursive",
      fontSize: 38,
      textColor: '#FFFBEB',
      fontWeight: '700',
      textTransform: 'none',
      strokeColor: '#2D1B00',
      strokeWidth: 2,
      shadowColor: '#FB923C',
      shadowBlur: 6,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      boxColor: '#000000',
      boxOpacity: 0,
      animationType: 'karaoke-pop',
      activeWordColor: '#F97316',
      activeWordBg: 'transparent',
      activeWordScale: 1.2,
      positionY: 80,
      rotation: -1,
      audioSyncOffset: -0.12,
    },
  },
];

/**
 * Automatically calculate optimal subtitle size, position, and width bounds
 * based on video aspect ratio (e.g. 9:16 TikTok Portrait vs 16:9 Landscape vs 1:1 Square)
 */
export function calculateAutoSubtitleLayout(videoWidth: number, videoHeight: number): Partial<SubtitleStyle> {
  if (!videoWidth || !videoHeight) return {};

  const aspectRatio = videoWidth / videoHeight;

  // 1. Portrait 9:16 (TikTok, Reels, Shorts) — aspect ratio < 0.8
  if (aspectRatio < 0.8) {
    return {
      positionX: 50,
      positionY: 72,       // Safe area above TikTok lower comment/caption bar
      maxWidthPercent: 88, // Wide enough for punchy 3-5 word lines
      fontSize: 32,
    };
  }

  // 2. Landscape 16:9 (YouTube, TV, Facebook) — aspect ratio > 1.4
  if (aspectRatio > 1.4) {
    return {
      positionX: 50,
      positionY: 84,       // Standard bottom cinema area
      maxWidthPercent: 76, // Elegant width centered
      fontSize: 26,
    };
  }

  // 3. Square / Feed (1:1, 4:5 Instagram)
  return {
    positionX: 50,
    positionY: 78,
    maxWidthPercent: 84,
    fontSize: 28,
  };
}

/**
 * Smart TikTok / Shorts Phrase Splitter:
 * Automatically breaks long walls of text (10-30 words) into compact,
 * punchy, bite-sized phrases (max 4-6 words per chunk) while preserving exact word timings.
 */
export function autoFormatSubtitleSegments(
  segments: SubtitleSegment[],
  maxWordsPerChunk = 5,
  maxCharsPerChunk = 28
): SubtitleSegment[] {
  if (!segments || segments.length === 0) return [];

  const formattedSegments: SubtitleSegment[] = [];

  for (const seg of segments) {
    // 1. If segment has word timestamps, chunk by words
    if (seg.words && seg.words.length > maxWordsPerChunk) {
      const words = seg.words;
      let chunkWords: SubtitleWord[] = [];
      let currentWordCount = 0;
      let currentCharCount = 0;

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        chunkWords.push(w);
        currentWordCount++;
        currentCharCount += w.word.length + 1;

        const isPunctuationEnd = /[.,?!;:]$/.test(w.word.trim());
        const isMaxWordsReached = currentWordCount >= maxWordsPerChunk;
        const isMaxCharsReached = currentCharCount >= maxCharsPerChunk;
        const isLastWord = i === words.length - 1;

        if (isLastWord || isPunctuationEnd || isMaxWordsReached || isMaxCharsReached) {
          const chunkStart = chunkWords[0].start;
          const chunkEnd = chunkWords[chunkWords.length - 1].end;
          const chunkText = chunkWords.map((cw) => cw.word).join(' ');

          formattedSegments.push({
            id: formattedSegments.length + 1,
            start: chunkStart,
            end: isLastWord ? seg.end : chunkEnd + 0.15,
            text: chunkText,
            words: [...chunkWords],
          });

          chunkWords = [];
          currentWordCount = 0;
          currentCharCount = 0;
        }
      }
    } else if (!seg.words && seg.text.length > maxCharsPerChunk) {
      // 2. Fallback text split if no word timestamps
      const words = seg.text.split(/\s+/);
      if (words.length <= maxWordsPerChunk) {
        formattedSegments.push({ ...seg, id: formattedSegments.length + 1 });
        continue;
      }

      const totalDuration = seg.end - seg.start;
      const chunks: string[] = [];
      let cur: string[] = [];

      for (const w of words) {
        cur.push(w);
        if (cur.length >= maxWordsPerChunk || /[.,?!;:]$/.test(w)) {
          chunks.push(cur.join(' '));
          cur = [];
        }
      }
      if (cur.length > 0) chunks.push(cur.join(' '));

      const durationPerChunk = totalDuration / chunks.length;
      chunks.forEach((chunkText, idx) => {
        formattedSegments.push({
          id: formattedSegments.length + 1,
          start: Number((seg.start + idx * durationPerChunk).toFixed(2)),
          end: Number((seg.start + (idx + 1) * durationPerChunk).toFixed(2)),
          text: chunkText,
        });
      });
    } else {
      formattedSegments.push({ ...seg, id: formattedSegments.length + 1 });
    }
  }

  return formattedSegments;
}

/**
 * Generate buttery-smooth Anti-Aliased Subpixel Text Shadows.
 */
export function generateSubtitleShadows(style: SubtitleStyle): string {
  const shadows: string[] = [];
  const sw = style.strokeWidth;
  const sc = style.strokeColor;

  if (sw > 0 && sc && sc !== 'transparent') {
    const numPoints = sw >= 3 ? 16 : 12;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const x = (Math.cos(angle) * sw).toFixed(2);
      const y = (Math.sin(angle) * sw).toFixed(2);
      shadows.push(`${x}px ${y}px 0.5px ${sc}`);
    }
    shadows.push(`0 0 ${sw.toFixed(1)}px ${sc}`);
  }

  if (style.shadowBlur > 0 && style.shadowColor && style.shadowColor !== 'transparent') {
    shadows.push(
      `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}`
    );
  }

  return shadows.length > 0 ? shadows.join(', ') : 'none';
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  const formattedMins = mins.toString().padStart(2, '0');
  const formattedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
  return `${formattedMins}:${formattedSecs}`;
}

export function formatSrtTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00,000';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function formatVttTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00.000';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function generateSrt(segments: SubtitleSegment[]): string {
  return segments
    .map((seg, index) => {
      const idx = index + 1;
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end);
      return `${idx}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join('\n');
}

export function generateVtt(segments: SubtitleSegment[]): string {
  let vtt = 'WEBVTT\n\n';
  segments.forEach((seg, index) => {
    const idx = index + 1;
    const start = formatVttTime(seg.start);
    const end = formatVttTime(seg.end);
    vtt += `${idx}\n${start} --> ${end}\n${seg.text}\n\n`;
  });
  return vtt;
}

export function parseSrt(srtContent: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIdx = 1;
    if (lines[0].includes('-->')) {
      timeLineIdx = 0;
    }

    const timeLine = lines[timeLineIdx];
    const match = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
    if (!match) continue;

    const startSec = parseTimeToSeconds(match[1]);
    const endSec = parseTimeToSeconds(match[2]);
    const textLines = lines.slice(timeLineIdx + 1).join(' ').trim();

    if (textLines) {
      segments.push({
        id: segments.length + 1,
        start: startSec,
        end: endSec,
        text: textLines,
      });
    }
  }

  return segments;
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.replace(',', '.').split(':');
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  }
  return 0;
}

/**
 * High-precision active segment locator with acoustic sync lookahead.
 */
export function findActiveSegment(
  segments: SubtitleSegment[],
  currentTime: number,
  syncOffset = -0.12
): SubtitleSegment | null {
  if (!segments || segments.length === 0) return null;

  // Apply lookahead sync (e.g. -0.12s -> looks 120ms ahead)
  const adjustedTime = Math.max(currentTime - (syncOffset || 0), 0);

  // 1. Check segments with word-level timestamps first
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.words && seg.words.length > 0) {
      const firstStart = seg.words[0].start;
      const lastEnd = seg.words[seg.words.length - 1].end;
      if (adjustedTime >= firstStart - 0.1 && adjustedTime <= lastEnd + 0.22) {
        return seg;
      }
    }
  }

  // 2. Fallback to segment start/end if words are empty
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (adjustedTime >= seg.start - 0.05 && adjustedTime <= seg.end) {
      return seg;
    }
  }

  return null;
}

/**
 * Ultra-responsive active word locator with instant acoustic synchronization.
 */
export function findActiveWordIndex(
  words: SubtitleWord[] | undefined,
  currentTime: number,
  syncOffset = -0.12
): number {
  if (!words || words.length === 0) return -1;

  // Lookahead sync compensation (e.g. -0.12s)
  const adjustedTime = Math.max(currentTime - (syncOffset || 0), 0);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (adjustedTime >= w.start - 0.05 && adjustedTime <= w.end + 0.05) {
      return i;
    }
  }

  // If between words in active sentence, smoothly bridge to active word
  for (let i = 0; i < words.length - 1; i++) {
    if (adjustedTime >= words[i].end && adjustedTime < words[i + 1].start) {
      return i;
    }
  }

  return -1;
}
