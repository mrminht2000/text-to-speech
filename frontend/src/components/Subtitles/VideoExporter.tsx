import { useState, type RefObject } from 'react';
import { SubtitleSegment, SubtitleStyle } from '../../types/subtitles';
import { generateSrt, generateVtt, findActiveSegment, findActiveWordIndex } from '../../utils/subtitleUtils';

interface VideoExporterProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  segments: SubtitleSegment[];
  style: SubtitleStyle;
  videoSrc: string | null;
}

export function VideoExporter({ videoRef, segments, style, videoSrc }: VideoExporterProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [exportError, setExportError] = useState<string | null>(null);

  // 1. Export SRT file
  const handleExportSrt = () => {
    if (segments.length === 0) return;
    const srtContent = generateSrt(segments);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Export VTT file
  const handleExportVtt = () => {
    if (segments.length === 0) return;
    const vttContent = generateVtt(segments);
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${Date.now()}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Export High-Resolution Video with Burned-in Animated Subtitles
  const handleExportVideo = async () => {
    const video = videoRef.current;
    if (!video || !videoSrc || segments.length === 0) {
      setExportError('Vui lòng chọn video và tạo phụ đề trước khi xuất video.');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setExportError(null);

    // Preload custom Google Fonts to prevent fallback font flicker
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font load check:', e);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false, alpha: false });
    if (!ctx) {
      setExportError('Không thể khởi tạo Canvas 2D để render video.');
      setIsExporting(false);
      return;
    }

    // High quality canvas settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    // Create audio context to capture video audio
    let audioStream: MediaStream | null = null;
    try {
      // @ts-ignore
      if (video.captureStream) {
        // @ts-ignore
        audioStream = video.captureStream();
      } else if ((video as any).mozCaptureStream) {
        audioStream = (video as any).mozCaptureStream();
      }
    } catch (e) {
      console.warn('Could not capture audio stream from video element:', e);
    }

    const canvasStream = canvas.captureStream(60);
    const combinedTracks = [...canvasStream.getVideoTracks()];
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      combinedTracks.push(audioStream.getAudioTracks()[0]);
    }
    const combinedStream = new MediaStream(combinedTracks);

    const mimeType = MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
      ? 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm;codecs=vp9';

    const recordedChunks: Blob[] = [];
    // 16 Mbps Ultra-Crisp Master Bitrate to eliminate all blurriness & pixelation!
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 16_000_000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minhtts_subtitled_master_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setProgress(100);
      video.pause();
      video.currentTime = 0;
    };

    mediaRecorder.start();

    // Start video playback and render frames
    video.currentTime = 0;
    try {
      await video.play();
    } catch (err) {
      console.warn('Autoplay notice:', err);
    }

    const duration = video.duration;

    const renderLoop = () => {
      if (!isExporting && mediaRecorder.state !== 'recording') return;

      if (video.ended || video.currentTime >= duration - 0.05) {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        return;
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Render Subtitles onto Canvas with razor-sharp vector rendering
      const curTime = video.currentTime;
      const currentSegment = findActiveSegment(segments, curTime, style.audioSyncOffset);

      if (currentSegment) {
        drawSubtitleOnCanvas(ctx, currentSegment, curTime, style, width, height);
      }

      // Update progress
      const p = Math.min(Math.round((curTime / duration) * 100), 99);
      setProgress(p);

      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
  };

  return (
    <div className="video-exporter-card">
      <div className="exporter-header">
        <span className="exporter-icon">🚀</span>
        <div>
          <h4 className="exporter-title">Xuất File & Render Video</h4>
          <p className="exporter-desc">Tải file phụ đề rời hoặc xuất video hoàn chỉnh gắn sẵn phụ đề chất lượng cao.</p>
        </div>
      </div>

      <div className="export-action-buttons">
        <button
          type="button"
          className="btn-export-file srt"
          onClick={handleExportSrt}
          disabled={segments.length === 0}
          title="Tải tệp phụ đề .SRT"
        >
          📄 Tải Phụ Đề (.SRT)
        </button>

        <button
          type="button"
          className="btn-export-file vtt"
          onClick={handleExportVtt}
          disabled={segments.length === 0}
          title="Tải tệp phụ đề .VTT cho web"
        >
          📄 Tải Phụ Đề (.VTT)
        </button>

        <button
          type="button"
          className="btn-export-video-primary"
          onClick={handleExportVideo}
          disabled={isExporting || segments.length === 0 || !videoSrc}
          title="Render video MP4 sắc nét với phụ đề đã tạo"
        >
          {isExporting ? `⏳ Đang render video (${progress}%)...` : '🎬 Xuất Video MP4 (Sắc Nét 60FPS)'}
        </button>
      </div>

      {isExporting && (
        <div className="export-progress-container">
          <div className="export-progress-bar">
            <div className="export-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="export-progress-text">Đang render video chất lượng cao & đồng bộ phụ đề: {progress}%</span>
        </div>
      )}

      {exportError && <div className="export-error-msg">⚠️ {exportError}</div>}
    </div>
  );
}

// Canvas Subtitle Drawing Helper with Anti-Aliased Subpixel Rendering
function drawSubtitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  segment: SubtitleSegment,
  currentTime: number,
  style: SubtitleStyle,
  canvasWidth: number,
  canvasHeight: number
) {
  const scale = canvasWidth / 800; // Relative scaling factor
  const fontSize = style.fontSize * scale;
  const posX = (style.positionX / 100) * canvasWidth;
  const posY = (style.positionY / 100) * canvasHeight;

  ctx.save();
  ctx.translate(posX, posY);
  if (style.rotation) {
    ctx.rotate((style.rotation * Math.PI) / 180);
  }

  ctx.font = `${style.fontWeight} ${style.fontStyle} ${fontSize}px ${style.fontFamily}`;
  ctx.textAlign = style.textAlign;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.miterLimit = 2;

  const textToDraw =
    style.textTransform === 'uppercase'
      ? segment.text.toUpperCase()
      : segment.text;

  const textMetrics = ctx.measureText(textToDraw);
  const textWidth = textMetrics.width;
  const paddingX = style.paddingX * scale;
  const paddingY = style.paddingY * scale;

  // 1. Draw Box Background
  if (style.boxOpacity > 0) {
    ctx.fillStyle = hexToRgba(style.boxColor, style.boxOpacity);
    const boxX = -textWidth / 2 - paddingX;
    const boxY = -fontSize / 2 - paddingY;
    const boxW = textWidth + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const radius = style.borderRadius * scale;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.fill();
  }

  // 2. Configure Shadow & Stroke
  if (style.shadowBlur > 0 && style.shadowColor) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur * scale;
    ctx.shadowOffsetX = style.shadowOffsetX * scale;
    ctx.shadowOffsetY = style.shadowOffsetY * scale;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // 3. Draw Stroke (Outline) with subpixel anti-aliasing
  if (style.strokeWidth > 0 && style.strokeColor && style.strokeColor !== 'transparent') {
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth * scale * 2;
    ctx.strokeText(textToDraw, 0, 0);
  }

  // 4. Draw Fill Text / Karaoke Words
  if (segment.words && segment.words.length > 0 && style.animationType !== 'none') {
    const activeWordIdx = findActiveWordIndex(segment.words, currentTime, style.audioSyncOffset);
    let currentX = -textWidth / 2;

    segment.words.forEach((w, idx) => {
      const wordText = style.textTransform === 'uppercase' ? w.word.toUpperCase() + ' ' : w.word + ' ';
      const wMetrics = ctx.measureText(wordText);
      const isActive = idx === activeWordIdx;
      const wordCenterX = currentX + wMetrics.width / 2;

      ctx.save();
      if (isActive) {
        const wordScale = style.activeWordScale || 1.22;
        ctx.translate(wordCenterX, 0);
        ctx.scale(wordScale, wordScale);

        if (style.animationType === 'karaoke-glow') {
          ctx.shadowColor = style.activeWordColor;
          ctx.shadowBlur = 18 * scale;
        } else if (style.animationType === 'karaoke-bounce') {
          ctx.rotate(-0.04);
        } else if (style.animationType === 'karaoke-pill') {
          ctx.fillStyle = 'rgba(236, 72, 153, 0.9)';
          ctx.beginPath();
          ctx.roundRect(-wMetrics.width / 2 - 4 * scale, -fontSize / 2 - 2 * scale, wMetrics.width + 8 * scale, fontSize + 4 * scale, 12 * scale);
          ctx.fill();
        }

        // Draw active word stroke & fill
        if (style.strokeWidth > 0 && style.strokeColor) {
          ctx.strokeStyle = style.strokeColor;
          ctx.lineWidth = style.strokeWidth * scale * 2;
          ctx.strokeText(wordText, 0, 0);
        }

        ctx.fillStyle = style.animationType === 'karaoke-pill' ? '#FFFFFF' : style.activeWordColor;
        ctx.fillText(wordText, 0, 0);
      } else {
        // Inactive words
        if (style.strokeWidth > 0 && style.strokeColor) {
          ctx.strokeStyle = style.strokeColor;
          ctx.lineWidth = style.strokeWidth * scale * 2;
          ctx.strokeText(wordText, wordCenterX, 0);
        }
        ctx.fillStyle = style.textColor;
        ctx.fillText(wordText, wordCenterX, 0);
      }
      ctx.restore();

      currentX += wMetrics.width;
    });
  } else {
    // Static full line text
    if (style.strokeWidth > 0 && style.strokeColor) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth * scale * 2;
      ctx.strokeText(textToDraw, 0, 0);
    }
    ctx.fillStyle = style.textColor;
    ctx.fillText(textToDraw, 0, 0);
  }

  ctx.restore();
}

function hexToRgba(hex: string, opacity: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0,0,0,${opacity})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
