import React, { useRef } from 'react';

interface Props {
  audioUrl: string | null;
}

export function AudioPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!audioUrl) return null;

  return (
    <div className="audio-player-wrapper">
      <audio
        ref={audioRef}
        id="tts-audio-player"
        className="audio-player"
        src={audioUrl}
        controls
        autoPlay
        aria-label="Kết quả âm thanh"
      />
    </div>
  );
}
