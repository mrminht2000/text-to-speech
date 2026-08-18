import { useRef, useState, useEffect, type RefObject, type CSSProperties, type MouseEvent as ReactMouseEvent, type ChangeEvent } from 'react';
import { SubtitleSegment, SubtitleStyle } from '../../types/subtitles';
import { findActiveSegment, findActiveWordIndex, formatTime, generateSubtitleShadows, calculateAutoSubtitleLayout } from '../../utils/subtitleUtils';

interface VideoSubtitleCanvasProps {
  videoSrc: string | null;
  segments: SubtitleSegment[];
  style: SubtitleStyle;
  onStyleChange: (updated: Partial<SubtitleStyle>) => void;
  onTimeUpdate?: (currentTime: number) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
}

type TransformAction = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'e' | 'w' | 'n' | 's' | 'rot' | null;

interface TransformDragState {
  action: TransformAction;
  startX: number;
  startY: number;
  initPosX: number;
  initPosY: number;
  initFontSize: number;
  initMaxWidth: number;
  initRotation: number;
  boxCenterX: number;
  boxCenterY: number;
  initDistance: number;
}

export function VideoSubtitleCanvas({
  videoSrc,
  segments,
  style,
  onStyleChange,
  onTimeUpdate,
  videoRef,
}: VideoSubtitleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleBoxRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [transformAction, setTransformAction] = useState<TransformAction>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(true);
  const dragStateRef = useRef<TransformDragState | null>(null);

  // Ultra-responsive 60 FPS video clock synchronization for instant word-level subtitle pop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animId: number;

    const syncLoop = () => {
      if (video && !video.paused && !video.ended) {
        const time = video.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
      animId = requestAnimationFrame(syncLoop);
    };

    animId = requestAnimationFrame(syncLoop);

    const handleTime = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (video) {
        setDuration(video.duration);
        const autoLayout = calculateAutoSubtitleLayout(video.videoWidth, video.videoHeight);
        onStyleChange(autoLayout);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    // Initial state sync
    setIsPlaying(!video.paused);
    if (video.duration) setDuration(video.duration);

    video.addEventListener('timeupdate', handleTime);
    video.addEventListener('seeking', handleTime);
    video.addEventListener('seeked', handleTime);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener('timeupdate', handleTime);
      video.removeEventListener('seeking', handleTime);
      video.removeEventListener('seeked', handleTime);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef, onTimeUpdate, videoSrc]);

  // Keyboard shortcut: Space to toggle play/pause when video preview is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        if (videoRef.current && videoSrc) {
          e.preventDefault();
          togglePlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoRef, videoSrc]);

  // ---------------------------------------------------------------------------
  // Photoshop-Style Transformation Engine (Move, Corner Resize, Width, Rotation)
  // ---------------------------------------------------------------------------
  const handleTransformStart = (e: ReactMouseEvent, action: TransformAction) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current || !subtitleBoxRef.current) return;

    const boxRect = subtitleBoxRef.current.getBoundingClientRect();
    const boxCenterX = boxRect.left + boxRect.width / 2;
    const boxCenterY = boxRect.top + boxRect.height / 2;
    const initDistance = Math.hypot(e.clientX - boxCenterX, e.clientY - boxCenterY) || 1;

    dragStateRef.current = {
      action,
      startX: e.clientX,
      startY: e.clientY,
      initPosX: style.positionX,
      initPosY: style.positionY,
      initFontSize: style.fontSize,
      initMaxWidth: style.maxWidthPercent,
      initRotation: style.rotation || 0,
      boxCenterX,
      boxCenterY,
      initDistance,
    };

    setTransformAction(action);
    setIsFocused(true);
  };

  useEffect(() => {
    if (!transformAction) return;

    const handleMouseMove = (e: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // 1. Move Position (Center Drag)
      if (state.action === 'move') {
        const deltaXPercent = ((e.clientX - state.startX) / containerWidth) * 100;
        const deltaYPercent = ((e.clientY - state.startY) / containerHeight) * 100;
        const newX = Math.round(Math.min(Math.max(state.initPosX + deltaXPercent, 5), 95));
        const newY = Math.round(Math.min(Math.max(state.initPosY + deltaYPercent, 5), 95));

        onStyleChange({
          positionX: newX,
          positionY: newY,
        });
      }
      // 2. Corner Resize (Scale Font Size proportionally)
      else if (state.action === 'nw' || state.action === 'ne' || state.action === 'se' || state.action === 'sw') {
        const currentDist = Math.hypot(e.clientX - state.boxCenterX, e.clientY - state.boxCenterY);
        const scaleFactor = currentDist / state.initDistance;
        const newFontSize = Math.round(Math.min(Math.max(state.initFontSize * scaleFactor, 14), 72));

        onStyleChange({
          fontSize: newFontSize,
        });
      }
      // 3. Horizontal Edge Resize (Adjust maxWidth bounding wrap)
      else if (state.action === 'e' || state.action === 'w') {
        const distFromCenter = Math.abs(e.clientX - state.boxCenterX);
        const newWidthPercent = Math.round(Math.min(Math.max(((distFromCenter * 2) / containerWidth) * 100, 25), 98));

        onStyleChange({
          maxWidthPercent: newWidthPercent,
        });
      }
      // 4. Rotation Knob (Tilt/Rotate Subtitle)
      else if (state.action === 'rot') {
        const rad = Math.atan2(e.clientY - state.boxCenterY, e.clientX - state.boxCenterX);
        let deg = Math.round((rad * 180) / Math.PI) + 90; // stem points upward (-90deg offset)
        while (deg > 180) deg -= 360;
        while (deg < -180) deg += 360;

        // Snap to 0 within +-2 degrees for level alignment
        if (Math.abs(deg) <= 2) deg = 0;

        onStyleChange({
          rotation: deg,
        });
      }
    };

    const handleMouseUp = () => {
      setTransformAction(null);
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [transformAction, onStyleChange]);

  const activeSegment = findActiveSegment(segments, currentTime, style.audioSyncOffset);
  const activeWordIdx = activeSegment ? findActiveWordIndex(activeSegment.words, currentTime, style.audioSyncOffset) : -1;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().catch((err) => console.warn('Play error:', err));
    } else {
      video.pause();
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const currentRotation = style.rotation || 0;
  const isTransforming = transformAction !== null;

  // Construct Photoshop Subtitle Wrapper Style
  const subtitleBoxStyle: CSSProperties = {
    position: 'absolute',
    left: `${style.positionX}%`,
    top: `${style.positionY}%`,
    transform: `translate(-50%, -50%) rotate(${currentRotation}deg)`,
    maxWidth: `${style.maxWidthPercent}%`,
    width: 'max-content',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'normal',
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    color: style.textColor,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textTransform: style.textTransform,
    textAlign: style.textAlign,
    backgroundColor:
      style.boxOpacity > 0
        ? hexToRgba(style.boxColor, style.boxOpacity)
        : 'transparent',
    borderRadius: `${style.borderRadius}px`,
    padding: `${style.paddingY}px ${style.paddingX}px`,
    WebkitTextStroke:
      style.strokeWidth > 0 ? `${style.strokeWidth}px ${style.strokeColor}` : 'none',
    paintOrder: 'stroke fill',
    textShadow: generateSubtitleShadows(style),
    cursor: transformAction === 'move' ? 'grabbing' : 'grab',
    userSelect: 'none',
    zIndex: 10,
    lineHeight: 1.35,
    pointerEvents: 'auto',
    transition: isTransforming ? 'none' : 'box-shadow 0.15s, border-color 0.15s',
  };

  // When playing, strictly render activeSegment. When paused at start (time < 0.1s), allow previewing segment 0 for gizmo positioning.
  const displaySegment = isPlaying
    ? activeSegment
    : (activeSegment || (currentTime < 0.1 && segments.length > 0 ? segments[0] : null));

  return (
    <div className="video-canvas-wrapper">
      <div
        ref={containerRef}
        className="video-display-container"
        style={{ position: 'relative', overflow: 'hidden' }}
        onClick={() => setIsFocused(true)}
      >
        {videoSrc ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              className="main-preview-video"
              playsInline
              onClick={togglePlay}
            />
            {!isPlaying && (
              <button
                type="button"
                className="center-floating-play-btn"
                onClick={togglePlay}
                title="Phát video (Space)"
              >
                ▶
              </button>
            )}
          </>
        ) : (
          <div className="video-placeholder">
            <span className="placeholder-icon">🎬</span>
            <p className="placeholder-text">Chưa có video được chọn. Vui lòng tải video lên.</p>
          </div>
        )}

        {/* Photoshop-Style Transformable Subtitle Overlay */}
        {displaySegment && (
          <div
            ref={subtitleBoxRef}
            className={`draggable-subtitle-box ps-transform-box ${isTransforming ? 'transforming' : ''} ${
              isHovered || isFocused ? 'show-gizmo' : ''
            }`}
            style={subtitleBoxStyle}
            onMouseDown={(e) => handleTransformStart(e, 'move')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Kéo thân chữ để di chuyển, kéo các nút góc để chỉnh kích cỡ & độ nghiêng"
          >
            {/* Text Content */}
            {displaySegment.words && displaySegment.words.length > 0 && style.animationType !== 'none' ? (
              <span className="words-karaoke-wrapper">
                {displaySegment.words.map((w, idx) => {
                  const isActive = idx === activeWordIdx;
                  return (
                    <span
                      key={idx}
                      className={`karaoke-word ${isActive ? 'active-word' : ''}`}
                      style={getWordHighlightStyle(isActive, style)}
                    >
                      {style.textTransform === 'uppercase' ? w.word.toUpperCase() : w.word}{' '}
                    </span>
                  );
                })}
              </span>
            ) : (
              <span className="static-subtitle-text">
                {style.textTransform === 'uppercase' ? displaySegment.text.toUpperCase() : displaySegment.text}
              </span>
            )}

            {/* Photoshop-Style Handles & Rotation Gizmo */}
            <div className="ps-gizmo-layer">
              {/* Rotation Handle & Stem (Top) */}
              <div className="ps-rot-stem" />
              <div
                className="ps-handle ps-rot-handle"
                onMouseDown={(e) => handleTransformStart(e, 'rot')}
                title="Xoay nghiêng phụ đề (Kéo để xoay góc)"
              >
                ⟳
              </div>

              {/* 4 Corner Resize Handles */}
              <div
                className="ps-handle ps-nw"
                onMouseDown={(e) => handleTransformStart(e, 'nw')}
                title="Thu phóng cỡ chữ"
              />
              <div
                className="ps-handle ps-ne"
                onMouseDown={(e) => handleTransformStart(e, 'ne')}
                title="Thu phóng cỡ chữ"
              />
              <div
                className="ps-handle ps-se"
                onMouseDown={(e) => handleTransformStart(e, 'se')}
                title="Thu phóng cỡ chữ"
              />
              <div
                className="ps-handle ps-sw"
                onMouseDown={(e) => handleTransformStart(e, 'sw')}
                title="Thu phóng cỡ chữ"
              />

              {/* 2 Horizontal Width Handles */}
              <div
                className="ps-handle ps-w"
                onMouseDown={(e) => handleTransformStart(e, 'w')}
                title="Kéo rộng / thu hẹp chiều rộng khung"
              />
              <div
                className="ps-handle ps-e"
                onMouseDown={(e) => handleTransformStart(e, 'e')}
                title="Kéo rộng / thu hẹp chiều rộng khung"
              />
            </div>
          </div>
        )}

        {/* Real-time Transform HUD Badge */}
        {isTransforming && (
          <div className="drag-coordinate-badge ps-hud-badge">
            📍 Vị trí: X: {style.positionX}% | Y: {style.positionY}% | 🔤 Cỡ chữ: {style.fontSize}px | 🔄 Góc nghiêng: {currentRotation}°
          </div>
        )}
      </div>

      {/* Video Playback Controls Bar */}
      {videoSrc && (
        <div className="video-playback-controls">
          <button
            type="button"
            className="btn-play-pause"
            onClick={togglePlay}
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          <span className="time-display current-time">{formatTime(currentTime)}</span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="video-timeline-scrubber"
          />

          <span className="time-display duration-time">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}

function getWordHighlightStyle(isActive: boolean, style: SubtitleStyle): CSSProperties {
  if (!isActive) {
    return {
      display: 'inline-block',
      padding: '0 3px',
      transition: 'all 0.1s ease',
    };
  }

  const scale = style.activeWordScale || 1.22;

  switch (style.animationType) {
    case 'karaoke-glow':
      return {
        display: 'inline-block',
        color: style.activeWordColor,
        transform: `scale(${scale})`,
        textShadow: `0 0 12px ${style.activeWordColor}, 0 0 24px ${style.activeWordColor}`,
        padding: '0 4px',
        transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.12s',
        zIndex: 2,
      };

    case 'karaoke-bounce':
      return {
        display: 'inline-block',
        color: style.activeWordColor,
        transform: `scale(${scale}) rotate(-2.5deg) translateY(-3px)`,
        padding: '0 4px',
        transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.12s',
        zIndex: 2,
      };

    case 'karaoke-pill':
      return {
        display: 'inline-block',
        color: style.activeWordColor || '#FFFFFF',
        background: style.activeWordBg && style.activeWordBg !== 'transparent'
          ? style.activeWordBg
          : 'linear-gradient(135deg, #EC4899, #8B5CF6)',
        borderRadius: '20px',
        padding: '2px 10px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
        transform: `scale(${scale})`,
        transition: 'transform 0.12s ease, background 0.12s',
        zIndex: 2,
      };

    case 'karaoke-pop':
    case 'karaoke-word':
    default:
      return {
        display: 'inline-block',
        color: style.activeWordColor,
        transform: `scale(${scale}) translateY(-2px)`,
        textShadow: `0 0 14px ${style.activeWordColor}88, ${generateSubtitleShadows(style)}`,
        padding: '0 4px',
        transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.12s',
        zIndex: 2,
      };
  }
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
