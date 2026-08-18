import { useState, useEffect, useCallback } from 'react';
import type { VoiceInfo, TtsState } from '../types/tts';
import { fetchVoices, generateSpeech } from '../services/ttsApi';

export function useTts() {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  const [speed, setSpeed] = useState<number>(1.0);
  const [state, setState] = useState<TtsState>({
    isLoading: false,
    audioUrl: null,
    audioBlob: null,
    error: null,
  });

  // Load voices on mount
  useEffect(() => {
    let cancelled = false;
    fetchVoices()
      .then((data) => {
        if (cancelled) return;
        setVoices(data);
        const defaultVoice = data.find((v) => v.isDefault);
        if (defaultVoice) setSelectedVoice(defaultVoice.id);
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({ ...s, error: 'Failed to load voices. Please refresh.' }));
      });
    return () => { cancelled = true; };
  }, []);

  const generate = useCallback(async (text: string) => {
    // Client-side validation
    if (!text.trim()) {
      setState((s) => ({ ...s, error: 'Text is required.' }));
      return;
    }
    if (text.length > 5000) {
      setState((s) => ({ ...s, error: 'Text exceeds 5000 character limit.' }));
      return;
    }

    // Revoke previous URL to avoid memory leak
    setState((prev) => {
      if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
      return { isLoading: true, audioUrl: null, audioBlob: null, error: null };
    });

    try {
      const blob = await generateSpeech({ text, voice: selectedVoice, speed });
      const url = URL.createObjectURL(blob);
      setState({ isLoading: false, audioUrl: url, audioBlob: blob, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred.';
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, [selectedVoice, speed]);

  const download = useCallback(() => {
    if (!state.audioBlob) return;
    const url = URL.createObjectURL(state.audioBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'output.mp3';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [state.audioBlob]);

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    speed,
    setSpeed,
    state,
    generate,
    download,
  };
}
