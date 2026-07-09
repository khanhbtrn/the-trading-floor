let audioCtx: AudioContext | null = null;

/** Subtle ping on new NPC message — Web Audio, no asset file. */
export function playNpcMessageSound(persona: 'manager' | 'compliance' | 'tech'): void {
  if (typeof window === 'undefined') return;

  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freq =
      persona === 'manager' ? 440 : persona === 'compliance' ? 330 : 280;
    osc.frequency.value = freq;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio optional — ignore failures (autoplay policies, etc.)
  }
}
