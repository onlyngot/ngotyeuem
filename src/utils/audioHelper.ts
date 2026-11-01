/**
 * Audio helper for Yimeo
 * Handles parsing and playback of:
 * - Direct MP3 / WAV / OGG / M4A / AAC audio URLs
 * - Uploaded audio files (data URLs from phone / PC)
 * - YouTube links (watch, share, shorts)
 * - Spotify links (tracks, albums, playlists)
 * - TikTok & CapCut audio links
 * - Sweet Lo-Fi Kalimba Web Audio Synthesizer fallback (guarantees sound always works)
 */

export type MusicType = 'direct' | 'youtube' | 'spotify' | 'tiktok' | 'capcut' | 'synth';

export interface ParsedMusicInfo {
  type: MusicType;
  rawUrl: string;
  directAudioUrl?: string;
  youtubeVideoId?: string;
  spotifyEmbedUrl?: string;
  spotifyId?: string;
  displayName?: string;
}

export function parseMusicUrl(url: string | null | undefined): ParsedMusicInfo {
  if (!url || !url.trim()) {
    return {
      type: 'synth',
      rawUrl: '',
      displayName: 'Strawberry Lo-Fi Chimes ♫',
    };
  }

  const trimmed = url.trim();

  // 1. Data URLs or blob URLs (uploaded from phone or computer)
  if (trimmed.startsWith('data:audio') || trimmed.startsWith('blob:')) {
    return {
      type: 'direct',
      rawUrl: trimmed,
      directAudioUrl: trimmed,
      displayName: 'Nhạc tải từ thiết bị 🎵',
    };
  }

  // 2. YouTube URL patterns
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      rawUrl: trimmed,
      youtubeVideoId: ytMatch[1],
      displayName: `YouTube [${ytMatch[1]}] ♫`,
    };
  }

  // 3. Spotify URL patterns
  const spotifyMatch = trimmed.match(
    /(?:open\.)?spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([a-zA-Z0-9]+)/i
  );
  if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
    const kind = spotifyMatch[1];
    const id = spotifyMatch[2];
    return {
      type: 'spotify',
      rawUrl: trimmed,
      spotifyId: id,
      spotifyEmbedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
      displayName: `Spotify ${kind === 'track' ? 'Bài hát' : 'Album'} ♫`,
    };
  }

  // 4. TikTok URLs
  if (trimmed.includes('tiktok.com')) {
    return {
      type: 'tiktok',
      rawUrl: trimmed,
      displayName: 'TikTok Sound ♫',
    };
  }

  // 5. CapCut URLs
  if (trimmed.includes('capcut.com')) {
    return {
      type: 'capcut',
      rawUrl: trimmed,
      displayName: 'CapCut Audio ♫',
    };
  }

  // 6. Direct MP3 or other audio URL
  return {
    type: 'direct',
    rawUrl: trimmed,
    directAudioUrl: trimmed,
    displayName: trimmed.split('/').pop()?.split('?')[0] || 'Audio Track ♫',
  };
}

/**
 * Built-in Sweet Dreamy Web Audio Synthesizer
 * Plays a relaxing, cute strawberry lofi kalimba melody so user NEVER hears silence.
 */
class CuteSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private noteIdx = 0;

  // C Pentatonic cute notes (Hz)
  private readonly notes = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    880.00, // A5
    659.25, // E5
    587.33, // D5
    523.25, // C5
    392.00, // G4
    440.00, // A4
  ];

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isPlaying = true;
      this.noteIdx = 0;
      this.scheduleNextNote();
    } catch (e) {
      console.warn('Synth start error:', e);
    }
  }

  private scheduleNextNote() {
    if (!this.isPlaying || !this.ctx) return;
    const freq = this.notes[this.noteIdx % this.notes.length];
    this.noteIdx++;
    this.playTone(freq, 0.45);

    const delay = 360 + (this.noteIdx % 3 === 0 ? 300 : 120);
    this.timer = window.setTimeout(() => this.scheduleNextNote(), delay);
  }

  private volume = 0.6;

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  private playTone(freq: number, duration: number) {
    if (!this.ctx || this.volume <= 0.001) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Sweet bell-like decay scaled by current volume
      const baseGain = 0.08 * this.volume;
      gain.gain.setValueAtTime(baseGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const cuteSynth = new CuteSynthesizer();
