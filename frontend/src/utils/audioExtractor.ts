/**
 * In-Browser Audio Extraction Utility
 * Extracts and downmixes audio from any Video (MP4, MKV, WebM, MOV) or Audio file
 * into a clean 16kHz mono WAV PCM ArrayBuffer / Base64.
 */

export async function extract16kWavFromMedia(file: File | Blob): Promise<{ wavBlob: Blob; wavBase64: string; duration: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const targetSampleRate = 16000;
    const duration = audioBuffer.duration;

    // Resample to 16kHz mono using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * targetSampleRate), targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const monoChannelData = renderedBuffer.getChannelData(0);

    // Encode to 16-bit PCM WAV
    const wavBytes = encodeWav(monoChannelData, targetSampleRate);
    const wavBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
    const wavBase64 = await blobToBase64(wavBlob);

    return { wavBlob, wavBase64, duration };
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM)
  view.setUint16(20, 1, true);
  // channel count (1 - mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channels * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write the 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}
