import type { TtsUsage } from '../types/tts';

interface Props {
  usage: TtsUsage | null;
}

export function UsageBadge({ usage }: Props) {
  if (!usage || usage.totalTokens === 0) return null;

  return (
    <div className="usage-container">
      <span className="usage-title">⚡ Google Model Usage:</span>
      <div className="usage-badges">
        <span className="usage-pill" title="Prompt Tokens (Input)">
          Input: <strong>{usage.promptTokens.toLocaleString()}</strong> tokens
        </span>
        <span className="usage-pill" title="Candidates Tokens (Audio Output)">
          Audio: <strong>{usage.candidatesTokens.toLocaleString()}</strong> tokens
        </span>
        <span className="usage-pill highlight" title="Total Tokens">
          Tổng: <strong>{usage.totalTokens.toLocaleString()}</strong> tokens
        </span>
      </div>
    </div>
  );
}
