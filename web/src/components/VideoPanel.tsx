import type { RefObject } from 'react';
import type { Detections, FrameRec, Status } from '../types';
import BoxOverlay from './BoxOverlay';

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  data: Detections;
  frame: FrameRec | undefined;
  status: Status;
  boxes: boolean;
  t: number;
  playing: boolean;
  ended: boolean;
  slow: boolean;
  toastHidden: boolean;
  onHideToast: () => void;
  onToggle: () => void;
  onRestart: () => void;
  onSlow: () => void;
  onBoxes: () => void;
  onJumpSmoke: () => void;
  onJumpFire: () => void;
  onSeek: (t: number) => void;
  markers: Array<{ t: number; tone: 'warn' | 'crit' }>;
}

export default function VideoPanel(p: Props) {
  const dur = p.data.video.duration;
  const fire = p.status === 'fire';
  return (
    <section className={`panel video-panel ${p.status}`} aria-label="Camera CAM-04">
      <div className="panel-head">
        <div className="cam-title">
          <span className={`live-dot ${p.playing ? 'on' : ''}`} />
          <strong>CAM-04</strong>
          <span className="muted">Machine room · Floor B</span>
        </div>
        <div className="cam-meta mono">1280×720 · 25 fps · night</div>
      </div>
      <div className="video-wrap">
        <video ref={p.videoRef} src={p.data.video.src} muted autoPlay playsInline preload="auto" aria-label="CAM-04 CCTV footage" />
        <div className="vid-tag mono">CAM-04 · AI view</div>
        <div className="vid-time mono">
          {p.t.toFixed(1)} s / {dur.toFixed(1)} s{p.slow ? ' · 0.25×' : ''}
        </div>
        {p.boxes && p.frame && <BoxOverlay boxes={p.frame.boxes} width={p.data.video.width} height={p.data.video.height} />}
        {p.status !== 'clear' && !p.toastHidden && (
          <div className={`toast ${p.status}`} role="alert">
            <span className="toast-bar" />
            <div>
              <div className="toast-from">FireWatch AI · now</div>
              <div className="toast-title">{fire ? 'Fire detected' : 'Smoke detected'} · CAM-04</div>
              <div className="toast-text">Production Floor B · {fire ? 'evacuate and respond' : 'check machine area now'}</div>
            </div>
            <button className="toast-x" onClick={p.onHideToast} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        {!p.playing && !p.ended && p.t === 0 && (
          <button className="big-play" onClick={p.onToggle} aria-label="Play">
            ▶
          </button>
        )}
      </div>
      <div
        className="scrub"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          p.onSeek(((e.clientX - r.left) / r.width) * dur);
        }}
        role="slider"
        aria-label="Video position"
        aria-valuemin={0}
        aria-valuemax={dur}
        aria-valuenow={Math.round(p.t * 10) / 10}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') p.onSeek(p.t + 1);
          if (e.key === 'ArrowLeft') p.onSeek(p.t - 1);
        }}
      >
        <div className="scrub-fill" style={{ width: `${(p.t / dur) * 100}%` }} />
        {p.markers.map((m) => (
          <span key={m.t} className={`scrub-mark ${m.tone}`} style={{ left: `${(m.t / dur) * 100}%` }} />
        ))}
      </div>
      <div className="controls">
        <div className="btn-row">
          <button className="btn primary" onClick={p.onToggle}>
            {p.ended ? 'Play again' : p.playing ? 'Pause' : 'Play'}
          </button>
          <button className="btn" onClick={p.onRestart}>Restart</button>
          <button className={`btn ${p.slow ? 'on' : ''}`} onClick={p.onSlow} aria-pressed={p.slow}>Slow motion</button>
          <button className={`btn ${p.boxes ? 'on' : ''}`} onClick={p.onBoxes} aria-pressed={p.boxes}>AI boxes</button>
          <span className="btn-sep" />
          <button className="btn" onClick={p.onJumpSmoke}>Jump to smoke</button>
          <button className="btn" onClick={p.onJumpFire}>Jump to fire</button>
        </div>
        <div className="controls-note">Real CCTV footage · pre-computed AI output</div>
      </div>
    </section>
  );
}
