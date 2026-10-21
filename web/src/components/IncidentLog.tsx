import type { FwEvent } from '../types';
import { eventTone, fmtSec } from '../lib/status';

interface Props {
  events: FwEvent[];
  onOpenImage: (src: string) => void;
}

export default function IncidentLog({ events, onOpenImage }: Props) {
  return (
    <aside className="card log">
      <div className="label">Incident log</div>
      <div className="log-scroll">
        {events.map((e) => (
          <div key={`${e.kind}-${e.t}`} className={`log-item tone-${eventTone[e.kind]} ${e.kind === 'lookalike' ? 'dim' : ''}`}>
            <div className="log-time mono">{fmtSec(e.t)}</div>
            <div className="log-main">
              <div className="log-title">{e.title}</div>
              <div className="log-detail">{e.detail}</div>
              {e.image && (
                <button className="log-img" onClick={() => onOpenImage(e.image!)} title="Open snapshot">
                  <img src={e.image} alt="Snapshot of the fire at the moment of the alert" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
