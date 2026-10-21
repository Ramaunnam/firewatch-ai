import type { FwEvent, Status } from '../types';
import { Check } from './Icons';

export interface Ack {
  videoT: number;
  wall: string;
}

interface Props {
  status: Status;
  events: FwEvent[];
  manual: Record<string, boolean>;
  onManual: (id: string) => void;
  ack: Ack | null;
  resolved: boolean;
  onAck: () => void;
  onResolve: () => void;
}

const auto = [
  { kind: 'supervisor', label: 'Shift supervisor alerted', sub: 'SMS + call' },
  { kind: 'siren', label: 'Siren and beacon on', sub: 'PLC output DO-04' },
  { kind: 'fire_team', label: 'Fire team alerted', sub: 'Teams / WhatsApp / email' },
  { kind: 'incident', label: 'Incident query raised', sub: 'P1 with snapshot' },
];
const manualSteps = [
  { id: 'evac', label: 'Evacuate Floor B', sub: 'Use EXIT 1 and EXIT 2' },
  { id: 'power', label: 'Isolate power to machine room', sub: 'Panel MCC-B2' },
  { id: 'scene', label: 'Fire team on scene', sub: 'Confirm by radio' },
];

export default function ResponsePanel({ status, events, manual, onManual, ack, resolved, onAck, onResolve }: Props) {
  const done = (k: string) => events.find((e) => e.kind === k);
  const active = status !== 'clear';
  return (
    <section className="panel response">
      <div className="panel-head">
        <span className="eyebrow">Response checklist</span>
        <span className={`chip ${resolved ? 'ok' : active ? status : 'muted'}`}>
          {resolved ? 'Resolved' : ack ? 'Acknowledged' : active ? 'Action needed' : 'Standing by'}
        </span>
      </div>
      {!active ? (
        <p className="empty">
          No active incident. When FireWatch confirms smoke or fire, the automatic alerts and the team’s steps appear here.
        </p>
      ) : (
        <>
          <ul className="steps">
            {auto.map((s) => {
              const e = done(s.kind);
              return (
                <li key={s.kind} className={e ? 'done' : 'wait'}>
                  <span className="step-box">{e ? <Check size={13} /> : null}</span>
                  <div>
                    <div className="step-label">{s.label}</div>
                    <div className="step-sub">{e ? `Automatic · ${e.t.toFixed(1)} s` : `Automatic · ${s.sub}`}</div>
                  </div>
                </li>
              );
            })}
            {manualSteps.map((s) => (
              <li key={s.id} className={manual[s.id] ? 'done' : 'todo'}>
                <button className="step-box" onClick={() => onManual(s.id)} aria-pressed={!!manual[s.id]} aria-label={s.label}>
                  {manual[s.id] ? <Check size={13} /> : null}
                </button>
                <div>
                  <div className="step-label">{s.label}</div>
                  <div className="step-sub">{manual[s.id] ? 'Done by Shift Supervisor' : s.sub}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="resp-actions">
            {!ack ? (
              <button className="btn primary wide" onClick={onAck}>Acknowledge alert</button>
            ) : !resolved ? (
              <button className="btn wide" onClick={onResolve}>Mark incident resolved</button>
            ) : (
              <div className="resolved-note"><Check size={14} /> Resolved · logged to incident history</div>
            )}
            {ack && <div className="ack-note">Acknowledged by Shift Supervisor at {ack.wall}</div>}
          </div>
        </>
      )}
    </section>
  );
}
