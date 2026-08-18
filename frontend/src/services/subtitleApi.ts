import { SubtitleSegment, TranscribeResponse } from '../types/subtitles';

function getApiBase(overrideUrl?: string): string {
  const base = overrideUrl?.trim() || (import.meta.env.VITE_API_URL as string | undefined) || '';
  return base.replace(/\/+$/, '');
}

export interface TranscribeMediaOptions {
  audioBase64?: string;
  file?: File | Blob;
  provider?: 'local-whisper' | 'gemini' | 'openai' | string;
  model?: string;
  language?: string;
  wordTimestamps?: boolean;
  initialPrompt?: string;
  apiKey?: string;
}

export async function transcribeMedia(
  options: TranscribeMediaOptions,
  apiUrl?: string
): Promise<TranscribeResponse> {
  const base = getApiBase(apiUrl);
  const token = localStorage.getItem('minhtts_jwt_token');

  // If audioBase64 is provided or converted
  let base64Data = options.audioBase64;
  if (!base64Data && options.file) {
    base64Data = await fileToBase64(options.file);
  }

  const payload = {
    audioBase64: base64Data,
    provider: options.provider || 'local-whisper',
    model: options.model,
    language: options.language || 'vi',
    wordTimestamps: options.wordTimestamps ?? true,
    initialPrompt: options.initialPrompt,
    apiKey: options.apiKey,
  };

  const response = await fetch(`${base}/api/subtitles/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg =
      errorData?.detail ||
      errorData?.error ||
      errorData?.title ||
      `Lỗi khi nhận diện phụ đề: HTTP ${response.status}`;
    throw new Error(msg);
  }

  return (await response.json()) as TranscribeResponse;
}

export async function exportSrtApi(segments: SubtitleSegment[], apiUrl?: string): Promise<string> {
  const base = getApiBase(apiUrl);
  const response = await fetch(`${base}/api/subtitles/export-srt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segments, format: 'srt' }),
  });
  if (!response.ok) throw new Error('Không thể xuất file SRT.');
  return await response.text();
}

export async function exportVttApi(segments: SubtitleSegment[], apiUrl?: string): Promise<string> {
  const base = getApiBase(apiUrl);
  const response = await fetch(`${base}/api/subtitles/export-vtt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segments, format: 'vtt' }),
  });
  if (!response.ok) throw new Error('Không thể xuất file VTT.');
  return await response.text();
}

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
