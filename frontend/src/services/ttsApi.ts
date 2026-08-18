import type { VoiceInfo, ModelInfo, TtsRequest, TtsResponseResult, TtsUsage } from '../types/tts';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchModels(): Promise<ModelInfo[]> {
  const response = await fetch(`${API_BASE}/api/models`);
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }
  const data = await response.json();
  return data.models as ModelInfo[];
}

export async function fetchVoices(): Promise<VoiceInfo[]> {
  const response = await fetch(`${API_BASE}/api/voices`);
  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`);
  }
  const data = await response.json();
  return data.voices as VoiceInfo[];
}

export async function generateSpeech(request: TtsRequest): Promise<TtsResponseResult> {
  const response = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.detail || errorData?.error || errorData?.title || `TTS request failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  const promptTokens = parseInt(response.headers.get('X-Usage-Prompt-Tokens') || '0', 10);
  const candidatesTokens = parseInt(response.headers.get('X-Usage-Candidates-Tokens') || '0', 10);
  const totalTokens = parseInt(response.headers.get('X-Usage-Total-Tokens') || '0', 10);

  const usage: TtsUsage = {
    promptTokens,
    candidatesTokens,
    totalTokens: totalTokens || (promptTokens + candidatesTokens),
  };

  const blob = await response.blob();
  return { blob, usage };
}
