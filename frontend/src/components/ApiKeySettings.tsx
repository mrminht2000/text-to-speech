import { useState } from 'react';

interface Props {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  apiUrl: string;
  onSaveApiUrl: (url: string) => void;
  disabled?: boolean;
}

export function ApiKeySettings({
  apiKey,
  onSaveApiKey,
  apiUrl,
  onSaveApiUrl,
  disabled,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [urlInput, setUrlInput] = useState(apiUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onSaveApiUrl(urlInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearKey = () => {
    setKeyInput('');
    onSaveApiKey('');
  };

  const handleClearUrl = () => {
    setUrlInput('');
    onSaveApiUrl('');
  };

  const hasCustomKey = Boolean(apiKey.trim());
  const hasCustomUrl = Boolean(apiUrl.trim());

  return (
    <div className="api-key-wrapper">
      <div className="api-key-toggle-row">
        <button
          type="button"
          className="api-key-toggle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
        >
          ⚙️ {isOpen ? 'Thu gọn cài đặt Máy chủ & API Key' : 'Cài đặt Backend & API Key (Tùy chọn)'}
        </button>
        <div className="status-badges-group">
          {hasCustomUrl && (
            <span className="key-status-badge custom" title={`Đang kết nối: ${apiUrl}`}>
              🌐 Tunnel/Host riêng
            </span>
          )}
          <span className={`key-status-badge ${hasCustomKey ? 'custom' : 'default'}`}>
            {hasCustomKey ? '🟢 Dùng Key cá nhân' : '🔵 Dùng Key hệ thống'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="api-key-panel">
          {/* Custom Backend URL Field */}
          <div className="settings-field-group">
            <label className="settings-label">
              🌐 Địa chỉ Backend Server (Cloudflare Tunnel / Local / VPS):
            </label>
            <p className="api-key-desc">
              Khi dùng Vercel, bạn có thể chạy backend tại máy local và điền URL Cloudflare Tunnel (vd: <code>https://xxx.trycloudflare.com</code>) vào đây để kết nối trực tiếp.
            </p>
            <div className="api-key-input-row">
              <input
                type="text"
                className="api-key-input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Để trống mặc định hoặc https://xxxx.trycloudflare.com"
                disabled={disabled}
                autoComplete="off"
              />
              {hasCustomUrl && (
                <button
                  type="button"
                  className="btn-clear-key"
                  onClick={handleClearUrl}
                  disabled={disabled}
                  title="Xóa để quay lại dùng mặc định"
                >
                  Xóa URL
                </button>
              )}
            </div>
          </div>

          {/* Gemini API Key Field */}
          <div className="settings-field-group">
            <label className="settings-label">
              🔑 Google Gemini API Key:
            </label>
            <p className="api-key-desc">
              Nhập Google Gemini API Key riêng của bạn để dùng hạn mức token cá nhân (Lưu an toàn trong LocalStorage).
            </p>
            <div className="api-key-input-row">
              <input
                type="password"
                className="api-key-input"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                disabled={disabled}
                autoComplete="off"
              />
              {hasCustomKey && (
                <button
                  type="button"
                  className="btn-clear-key"
                  onClick={handleClearKey}
                  disabled={disabled}
                  title="Xóa để quay lại dùng Key mặc định"
                >
                  Xóa Key
                </button>
              )}
            </div>
          </div>

          <div className="settings-actions-row">
            <button
              type="button"
              className="btn-save-key"
              onClick={handleSave}
              disabled={disabled}
            >
              💾 Lưu Cài Đặt
            </button>
            {savedSuccess && (
              <span className="key-saved-msg">✅ Đã lưu cài đặt thành công!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
