import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceInfo, ModelInfo, TtsState } from '../types/tts';
import { fetchVoices, fetchModels, generateSpeech } from '../services/ttsApi';

const STORAGE_KEY_API_KEY = 'viet_tts_custom_api_key';
const STORAGE_KEY_API_URL = 'viet_tts_custom_api_url';

export function useTts() {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash-preview-tts');
  const [customApiKey, setCustomApiKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
    } catch {
      return '';
    }
  });
  const [customApiUrl, setCustomApiUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API_URL) || '';
    } catch {
      return '';
    }
  });
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

  const setCustomApiKey = useCallback((key: string) => {
    setCustomApiKeyState(key);
    try {
      if (key) {
        localStorage.setItem(STORAGE_KEY_API_KEY, key);
      } else {
        localStorage.removeItem(STORAGE_KEY_API_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setCustomApiUrl = useCallback((url: string) => {
    setCustomApiUrlState(url);
    try {
      if (url) {
        localStorage.setItem(STORAGE_KEY_API_URL, url);
      } else {
        localStorage.removeItem(STORAGE_KEY_API_URL);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Load voices and models on mount or when customApiUrl changes
  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchVoices(customApiUrl), fetchModels(customApiUrl)])
      .then(([voicesData, modelsData]) => {
        if (cancelled) return;
        setVoices(voicesData);
        setModels(modelsData);

        const defaultVoice = voicesData.find((v) => v.isDefault) || voicesData[0];
        if (defaultVoice) setSelectedVoice(defaultVoice.id);

        const defaultModel = modelsData.find((m) => m.isDefault) || modelsData[0];
        if (defaultModel) setSelectedModel(defaultModel.id);

        setState((s) => ({ ...s, error: null }));
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          error: customApiUrl
            ? `Không thể kết nối đến Backend: ${customApiUrl}. Vui lòng kiểm tra lại URL tunnel.`
            : 'Không thể kết nối danh mục giọng đọc / model. Vui lòng kiểm tra backend.',
        }));
      });

    return () => {
      cancelled = true;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [customApiUrl]);

  const startProgressAnimation = () => {
    setState((s) => ({ ...s, progress: 8 }));
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = window.setInterval(() => {
      setState((prev) => {
        if (!prev.isLoading) return prev;
        if (prev.progress < 40) {
          return { ...prev, progress: prev.progress + 4 };
        } else if (prev.progress < 75) {
          return { ...prev, progress: prev.progress + 2 };
        } else if (prev.progress < 92) {
          return { ...prev, progress: prev.progress + 0.8 };
        }
        return prev;
      });
    }, 120);
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
    if (!text.trim()) {
      setState((s) => ({ ...s, error: 'Vui lòng nhập văn bản cần đọc.' }));
      return;
    }
    if (text.length > 5000) {
      setState((s) => ({ ...s, error: 'Văn bản vượt quá giới hạn 5.000 ký tự.' }));
      return;
    }

    setState((prev) => {
      if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
      return {
        isLoading: true,
        progress: 8,
        audioUrl: null,
        audioBlob: null,
        usage: null,
        error: null,
      };
    });

    startProgressAnimation();

    try {
      const { blob, usage } = await generateSpeech(
        {
          text,
          voice: selectedVoice,
          speed,
          model: selectedModel,
          apiKey: customApiKey.trim() || undefined,
        },
        customApiUrl.trim() || undefined,
      );

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
  }, [selectedVoice, speed, selectedModel, customApiKey, customApiUrl]);

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
    customApiKey,
    setCustomApiKey,
    customApiUrl,
    setCustomApiUrl,
    speed,
    setSpeed,
    state,
    generate,
    download,
  };
}
