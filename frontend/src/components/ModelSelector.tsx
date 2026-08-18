import type { ModelInfo } from '../types/tts';

interface Props {
  models: ModelInfo[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ models, value, onChange, disabled }: Props) {
  const currentModel = models.find((m) => m.id === value);

  return (
    <div className="model-selector-wrapper">
      <label htmlFor="model-select" className="control-label">
        Mô hình TTS
      </label>
      <select
        id="model-select"
        className="voice-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Chọn mô hình TTS"
      >
        {models.map((model) => (
          <option
            key={model.id}
            value={model.id}
            disabled={!model.isAvailable}
          >
            {model.name} ({model.provider})
          </option>
        ))}
      </select>
      {currentModel && (
        <span className="model-desc">{currentModel.description}</span>
      )}
    </div>
  );
}
