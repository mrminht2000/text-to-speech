import React from 'react';
import { ModelInfo, VoiceInfo, TtsState } from '../../types/tts';
import { TextInput } from '../TextInput';
import { ModelSelector } from '../ModelSelector';
import { VoiceSelector } from '../VoiceSelector';
import { VoiceCloner } from '../VoiceCloner';
import { SpeedSlider } from '../SpeedSlider';
import { ProgressBar } from '../ProgressBar';
import { AudioPlayer } from '../AudioPlayer';
import { UsageBadge } from '../UsageBadge';
import { useLanguage } from '../../context/LanguageContext';

interface TtsStudioTabProps {
  text: string;
  onTextChange: (val: string) => void;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  voices: VoiceInfo[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  referenceAudio: string | null;
  onReferenceAudioChange: (val: string | null) => void;
  referenceText: string;
  onReferenceTextChange: (val: string) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  state: TtsState;
  onGenerate: () => void;
  isByok: boolean;
  onOpenPricing: () => void;
}

export const TtsStudioTab: React.FC<TtsStudioTabProps> = ({
  text,
  onTextChange,
  models,
  selectedModel,
  onModelChange,
  voices,
  selectedVoice,
  onVoiceChange,
  referenceAudio,
  onReferenceAudioChange,
  referenceText,
  onReferenceTextChange,
  speed,
  onSpeedChange,
  state,
  onGenerate,
  isByok,
  onOpenPricing,
}) => {
  const { t } = useLanguage();
  const isMarkdownSupported = selectedModel === 'gemini-3.1-flash-tts-preview';
  const isVoiceCloningModel = selectedModel === 'f5-tts-vietnamese';

  return (
    <div className="tab-content studio-grid-layout">
      {/* Left Column: Text Input & Editor */}
      <div className="studio-main-column">
        <div className="card studio-editor-card">
          <TextInput
            value={text}
            onChange={onTextChange}
            disabled={state.isLoading}
            maxLength={25000}
            isMarkdownSupported={isMarkdownSupported}
            isByok={isByok}
            onOpenPricing={onOpenPricing}
          />

          {/* Voice Cloner (Only when Voice Cloning model is active) */}
          {isVoiceCloningModel && (
            <div className="cloner-section-wrapper">
              <VoiceCloner
                referenceAudio={referenceAudio}
                onReferenceAudioChange={onReferenceAudioChange}
                referenceText={referenceText}
                onReferenceTextChange={onReferenceTextChange}
                disabled={state.isLoading}
              />
            </div>
          )}

          {/* Generate Action Row */}
          <div className="studio-actions-row">
            <button
              type="button"
              className={`btn-generate ${state.isLoading ? 'loading' : ''}`}
              onClick={onGenerate}
              disabled={state.isLoading || !text.trim()}
              id="btn-generate-speech"
            >
              {state.isLoading ? (
                <>
                  <span className="spinner" />
                  {t('btn_generating')}
                </>
              ) : (
                t('btn_generate')
              )}
            </button>
          </div>

          {/* Progress bar */}
          {state.isLoading && <ProgressBar progress={state.progress} model={selectedModel} />}

          {/* Error Message */}
          {state.error && (
            <div className="error-banner" role="alert">
              ⚠️ {state.error}
            </div>
          )}

          {/* Audio Player */}
          {state.audioUrl && (
            <div className="studio-player-container">
              <AudioPlayer audioUrl={state.audioUrl} />
            </div>
          )}

          {/* Token Usage Metrics */}
          {state.usage && <UsageBadge usage={state.usage} />}
        </div>
      </div>

      {/* Right Column: Voice & Model Controls */}
      <div className="studio-side-column">
        <div className="card studio-controls-card">
          <h3 className="sidebar-card-title">Cấu hình Giọng đọc & Mô hình</h3>

          {/* Model Selector */}
          <div className="sidebar-group">
            <label className="sidebar-label">{t('model_label')}</label>
            <ModelSelector
              models={models}
              value={selectedModel}
              onChange={onModelChange}
              disabled={state.isLoading}
            />
          </div>

          {/* Voice Selector (Only when not Cloning) */}
          {!isVoiceCloningModel && (
            <div className="sidebar-group">
              <label className="sidebar-label">{t('voice_label')}</label>
              <VoiceSelector
                voices={voices}
                value={selectedVoice}
                onChange={onVoiceChange}
                disabled={state.isLoading}
              />
            </div>
          )}

          {/* Speed Slider */}
          <div className="sidebar-group">
            <SpeedSlider
              value={speed}
              onChange={onSpeedChange}
              disabled={state.isLoading}
            />
          </div>

          {/* BYOK Status Card in Sidebar */}
          <div className={`byok-mini-status ${isByok ? 'active' : ''}`}>
            <div className="byok-mini-header">
              <span>{isByok ? 'BYOK: Đang Bật' : 'Token Server Mặc Định'}</span>
              {isByok && <span className="byok-pill">Miễn Trừ Hạn Mức</span>}
            </div>
            <p className="byok-mini-desc">
              {isByok
                ? 'Request không bị trừ vào hạn mức token hàng ngày của tài khoản.'
                : 'Đang sử dụng hạn mức token hàng ngày của tài khoản.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
