import { useEffect, useState } from 'react';
import type { Detections, Status } from '../types';

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#fff"
        d="M12 2c.8 3.4 5 5.3 5 10.6A5 5 0 0 1 7 12.6c0-2.6 1.6-4.3 2.6-5.1 0 1.7.8 2.7 1.8 2.9C10.6 7.6 11.2 4.6 12 2z"
      />
    </svg>
  );
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="clock mono">
      <span className="rec-dot" aria-hidden="true" />
      {now.toLocaleTimeString('en-GB', { hour12: false })}
    </span>
  );
}

const pillText: Record<Status, string> = {
  clear: 'ALL CLEAR',
  smoke: 'SMOKE WARNING',
  fire: 'FIRE ALERT',
};

interface Props {
  camera: Detections['camera'];
  status: Status;
  muted: boolean;
  onToggleMute: () => void;
}

export default function Header({ camera, status, muted, onToggleMute }: Props) {
  return (
    <header className="header">
      <div className="brand">
        <div className="logo">
          <FlameIcon />
        </div>
        <div>
          <div className="brand-name">FireWatch AI</div>
          <div className="brand-sub">Early fire &amp; smoke detection</div>
        </div>
      </div>
      <div className="cam-info">
        <div className="cam-name">
          {camera.id} · {camera.name}
        </div>
        <div className="cam-meta mono">{camera.meta}</div>
      </div>
      <div className="header-right">
        <button
          className="icon-btn"
          onClick={onToggleMute}
          title={muted ? 'Turn alarm sound on' : 'Mute alarm sound'}
          aria-label={muted ? 'Turn alarm sound on' : 'Mute alarm sound'}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5 6 9H3v6h3l5 4V5z" />
              <path d="m22 9-6 6M16 9l6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5 6 9H3v6h3l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
        </button>
        <LiveClock />
        <span className={`pill pill-${status}`} role="status" aria-live="polite">
          <span className="pill-dot" />
          {pillText[status]}
        </span>
      </div>
    </header>
  );
}
