import { useState } from 'react';
import { useTts } from './hooks/useTts';
import { TextInput } from './components/TextInput';
import { ModelSelector } from './components/ModelSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { VoiceCloner } from './components/VoiceCloner';
import { SpeedSlider } from './components/SpeedSlider';
import { ProgressBar } from './components/ProgressBar';
import { UsageBadge } from './components/UsageBadge';
import { AudioPlayer } from './components/AudioPlayer';
import { ApiKeySettings } from './components/ApiKeySettings';

export function App() {
  const [text, setText] = useState('');

  const {
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
    customApiUrl,
    setCustomApiUrl,
    speed,
    setSpeed,
    state,
    generate,
    download,
  } = useTts();

  const handleGenerate = () => {
    generate(text);
  };

  const isVoiceCloningModel = selectedModel === 'f5-tts-vietnamese';

  return (
    <div className="app">
      {/* Background ambient orbs */}
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />
      <div className="bg-orb bg-orb-3" aria-hidden="true" />

      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <span className="logo-icon" role="img" aria-label="Mic">🎙️</span>
            <div>
              <h1 className="title">MinhTTS Studio</h1>
              <p className="subtitle">Chuyển đổi văn bản sang giọng nói AI tiếng Việt cao cấp</p>
            </div>
          </div>
          <span className="badge">AI Audio</span>
        </header>

        {/* API Key & Backend Server Configuration */}
        <ApiKeySettings
          apiKey={customApiKey}
          onSaveApiKey={setCustomApiKey}
          apiUrl={customApiUrl}
          onSaveApiUrl={setCustomApiUrl}
          disabled={state.isLoading}
        />

        {/* Main Interactive Glassmorphism Card */}
        <div className="card">
          {/* Text Input & Markdown preview */}
          <div className="section">
            <TextInput
              value={text}
              onChange={setText}
              disabled={state.isLoading}
              maxLength={5000}
            />
          </div>

          {/* Model & Voice selection in a balanced 2-column row */}
          <div className="controls-row">
            <div className="control-group">
              <ModelSelector
                models={models}
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={state.isLoading}
              />
            </div>

            <div className="control-group">
              <VoiceSelector
                voices={voices}
                value={selectedVoice}
                onChange={setSelectedVoice}
                disabled={state.isLoading}
              />
            </div>
          </div>

          {/* Voice Cloner (Conditional for F5-TTS) */}
          {isVoiceCloningModel && (
            <VoiceCloner
              referenceAudio={referenceAudio}
              onReferenceAudioChange={setReferenceAudio}
              referenceText={referenceText}
              onReferenceTextChange={setReferenceText}
              disabled={state.isLoading}
            />
          )}

          {/* Speed slider */}
          <SpeedSlider
            value={speed}
            onChange={setSpeed}
            disabled={state.isLoading}
          />

          {/* Generate Button */}
          <button
            type="button"
            className={`btn-generate ${state.isLoading ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={state.isLoading || !text.trim()}
            id="btn-generate-speech"
          >
            {state.isLoading ? (
              <>
                <span className="spinner" />
                Đang tổng hợp giọng đọc...
              </>
            ) : (
              '▶ Chuyển thành giọng nói'
            )}
          </button>

          {/* Progress bar */}
          {state.isLoading && <ProgressBar progress={state.progress} />}

          {/* Error Message */}
          {state.error && (
            <div className="error-banner" role="alert">
              ⚠️ {state.error}
            </div>
          )}

          {/* Token Usage Badge */}
          {state.usage && <UsageBadge usage={state.usage} />}

          {/* Audio Output Result */}
          {state.audioUrl && (
            <div className="result-section">
              <AudioPlayer audioUrl={state.audioUrl} />
              <button
                type="button"
                className="btn-download"
                onClick={download}
                id="btn-download-audio"
              >
                📥 Tải xuống file MP3
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>
            Tác giả: <strong>Zygardoge (Nguyen Ngoc Minh)</strong> — Email: <code>mrminht2000@gmail.com</code>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;