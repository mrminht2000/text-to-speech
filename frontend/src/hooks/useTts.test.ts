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
  { id: 'Charon', name: 'Charon', style: 'Firm', label: 'Adam-like ★', provider: 'Google Gemini', isDefault: true },
  { id: 'Kore', name: 'Kore', style: 'Firm', label: 'Kore', provider: 'Google Gemini', isDefault: false },
  { id: 'north_female', name: 'Nữ miền Bắc', style: 'Natural', label: 'Trúc Ly', provider: 'Local Model', isDefault: false },
  { id: 'voice_clone_custom', name: 'Custom Voice', style: 'Clone', label: 'Clone', provider: 'Local Model', isDefault: false },
];

const mockModels = [
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash', provider: 'Google Gemini', description: 'Lowest cost', isDefault: true, isAvailable: true },
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash', provider: 'Google Gemini', description: 'Expressive audio', isDefault: false, isAvailable: true },
  { id: 'vieneu-tts', name: 'VieNeu-TTS', provider: 'Local Model', description: 'Local 3-region', isDefault: false, isAvailable: true },
  { id: 'f5-tts-vietnamese', name: 'F5-TTS', provider: 'Local Model', description: 'Voice clone', isDefault: false, isAvailable: true },
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

  it('filters voices for Google Gemini model by default', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });
    // Default model is Gemini 2.5 Flash -> only Gemini voices
    expect(result.current.voices).toEqual([mockVoices[0], mockVoices[1]]);
    expect(result.current.selectedVoice).toBe('Charon');
  });

  it('filters voices for VieNeu Local Model when switched', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setSelectedModel('vieneu-tts');
    });

    // Only VieNeu local voices (excluding voice_clone_custom)
    expect(result.current.voices).toEqual([mockVoices[2]]);
    expect(result.current.selectedVoice).toBe('north_female');
  });

  it('auto selects voice_clone_custom when F5-TTS is selected', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setSelectedModel('f5-tts-vietnamese');
    });

    expect(result.current.voices).toEqual([mockVoices[3]]);
    expect(result.current.selectedVoice).toBe('voice_clone_custom');
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

  it('handles custom API key correctly', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      result.current.setCustomApiKey('AIzaSyTest');
    });
    expect(result.current.customApiKey).toBe('AIzaSyTest');
  });
});
