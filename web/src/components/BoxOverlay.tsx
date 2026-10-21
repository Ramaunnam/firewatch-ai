import type { Box } from '../types';

interface Props {
  boxes: Box[];
  width: number;
  height: number;
}

const colour = { fire: '#ef4444', smoke: '#f59e0b' } as const;

/** Draws the AI boxes on top of the video. Uses the video's own pixel size as the
 *  SVG viewBox, so the boxes always line up whatever the window size is. */
export default function BoxOverlay({ boxes, width, height }: Props) {
  return (
    <svg className="overlay" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {boxes.map((b, i) => {
        const x = b.x * width;
        const y = b.y * height;
        const w = b.w * width;
        const h = b.h * height;
        const label = `${b.cls.toUpperCase()} ${Math.round(b.conf * 100)}%`;
        const lw = label.length * 12.5 + 16;
        const lh = 28;
        const ly = y - lh - 2 < 0 ? y + 2 : y - lh - 2;
        const c = colour[b.cls];
        return (
          <g key={`${b.cls}-${i}`} className="box">
            <rect x={x} y={y} width={w} height={h} fill="none" stroke={c} strokeWidth={3} rx={2} />
            <rect x={x - 1.5} y={ly} width={lw} height={lh} fill={c} rx={3} />
            <text x={x + 7} y={ly + 20} fill="#fff" fontSize={19} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
