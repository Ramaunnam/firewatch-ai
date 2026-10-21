import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import BoxOverlay from './components/BoxOverlay';
import Toast from './components/Toast';
import Controls from './components/Controls';
import IncidentLog from './components/IncidentLog';
import ConfidenceChart from './components/ConfidenceChart';
import StatCards from './components/StatCards';
import HowItDecides from './components/HowItDecides';
import Footer from './components/Footer';
import ImageModal from './components/ImageModal';
import { useDetections } from './hooks/useDetections';
import { useVideoClock } from './hooks/useVideoClock';
import { useAlarmSound } from './hooks/useAlarmSound';
import { eventTime, statusAt, statusRank } from './lib/status';
import type { Detections, Status } from './types';

export default function App() {
  const { data, error } = useDetections();
  if (error)
    return (
      <div className="center-msg">
        <b>Could not load the detection data.</b>
        <span>{error}</span>
        <span>Check that public/detections.json exists, then refresh.</span>
      </div>
    );
  if (!data) return <div className="center-msg">Loading FireWatch AI…</div>;
  return <Dashboard data={data} />;
}

function Dashboard({ data }: { data: Detections }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clock = useVideoClock(videoRef);
  const [boxesOn, setBoxesOn] = useState(true);
  const [muted, setMuted] = useState(false);
  const [dismissed, setDismissed] = useState<Status | null>(null);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const sound = useAlarmSound(muted);

  const t = clock.t;
  const status = statusAt(data.events, t);
  const frame = data.frames[Math.min(data.frames.length - 1, Math.max(0, Math.round(t * data.video.fps)))];
  const visible = useMemo(() => data.events.filter((e) => e.t <= t + 1e-3).reverse(), [data.events, t]);

  // Sound + toast when the alarm level goes up.
  const prev = useRef<Status>('clear');
  useEffect(() => {
    if (statusRank[status] > statusRank[prev.current] && clock.playing) {
      if (status === 'fire') sound.siren();
      else if (status === 'smoke') sound.beep();
    }
    if (status !== prev.current) setDismissed(null);
    if (status === 'clear') sound.stop();
    prev.current = status;
  }, [status, clock.playing, sound]);

  const jump = useCallback(
    (kind: 'possible_smoke' | 'flame_seen') => {
      const at = eventTime(data.events, kind);
      if (at !== undefined) clock.seek(Math.max(0, at - 1));
    },
    [data.events, clock],
  );

  // Keyboard: space = play/pause, R = restart.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      if (e.code === 'Space') {
        e.preventDefault();
        clock.toggle();
      } else if (e.key === 'r' || e.key === 'R') clock.restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock]);

  return (
    <div className="page">
      <Header camera={data.camera} status={status} muted={muted} onToggleMute={() => setMuted((m) => !m)} />

      <main className="main-grid">
        <div className={`card video-card status-${status}`}>
          <video
            ref={videoRef}
            src={data.video.src}
            muted
            autoPlay
            playsInline
            preload="auto"
            aria-label={`${data.camera.id} CCTV video`}
          />
          <div className="video-label mono">{data.camera.id} · AI view</div>
          {boxesOn && frame && <BoxOverlay boxes={frame.boxes} width={data.video.width} height={data.video.height} />}
          {dismissed !== status && <Toast status={status} camera={data.camera} onClose={() => setDismissed(status)} />}
          {!clock.playing && !clock.ended && t === 0 && (
            <button className="big-play" onClick={clock.play} aria-label="Play">
              ▶
            </button>
          )}
        </div>

        <IncidentLog events={visible} onOpenImage={setModalImg} />

        <Controls
          playing={clock.playing}
          ended={clock.ended}
          slow={clock.slow}
          boxesOn={boxesOn}
          onToggle={clock.toggle}
          onRestart={clock.restart}
          onSlow={() => clock.setSlow(!clock.slow)}
          onBoxes={() => setBoxesOn((b) => !b)}
          onJumpSmoke={() => jump('possible_smoke')}
          onJumpFire={() => jump('flame_seen')}
        />
      </main>

      <ConfidenceChart data={data} t={t} onSeek={(s) => clock.seek(s)} />
      <StatCards data={data} />
      <HowItDecides th={data.thresholds} />
      <Footer />
      <ImageModal src={modalImg} onClose={() => setModalImg(null)} />
    </div>
  );
}
