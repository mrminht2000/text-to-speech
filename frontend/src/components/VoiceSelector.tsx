import type { VoiceInfo } from '../types/tts';

interface Props {
  voices: VoiceInfo[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({ voices, value, onChange, disabled }: Props) {
  const currentVoice = voices.find((v) => v.id === value);

  // Group voices by provider
  const groupedVoices = voices.reduce<Record<string, VoiceInfo[]>>((acc, voice) => {
    const provider = voice.provider || 'Khác';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(voice);
    return acc;
  }, {});

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
        {Object.entries(groupedVoices).map(([providerName, providerVoices]) => (
          <optgroup key={providerName} label={`── ${providerName} ──`}>
            {providerVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.label} ({voice.style})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
