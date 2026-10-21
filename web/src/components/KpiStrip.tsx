import type { Status, Timeline } from '../types';

interface Props {
  tl: Timeline;
  status: Status;
  t: number;
}

const label: Record<Status, string> = { clear: 'All clear', smoke: 'Smoke warning', fire: 'Fire alert' };

/** Figures follow the video: nothing is shown before it has happened. */
export default function KpiStrip({ tl, status, t }: Props) {
  const since = status === 'fire' ? tl.fireAlertAt : status === 'smoke' ? tl.smokeWarnAt : undefined;
  const s = tl.stats;
  const warned = tl.smokeWarnAt !== undefined && t >= tl.smokeWarnAt;
  const fired = tl.fireAlertAt !== undefined && t >= tl.fireAlertAt;
  const lookSeen = tl.events.filter((e) => e.kind === 'lookalike' && e.t <= t).length;

  let ewValue = '—';
  let ewSub = 'starts when smoke is confirmed';
  if (fired && s.leadTime !== null) {
    ewValue = `${s.leadTime.toFixed(1)} s`;
    ewSub = 'smoke warning came before the fire alert';
  } else if (warned) {
    ewValue = `${(t - tl.smokeWarnAt!).toFixed(1)} s`;
    ewSub = 'since the smoke warning · no flame yet';
  }

  return (
    <section className="kpis" aria-label="Key figures">
      <div className={`kpi status-kpi ${status}`}>
        <div className="kpi-label">Floor B status</div>
        <div className="kpi-value">{label[status]}</div>
        <div className="kpi-sub">{since !== undefined ? `for ${(t - since).toFixed(1)} s · CAM-04` : '6 zones · no active alarms'}</div>
      </div>
      <div className={`kpi ${warned && !fired ? 'counting' : ''}`}>
        <div className="kpi-label">Early warning</div>
        <div className="kpi-value mono">{ewValue}</div>
        <div className="kpi-sub">{ewSub}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Time to confirm</div>
        <div className="kpi-value mono">{warned && s.smokeToWarning !== null ? `${s.smokeToWarning.toFixed(1)} s` : '—'}</div>
        <div className="kpi-sub">{warned ? 'from first visible smoke to the warning' : 'waiting for smoke'}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">False alarms</div>
        <div className="kpi-value mono">{s.falseAlarms}</div>
        <div className="kpi-sub">{lookSeen} sub-threshold reading{lookSeen === 1 ? '' : 's'} ignored so far</div>
      </div>
    </section>
  );
}
