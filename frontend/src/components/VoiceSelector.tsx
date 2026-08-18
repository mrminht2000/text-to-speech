import type { VoiceInfo } from '../types/tts';

interface Props {
  voices: VoiceInfo[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({ voices, value, onChange, disabled }: Props) {
  const currentVoice = voices.find((v) => v.id === value);

  return (
    <div className="voice-selector-wrapper">
      <div className="voice-header-row">
        <label htmlFor="voice-select" className="control-label">
          🎙 Giọng đọc AI ({voices.length} giọng)
        </label>
        {currentVoice && (
          <span className="voice-style-tag">{currentVoice.style}</span>
        )}
      </div>
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
            {voice.label} ({voice.style})
          </option>
        ))}
      </select>
    </div>
  );
}
