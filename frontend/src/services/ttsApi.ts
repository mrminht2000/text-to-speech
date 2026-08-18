import type { VoiceInfo, TtsRequest } from '../types/tts';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5268';

export async function fetchVoices(): Promise<VoiceInfo[]> {
  const response = await fetch(`${API_BASE}/api/voices`);
  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`);
  }
  const data = await response.json();
  return data.voices as VoiceInfo[];
}

export async function generateSpeech(request: TtsRequest): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error ?? `TTS request failed: ${response.status}`);
  }

  return response.blob();
}
