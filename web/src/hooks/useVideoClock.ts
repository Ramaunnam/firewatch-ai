import { useCallback, useEffect, useState, type RefObject } from 'react';

export const SLOW_RATE = 0.25;

/** Follows the <video> element's time on every animation frame and exposes simple controls. */
export function useVideoClock(ref: RefObject<HTMLVideoElement>) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [slow, setSlowState] = useState(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = ref.current;
      if (v) {
        setT(v.currentTime);
        setPlaying(!v.paused && !v.ended);
        setEnded(v.ended);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref]);

  const play = useCallback(() => {
    ref.current?.play().catch(() => undefined);
  }, [ref]);

  const pause = useCallback(() => ref.current?.pause(), [ref]);

  const seek = useCallback(
    (time: number, andPlay = true) => {
      const v = ref.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(time, (v.duration || time) - 0.01));
      setT(v.currentTime);
      if (andPlay) v.play().catch(() => undefined);
    },
    [ref],
  );

  const restart = useCallback(() => seek(0, true), [seek]);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.ended) restart();
    else if (v.paused) play();
    else pause();
  }, [ref, play, pause, restart]);

  const setSlow = useCallback(
    (on: boolean) => {
      if (ref.current) ref.current.playbackRate = on ? SLOW_RATE : 1;
      setSlowState(on);
    },
    [ref],
  );

  return { t, playing, ended, slow, play, pause, toggle, seek, restart, setSlow };
}
