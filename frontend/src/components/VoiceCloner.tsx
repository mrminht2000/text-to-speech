import { useState, useRef } from 'react';

interface Props {
  referenceAudio: string | null;
  onReferenceAudioChange: (base64: string | null) => void;
  referenceText: string;
  onReferenceTextChange: (text: string) => void;
  disabled?: boolean;
}

export function VoiceCloner({
  referenceAudio,
  onReferenceAudioChange,
  referenceText,
  onReferenceTextChange,
  disabled,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onReferenceAudioChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = () => {
          onReferenceAudioChange(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert('Không thể truy cập microphone. Vui lòng cấp quyền trong trình duyệt.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleClear = () => {
    onReferenceAudioChange(null);
    onReferenceTextChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="voice-cloner-container">
      <div className="cloner-header">
        <span className="cloner-title">🎙️ Zero-Shot Voice Cloning (Nhân Bản Giọng Nói)</span>
        <span className="cloner-badge">F5-TTS Flow Matching</span>
      </div>
      <p className="cloner-desc">
        Tải lên file âm thanh mẫu (3–10 giây) hoặc thu âm trực tiếp để mô hình F5-TTS đọc văn bản bằng chính giọng nói này:
      </p>

      <div className="cloner-actions-row">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn-upload-sample"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRecording}
        >
          📁 Tải file Audio mẫu (.wav, .mp3)
        </button>

        {!isRecording ? (
          <button
            type="button"
            className="btn-record-sample"
            onClick={startRecording}
            disabled={disabled}
          >
            🔴 Thu âm trực tiếp
          </button>
        ) : (
          <button
            type="button"
            className="btn-record-sample recording"
            onClick={stopRecording}
          >
            ⏹ Dừng thu âm ({recordSeconds}s)
          </button>
        )}
      </div>

      {referenceAudio && (
        <div className="cloner-preview-box">
          <div className="preview-row">
            <span className="preview-label">🔊 Giọng mẫu đã tải:</span>
            <audio controls src={referenceAudio} className="cloner-audio-preview" />
            <button
              type="button"
              className="btn-clear-sample"
              onClick={handleClear}
              disabled={disabled}
              title="Xóa mẫu giọng"
            >
              ✕ Xóa
            </button>
          </div>
          <div className="cloner-transcript-row">
            <input
              type="text"
              className="cloner-transcript-input"
              value={referenceText}
              onChange={(e) => onReferenceTextChange(e.target.value)}
              placeholder="Lời thoại của đoạn audio mẫu (Tùy chọn, giúp tăng độ chính xác)"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
