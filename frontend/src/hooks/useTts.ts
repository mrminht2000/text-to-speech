import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { VoiceInfo, ModelInfo, TtsState } from '../types/tts';
import { fetchVoices, fetchModels, generateSpeech } from '../services/ttsApi';

const STORAGE_KEY_API_KEY = 'viet_tts_custom_api_key';
const STORAGE_KEY_OPENAI = 'minhtts_openai_key';
const STORAGE_KEY_ELEVEN = 'minhtts_eleven_key';

export function useTts() {
  const [allVoices, setAllVoices] = useState<VoiceInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash-preview-tts');
  const [referenceAudio, setReferenceAudio] = useState<string | null>(null);
  const [referenceText, setReferenceText] = useState<string>('');
  const [customApiKey, setCustomApiKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
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

  // Filter voices specific to the selected model
  const voices = useMemo(() => {
    if (selectedModel.startsWith('gemini-')) {
      return allVoices.filter((v) => v.provider === 'Google Gemini');
    }
    if (selectedModel.startsWith('tts-1')) {
      return allVoices.filter((v) => v.provider === 'OpenAI');
    }
    if (selectedModel.startsWith('eleven_')) {
      return allVoices.filter((v) => v.provider === 'ElevenLabs');
    }
    if (selectedModel === 'vieneu-tts') {
      return allVoices.filter((v) => (v.provider === 'Local GPU' || v.provider === 'Local Model') && v.id !== 'voice_clone_custom');
    }
    if (selectedModel === 'f5-tts-vietnamese') {
      return allVoices.filter((v) => v.id === 'voice_clone_custom');
    }
    return allVoices;
  }, [allVoices, selectedModel]);

  // Load voices and models on mount
  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchVoices(), fetchModels()])
      .then(([voicesData, modelsData]) => {
        if (cancelled) return;
        setAllVoices(voicesData);
        setModels(modelsData);

        const defaultModel = modelsData.find((m) => m.isDefault) || modelsData[0];
        if (defaultModel) setSelectedModel(defaultModel.id);

        const defaultVoice = voicesData.find((v) => v.isDefault && v.provider === 'Google Gemini') || voicesData[0];
        if (defaultVoice) setSelectedVoice(defaultVoice.id);

        setState((s) => ({ ...s, error: null }));
      })
      .catch(() => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          error: 'Không thể kết nối danh mục giọng đọc / model. Vui lòng kiểm tra backend.',
        }));
      });

    return () => {
      cancelled = true;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Sync selectedVoice when selectedModel changes
  useEffect(() => {
    if (selectedModel === 'f5-tts-vietnamese') {
      setSelectedVoice('voice_clone_custom');
      return;
    }

    if (selectedModel.startsWith('tts-1')) {
      const openaiVoices = allVoices.filter((v) => v.provider === 'OpenAI');
      const exists = openaiVoices.some((v) => v.id === selectedVoice);
      if (!exists && openaiVoices.length > 0) {
        setSelectedVoice(openaiVoices[0].id);
      }
      return;
    }

    if (selectedModel.startsWith('eleven_')) {
      const elevenVoices = allVoices.filter((v) => v.provider === 'ElevenLabs');
      const exists = elevenVoices.some((v) => v.id === selectedVoice);
      if (!exists && elevenVoices.length > 0) {
        setSelectedVoice(elevenVoices[0].id);
      }
      return;
    }

    if (selectedModel === 'vieneu-tts') {
      const localVoices = allVoices.filter((v) => (v.provider === 'Local GPU' || v.provider === 'Local Model') && v.id !== 'voice_clone_custom');
      const exists = localVoices.some((v) => v.id === selectedVoice);
      if (!exists && localVoices.length > 0) {
        setSelectedVoice(localVoices[0].id);
      }
      return;
    }

    if (selectedModel.startsWith('gemini-')) {
      const geminiVoices = allVoices.filter((v) => v.provider === 'Google Gemini');
      const exists = geminiVoices.some((v) => v.id === selectedVoice);
      if (!exists && geminiVoices.length > 0) {
        const defaultGemini = geminiVoices.find((v) => v.isDefault) || geminiVoices[0];
        setSelectedVoice(defaultGemini.id);
      }
    }
  }, [selectedModel, allVoices, selectedVoice]);

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
      const isCloning = selectedModel === 'f5-tts-vietnamese';
      
      // Determine appropriate API Key according to Model Provider
      let activeApiKey = customApiKey.trim();
      if (selectedModel.startsWith('tts-1')) {
        activeApiKey = localStorage.getItem(STORAGE_KEY_OPENAI) || activeApiKey;
      } else if (selectedModel.startsWith('eleven_')) {
        activeApiKey = localStorage.getItem(STORAGE_KEY_ELEVEN) || activeApiKey;
      }

      const { blob, usage } = await generateSpeech({
        text,
        voice: selectedVoice,
        speed,
        model: selectedModel,
        apiKey: activeApiKey || undefined,
        referenceAudioBase64: isCloning ? (referenceAudio || undefined) : undefined,
        referenceText: isCloning ? (referenceText || undefined) : undefined,
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
  }, [selectedVoice, speed, selectedModel, customApiKey, referenceAudio, referenceText]);

  const download = useCallback(() => {
    if (!state.audioBlob) return;
    const isWav = selectedModel === 'vieneu-tts' || selectedModel === 'f5-tts-vietnamese';
    const ext = isWav ? 'wav' : 'mp3';
    const url = URL.createObjectURL(state.audioBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `minhtts_audio.${ext}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [state.audioBlob, selectedModel]);

  return {
    voices,
    models,
    selectedVoice,
    setSelectedVoice,
    selectedModel,
    setSelectedModel,
    referenceAudio,
    setReferenceAudio,
    referenceText,
    setReferenceText,
    customApiKey,
    setCustomApiKey,
    speed,
    setSpeed,
    state,
    generate,
    download,
  };
}
