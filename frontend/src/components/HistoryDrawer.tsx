import React, { useState, useEffect, useCallback } from 'react';
import { AudioHistoryItem } from '../types/auth';
import { authApi } from '../services/authApi';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectText?: (text: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, onSelectText }) => {
  const [items, setItems] = useState<AudioHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await authApi.getHistory(1, 50, search, filterModel);
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, search, filterModel]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đoạn âm thanh này?')) return;
    try {
      await authApi.deleteHistory(id);
      setItems(items.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử âm thanh?')) return;
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

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h2>📚 Thư viện âm thanh</h2>
            <span className="drawer-count">{items.length} bản ghi</span>
          </div>
          <div className="drawer-actions">
            {items.length > 0 && (
              <button 
                type="button" 
                className="clear-all-btn"
                onClick={handleClearAll}
              >
                🗑️ Xóa hết
              </button>
            )}
            <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="drawer-filter-bar">
          <input
            type="text"
            className="glass-input search-input"
            placeholder="🔍 Tìm kiếm nội dung văn bản..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select 
            className="glass-select model-filter"
            value={filterModel}
            onChange={e => setFilterModel(e.target.value)}
          >
            <option value="">Tất cả Model</option>
            <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro-preview-tts">Gemini 2.5 Pro</option>
            <option value="vieneu-tts">VieNeu Regional</option>
            <option value="f5-tts-vietnamese">F5-TTS Cloning</option>
          </select>
        </div>

        <div className="drawer-body">
          {loading ? (
            <div className="drawer-empty-state">
              <span className="empty-icon">⏳</span>
              <p>Đang tải lịch sử âm thanh...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="drawer-empty-state">
              <span className="empty-icon">🎙️</span>
              <h3>Chưa có bản ghi âm thanh nào</h3>
              <p>Các đoạn giọng đọc AI bạn tạo sẽ tự động được lưu trữ và hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="history-list">
              {items.map(item => {
                const audioUrl = `${API_BASE}${item.downloadUrl}`;
                return (
                  <div key={item.id} className="history-card">
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
                          title="Sao chép văn bản"
                          onClick={() => handleCopyText(item.id, item.text)}
                        >
                          {copiedId === item.id ? '✓ Đã chép' : '📋 Sao chép'}
                        </button>

                        {onSelectText && (
                          <button
                            type="button"
                            className="history-action-btn"
                            title="Tải lại vào ô nhập"
                            onClick={() => { onSelectText(item.text); onClose(); }}
                          >
                            ✏️ Dùng lại
                          </button>
                        )}

                        <a 
                          href={audioUrl} 
                          download 
                          className="history-action-btn download-btn"
                          title="Tải file âm thanh"
                        >
                          ⬇️ Tải về
                        </a>

                        <button
                          type="button"
                          className="history-action-btn delete-btn"
                          title="Xóa bản ghi"
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
    </div>
  );
};
