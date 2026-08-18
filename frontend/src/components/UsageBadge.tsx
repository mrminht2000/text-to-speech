import type { TtsUsage } from '../types/tts';

interface Props {
  usage: TtsUsage | null;
}

export function UsageBadge({ usage }: Props) {
  if (!usage) return null;

  return (
    <div className="usage-container" aria-label="Mức tiêu thụ Token">
      <div className="usage-header">
        <span className="usage-icon">📊</span>
        <span className="usage-title">Mức tiêu thụ Token</span>
      </div>
      <div className="usage-badges">
        <div className="usage-pill prompt" title="Số token của văn bản đầu vào">
          <span className="pill-label">📝 Prompt:</span>
          <span className="pill-val">{usage.promptTokens.toLocaleString()}</span>
        </div>
        <div className="usage-pill audio" title="Số token của âm thanh sinh ra">
          <span className="pill-label">🔊 Audio:</span>
          <span className="pill-val">{usage.candidatesTokens.toLocaleString()}</span>
        </div>
        <div className="usage-pill total highlight" title="Tổng số token đã tiêu thụ">
          <span className="pill-label">⚡ Tổng cộng:</span>
          <span className="pill-val">{usage.totalTokens.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
