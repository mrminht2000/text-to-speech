import type { TtsUsage } from '../types/tts';

interface Props {
  usage: TtsUsage | null;
}

export function UsageBadge({ usage }: Props) {
  if (!usage) return null;

  return (
    <div className="usage-container" aria-label="Mức tiêu thụ Token">
      <span className="usage-title">📊 Token Usage:</span>
      <div className="usage-badges">
        <span className="usage-pill" title="Token văn bản đầu vào">
          Prompt: <strong>{usage.promptTokens.toLocaleString()}</strong>
        </span>
        <span className="usage-pill" title="Token âm thanh đầu ra">
          Audio: <strong>{usage.candidatesTokens.toLocaleString()}</strong>
        </span>
        <span className="usage-pill highlight" title="Tổng số token">
          Tổng: <strong>{usage.totalTokens.toLocaleString()}</strong>
        </span>
      </div>
    </div>
  );
}
