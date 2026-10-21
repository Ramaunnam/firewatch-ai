import type { Box } from '../types';

interface Props {
  boxes: Box[];
  width: number;
  height: number;
}

const colour = { fire: '#f04438', smoke: '#f5a524', person: '#2fbf71' } as const;

/** AI boxes drawn in the video's own pixel space, so they line up at any size. */
export default function BoxOverlay({ boxes, width, height }: Props) {
  return (
    <svg className="overlay" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {boxes.map((b, i) => {
        const x = b.x * width;
        const y = b.y * height;
        const w = b.w * width;
        const h = b.h * height;
        const label = `${b.cls.toUpperCase()} ${Math.round(b.conf * 100)}%`;
        const lw = label.length * 12 + 18;
        const lh = 27;
        const ly = y - lh - 3 < 0 ? y + 3 : y - lh - 3;
        const c = colour[b.cls];
        const cl = Math.min(14, w / 3, h / 3);
        return (
          <g key={`${b.cls}-${i}`}>
            <rect x={x} y={y} width={w} height={h} fill={c} fillOpacity={0.08} stroke={c} strokeWidth={2} strokeOpacity={0.9} />
            <path
              d={`M${x},${y + cl}V${y}H${x + cl} M${x + w - cl},${y}H${x + w}V${y + cl} M${x + w},${y + h - cl}V${y + h}H${x + w - cl} M${x + cl},${y + h}H${x}V${y + h - cl}`}
              stroke={c}
              strokeWidth={5}
              fill="none"
            />
            <rect x={x - 1} y={ly} width={lw} height={lh} fill={c} rx={3} />
            <text x={x + 8} y={ly + 19} fill="#fff" fontSize={17} fontWeight={600} fontFamily="'IBM Plex Mono', monospace">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
