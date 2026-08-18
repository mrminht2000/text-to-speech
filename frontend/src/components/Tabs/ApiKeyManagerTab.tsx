import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ApiKeyManagerTabProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyManagerTab: React.FC<ApiKeyManagerTabProps> = ({ apiKey, onSaveApiKey }) => {
  const { t } = useLanguage();
  const [geminiKey, setGeminiKey] = useState(apiKey);
  const [showGemini, setShowGemini] = useState(false);

  const [openaiKey, setOpenaiKey] = useState(() => {
    try {
      return localStorage.getItem('minhtts_openai_key') || '';
    } catch {
      return '';
    }
  });
  const [showOpenai, setShowOpenai] = useState(false);

  const [elevenKey, setElevenKey] = useState(() => {
    try {
      return localStorage.getItem('minhtts_eleven_key') || '';
    } catch {
      return '';
    }
  });
  const [showEleven, setShowEleven] = useState(false);

  const [savedProvider, setSavedProvider] = useState<string | null>(null);

  const handleSaveGemini = () => {
    onSaveApiKey(geminiKey.trim());
    showSuccessToast('Google Gemini');
  };

  const handleClearGemini = () => {
    setGeminiKey('');
    onSaveApiKey('');
  };

  const handleSaveOpenai = () => {
    const key = openaiKey.trim();
    if (key) {
      localStorage.setItem('minhtts_openai_key', key);
    } else {
      localStorage.removeItem('minhtts_openai_key');
    }
    showSuccessToast('OpenAI');
  };

  const handleClearOpenai = () => {
    setOpenaiKey('');
    localStorage.removeItem('minhtts_openai_key');
  };

  const handleSaveEleven = () => {
    const key = elevenKey.trim();
    if (key) {
      localStorage.setItem('minhtts_eleven_key', key);
    } else {
      localStorage.removeItem('minhtts_eleven_key');
    }
    showSuccessToast('ElevenLabs');
  };

  const handleClearEleven = () => {
    setElevenKey('');
    localStorage.removeItem('minhtts_eleven_key');
  };

  const showSuccessToast = (providerName: string) => {
    setSavedProvider(providerName);
    setTimeout(() => setSavedProvider(null), 3500);
  };

  const isGeminiActive = Boolean(apiKey && apiKey.trim().length > 0);
  const isOpenaiActive = Boolean(openaiKey && openaiKey.trim().length > 0);
  const isElevenActive = Boolean(elevenKey && elevenKey.trim().length > 0);

  return (
    <div className="tab-content api-keys-tab-layout">
      <div className="card api-keys-card">
        <div className="api-keys-header">
          <h2>{t('api_tab_title')}</h2>
          <p className="api-keys-subtitle">{t('api_tab_subtitle')}</p>
        </div>

        {savedProvider && (
          <div className="save-success-banner">
            ✓ Đã lưu thành công khóa API cho {savedProvider}! Bạn có thể sử dụng ngay trong Studio.
          </div>
        )}

        <div className="api-providers-list">
          {/* 1. GOOGLE GEMINI */}
          <div className={`provider-card ${isGeminiActive ? 'provider-active' : ''}`}>
            <div className="provider-card-header">
              <div className="provider-brand">
                <span className="provider-logo">✨</span>
                <div>
                  <h3>{t('gemini_key_title')}</h3>
                  <span className={`status-pill ${isGeminiActive ? 'active-pill' : 'default-pill'}`}>
                    {isGeminiActive ? t('key_status_custom') : t('key_status_default')}
                  </span>
                </div>
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer" 
                className="get-key-link"
              >
                {t('get_gemini_key_link')} ↗
              </a>
            </div>

            <p className="provider-desc">{t('gemini_key_desc')}</p>

            <div className="key-input-row">
              <input
                type={showGemini ? 'text' : 'password'}
                className="glass-input key-input-field"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
              />
              <button 
                type="button" 
                className="toggle-vis-btn"
                onClick={() => setShowGemini(!showGemini)}
                title={showGemini ? 'Ẩn' : 'Hiện'}
              >
                {showGemini ? 'Ẩn' : 'Hiện'}
              </button>
              <button 
                type="button" 
                className="btn-save-key"
                onClick={handleSaveGemini}
              >
                {t('btn_save_key')}
              </button>
              {isGeminiActive && (
                <button 
                  type="button" 
                  className="btn-clear-key"
                  onClick={handleClearGemini}
                >
                  {t('btn_clear_key')}
                </button>
              )}
            </div>
          </div>

          {/* 2. OPENAI (TTS-1 / TTS-1-HD) */}
          <div className={`provider-card ${isOpenaiActive ? 'provider-active' : ''}`}>
            <div className="provider-card-header">
              <div className="provider-brand">
                <span className="provider-logo">🤖</span>
                <div>
                  <h3>{t('openai_key_title')}</h3>
                  <span className={`status-pill ${isOpenaiActive ? 'active-pill' : 'default-pill'}`}>
                    {isOpenaiActive ? 'Khóa cá nhân đang hoạt động' : 'Chưa cấu hình (Tùy chọn BYOK)'}
                  </span>
                </div>
              </div>
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noreferrer" 
                className="get-key-link"
              >
                Lấy OpenAI API Key ↗
              </a>
            </div>

            <p className="provider-desc">{t('openai_key_desc')}</p>

            <div className="key-input-row">
              <input
                type={showOpenai ? 'text' : 'password'}
                className="glass-input key-input-field"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
              />
              <button 
                type="button" 
                className="toggle-vis-btn"
                onClick={() => setShowOpenai(!showOpenai)}
                title={showOpenai ? 'Ẩn' : 'Hiện'}
              >
                {showOpenai ? 'Ẩn' : 'Hiện'}
              </button>
              <button 
                type="button" 
                className="btn-save-key"
                onClick={handleSaveOpenai}
              >
                {t('btn_save_key')}
              </button>
              {isOpenaiActive && (
                <button 
                  type="button" 
                  className="btn-clear-key"
                  onClick={handleClearOpenai}
                >
                  {t('btn_clear_key')}
                </button>
              )}
            </div>
          </div>

          {/* 3. ELEVENLABS (Multilingual v2 & Turbo) */}
          <div className={`provider-card ${isElevenActive ? 'provider-active' : ''}`}>
            <div className="provider-card-header">
              <div className="provider-brand">
                <span className="provider-logo">🎙️</span>
                <div>
                  <h3>{t('elevenlabs_key_title')}</h3>
                  <span className={`status-pill ${isElevenActive ? 'active-pill' : 'default-pill'}`}>
                    {isElevenActive ? 'Khóa cá nhân đang hoạt động' : 'Chưa cấu hình (Tùy chọn BYOK)'}
                  </span>
                </div>
              </div>
              <a 
                href="https://elevenlabs.io/app/speech-synthesis" 
                target="_blank" 
                rel="noreferrer" 
                className="get-key-link"
              >
                Lấy ElevenLabs Key ↗
              </a>
            </div>

            <p className="provider-desc">{t('elevenlabs_key_desc')}</p>

            <div className="key-input-row">
              <input
                type={showEleven ? 'text' : 'password'}
                className="glass-input key-input-field"
                placeholder="xi-api-key-..."
                value={elevenKey}
                onChange={e => setElevenKey(e.target.value)}
              />
              <button 
                type="button" 
                className="toggle-vis-btn"
                onClick={() => setShowEleven(!showEleven)}
                title={showEleven ? 'Ẩn' : 'Hiện'}
              >
                {showEleven ? 'Ẩn' : 'Hiện'}
              </button>
              <button 
                type="button" 
                className="btn-save-key"
                onClick={handleSaveEleven}
              >
                {t('btn_save_key')}
              </button>
              {isElevenActive && (
                <button 
                  type="button" 
                  className="btn-clear-key"
                  onClick={handleClearEleven}
                >
                  {t('btn_clear_key')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
