import { useState } from 'react';
import type { Status, Timeline } from '../types';
import { INCIDENT_ID, SNAPSHOT, eventTone, fmtSec } from '../lib/rules';
import type { Ack } from '../components/ResponsePanel';
import { Close } from '../components/Icons';

interface Row {
  id: string;
  when: string;
  camera: string;
  zone: string;
  type: 'Fire' | 'Smoke' | 'Sparks' | 'Look-alike';
  peak: number;
  priority: 'P1' | 'P2' | 'P3' | '—';
  state: 'Open' | 'Acknowledged' | 'Resolved' | 'Dismissed';
  duration: string;
  note: string;
  sample?: boolean;
}

const SAMPLE: Row[] = [
  { id: 'INC-20261019-0041', when: '19 Oct · 22:14', camera: 'CAM-02', zone: 'Conveyor line', type: 'Smoke', peak: 0.58, priority: 'P2', state: 'Resolved', duration: '12 min', note: 'Belt friction near roller 14. Belt cleaned and re-tensioned.', sample: true },
  { id: 'INC-20261017-0040', when: '17 Oct · 03:41', camera: 'CAM-03', zone: 'Ladle bay', type: 'Look-alike', peak: 0.44, priority: '—', state: 'Dismissed', duration: '0 min', note: 'Steam from ladle pre-heat looked like smoke for 0.3 s. Not confirmed, no alert raised.', sample: true },
  { id: 'INC-20261012-0039', when: '12 Oct · 15:02', camera: 'CAM-05', zone: 'Corridor', type: 'Sparks', peak: 0.63, priority: 'P3', state: 'Resolved', duration: '25 min', note: 'Sparks from planned welding work. Hot-work permit was active; zone muted for the job.', sample: true },
];

interface Props {
  tl: Timeline;
  status: Status;
  t: number;
  ack: Ack | null;
  resolved: boolean;
  onAck: () => void;
  onResolve: () => void;
  onOpenLive: () => void;
}

export default function IncidentsPage({ tl, status, t, ack, resolved, onAck, onResolve, onOpenLive }: Props) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const rows: Row[] = [];
  if (status !== 'clear') {
    const fire = status === 'fire';
    const peak = fire ? Number(tl.events.find((e) => e.kind === 'fire_alert')?.detail.match(/(\d+)%/)?.[1] ?? 0) / 100 : Number(tl.events.find((e) => e.kind === 'smoke_warning')?.detail.match(/(\d+)%/)?.[1] ?? 0) / 100;
    const since = tl.smokeWarnAt ?? 0;
    rows.push({
      id: INCIDENT_ID,
      when: 'Today · live',
      camera: 'CAM-04',
      zone: 'Machine room',
      type: fire ? 'Fire' : 'Smoke',
      peak,
      priority: fire ? 'P1' : 'P2',
      state: resolved ? 'Resolved' : ack ? 'Acknowledged' : 'Open',
      duration: `${Math.max(0, t - since).toFixed(0)} s`,
      note: fire ? 'Fire confirmed beside the machine after an early smoke warning.' : 'Smoke confirmed above a bucket beside the machine.',
    });
  }
  rows.push(...SAMPLE);
  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'open' ? r.state === 'Open' || r.state === 'Acknowledged' : r.state === 'Resolved' || r.state === 'Dismissed'));
  const sel = rows.find((r) => r.id === open) ?? null;
  const live = sel?.id === INCIDENT_ID;
  const visible = tl.events.filter((e) => e.t <= t + 1e-3);

  return (
    <div className="page-body">
      <section className="panel">
        <div className="panel-head">
          <div className="seg" role="tablist" aria-label="Filter incidents">
            {(['all', 'open', 'closed'] as const).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Closed'}
              </button>
            ))}
          </div>
          <span className="muted small">Earlier incidents are sample history for the demo</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Incident</th><th>Started</th><th>Camera · zone</th><th>Type</th><th className="num">Peak</th><th>Priority</th><th>Status</th><th className="num">Duration</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} onClick={() => setOpen(r.id)} className={r.id === INCIDENT_ID ? `live-row ${status}` : ''} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(r.id)}>
                  <td className="mono">{r.id}{r.id === INCIDENT_ID && <span className="live-tag">LIVE</span>}</td>
                  <td>{r.when}</td>
                  <td>{r.camera} · {r.zone}</td>
                  <td><span className={`type ${r.type.toLowerCase().replace('-', '')}`}>{r.type}</span></td>
                  <td className="num mono">{Math.round(r.peak * 100)}%</td>
                  <td><span className={`prio ${r.priority.toLowerCase()}`}>{r.priority}</span></td>
                  <td><span className={`state ${r.state.toLowerCase()}`}>{r.state}</span></td>
                  <td className="num mono">{r.duration}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={8} className="empty">No incidents match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {sel && (
        <div className="drawer-back" onClick={() => setOpen(null)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Incident ${sel.id}`}>
            <div className="drawer-head">
              <div>
                <div className="mono muted small">{sel.id}</div>
                <h2>{sel.type} · {sel.zone}</h2>
              </div>
              <button className="icon-btn" onClick={() => setOpen(null)} aria-label="Close"><Close size={16} /></button>
            </div>
            <div className="drawer-meta">
              <div><span>Camera</span>{sel.camera}</div>
              <div><span>Started</span>{sel.when}</div>
              <div><span>Peak confidence</span>{Math.round(sel.peak * 100)}%</div>
              <div><span>Status</span>{sel.state}</div>
            </div>
            {live && tl.fireAlertAt !== undefined && t >= tl.fireAlertAt + 1.2 && <img className="drawer-img" src={SNAPSHOT} alt="Incident snapshot" />}
            <p className="drawer-note">{sel.note}</p>
            {live ? (
              <>
                <div className="eyebrow">Timeline</div>
                <ul className="mini-log">
                  {visible.map((e) => (
                    <li key={`${e.kind}-${e.t}`} className={eventTone[e.kind]}>
                      <span className="mono">{fmtSec(e.t)}</span>
                      <span>{e.title}</span>
                    </li>
                  ))}
                </ul>
                <div className="drawer-actions">
                  {!ack && <button className="btn primary" onClick={onAck}>Acknowledge</button>}
                  {ack && !resolved && <button className="btn primary" onClick={onResolve}>Mark resolved</button>}
                  <button className="btn" onClick={() => { setOpen(null); onOpenLive(); }}>Open live camera</button>
                </div>
              </>
            ) : (
              <div className="drawer-note muted small">Sample record. Shows how past incidents are kept for audits and shift handover.</div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
