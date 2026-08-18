import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInput({ value, onChange, maxLength = 5000, disabled }: Props) {
  const count = value.length;
  const isNearLimit = count > maxLength * 0.9;
  const isOverLimit = count > maxLength;

  return (
    <div className="text-input-wrapper">
      <textarea
        id="tts-text-input"
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập văn bản tiếng Việt cần chuyển đổi..."
        maxLength={maxLength}
        disabled={disabled}
        rows={8}
        aria-label="Văn bản cần chuyển đổi"
        aria-describedby="char-count"
      />
      <div
        id="char-count"
        className={`char-count ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}
      >
        {count.toLocaleString()} / {maxLength.toLocaleString()}
      </div>
    </div>
  );
}
