interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const PRESET_SPEEDS = [0.8, 1.0, 1.2, 1.5];

export function SpeedSlider({ value, onChange, disabled }: Props) {
  return (
    <div className="speed-slider-wrapper">
      <div className="speed-header">
        <label htmlFor="speed-slider" className="control-label">
          ⚡ Tốc độ: <span className="speed-value">{value.toFixed(1)}x</span>
        </label>
        <div className="speed-presets">
          {PRESET_SPEEDS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`preset-btn ${value === preset ? 'active' : ''}`}
              onClick={() => onChange(preset)}
              disabled={disabled}
            >
              {preset.toFixed(1)}x
            </button>
          ))}
        </div>
      </div>
      <input
        id="speed-slider"
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="speed-slider"
        aria-label="Điều chỉnh tốc độ phát"
      />
      <div className="speed-labels">
        <span>0.5x (Chậm)</span>
        <span>1.0x (Chuẩn)</span>
        <span>2.0x (Nhanh)</span>
      </div>
    </div>
  );
}
