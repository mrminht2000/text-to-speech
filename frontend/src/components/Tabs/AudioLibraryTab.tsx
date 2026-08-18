import React, { useState, useEffect, useCallback } from 'react';
import { AudioHistoryItem } from '../../types/auth';
import { authApi } from '../../services/authApi';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface AudioLibraryTabProps {
  onReuseText: (text: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export const AudioLibraryTab: React.FC<AudioLibraryTabProps> = ({ onReuseText }) => {
  const { t } = useLanguage();
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState<AudioHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await authApi.getHistory(1, 100, search, filterModel);
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [user, search, filterModel]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi âm thanh này?')) return;
    try {
      await authApi.deleteHistory(id);
      setItems(items.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ thư viện âm thanh?')) return;
    try {
      await authApi.clearHistory();
      setItems([]);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa toàn bộ');
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return (
      <div className="tab-content">
        <div className="card empty-auth-card">
          <span className="empty-icon">🔒</span>
          <h2>Vui lòng đăng nhập để xem Thư viện âm thanh</h2>
          <p>Đăng nhập giúp bạn lưu lại toàn bộ các đoạn giọng đọc đã tạo và phát lại mọi lúc.</p>
          <button 
            type="button" 
            className="btn-generate"
            style={{ maxWidth: '240px', marginTop: '16px' }}
            onClick={() => openAuthModal('login')}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content library-tab-layout">
      <div className="card library-card">
        <div className="library-header-row">
          <div>
            <h2>{t('lib_title')}</h2>
            <p className="library-subtitle">{t('lib_subtitle')}</p>
          </div>
          {items.length > 0 && (
            <button 
              type="button" 
              className="clear-all-btn"
              onClick={handleClearAll}
            >
              {t('btn_clear_all')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="library-filter-bar">
          <input
            type="text"
            className="glass-input search-input"
            placeholder={t('search_prompt_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select 
            className="glass-select model-filter"
            value={filterModel}
            onChange={e => setFilterModel(e.target.value)}
          >
            <option value="">{t('filter_all_models')}</option>
            <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro-preview-tts">Gemini 2.5 Pro</option>
            <option value="gemini-3.1-flash-tts-preview">Gemini 3.1 Flash</option>
            <option value="vieneu-tts">VieNeu Regional</option>
            <option value="f5-tts-vietnamese">F5-TTS Cloning</option>
          </select>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="drawer-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Đang tải thư viện âm thanh...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="drawer-empty-state">
            <span className="empty-icon">🎙️</span>
            <h3>{t('lib_empty_title')}</h3>
            <p>{t('lib_empty_desc')}</p>
          </div>
        ) : (
          <div className="library-grid">
            {items.map(item => {
              const audioUrl = `${API_BASE}${item.downloadUrl}`;
              return (
                <div key={item.id} className="history-card library-item-card">
                  <div className="history-card-header">
                    <div className="history-meta-tags">
                      <span className="meta-tag model-tag">{item.model}</span>
                      <span className="meta-tag voice-tag">🗣️ {item.voice}</span>
                      <span className="meta-tag speed-tag">{item.speed}x</span>
                      {item.isByok && <span className="meta-tag byok-tag">🔑 BYOK</span>}
                    </div>
                    <span className="history-date">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <p className="history-text-snippet">{item.text}</p>

                  <div className="history-player-row">
                    <audio controls preload="none" src={audioUrl} className="mini-audio-player" />
                  </div>

                  <div className="history-card-footer">
                    <div className="token-meta">
                      <span>{item.totalTokens.toLocaleString()} tokens</span>
                      <span>•</span>
                      <span>{(item.fileSizeBytes / 1024).toFixed(1)} KB</span>
                    </div>

                    <div className="card-btn-group">
                      <button
                        type="button"
                        className="history-action-btn"
                        title={t('btn_copy_text')}
                        onClick={() => handleCopyText(item.id, item.text)}
                      >
                        {copiedId === item.id ? t('btn_copied') : t('btn_copy_text')}
                      </button>

                      <button
                        type="button"
                        className="history-action-btn"
                        title={t('btn_reuse')}
                        onClick={() => onReuseText(item.text)}
                      >
                        {t('btn_reuse')}
                      </button>

                      <a 
                        href={audioUrl} 
                        download 
                        className="history-action-btn download-btn"
                        title={t('btn_download')}
                      >
                        {t('btn_download')}
                      </a>

                      <button
                        type="button"
                        className="history-action-btn delete-btn"
                        title="Xóa"
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
