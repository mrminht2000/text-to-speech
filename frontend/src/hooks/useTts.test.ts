import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTts } from './useTts';
import * as ttsApi from '../services/ttsApi';

// Mock the API module
vi.mock('../services/ttsApi');

const mockVoices = [
  { id: 'Charon', name: 'Charon', style: 'Firm', label: 'Adam-like (Mặc định) ★', isDefault: true },
  { id: 'Kore', name: 'Kore', style: 'Firm', label: 'Kore — Dứt khoát', isDefault: false },
];

const mockModels = [
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS', provider: 'Google Gemini', description: 'TTS Model', isDefault: true, isAvailable: true }
];

describe('useTts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
    vi.mocked(ttsApi.fetchModels).mockResolvedValue(mockModels);
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts with empty state — no loading, no audio, no error', () => {
    const { result } = renderHook(() => useTts());

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.audioUrl).toBeNull();
    expect(result.current.state.error).toBeNull();
  });

  // ── fetchVoices & fetchModels ──────────────────────────────────────────────

  it('loads voices and models on mount', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {});

    expect(result.current.voices).toHaveLength(2);
    expect(result.current.voices[0].id).toBe('Charon');
    expect(result.current.models).toHaveLength(1);
    expect(result.current.selectedModel).toBe('gemini-3.1-flash-tts-preview');
  });

  it('sets default voice to Charon after loading', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {});

    expect(result.current.selectedVoice).toBe('Charon');
  });

  it('sets error when fetchVoices fails', async () => {
    vi.mocked(ttsApi.fetchVoices).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useTts());
    await act(async () => {});

    expect(result.current.state.error).toContain('Không thể kết nối');
  });

  // ── generate ───────────────────────────────────────────────────────────────

  it('sets isLoading true while generating', async () => {
    vi.mocked(ttsApi.generateSpeech).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const { result } = renderHook(() => useTts());
    await act(async () => {});

    act(() => {
      result.current.generate('Xin chào');
    });

    expect(result.current.state.isLoading).toBe(true);
  });

  it('sets audioUrl and usage on successful generate', async () => {
    const mockBlob = new Blob([new Uint8Array([0xFF, 0xFB])], { type: 'audio/mpeg' });
    const mockUsage = { promptTokens: 5, candidatesTokens: 40, totalTokens: 45 };
    vi.mocked(ttsApi.generateSpeech).mockResolvedValue({ blob: mockBlob, usage: mockUsage });

    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    const { result } = renderHook(() => useTts());
    await act(async () => {});

    await act(async () => {
      await result.current.generate('Xin chào');
    });

    expect(result.current.state.audioUrl).toBe('blob:mock-url');
    expect(result.current.state.usage).toEqual(mockUsage);
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('sets error on failed generate', async () => {
    vi.mocked(ttsApi.generateSpeech).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useTts());
    await act(async () => {});

    await act(async () => {
      await result.current.generate('Xin chào');
    });

    expect(result.current.state.error).toBe('API error');
    expect(result.current.state.isLoading).toBe(false);
  });

  it('rejects generate when text is empty', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {});

    await act(async () => {
      await result.current.generate('');
    });

    expect(result.current.state.error).toContain('Vui lòng nhập');
    expect(ttsApi.generateSpeech).not.toHaveBeenCalled();
  });

  it('rejects generate when text exceeds 5000 chars', async () => {
    const { result } = renderHook(() => useTts());
    await act(async () => {});

    await act(async () => {
      await result.current.generate('x'.repeat(5001));
    });

    expect(result.current.state.error).toContain('5.000');
    expect(ttsApi.generateSpeech).not.toHaveBeenCalled();
  });

  // ── download ──────────────────────────────────────────────────────────────

  it('calls download with correct filename when audio exists', async () => {
    const mockBlob = new Blob([new Uint8Array([0xFF, 0xFB])], { type: 'audio/mpeg' });
    vi.mocked(ttsApi.generateSpeech).mockResolvedValue({
      blob: mockBlob,
      usage: { promptTokens: 5, candidatesTokens: 40, totalTokens: 45 }
    });
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    // Track anchor attributes set during download
    const clickedAnchors: { download: string; href: string }[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        el.click = () => {
          clickedAnchors.push({ download: (el as HTMLAnchorElement).download, href: (el as HTMLAnchorElement).href });
        };
      }
      return el;
    });

    const { result } = renderHook(() => useTts());
    await act(async () => {});
    await act(async () => { await result.current.generate('Xin chào'); });

    act(() => { result.current.download(); });

    expect(clickedAnchors).toHaveLength(1);
    expect(clickedAnchors[0].download).toBe('output.mp3');
  });
});
