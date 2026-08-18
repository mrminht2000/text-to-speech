interface Props {
  progress: number;
}

export function ProgressBar({ progress }: Props) {
  let stageText = 'Đang khởi động tiến trình...';
  if (progress > 5 && progress <= 35) {
    stageText = '📝 Đang phân tích ngữ điệu tiếng Việt...';
  } else if (progress > 35 && progress <= 70) {
    stageText = '🎙 Đang tổng hợp giọng đọc AI (Gemini)...';
  } else if (progress > 70 && progress < 100) {
    stageText = '⚡ Đang mã hóa và hoàn thiện file âm thanh...';
  } else if (progress >= 100) {
    stageText = '✨ Hoàn tất!';
  }

  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-header">
        <span className="progress-status">{stageText}</span>
        <span className="progress-percent">{Math.min(100, Math.round(progress))}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
        >
          <div className="progress-shimmer" />
        </div>
      </div>
    </div>
  );
}
