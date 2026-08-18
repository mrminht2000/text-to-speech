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

describe('useTts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts with empty state — no loading, no audio, no error', () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue([]);
    const { result } = renderHook(() => useTts());

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.audioUrl).toBeNull();
    expect(result.current.state.error).toBeNull();
  });

  // ── fetchVoices ────────────────────────────────────────────────────────────

  it('loads voices on mount', async () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
    const { result } = renderHook(() => useTts());

    // Wait for voices to load
    await act(async () => {});

    expect(result.current.voices).toHaveLength(2);
    expect(result.current.voices[0].id).toBe('Charon');
  });

  it('sets default voice to Charon after loading', async () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
    const { result } = renderHook(() => useTts());

    await act(async () => {});

    expect(result.current.selectedVoice).toBe('Charon');
  });

  it('sets error when fetchVoices fails', async () => {
    vi.mocked(ttsApi.fetchVoices).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useTts());

    await act(async () => {});

    expect(result.current.state.error).toContain('voices');
  });

  // ── generate ───────────────────────────────────────────────────────────────

  it('sets isLoading true while generating', async () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
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

  it('sets audioUrl on successful generate', async () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
    const mockBlob = new Blob([new Uint8Array([0xFF, 0xFB])], { type: 'audio/mpeg' });
    vi.mocked(ttsApi.generateSpeech).mockResolvedValue(mockBlob);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

    const { result } = renderHook(() => useTts());
    await act(async () => {});

    await act(async () => {
      await result.current.generate('Xin chào');
    });

    expect(result.current.state.audioUrl).toBe('blob:mock-url');
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('sets error on failed generate', async () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
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
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
    const { result } = renderHook(() => useTts());
    await act(async () => {});

    await act(async () => {
      await result.current.generate('');
    });

    expect(result.current.state.error).toContain('Text');
    expect(ttsApi.generateSpeech).not.toHaveBeenCalled();
  });

  it('rejects generate when text exceeds 5000 chars', async () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
    const { result } = renderHook(() => useTts());
    await act(async () => {});

    await act(async () => {
      await result.current.generate('x'.repeat(5001));
    });

    expect(result.current.state.error).toContain('5000');
    expect(ttsApi.generateSpeech).not.toHaveBeenCalled();
  });

  // ── download ──────────────────────────────────────────────────────────────

  it('calls download with correct filename when audio exists', async () => {
    vi.mocked(ttsApi.fetchVoices).mockResolvedValue(mockVoices);
    const mockBlob = new Blob([new Uint8Array([0xFF, 0xFB])], { type: 'audio/mpeg' });
    vi.mocked(ttsApi.generateSpeech).mockResolvedValue(mockBlob);
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Track anchor attributes set during download
    const clickedAnchors: { download: string; href: string }[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        const origClick = el.click.bind(el);
        el.click = () => {
          clickedAnchors.push({ download: el.download, href: el.href });
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
