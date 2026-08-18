import { useEffect, useState, useMemo } from 'react';

interface Props {
  progress: number;
  model?: string;
}

const STAGE_MESSAGES = {
  gemini: {
    start: [
      '📝 Đang phân tích ngữ cảnh và dấu câu tiếng Việt...',
      '✨ Đang tối ưu hóa cấu trúc văn bản âm học...',
    ],
    synthesizing: [
      '🎙 Đang tổng hợp giọng đọc qua Google Gemini AI...',
      '⚡ Đang điều biến ngữ điệu truyền cảm...',
      '🔊 Đang xử lý sắc thái giọng tự nhiên chuẩn AI...',
      '✨ Đang kiến tạo âm thanh biểu cảm cao cấp...',
    ],
    finishing: [
      '🎧 Đang hoàn thiện file âm thanh chất lượng cao...',
      '🌊 Đang tinh chỉnh chất âm phòng thu...',
    ],
  },
  cloning: {
    start: [
      '🧬 Đang trích xuất đặc trưng âm sắc từ audio mẫu...',
      '🎙 Đang phân tích tần số và chất giọng người nói...',
    ],
    synthesizing: [
      '⚡ Đang nhân bản giọng nói theo thuật toán Zero-Shot AI...',
      '🗣 Đang tổng hợp từng đoạn ngữ âm theo phong cách của bạn...',
      '🎵 Đang tái tạo cao độ và nhịp thở tự nhiên...',
      '✨ Đang mô phỏng ngữ điệu người nói chân thực...',
    ],
    finishing: [
      '🌊 Đang khử nhiễu và làm mượt mà dải âm thanh...',
      '🎧 Đang ghép nhịp nghỉ tự nhiên và xuất file...',
    ],
  },
  local: {
    start: [
      '🇻🇳 Đang nạp mô hình giọng chuẩn 3 miền Bắc - Trung - Nam...',
      '📝 Đang ngắt nhịp và xử lý thanh điệu tiếng Việt...',
    ],
    synthesizing: [
      '🎙 Đang tổng hợp chất giọng vùng miền truyền cảm...',
      '🔊 Đang tạo ngữ điệu phát thanh viên chuyên nghiệp...',
      '⚡ Đang xử lý nhịp điệu và độ nhấn câu tự nhiên...',
    ],
    finishing: [
      '⚡ Đang mã hóa và hoàn thiện âm thanh phòng thu...',
      '🎧 Sắp hoàn tất bản thu âm tiếng Việt...',
    ],
  },
};

export function ProgressBar({ progress, model = 'gemini-2.5-flash-preview-tts' }: Props) {
  const [randomSeed, setRandomSeed] = useState(() => Math.floor(Math.random() * 100));

  useEffect(() => {
    // Pick a new random phrase every time a new synthesis starts
    if (progress <= 10) {
      setRandomSeed(Math.floor(Math.random() * 100));
    }
  }, [progress]);

  const category = useMemo(() => {
    if (model === 'f5-tts-vietnamese') return 'cloning';
    if (model === 'vieneu-tts') return 'local';
    return 'gemini';
  }, [model]);

  const stageText = useMemo(() => {
    if (progress >= 100) return '✨ Hoàn tất!';

    const msgGroup = STAGE_MESSAGES[category];
    if (progress <= 35) {
      const list = msgGroup.start;
      return list[randomSeed % list.length];
    } else if (progress <= 75) {
      const list = msgGroup.synthesizing;
      return list[randomSeed % list.length];
    } else {
      const list = msgGroup.finishing;
      return list[randomSeed % list.length];
    }
  }, [progress, category, randomSeed]);

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
