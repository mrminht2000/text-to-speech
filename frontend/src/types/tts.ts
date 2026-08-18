export interface VoiceInfo {
  id: string;
  name: string;
  style: string;
  label: string;
  isDefault: boolean;
}

export interface TtsRequest {
  text: string;
  voice: string;
  speed: number;
}

export interface TtsState {
  isLoading: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  error: string | null;
}
