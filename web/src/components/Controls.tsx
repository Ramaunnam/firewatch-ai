interface Props {
  playing: boolean;
  ended: boolean;
  slow: boolean;
  boxesOn: boolean;
  onToggle: () => void;
  onRestart: () => void;
  onSlow: () => void;
  onBoxes: () => void;
  onJumpSmoke: () => void;
  onJumpFire: () => void;
}

export default function Controls(p: Props) {
  return (
    <div className="controls">
      <div className="btn-row">
        <button className="btn" onClick={p.onToggle}>
          {p.ended ? 'Play again' : p.playing ? 'Pause' : 'Play'}
        </button>
        <button className="btn" onClick={p.onRestart}>
          Restart
        </button>
        <button className={`btn ${p.slow ? 'on' : ''}`} onClick={p.onSlow} aria-pressed={p.slow}>
          Slow motion
        </button>
        <button className={`btn ${p.boxesOn ? 'on' : ''}`} onClick={p.onBoxes} aria-pressed={p.boxesOn}>
          AI boxes
        </button>
        <button className="btn" onClick={p.onJumpSmoke}>
          Jump to smoke
        </button>
        <button className="btn" onClick={p.onJumpFire}>
          Jump to fire
        </button>
      </div>
      <div className="controls-note">Real CCTV footage · pre-computed AI output</div>
    </div>
  );
}
