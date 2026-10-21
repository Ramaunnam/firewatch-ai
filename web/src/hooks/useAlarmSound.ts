import { useCallback, useEffect, useRef } from 'react';

/** Alarm tones made with the Web Audio API, so no sound files are needed. */
export function useAlarmSound(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  // Browsers only allow audio after the user has clicked something.
  useEffect(() => {
    const unlock = () => {
      if (!ctxRef.current) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (Ctx) ctxRef.current = new Ctx();
      }
      ctxRef.current?.resume().catch(() => undefined);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  useEffect(() => {
    if (muted) stop();
  }, [muted, stop]);

  const tone = useCallback(
    (pattern: Array<[freq: number, start: number, dur: number]>, type: OscillatorType, vol: number) => {
      const ctx = ctxRef.current;
      if (!ctx || muted || ctx.state !== 'running') return;
      stop();
      const gain = ctx.createGain();
      gain.gain.value = vol;
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      const oscs = pattern.map(([f, s, d]) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + s);
        g.gain.linearRampToValueAtTime(1, now + s + 0.02);
        g.gain.setValueAtTime(1, now + s + d - 0.04);
        g.gain.linearRampToValueAtTime(0, now + s + d);
        o.connect(g).connect(gain);
        o.start(now + s);
        o.stop(now + s + d);
        return o;
      });
      stopRef.current = () => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        });
        gain.disconnect();
      };
    },
    [muted, stop],
  );

  const beep = useCallback(() => tone([[880, 0, 0.18], [880, 0.28, 0.18]], 'sine', 0.18), [tone]);

  const siren = useCallback(() => {
    const p: Array<[number, number, number]> = [];
    for (let i = 0; i < 6; i++) p.push([i % 2 ? 620 : 960, i * 0.42, 0.4]);
    tone(p, 'square', 0.06);
  }, [tone]);

  return { beep, siren, stop };
}
