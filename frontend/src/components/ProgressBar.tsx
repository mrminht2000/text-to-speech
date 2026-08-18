interface Props {
  progress: number;
  statusText?: string;
}

export function ProgressBar({ progress, statusText = 'Đang tổng hợp giọng đọc AI...' }: Props) {
  return (
    <div className="progress-container" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-header">
        <span className="progress-status">{statusText}</span>
        <span className="progress-percent">{Math.round(progress)}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
