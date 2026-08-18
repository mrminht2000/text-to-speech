import { useRef, useState, type ChangeEvent } from 'react';
import { SubtitleSegment, SubtitleStyle } from '../../types/subtitles';
import { DEFAULT_SUBTITLE_STYLE, autoFormatSubtitleSegments, calculateAutoSubtitleLayout } from '../../utils/subtitleUtils';
import { transcribeMedia } from '../../services/subtitleApi';
import { extract16kWavFromMedia } from '../../utils/audioExtractor';
import { VideoSubtitleCanvas } from '../Subtitles/VideoSubtitleCanvas';
import { SubtitleStylePanel } from '../Subtitles/SubtitleStylePanel';
import { SubtitleTimelineEditor } from '../Subtitles/SubtitleTimelineEditor';
import { VideoExporter } from '../Subtitles/VideoExporter';

export function VideoSubtitlesTab() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [style, setStyle] = useState<SubtitleStyle>(DEFAULT_SUBTITLE_STYLE);
  const [activeSubTab, setActiveSubTab] = useState<'style' | 'timeline'>('style');

  // AI Transcription State
  const [provider, setProvider] = useState<'local-whisper' | 'gemini' | 'openai'>('local-whisper');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-flash-latest');
  const [language, setLanguage] = useState<string>('vi');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleStyleChange = (updated: Partial<SubtitleStyle>) => {
    setStyle((prev) => ({ ...prev, ...updated }));
  };

  // Handle Video File Upload & Auto-calculate safe layout based on aspect ratio
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setErrorMessage(null);
    setTranscribeStatus(null);

    // Auto-detect video dimensions and compute safe aspect-ratio layout (9:16 vs 16:9)
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const autoLayout = calculateAutoSubtitleLayout(tempVideo.videoWidth, tempVideo.videoHeight);
      setStyle((prev) => ({ ...prev, ...autoLayout }));
    };
  };

  // Run AI Speech-to-Text Transcription
  const handleStartTranscribe = async () => {
    if (!videoFile) {
      setErrorMessage('Vui lòng chọn video trước khi bắt đầu tạo phụ đề.');
      return;
    }

    setIsTranscribing(true);
    setErrorMessage(null);
    setTranscribeStatus('🎵 Đang trích xuất và chuẩn hóa âm thanh 16kHz từ video...');

    try {
      // 1. In-browser 16kHz mono audio extraction
      let payloadFile: File | Blob = videoFile;
      let payloadBase64: string | undefined = undefined;

      try {
        const { wavBlob, wavBase64 } = await extract16kWavFromMedia(videoFile);
        payloadFile = wavBlob;
        payloadBase64 = wavBase64;
        setTranscribeStatus(`🚀 Đang nhận diện phụ đề qua ${provider === 'local-whisper' ? 'mô hình AI local' : provider.toUpperCase()}...`);
      } catch (extractErr) {
        console.warn('AudioContext extract notice, falling back to direct media upload:', extractErr);
      }

      const customKey = localStorage.getItem('gemini_api_key') || undefined;

      // 2. Call Transcription API
      const result = await transcribeMedia({
        file: payloadFile,
        audioBase64: payloadBase64,
        provider,
        model: provider === 'gemini' ? geminiModel : undefined,
        language,
        wordTimestamps: true,
        apiKey: customKey,
      });

      if (!result.segments || result.segments.length === 0) {
        setErrorMessage('Không nhận diện được giọng nói trong đoạn video này. Vui lòng kiểm tra âm lượng video.');
      } else {
        // Automatically split long sentences into punchy, compact 3-5 word TikTok chunks
        const formatted = autoFormatSubtitleSegments(result.segments, 5, 28);
        setSegments(formatted);
        setTranscribeStatus(`✅ Đã tạo thành công ${formatted.length} câu phụ đề ngắn gọn (${result.duration}s).`);
        setActiveSubTab('timeline');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Không thể tạo phụ đề bằng AI.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Load sample demo video
  const handleLoadDemo = () => {
    setVideoSrc('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    setSegments([
      {
        id: 1,
        start: 0.5,
        end: 3.2,
        text: 'Chào mừng các bạn đến với ứng dụng MinhTTS Studio.',
        words: [
          { word: 'Chào', start: 0.5, end: 0.9 },
          { word: 'mừng', start: 0.9, end: 1.3 },
          { word: 'các', start: 1.3, end: 1.6 },
          { word: 'bạn', start: 1.6, end: 2.0 },
          { word: 'đến', start: 2.0, end: 2.3 },
          { word: 'với', start: 2.3, end: 2.6 },
          { word: 'MinhTTS.', start: 2.6, end: 3.2 },
        ],
      },
      {
        id: 2,
        start: 3.5,
        end: 7.0,
        text: 'Hệ thống tự động nhận diện và ghép phụ đề video thông minh.',
        words: [
          { word: 'Hệ', start: 3.5, end: 3.9 },
          { word: 'thống', start: 3.9, end: 4.4 },
          { word: 'tự', start: 4.4, end: 4.8 },
          { word: 'động', start: 4.8, end: 5.3 },
          { word: 'ghép', start: 5.3, end: 5.8 },
          { word: 'phụ', start: 5.8, end: 6.3 },
          { word: 'đề.', start: 6.3, end: 7.0 },
        ],
      },
    ]);
  };

  return (
    <div className="video-subtitles-tab-container">
      {/* Top Banner / Upload Bar */}
      <div className="subtitles-top-bar">
        <div className="file-upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-upload-video"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Tải Lên Video / Âm Thanh
          </button>
          <button
            type="button"
            className="btn-demo-video"
            onClick={handleLoadDemo}
          >
            🎥 Thử Video Mẫu Demo
          </button>
          {videoFile && <span className="file-name-badge">📄 {videoFile.name}</span>}
        </div>

        {/* AI Transcription Action Box */}
        <div className="ai-transcribe-bar">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="provider-select"
          >
            <option value="local-whisper">⚡ Local GPU Faster-Whisper Large-v3-Turbo (RTX 3060)</option>
            <option value="gemini">✨ Google Gemini Multimodal</option>
            <option value="openai">🤖 OpenAI Whisper-1</option>
          </select>

          {provider === 'gemini' && (
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="provider-select"
              title="Chọn mô hình Gemini"
            >
              <option value="gemini-flash-latest">Gemini Flash Latest (Nhanh & Chuẩn)</option>
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Mới nhất, dấu câu tốt)</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (Tự cắt nhịp câu)</option>
            </select>
          )}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-select"
          >
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇺🇸 Tiếng Anh</option>
            <option value="ja">🇯🇵 Tiếng Nhật</option>
          </select>

          <button
            type="button"
            className="btn-primary-generate"
            onClick={handleStartTranscribe}
            disabled={isTranscribing || (!videoFile && !videoSrc)}
          >
            {isTranscribing ? '⏳ Đang nhận diện...' : '✨ Tạo Phụ Đề AI'}
          </button>
        </div>
      </div>

      {transcribeStatus && <div className="transcribe-status-banner">{transcribeStatus}</div>}
      {errorMessage && <div className="transcribe-error-banner">⚠️ {errorMessage}</div>}

      {/* Main Studio 2-Column Grid */}
      <div className="subtitles-studio-grid">
        {/* Left Column: Interactive Video Canvas & Exporter */}
        <div className="studio-left-col">
          <div className="card-glass canvas-card">
            <h3 className="card-title">🎬 Khung Xem Trước Video (Kéo Thả Phụ Đề)</h3>
            <p className="card-hint">Bạn có thể nhấp chuột và kéo thả trực tiếp phụ đề trên video để đổi vị trí.</p>
            <VideoSubtitleCanvas
              videoRef={videoRef}
              videoSrc={videoSrc}
              segments={segments}
              style={style}
              onStyleChange={handleStyleChange}
            />
          </div>

          <VideoExporter
            videoRef={videoRef}
            videoSrc={videoSrc}
            segments={segments}
            style={style}
          />
        </div>

        {/* Right Column: Style Studio & Subtitle Timeline Editor */}
        <div className="studio-right-col">
          <div className="card-glass editor-card">
            {/* Sub Tabs */}
            <div className="editor-subtabs-nav">
              <button
                type="button"
                className={`subtab-btn ${activeSubTab === 'style' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('style')}
              >
                🎨 Tùy Biến Style & Font ({style.fontFamily.split(',')[0].replace(/'/g, '')})
              </button>
              <button
                type="button"
                className={`subtab-btn ${activeSubTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('timeline')}
              >
                📝 Chỉnh Sửa Phụ Đề ({segments.length} câu)
              </button>
            </div>

            {/* Sub Tab Contents */}
            <div className="subtab-content-area">
              {activeSubTab === 'style' && (
                <SubtitleStylePanel
                  style={style}
                  onChange={handleStyleChange}
                />
              )}

              {activeSubTab === 'timeline' && (
                <SubtitleTimelineEditor
                  segments={segments}
                  currentTime={videoRef.current?.currentTime || 0}
                  onSeek={(time) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                    }
                  }}
                  onSegmentsChange={setSegments}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
