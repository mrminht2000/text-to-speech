import { useRef, useEffect } from 'react';

interface Props {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        // Autoplay may be blocked by browser policy
      });
    }
  }, [audioUrl]);

  return (
    <div className="audio-player-wrapper">
      <audio
        ref={audioRef}
        controls
        className="audio-player"
        src={audioUrl}
        aria-label="Phát âm thanh kết quả"
      >
        Trình duyệt của bạn không hỗ trợ phát audio.
      </audio>
    </div>
  );
}
