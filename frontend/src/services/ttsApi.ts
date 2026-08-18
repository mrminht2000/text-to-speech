import type { VoiceInfo, ModelInfo, TtsRequest, TtsResponseResult, TtsUsage } from '../types/tts';

function getApiBase(overrideUrl?: string): string {
  const base = overrideUrl?.trim() || (import.meta.env.VITE_API_URL as string | undefined) || '';
  return base.replace(/\/+$/, '');
}

export async function fetchModels(apiUrl?: string): Promise<ModelInfo[]> {
  const base = getApiBase(apiUrl);
  const response = await fetch(`${base}/api/models`);
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }
  const data = await response.json();
  return data.models as ModelInfo[];
}

export async function fetchVoices(apiUrl?: string): Promise<VoiceInfo[]> {
  const base = getApiBase(apiUrl);
  const response = await fetch(`${base}/api/voices`);
  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`);
  }
  const data = await response.json();
  return data.voices as VoiceInfo[];
}

export async function generateSpeech(request: TtsRequest, apiUrl?: string): Promise<TtsResponseResult> {
  const base = getApiBase(apiUrl);
  const response = await fetch(`${base}/api/tts`, {
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
