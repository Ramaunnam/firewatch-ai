import { useEffect, useMemo, useRef, useState } from 'react';
import type { Detections, Thresholds, Timeline } from '../types';

interface Props {
  data: Detections;
  tl: Timeline;
  th: Thresholds;
  t: number;
  onSeek: (t: number) => void;
  height?: number;
}

const PAD = { l: 38, r: 12, t: 22, b: 24 };
const SMOKE = '#f5a524';
const FIRE = '#f04438';

export default function ConfidenceChart({ data, tl, th, t, onSeek, height = 170 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(900);
  const [hover, setHover] = useState<number | null>(null);
  const H = height;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e.contentRect.width > 0 && setW(e.contentRect.width));
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
      const line = 'M' + data.frames.map((f) => `${x(f.t).toFixed(1)},${y(f[key]).toFixed(1)}`).join('L');
      const area = `${line}L${x(data.frames[data.frames.length - 1].t).toFixed(1)},${y(0)}L${x(0)},${y(0)}Z`;
      return { line, area };
    };
    return { smoke: mk('smoke'), fire: mk('fire') };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, W, H]);

  const looks = tl.events.filter((e) => e.kind === 'lookalike');
  const toTime = (cx: number) => {
    const r = wrap.current!.getBoundingClientRect();
    return Math.max(0, Math.min(dur, ((cx - r.left - PAD.l) / iw) * dur));
  };
  const hf = hover === null ? null : data.frames[Math.min(data.frames.length - 1, Math.round(hover * data.video.fps))];

  return (
    <div className="chart">
      <div className="legend">
        <span><i style={{ background: SMOKE }} /> Smoke confidence</span>
        <span><i style={{ background: FIRE }} /> Fire confidence</span>
        <span className="muted">Dashed lines: alarm levels (smoke {Math.round(th.smoke * 100)}%, fire {Math.round(th.fire * 100)}%). Click to jump.</span>
      </div>
      <div
        ref={wrap}
        className="chart-wrap"
        onClick={(e) => onSeek(toTime(e.clientX))}
        onMouseMove={(e) => setHover(toTime(e.clientX))}
        onMouseLeave={() => setHover(null)}
      >
        <svg width={W} height={H} role="img" aria-label="Smoke and fire confidence for every frame">
          <defs>
            <linearGradient id="gS" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={SMOKE} stopOpacity="0.28" />
              <stop offset="1" stopColor={SMOKE} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gF" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={FIRE} stopOpacity="0.34" />
              <stop offset="1" stopColor={FIRE} stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="grid" />
              <text x={PAD.l - 8} y={y(v) + 4} className="axis" textAnchor="end">{v * 100}%</text>
            </g>
          ))}
          {Array.from({ length: Math.floor(dur / 5) + 1 }, (_, i) => i * 5).map((s) => (
            <text key={s} x={x(s)} y={H - 6} className="axis" textAnchor="middle">{s} s</text>
          ))}
          {tl.smokeWarnAt !== undefined && <rect x={x(tl.smokeWarnAt)} y={PAD.t} width={x(tl.fireAlertAt ?? dur) - x(tl.smokeWarnAt)} height={ih} fill={SMOKE} opacity={0.05} />}
          {tl.fireAlertAt !== undefined && <rect x={x(tl.fireAlertAt)} y={PAD.t} width={x(dur) - x(tl.fireAlertAt)} height={ih} fill={FIRE} opacity={0.06} />}
          <line x1={PAD.l} x2={W - PAD.r} y1={y(th.smoke)} y2={y(th.smoke)} stroke={SMOKE} strokeOpacity={0.6} strokeDasharray="4 4" />
          <line x1={PAD.l} x2={W - PAD.r} y1={y(th.fire)} y2={y(th.fire)} stroke={FIRE} strokeOpacity={0.6} strokeDasharray="4 4" />
          <path d={paths.smoke.area} fill="url(#gS)" />
          <path d={paths.fire.area} fill="url(#gF)" />
          <path d={paths.smoke.line} fill="none" stroke={SMOKE} strokeWidth={1.5} strokeLinejoin="round" />
          <path d={paths.fire.line} fill="none" stroke={FIRE} strokeWidth={1.5} strokeLinejoin="round" />
          {looks.map((e) => (
            <text key={e.t} x={x(e.t)} y={y(0.72)} className="axis note" textAnchor="middle">look-alike ignored</text>
          ))}
          {tl.smokeWarnAt !== undefined && (
            <g>
              <line x1={x(tl.smokeWarnAt)} x2={x(tl.smokeWarnAt)} y1={PAD.t - 8} y2={y(0)} stroke={SMOKE} strokeWidth={1.2} />
              <text x={x(tl.smokeWarnAt) + 5} y={PAD.t - 8} fill={SMOKE} className="marker">Smoke warning {tl.smokeWarnAt.toFixed(1)} s</text>
            </g>
          )}
          {tl.fireAlertAt !== undefined && (
            <g>
              <line x1={x(tl.fireAlertAt)} x2={x(tl.fireAlertAt)} y1={PAD.t - 8} y2={y(0)} stroke={FIRE} strokeWidth={1.2} />
              <text x={x(tl.fireAlertAt) - 5} y={PAD.t - 8} fill={FIRE} className="marker" textAnchor="end">Fire alert {tl.fireAlertAt.toFixed(1)} s</text>
            </g>
          )}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} className="hover-line" />}
          <line x1={x(t)} x2={x(t)} y1={PAD.t - 2} y2={y(0)} className="playhead" />
          <circle cx={x(t)} cy={PAD.t - 2} r={3.5} className="playhead-dot" />
        </svg>
        {hf && (
          <div className="chart-tip mono" style={{ left: Math.min(W - 170, Math.max(0, x(hf.t) + 10)) }}>
            {hf.t.toFixed(1)} s · smoke {Math.round(hf.smoke * 100)}% · fire {Math.round(hf.fire * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}
