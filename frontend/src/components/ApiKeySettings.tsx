import { useState } from 'react';

interface Props {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  disabled?: boolean;
}

export function ApiKeySettings({
  apiKey,
  onSaveApiKey,
  disabled,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearKey = () => {
    setKeyInput('');
    onSaveApiKey('');
  };

  const hasCustomKey = Boolean(apiKey.trim());

  return (
    <div className="api-key-wrapper">
      <div className="api-key-toggle-row">
        <button
          type="button"
          className="api-key-toggle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
        >
          🔑 {isOpen ? 'Thu gọn Cài đặt AI API Key' : 'Cài đặt AI API Key (Tùy chọn BYOK)'}
        </button>
        <div className="status-badges-group">
          <span className={`key-status-badge ${hasCustomKey ? 'custom' : 'default'}`}>
            {hasCustomKey ? '🟢 Dùng Key cá nhân' : '🔵 Dùng Key hệ thống'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="api-key-panel">
          {/* Gemini API Key Field */}
          <div className="settings-field-group">
            <label className="settings-label">
              🔑 Google Gemini API Key (Cá nhân):
            </label>
            <p className="api-key-desc">
              Nhập Google Gemini API Key riêng của bạn để dùng hạn mức token cá nhân (Lưu an toàn trên trình duyệt của bạn).
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
              💾 Lưu API Key
            </button>
            {savedSuccess && (
              <span className="key-saved-msg">✅ Đã lưu API Key thành công!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
