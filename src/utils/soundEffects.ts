// Kawaii Sound Effects Engine for Yimeo
// Uses Web Audio API synthesis for zero-dependency crisp audio + Admin Custom Sound support

export interface SoundEffectsSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  preset: 'bubble' | 'sparkle' | 'bell' | 'soft_blip' | 'custom';
  customAudioUrl: string | null;
}

const SOUND_SETTINGS_KEY = 'yimeo_sound_effects_settings';

export const DEFAULT_SOUND_SETTINGS: SoundEffectsSettings = {
  enabled: true,
  volume: 0.45,
  preset: 'bubble',
  customAudioUrl: null,
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getSoundSettings(): SoundEffectsSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SOUND_SETTINGS;
  const raw = localStorage.getItem(SOUND_SETTINGS_KEY);
  if (!raw) return DEFAULT_SOUND_SETTINGS;
  try {
    return { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

export function setSoundSettings(settings: SoundEffectsSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_sound_updated', { detail: settings }));
  }
}

let lastSoundTimestamp = 0;

// Synthesize adorable sound waves with rapid-tap throttle protection
export function playCuteSound(soundType: 'pop' | 'sparkle' | 'bell' | 'soft_blip' | 'click' = 'pop'): void {
  const settings = getSoundSettings();
  if (!settings.enabled) return;

  const nowMs = Date.now();
  if (nowMs - lastSoundTimestamp < 55) {
    return; // Throttle to prevent browser AudioContext buffer overrun on super-fast clicks
  }
  lastSoundTimestamp = nowMs;

  try {
    // If admin provided a custom sound URL/file, play it
  if (settings.preset === 'custom' && settings.customAudioUrl) {
    try {
      const audio = new Audio(settings.customAudioUrl);
      audio.volume = Math.max(0, Math.min(1, settings.volume));
      audio.play().catch(() => {});
      return;
    } catch {
      // Fallback to synth if custom audio fails
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(settings.volume * 0.4, now);
  masterGain.connect(ctx.destination);

  const effectiveType = settings.preset !== 'custom' ? settings.preset : soundType;

  if (effectiveType === 'sparkle') {
    // 3 harmonic twinkle notes
    [587.33, 880, 1174.66, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.001, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(settings.volume * 0.25, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.4);
    });
  } else if (effectiveType === 'bell') {
    // Sweet crystal chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(settings.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.55);
  } else if (effectiveType === 'soft_blip') {
    // Soft high blip
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(settings.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  } else {
    // Default: Cute Bubble Pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Frequency sweeps up rapidly like popping a bubble
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);

    gain.gain.setValueAtTime(settings.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }
  } catch {
    // Graceful fallback if Web Audio is suspended/interrupted
  }
}
