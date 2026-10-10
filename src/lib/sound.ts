/**
 * Soothing gentle chime sound synthesizer using Web Audio API
 * Generates a calm two-tone meditative bell chime (E5 -> B5) with soft decay.
 * Pure audio synthesis: no external assets or network requests required.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playGentleChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic frequencies for calm singing bowl / wooden chime (E5: 659.25Hz, G#5: 830.61Hz, B5: 987.77Hz)
    const notes = [
      { freq: 659.25, time: 0.0, gain: 0.15 },
      { freq: 830.61, time: 0.12, gain: 0.12 },
      { freq: 987.77, time: 0.25, gain: 0.18 }
    ];

    notes.forEach(({ freq, time, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Soft attack and smooth exponential decay
      gainNode.gain.setValueAtTime(0.0001, now + time);
      gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + 1.6);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + 1.7);
    });
  } catch (err) {
    console.warn('Audio playback not supported or user has not interacted with DOM yet', err);
  }
}

export function playConfirmClick(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch (err) {
    console.warn('Click audio error', err);
  }
}
