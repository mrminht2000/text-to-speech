import { useState } from 'react';
import { useTts } from './hooks/useTts';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { UserMenu } from './components/UserMenu';
import { AuthModal } from './components/AuthModal';
import { TtsStudioTab } from './components/Tabs/TtsStudioTab';
import { ApiKeyManagerTab } from './components/Tabs/ApiKeyManagerTab';
import { AudioLibraryTab } from './components/Tabs/AudioLibraryTab';
import { PricingTiersTab } from './components/Tabs/PricingTiersTab';
import { AdminDashboardTab } from './components/Tabs/AdminDashboardTab';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('studio');
  const [text, setText] = useState('');

  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

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
    speed,
    setSpeed,
    state,
    generate,
  } = useTts();

  const handleGenerate = async () => {
    await generate(text);
    refreshUser();
  };

  const isByok = Boolean(customApiKey && customApiKey.trim().length > 0);

  const handleReuseFromLibrary = (snippetText: string) => {
    setText(snippetText);
    setActiveTab('studio');
  };

  return (
    <div className="app wide-dashboard-app">
      {/* Background ambient orbs */}
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />
      <div className="bg-orb bg-orb-3" aria-hidden="true" />

      <main className="main wide-dashboard-main">
        {/* Top Header Bar */}
        <header className="header top-navbar-glass">
          <div className="logo" onClick={() => setActiveTab('studio')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon" role="img" aria-label="Mic">🎙️</span>
            <div>
              <h1 className="title">{t('app_title')}</h1>
              <p className="subtitle">{t('app_subtitle')}</p>
            </div>
          </div>
          
          <div className="header-right-actions">
            <UserMenu onNavigateTab={setActiveTab} />
          </div>
        </header>

        {/* Studio Dashboard Tab Navigation Bar */}
        <nav className="dashboard-tabs-navbar">
          <div className="nav-tabs-container">
            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('studio')}
            >
              <span className="tab-icon">🎙️</span>
              <span className="tab-label">{t('tab_studio')}</span>
            </button>

            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'api_keys' ? 'active' : ''}`}
              onClick={() => setActiveTab('api_keys')}
            >
              <span className="tab-icon">🔑</span>
              <span className="tab-label">{t('tab_api_keys')}</span>
              {isByok && <span className="tab-dot-badge" title="BYOK Đang Bật" />}
            </button>

            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
            >
              <span className="tab-icon">📚</span>
              <span className="tab-label">{t('tab_library')}</span>
            </button>

            <button
              type="button"
              className={`dashboard-nav-tab ${activeTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setActiveTab('pricing')}
            >
              <span className="tab-icon">💎</span>
              <span className="tab-label">{t('tab_pricing')}</span>
            </button>

            {user?.role === 'admin' && (
              <button
                type="button"
                className={`dashboard-nav-tab admin-tab ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <span className="tab-icon">🛡️</span>
                <span className="tab-label">{t('tab_admin')}</span>
              </button>
            )}
          </div>
        </nav>

        {/* Tab Views */}
        <div className="tab-view-container">
          {activeTab === 'studio' && (
            <TtsStudioTab
              text={text}
              onTextChange={setText}
              models={models}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              referenceAudio={referenceAudio}
              onReferenceAudioChange={setReferenceAudio}
              referenceText={referenceText}
              onReferenceTextChange={setReferenceText}
              speed={speed}
              onSpeedChange={setSpeed}
              state={state}
              onGenerate={handleGenerate}
              isByok={isByok}
              onOpenPricing={() => setActiveTab('pricing')}
            />
          )}

          {activeTab === 'api_keys' && (
            <ApiKeyManagerTab
              apiKey={customApiKey}
              onSaveApiKey={setCustomApiKey}
            />
          )}

          {activeTab === 'library' && (
            <AudioLibraryTab
              onReuseText={handleReuseFromLibrary}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingTiersTab />
          )}

          {activeTab === 'admin' && user?.role === 'admin' && (
            <AdminDashboardTab />
          )}
        </div>

        {/* Footer */}
        <footer className="footer wide-footer">
          <p>
            MinhTTS Studio © 2026 — Phát triển bởi <strong>Zygardoge (Nguyen Ngoc Minh)</strong> • Email:{' '}
            <a href="mailto:mrminht2000@gmail.com">mrminht2000@gmail.com</a>
          </p>
        </footer>
      </main>

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
}

export default App;