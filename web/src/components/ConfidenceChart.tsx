import { useEffect, useMemo, useRef, useState } from 'react';
import type { Detections } from '../types';
import { eventTime } from '../lib/status';

interface Props {
  data: Detections;
  t: number;
  onSeek: (t: number) => void;
}

const H = 150;
const PAD = { l: 34, r: 14, t: 18, b: 22 };
const AMBER = '#f59e0b';
const RED = '#ef4444';

export default function ConfidenceChart({ data, t, onSeek }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(900);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dur = data.video.duration;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (s: number) => PAD.l + (s / dur) * iw;
  const y = (v: number) => PAD.t + (1 - v) * ih;

  const paths = useMemo(() => {
    const mk = (key: 'smoke' | 'fire') => {
      const pts = data.frames.map((f) => `${x(f.t).toFixed(1)},${y(f[key]).toFixed(1)}`);
      const line = 'M' + pts.join('L');
      const area = `${line}L${x(data.frames[data.frames.length - 1].t).toFixed(1)},${y(0)}L${x(0)},${y(0)}Z`;
      return { line, area };
    };
    return { smoke: mk('smoke'), fire: mk('fire') };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, W]);

  const smokeWarn = eventTime(data.events, 'smoke_warning');
  const fireAlert = eventTime(data.events, 'fire_alert');
  const look = eventTime(data.events, 'lookalike');
  const lookPeak = look === undefined ? 0 : Math.max(...data.frames.filter((f) => Math.abs(f.t - look) < 0.3).map((f) => f.smoke));

  const toTime = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    return Math.max(0, Math.min(dur, ((clientX - r.left - PAD.l) / iw) * dur));
  };

  const hoverFrame = hover === null ? null : data.frames[Math.min(data.frames.length - 1, Math.round(hover * data.video.fps))];

  return (
    <section className="card chart">
      <div className="label">What the AI saw, frame by frame</div>
      <div className="legend">
        <span>
          <i style={{ background: AMBER }} /> Smoke confidence
        </span>
        <span>
          <i style={{ background: RED }} /> Fire confidence
        </span>
        <span className="legend-note">
          Dashed lines: alarm levels (smoke {Math.round(data.thresholds.smoke * 100)}%, fire{' '}
          {Math.round(data.thresholds.fire * 100)}%). Click to jump.
        </span>
      </div>
      <div
        ref={wrap}
        className="chart-wrap"
        onClick={(e) => onSeek(toTime(e.clientX))}
        onMouseMove={(e) => setHover(toTime(e.clientX))}
        onMouseLeave={() => setHover(null)}
      >
        <svg width={W} height={H} role="img" aria-label="Smoke and fire confidence over the clip">
          <defs>
            <linearGradient id="gSmoke" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={AMBER} stopOpacity="0.28" />
              <stop offset="1" stopColor={AMBER} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gFire" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={RED} stopOpacity="0.32" />
              <stop offset="1" stopColor={RED} stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="grid" />
              <text x={PAD.l - 8} y={y(v) + 4} className="axis" textAnchor="end">
                {v * 100}%
              </text>
            </g>
          ))}
          {Array.from({ length: Math.floor(dur / 5) + 1 }, (_, i) => i * 5).map((s) => (
            <text key={s} x={x(s)} y={H - 4} className="axis" textAnchor="middle">
              {s} s
            </text>
          ))}
          <line x1={PAD.l} x2={W - PAD.r} y1={y(data.thresholds.smoke)} y2={y(data.thresholds.smoke)} stroke={AMBER} strokeOpacity={0.55} strokeDasharray="4 4" />
          <line x1={PAD.l} x2={W - PAD.r} y1={y(data.thresholds.fire)} y2={y(data.thresholds.fire)} stroke={RED} strokeOpacity={0.55} strokeDasharray="4 4" />

          <path d={paths.smoke.area} fill="url(#gSmoke)" />
          <path d={paths.fire.area} fill="url(#gFire)" />
          <path d={paths.smoke.line} fill="none" stroke={AMBER} strokeWidth={1.6} strokeLinejoin="round" />
          <path d={paths.fire.line} fill="none" stroke={RED} strokeWidth={1.6} strokeLinejoin="round" />

          {look !== undefined && (
            <text x={x(look)} y={y(lookPeak) - 8} className="axis note" textAnchor="middle">
              look-alike ignored
            </text>
          )}
          {smokeWarn !== undefined && (
            <g>
              <line x1={x(smokeWarn)} x2={x(smokeWarn)} y1={PAD.t - 6} y2={y(0)} stroke={AMBER} strokeWidth={1.2} />
              <text x={x(smokeWarn) + 4} y={PAD.t + 4} fill={AMBER} className="marker">
                Smoke warning
              </text>
            </g>
          )}
          {fireAlert !== undefined && (
            <g>
              <line x1={x(fireAlert)} x2={x(fireAlert)} y1={PAD.t - 6} y2={y(0)} stroke={RED} strokeWidth={1.2} />
              <text x={x(fireAlert) + 4} y={PAD.t + 4} fill={RED} className="marker">
                Fire alert
              </text>
            </g>
          )}

          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="#94a3b8" strokeOpacity={0.35} />}

          <line x1={x(t)} x2={x(t)} y1={PAD.t - 6} y2={y(0)} stroke="#e5e7eb" strokeWidth={1.4} />
          <circle cx={x(t)} cy={PAD.t - 6} r={3.5} fill="#e5e7eb" />
        </svg>
        {hoverFrame && (
          <div className="chart-tip mono" style={{ left: Math.min(W - 150, Math.max(0, x(hoverFrame.t) + 8)) }}>
            {hoverFrame.t.toFixed(1)} s · smoke {Math.round(hoverFrame.smoke * 100)}% · fire {Math.round(hoverFrame.fire * 100)}%
          </div>
        )}
      </div>
    </section>
  );
}
