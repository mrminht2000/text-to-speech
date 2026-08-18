import React, { useState } from 'react';
import { useTts } from './hooks/useTts';
import { TextInput } from './components/TextInput';
import { VoiceSelector } from './components/VoiceSelector';
import { SpeedSlider } from './components/SpeedSlider';
import { AudioPlayer } from './components/AudioPlayer';
import './styles/index.css';

export default function App() {
  const [text, setText] = useState('');
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    speed,
    setSpeed,
    state,
    generate,
    download,
  } = useTts();

  const handleGenerate = () => generate(text);

  return (
    <div className="app">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />
      <div className="bg-orb bg-orb-3" aria-hidden="true" />

      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <span className="logo-icon">🎙</span>
            <div className="logo-text">
              <h1 className="title">VietTTS</h1>
              <p className="subtitle">Chuyển văn bản tiếng Việt thành giọng nói</p>
            </div>
          </div>
          <div className="badge">Gemini AI</div>
        </header>

        {/* Card */}
        <div className="card">
          {/* Text input */}
          <section className="section">
            <h2 className="section-title">📝 Văn bản</h2>
            <TextInput
              value={text}
              onChange={setText}
              disabled={state.isLoading}
            />
          </section>

          {/* Controls row */}
          <section className="section controls-row">
            <div className="control-group">
              <VoiceSelector
                voices={voices}
                value={selectedVoice}
                onChange={setSelectedVoice}
                disabled={state.isLoading}
              />
            </div>
            <div className="control-group">
              <SpeedSlider
                value={speed}
                onChange={setSpeed}
                disabled={state.isLoading}
              />
            </div>
          </section>

          {/* Error */}
          {state.error && (
            <div className="error-banner" role="alert">
              ⚠️ {state.error}
            </div>
          )}

          {/* Generate button */}
          <button
            id="generate-btn"
            className={`btn-generate ${state.isLoading ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={state.isLoading || !text.trim()}
            aria-busy={state.isLoading}
          >
            {state.isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Đang tạo giọng nói...
              </>
            ) : (
              <>
                <span>▶</span> Tạo giọng nói
              </>
            )}
          </button>

          {/* Audio player + download */}
          {state.audioUrl && (
            <section className="section result-section">
              <h2 className="section-title">🔊 Kết quả</h2>
              <AudioPlayer audioUrl={state.audioUrl} />
              <button
                id="download-btn"
                className="btn-download"
                onClick={download}
              >
                ⬇ Tải MP3
              </button>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>Giọng mặc định: <strong>Charon</strong> (Adam-like) • Powered by Gemini TTS</p>
        </footer>
      </main>
    </div>
  );
}
