export interface VoiceInfo {
  id: string;
  name: string;
  style: string;
  label: string;
  isDefault: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface TtsUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface TtsRequest {
  text: string;
  voice: string;
  speed: number;
  model?: string;
}

export interface TtsResponseResult {
  blob: Blob;
  usage: TtsUsage;
}

export interface TtsState {
  isLoading: boolean;
  progress: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  usage: TtsUsage | null;
  error: string | null;
}
