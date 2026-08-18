import React from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const SPEED_MARKS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function SpeedSlider({ value, onChange, disabled }: Props) {
  return (
    <div className="speed-slider-wrapper">
      <label htmlFor="speed-slider" className="control-label">
        ⚡ Tốc độ: <span className="speed-value">{value.toFixed(2)}x</span>
      </label>
      <input
        id="speed-slider"
        type="range"
        className="speed-slider"
        min={0.5}
        max={2.0}
        step={0.25}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        aria-label={`Tốc độ đọc: ${value}x`}
        list="speed-marks"
      />
      <datalist id="speed-marks">
        {SPEED_MARKS.map((m) => <option key={m} value={m} />)}
      </datalist>
      <div className="speed-labels">
        <span>0.5x</span>
        <span>1x (bình thường)</span>
        <span>2x</span>
      </div>
    </div>
  );
}
