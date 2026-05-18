import {
  listVoices,
  EdgeTTS,
  createSRT,
  type Voice,
} from 'edge-tts-universal';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readAudioDurationMs } from './media-duration';

export function convertSpeedToRate(speed: number): string {
  const pct = Math.round((speed - 1) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

export function convertPitchToHz(pitch: number): string {
  // Map -12..12 semitones to rough Hz adjustment
  const hz = Math.round(pitch * 8.33);
  return `${hz >= 0 ? '+' : ''}${hz}Hz`;
}

export { listVoices };
export type { Voice };

export interface EdgeTtsGenerateResult {
  audioPath: string;
  srtPath: string;
  originalSrtPath: string;
  durationMs: number;
}

export async function generateEdgeTts(
  text: string,
  voice: string,
  speed: number,
  pitch: number,
  projectDir: string,
  binariesDirectory: string | null,
): Promise<EdgeTtsGenerateResult> {
  const rate = convertSpeedToRate(speed);
  const pitchHz = convertPitchToHz(pitch);

  const tts = new EdgeTTS(text, voice, {
    rate,
    pitch: pitchHz,
    volume: '+0%',
  });

  const result = await tts.synthesize();

  // Convert Blob to Buffer
  const audioBuf = Buffer.from(await result.audio.arrayBuffer());

  if (audioBuf.byteLength === 0) {
    throw new Error('Edge TTS 未返回任何音频数据');
  }

  await fs.mkdir(projectDir, { recursive: true });

  const audioPath = path.join(projectDir, 'podcast-audio.mp3');
  await fs.writeFile(audioPath, audioBuf);

  // Get audio duration
  let durationMs: number;
  try {
    durationMs = await readAudioDurationMs(audioPath, { binariesDirectory });
  } catch {
    // Rough fallback: ~48kbps mp3 → byteLength * 8 / bitrate * 1000
    durationMs = Math.round((audioBuf.byteLength * 8) / 48);
    if (durationMs <= 0) durationMs = 1000;
  }

  // Generate SRT from word boundaries
  const srtText = createSRT(result.subtitle);

  const srtPath = path.join(projectDir, 'podcast-subtitles.srt');
  const originalSrtPath = path.join(projectDir, 'podcast-subtitles.original.srt');
  await fs.writeFile(srtPath, srtText, 'utf-8');
  await fs.writeFile(originalSrtPath, srtText, 'utf-8');

  return { audioPath, srtPath, originalSrtPath, durationMs };
}
