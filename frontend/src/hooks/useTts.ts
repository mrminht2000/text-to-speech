import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceInfo, ModelInfo, TtsState } from '../types/tts';
import { fetchVoices, fetchModels, generateSpeech } from '../services/ttsApi';

export function useTts() {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-tts-preview');
  const [speed, setSpeed] = useState<number>(1.0);
  const [state, setState] = useState<TtsState>({
    isLoading: false,
    progress: 0,
    audioUrl: null,
    audioBlob: null,
    usage: null,
    error: null,
  });

  const progressIntervalRef = useRef<number | null>(null);

  // Load voices and models on mount
  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchVoices(), fetchModels()])
      .then(([voicesData, modelsData]) => {
        if (cancelled) return;
        setVoices(voicesData);
        setModels(modelsData);

        const defaultVoice = voicesData.find((v) => v.isDefault);
        if (defaultVoice) setSelectedVoice(defaultVoice.id);

        const defaultModel = modelsData.find((m) => m.isDefault);
        if (defaultModel) setSelectedModel(defaultModel.id);
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({ ...s, error: 'Không thể kết nối danh mục giọng đọc / model. Vui lòng kiểm tra backend.' }));
      });

    return () => {
      cancelled = true;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const startProgressAnimation = () => {
    setState((s) => ({ ...s, progress: 10 }));
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = window.setInterval(() => {
      setState((prev) => {
        if (!prev.isLoading) return prev;
        // Asymptotically approach 95%
        if (prev.progress < 70) {
          return { ...prev, progress: prev.progress + 6 };
        } else if (prev.progress < 92) {
          return { ...prev, progress: prev.progress + 2 };
        }
        return prev;
      });
    }, 150);
  };

  const stopProgressAnimation = (completed = false) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (completed) {
      setState((s) => ({ ...s, progress: 100 }));
    }
  };

  const generate = useCallback(async (text: string) => {
    // Client-side validation
    if (!text.trim()) {
      setState((s) => ({ ...s, error: 'Vui lòng nhập văn bản cần đọc.' }));
      return;
    }
    if (text.length > 5000) {
      setState((s) => ({ ...s, error: 'Văn bản vượt quá giới hạn 5.000 ký tự.' }));
      return;
    }

    // Revoke previous URL to avoid memory leak
    setState((prev) => {
      if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
      return {
        isLoading: true,
        progress: 5,
        audioUrl: null,
        audioBlob: null,
        usage: null,
        error: null,
      };
    });

    startProgressAnimation();

    try {
      const { blob, usage } = await generateSpeech({
        text,
        voice: selectedVoice,
        speed,
        model: selectedModel,
      });

      stopProgressAnimation(true);

      const url = URL.createObjectURL(blob);
      setState({
        isLoading: false,
        progress: 100,
        audioUrl: url,
        audioBlob: blob,
        usage,
        error: null,
      });
    } catch (err) {
      stopProgressAnimation(false);
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
      setState((s) => ({ ...s, isLoading: false, progress: 0, error: message }));
    }
  }, [selectedVoice, speed, selectedModel]);

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
    models,
    selectedVoice,
    setSelectedVoice,
    selectedModel,
    setSelectedModel,
    speed,
    setSpeed,
    state,
    generate,
    download,
  };
}
