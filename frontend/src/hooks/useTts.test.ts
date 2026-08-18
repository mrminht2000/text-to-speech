import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTts } from './useTts';
import * as api from '../services/ttsApi';

vi.mock('../services/ttsApi', () => ({
  fetchVoices: vi.fn(),
  fetchModels: vi.fn(),
  generateSpeech: vi.fn(),
}));

const mockVoices = [
  { id: 'Charon', name: 'Charon', style: 'Firm', label: 'Adam-like ★', isDefault: true },
  { id: 'Kore', name: 'Kore', style: 'Firm', label: 'Kore', isDefault: false },
];

const mockModels = [
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash', provider: 'Google Gemini', description: 'Lowest cost', isDefault: true, isAvailable: true },
];

describe('useTts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchVoices).mockResolvedValue(mockVoices);
    vi.mocked(api.fetchModels).mockResolvedValue(mockModels);
  });

  it('starts with empty state — no loading, no audio, no error', async () => {
    const { result } = renderHook(() => useTts());
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.audioUrl).toBeNull();
    expect(result.current.state.error).toBeNull();
  });

  it('loads voices and models on mount', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.voices).toEqual(mockVoices);
    expect(result.current.models).toEqual(mockModels);
    expect(result.current.selectedVoice).toBe('Charon');
  });

  it('sets error on empty text generate', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.generate('');
    });
    expect(result.current.state.error).toBe('Vui lòng nhập văn bản cần đọc.');
  });

  it('sets error when text exceeds 5000 chars', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });
    const longText = 'a'.repeat(5001);
    await act(async () => {
      await result.current.generate(longText);
    });
    expect(result.current.state.error).toBe('Văn bản vượt quá giới hạn 5.000 ký tự.');
  });

  it('generates speech successfully and creates object URL', async () => {
    const fakeBlob = new Blob(['audio'], { type: 'audio/mpeg' });
    const fakeUsage = { promptTokens: 10, candidatesTokens: 50, totalTokens: 60 };
    vi.mocked(api.generateSpeech).mockResolvedValue({ blob: fakeBlob, usage: fakeUsage });

    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.generate('Xin chào');
    });

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.audioBlob).toBe(fakeBlob);
    expect(result.current.state.usage).toEqual(fakeUsage);
  });

  it('handles custom API key and custom API URL', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      result.current.setCustomApiKey('AIzaSyTest');
      result.current.setCustomApiUrl('https://test.trycloudflare.com');
    });
    expect(result.current.customApiKey).toBe('AIzaSyTest');
    expect(result.current.customApiUrl).toBe('https://test.trycloudflare.com');
  });
});
