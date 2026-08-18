import { useState } from 'react';
import { SubtitlePreset, SubtitleStyle } from '../../types/subtitles';
import { SUBTITLE_PRESETS, VIETNAMESE_FONTS } from '../../utils/subtitleUtils';

interface SubtitleStylePanelProps {
  style: SubtitleStyle;
  onChange: (updated: Partial<SubtitleStyle>) => void;
}

export function SubtitleStylePanel({ style, onChange }: SubtitleStylePanelProps) {
  // Track active preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('tiktok_hormozi');

  const handlePresetSelect = (preset: SubtitlePreset) => {
    if (selectedPresetId === preset.id) {
      // Toggle off -> Unlock all fonts
      setSelectedPresetId(null);
    } else {
      setSelectedPresetId(preset.id);
      onChange(preset.style);
    }
  };

  const handleClearPresetFilter = () => {
    setSelectedPresetId(null);
  };

  const activePreset = selectedPresetId ? SUBTITLE_PRESETS.find((p) => p.id === selectedPresetId) : null;

  // Filter fonts based on active preset or show all
  const filteredFonts = activePreset && activePreset.recommendedFonts && activePreset.recommendedFonts.length > 0
    ? VIETNAMESE_FONTS.filter((f) => activePreset.recommendedFonts!.includes(f.family) || f.family === style.fontFamily)
    : VIETNAMESE_FONTS;

  const fontCategories = Array.from(new Set(filteredFonts.map((f) => f.category)));

  const QUICK_PALETTE = ['#FFE600', '#00FF66', '#FF0055', '#00F0FF', '#FFFFFF', '#FF9900', '#A855F7'];

  return (
    <div className="subtitle-style-panel">
      {/* 1. Presets Section */}
      <div className="style-section presets-section">
        <div className="section-header-flex">
          <label className="section-label">⚡ Mẫu Phụ Đề Xu Hướng (Presets)</label>
          {selectedPresetId && (
            <button
              type="button"
              className="btn-clear-preset"
              onClick={handleClearPresetFilter}
              title="Bỏ chọn để xem toàn bộ phông chữ"
            >
              🔓 Bỏ chọn mẫu (Xem tất cả)
            </button>
          )}
        </div>

        <div className="presets-grid">
          {SUBTITLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-card-btn ${isSelected ? 'active-glowing' : ''}`}
                onClick={() => handlePresetSelect(preset)}
                title={isSelected ? 'Nhấn để bỏ chọn mẫu này' : `Chọn mẫu ${preset.name}`}
              >
                <div className="preset-header-row">
                  <span className="preset-icon">{preset.icon}</span>
                  {isSelected && <span className="preset-active-badge">✓ Đang chọn</span>}
                </div>
                <div className="preset-info">
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-desc">{preset.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Typography Section */}
      <div className="style-section typography-section">
        <div className="section-header-flex">
          <label className="section-label">
            🔤 Phông Chữ {selectedPresetId ? `(${filteredFonts.length} font của mẫu)` : '(24+ Fonts)'}
          </label>
          {selectedPresetId ? (
            <span className="font-filter-tag">
              🎯 Mẫu: <strong>{activePreset?.name}</strong>
            </span>
          ) : (
            <span className="font-filter-tag all-fonts">
              🌐 Tất cả 24+ Font
            </span>
          )}
        </div>

        <div className="form-group">
          <select
            value={style.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="select-input font-select"
          >
            {fontCategories.map((cat) => (
              <optgroup key={cat} label={cat}>
                {filteredFonts.filter((f) => f.category === cat).map((f) => (
                  <option key={f.name} value={f.family}>
                    {f.name} {f.badge ? `[${f.badge}]` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Font Size & Weight */}
        <div className="form-row two-cols">
          <div className="form-group">
            <label className="sub-label">Cỡ chữ: {style.fontSize}px</label>
            <input
              type="range"
              min={14}
              max={64}
              step={1}
              value={style.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
              className="range-slider"
            />
          </div>

          <div className="form-group">
            <label className="sub-label">Độ đậm</label>
            <select
              value={style.fontWeight}
              onChange={(e) => onChange({ fontWeight: e.target.value })}
              className="select-input"
            >
              <option value="normal">Bình thường (400)</option>
              <option value="600">Đậm vừa (600)</option>
              <option value="bold">Rất đậm (700)</option>
              <option value="900">Siêu đậm (900 - Viral)</option>
            </select>
          </div>
        </div>

        {/* Text Colors & Text Transform */}
        <div className="form-row three-cols">
          <div className="form-group">
            <label className="sub-label">Màu chữ chính</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={style.textColor.startsWith('#') ? style.textColor : '#FFFFFF'}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="color-input"
              />
              <span className="color-value-text">{style.textColor}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="sub-label">Kiểu chữ</label>
            <select
              value={style.textTransform}
              onChange={(e) => onChange({ textTransform: e.target.value as any })}
              className="select-input"
            >
              <option value="uppercase">IN HOA (TIKTOK)</option>
              <option value="none">Bình thường</option>
              <option value="capitalize">Viết hoa đầu từ</option>
            </select>
          </div>

          <div className="form-group">
            <label className="sub-label">Căn lề</label>
            <div className="align-buttons-group">
              <button
                type="button"
                className={`btn-align ${style.textAlign === 'left' ? 'active' : ''}`}
                onClick={() => onChange({ textAlign: 'left' })}
                title="Căn trái"
              >
                ⬅️
              </button>
              <button
                type="button"
                className={`btn-align ${style.textAlign === 'center' ? 'active' : ''}`}
                onClick={() => onChange({ textAlign: 'center' })}
                title="Căn giữa"
              >
                ↔️
              </button>
              <button
                type="button"
                className={`btn-align ${style.textAlign === 'right' ? 'active' : ''}`}
                onClick={() => onChange({ textAlign: 'right' })}
                title="Căn phải"
              >
                ➡️
              </button>
            </div>
          </div>
        </div>

        {/* Photoshop Rotation & Bounding Width Controls */}
        <div className="form-row two-cols" style={{ marginTop: '0.75rem' }}>
          <div className="form-group">
            <div className="sub-label-row">
              <label className="sub-label">Góc xoay / Độ nghiêng: {style.rotation || 0}°</label>
              {(style.rotation || 0) !== 0 && (
                <button
                  type="button"
                  className="btn-reset-rot"
                  onClick={() => onChange({ rotation: 0 })}
                  title="Đặt lại góc cân bằng (0°)"
                >
                  ↺ 0° Cân bằng
                </button>
              )}
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              step={1}
              value={style.rotation || 0}
              onChange={(e) => onChange({ rotation: parseInt(e.target.value, 10) })}
              className="range-slider"
            />
          </div>

          <div className="form-group">
            <label className="sub-label">Chiều rộng khung (Wrap): {style.maxWidthPercent}%</label>
            <input
              type="range"
              min={30}
              max={98}
              step={1}
              value={style.maxWidthPercent}
              onChange={(e) => onChange({ maxWidthPercent: parseInt(e.target.value, 10) })}
              className="range-slider"
            />
          </div>
        </div>
      </div>

      {/* 3. Word-by-Word Highlight & Animation Engine */}
      <div className="style-section animation-section">
        <label className="section-label">✨ Hiệu Ứng Nổi Từng Chữ (Viral Animation)</label>

        <div className="form-row two-cols">
          <div className="form-group">
            <label className="sub-label">Kiểu hoạt ảnh từ đang đọc</label>
            <select
              value={style.animationType}
              onChange={(e) => onChange({ animationType: e.target.value as any })}
              className="select-input"
            >
              <option value="karaoke-pop">⚡ Nhảy To Chữ Vàng (Hormozi / TikTok)</option>
              <option value="karaoke-glow">🔮 Phát Sáng Neon Rực Rỡ (Cyberpunk)</option>
              <option value="karaoke-bounce">💥 Bật Nảy Hoạt Hình (MrBeast Comic)</option>
              <option value="karaoke-pill">💊 Viên Nhộng Gradient (CapCut Capsule)</option>
              <option value="none">🎬 Tĩnh Điện Ảnh (Netflix Classic)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="sub-label">Độ phóng to (Scale): {(style.activeWordScale || 1.22).toFixed(2)}x</label>
            <input
              type="range"
              min={1.0}
              max={1.5}
              step={0.05}
              value={style.activeWordScale || 1.22}
              onChange={(e) => onChange({ activeWordScale: parseFloat(e.target.value) })}
              className="range-slider"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label className="sub-label">Màu từ đang đọc (Active Word Color)</label>
          <div className="quick-color-row">
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={style.activeWordColor.startsWith('#') ? style.activeWordColor : '#FFE600'}
                onChange={(e) => onChange({ activeWordColor: e.target.value })}
                className="color-input"
              />
              <span className="color-value-text">{style.activeWordColor}</span>
            </div>

            <div className="palette-swatches">
              {QUICK_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="palette-swatch-btn"
                  style={{ backgroundColor: c }}
                  onClick={() => onChange({ activeWordColor: c })}
                  title={`Chọn màu ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Audio-Video Sync Lead-In Offset */}
        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <div className="sub-label-row">
            <label className="sub-label">
              ⚡ Độ bù trừ âm thanh (Audio Sync Lead-In): {Math.round((style.audioSyncOffset || -0.12) * 1000)}ms
            </label>
            <button
              type="button"
              className="btn-reset-rot"
              onClick={() => onChange({ audioSyncOffset: -0.12 })}
              title="Đặt về chuẩn -120ms (khớp tiếng chuẩn)"
            >
              ↺ Chuẩn (-120ms)
            </button>
          </div>
          <input
            type="range"
            min={-0.35}
            max={0.15}
            step={0.01}
            value={style.audioSyncOffset ?? -0.12}
            onChange={(e) => onChange({ audioSyncOffset: parseFloat(e.target.value) })}
            className="range-slider"
          />
        </div>
      </div>

      {/* 4. Text Stroke & Anti-Aliased Shadow */}
      <div className="style-section effect-section">
        <label className="section-label">🎨 Viền Chữ Khử Răng Cưa & Đổ Bóng (Outline)</label>
        
        <div className="form-row two-cols">
          <div className="form-group">
            <label className="sub-label">Độ dày viền nét: {style.strokeWidth}px</label>
            <input
              type="range"
              min={0}
              max={8}
              step={0.5}
              value={style.strokeWidth}
              onChange={(e) => onChange({ strokeWidth: parseFloat(e.target.value) })}
              className="range-slider"
            />
          </div>

          <div className="form-group">
            <label className="sub-label">Màu viền</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={style.strokeColor.startsWith('#') ? style.strokeColor : '#000000'}
                onChange={(e) => onChange({ strokeColor: e.target.value })}
                className="color-input"
              />
              <span className="color-value-text">{style.strokeColor}</span>
            </div>
          </div>
        </div>

        <div className="form-row two-cols">
          <div className="form-group">
            <label className="sub-label">Độ mờ bóng (Shadow): {style.shadowBlur}px</label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={style.shadowBlur}
              onChange={(e) => onChange({ shadowBlur: parseInt(e.target.value, 10) })}
              className="range-slider"
            />
          </div>

          <div className="form-group">
            <label className="sub-label">Màu bóng</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={style.shadowColor.startsWith('#') ? style.shadowColor : '#000000'}
                onChange={(e) => onChange({ shadowColor: e.target.value })}
                className="color-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Background Box */}
      <div className="style-section box-section">
        <label className="section-label">📦 Hộp Nền Khung Phụ Đề (Background Box)</label>

        <div className="form-row two-cols">
          <div className="form-group">
            <label className="sub-label">Độ trong suốt nền: {Math.round(style.boxOpacity * 100)}%</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={style.boxOpacity}
              onChange={(e) => onChange({ boxOpacity: parseFloat(e.target.value) })}
              className="range-slider"
            />
          </div>

          <div className="form-group">
            <label className="sub-label">Màu hộp nền</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={style.boxColor.startsWith('#') ? style.boxColor : '#000000'}
                onChange={(e) => onChange({ boxColor: e.target.value })}
                className="color-input"
              />
              <span className="color-value-text">{style.boxColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
