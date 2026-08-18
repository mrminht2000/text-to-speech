import type { VoiceInfo } from '../types/tts';

interface Props {
  voices: VoiceInfo[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({ voices, value, onChange, disabled }: Props) {
  return (
    <div className="voice-selector-wrapper">
      <label htmlFor="voice-select" className="control-label">
        🎙 Giọng đọc
      </label>
      <select
        id="voice-select"
        className="voice-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Chọn giọng đọc"
      >
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.label}
          </option>
        ))}
      </select>
    </div>
  );
}
