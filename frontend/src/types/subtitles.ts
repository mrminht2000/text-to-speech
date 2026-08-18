export interface SubtitleWord {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
  probability?: number;
}

export interface SubtitleSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  words?: SubtitleWord[];
}

export type SubtitleAnimationType =
  | 'none'
  | 'karaoke-pop'
  | 'karaoke-glow'
  | 'karaoke-pill'
  | 'karaoke-bounce'
  | 'karaoke-word';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;        // in px
  textColor: string;       // hex or rgba
  fontWeight: string;      // 'normal' | '600' | 'bold' | '900'
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase' | 'capitalize';
  strokeColor: string;
  strokeWidth: number;     // in px (0 for none)
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  boxColor: string;
  boxOpacity: number;      // 0 to 1
  borderRadius: number;    // in px
  paddingX: number;
  paddingY: number;
  positionX: number;       // percent 0 - 100
  positionY: number;       // percent 0 - 100
  maxWidthPercent: number; // percent 30 - 100
  textAlign: 'left' | 'center' | 'right';
  animationType: SubtitleAnimationType;
  activeWordColor: string;
  activeWordBg: string;
  activeWordScale?: number;
  rotation?: number;       // degrees -180 to 180 (default 0)
  audioSyncOffset?: number; // audio-visual lead-in sync in seconds (e.g. -0.12s)
}

export interface SubtitlePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommendedFonts?: string[];
  style: Partial<SubtitleStyle>;
}

export interface TranscribeResponse {
  text: string;
  language: string;
  duration: number;
  provider: string;
  segments: SubtitleSegment[];
}
