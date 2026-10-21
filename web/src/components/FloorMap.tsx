import type { Status } from '../types';

/** Schematic plan of Production Floor B. The machine room (CAM-04) takes the alarm colour. */
export default function FloorMap({ status }: { status: Status }) {
  const fire = status === 'fire';
  const hot = status !== 'clear';
  const cams = [
    { id: 'CAM-01', x: 22, y: 22, r: 45 },
    { id: 'CAM-02', x: 300, y: 18, r: 100 },
    { id: 'CAM-03', x: 458, y: 104, r: 135 },
    { id: 'CAM-04', x: 182, y: 102, r: 45, me: true },
    { id: 'CAM-05', x: 22, y: 232, r: 0 },
  ];
  return (
    <section className="panel map">
      <div className="panel-head">
        <span className="eyebrow">Floor B plan</span>
        <span className="muted small">{fire ? 'Evacuation routes shown' : hot ? 'Machine room on watch' : 'All zones normal'}</span>
      </div>
      <svg viewBox="0 0 480 300" className="map-svg" role="img" aria-label={`Floor B plan, machine room ${hot ? (fire ? 'on fire alert' : 'on smoke warning') : 'normal'}`}>
        <defs>
          <pattern id="belt" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 10 10 0" className="map-belt" />
          </pattern>
          <marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 10 5 0 10z" className="map-exit-fill" />
          </marker>
        </defs>
        <rect x="4" y="4" width="472" height="292" rx="6" className="map-wall" />
        <g className="zone"><rect x="12" y="12" width="148" height="118" rx="3" /><text x="22" y="122">Raw material store</text></g>
        <g className="zone"><rect x="170" y="12" width="298" height="70" rx="3" /><rect x="186" y="38" width="266" height="16" fill="url(#belt)" className="map-beltbox" /><text x="180" y="74">Conveyor line</text></g>
        <g className={`zone ${hot ? `alert ${status}` : ''}`}>
          <rect x="170" y="92" width="170" height="118" rx="3" />
          <text x="180" y="202">Machine room</text>
        </g>
        <g className="zone"><rect x="350" y="92" width="118" height="196" rx="3" /><circle cx="409" cy="170" r="26" className="map-ladle" /><text x="360" y="280">Ladle bay</text></g>
        <g className="zone"><rect x="12" y="140" width="148" height="70" rx="3" /><text x="22" y="202">Control room</text></g>
        <g className="zone corridor"><rect x="12" y="220" width="328" height="68" rx="3" /><text x="22" y="280">Corridor</text></g>

        {cams.map((c) => (
          <g key={c.id} className={`cam ${c.me ? 'me' : ''}`} transform={`translate(${c.x} ${c.y})`}>
            {c.me && <path d="M0 0 L70 22 A74 74 0 0 1 40 62 Z" className={`cone ${status}`} transform={`rotate(${c.r - 45})`} />}
            <circle r="5.5" />
            <text x={c.x > 400 ? -9 : 9} y={c.y > 200 ? -6 : 16} textAnchor={c.x > 400 ? 'end' : 'start'}>{c.id}</text>
          </g>
        ))}

        {hot && (
          <g transform="translate(262 150)">
            <circle r="16" className={`hazard-ring ${status}`} />
            <circle r="6" className={`hazard ${status}`} />
          </g>
        )}

        <g className="exit"><rect x="0" y="244" width="8" height="28" /><text x="14" y="242">EXIT 1</text></g>
        <g className="exit"><rect x="220" y="292" width="40" height="8" /><text x="266" y="296">EXIT 2</text></g>
        {fire && (
          <g className="evac">
            <path d="M214 180 V250 H34" markerEnd="url(#arr)" />
            <path d="M262 196 V282" markerEnd="url(#arr)" />
          </g>
        )}
      </svg>
      <div className="map-legend">
        <span><i className="lg cam-i" /> Camera</span>
        <span><i className={`lg zone-i ${hot ? status : ''}`} /> Alarm zone</span>
        <span><i className="lg exit-i" /> Exit / route</span>
      </div>
    </section>
  );
}
