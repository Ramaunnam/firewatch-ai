import type { Detections, Thresholds, Timeline } from '../types';
import ConfidenceChart from '../components/ConfidenceChart';

interface Props {
  data: Detections;
  tl: Timeline;
  th: Thresholds;
  t: number;
  onSeek: (t: number) => void;
}

export default function AnalyticsPage({ data, tl, th, t, onSeek }: Props) {
  const s = tl.stats;
  const dur = data.video.duration;
  const marks = [
    { at: tl.firstSmokeAt, label: 'First smoke', tone: 'info' },
    { at: tl.smokeWarnAt, label: 'Smoke warning', tone: 'warn' },
    { at: tl.flameAt, label: 'Flame seen', tone: 'info' },
    { at: tl.fireAlertAt, label: 'Fire alert', tone: 'crit' },
  ].filter((m) => m.at !== undefined) as Array<{ at: number; label: string; tone: string }>;
  const bars = [
    { label: 'Frames checked', v: s.framesChecked, tone: 'neutral' },
    { label: 'Frames with smoke above alarm level', v: s.smokeFrames, tone: 'warn' },
    { label: 'Frames with fire above alarm level', v: s.fireFrames, tone: 'crit' },
  ];
  const steps = [
    { title: 'Look at every frame', text: 'A fire and smoke detection model checks each CCTV frame and draws a box around anything that looks like smoke or flame.' },
    { title: 'Confirm over time', text: `Smoke must appear in ${Math.round(th.smokeRatio * 100)}% of frames over ${th.smokeWindow} s; fire in ${Math.round(th.fireRatio * 100)}% over ${th.fireWindow} s. One-off look-alikes, like a grey shirt walking past, are ignored.` },
    { title: 'Warn early', text: 'Smoke raises an amber warning first, so someone can check and cut power before flames appear.' },
    { title: 'Escalate and log', text: 'A confirmed fire sets off the siren, alerts the fire team and raises an incident query with a snapshot.' },
  ];
  return (
    <div className="page-body">
      <section className="kpis">
        <div className="kpi"><div className="kpi-label">Early warning</div><div className="kpi-value mono">{s.leadTime !== null ? `${s.leadTime.toFixed(1)} s` : '—'}</div><div className="kpi-sub">smoke warning before the fire alert</div></div>
        <div className="kpi"><div className="kpi-label">Time to confirm</div><div className="kpi-value mono">{s.smokeToWarning !== null ? `${s.smokeToWarning.toFixed(1)} s` : '—'}</div><div className="kpi-sub">first visible smoke to warning</div></div>
        <div className="kpi"><div className="kpi-label">False alarms</div><div className="kpi-value mono">{s.falseAlarms}</div><div className="kpi-sub">{s.lookalikes} look-alike{s.lookalikes === 1 ? '' : 's'}, {s.traces} early trace{s.traces === 1 ? '' : 's'} ignored</div></div>
        <div className="kpi"><div className="kpi-label">Coverage</div><div className="kpi-value mono">100%</div><div className="kpi-sub">{s.framesChecked} of {data.video.frames} frames at {data.video.fps} fps</div></div>
      </section>

      <section className="panel">
        <div className="panel-head"><span className="eyebrow">What the AI saw, frame by frame</span></div>
        <ConfidenceChart data={data} tl={tl} th={th} t={t} onSeek={onSeek} height={210} />
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><span className="eyebrow">Detection timeline</span><span className="muted small">seconds into the clip</span></div>
          <div className="track">
            <div className="track-line" />
            {tl.smokeWarnAt !== undefined && (
              <div className="track-span warn" style={{ left: `${(tl.smokeWarnAt / dur) * 100}%`, width: `${(((tl.fireAlertAt ?? dur) - tl.smokeWarnAt) / dur) * 100}%` }}>
                <span>{s.leadTime !== null ? `${s.leadTime.toFixed(1)} s early warning` : 'warning'}</span>
              </div>
            )}
            {marks.map((m, i) => (
              <div key={m.label} className={`track-mark ${m.tone} ${i % 2 ? 'low' : ''}`} style={{ left: `${(m.at / dur) * 100}%` }}>
                <i />
                <b className="mono">{m.at.toFixed(1)} s</b>
                <span>{m.label}</span>
              </div>
            ))}
            <div className="track-axis mono"><span>0 s</span><span>{(dur / 2).toFixed(0)} s</span><span>{dur.toFixed(0)} s</span></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><span className="eyebrow">Detection breakdown</span></div>
          <div className="bars">
            {bars.map((b) => (
              <div key={b.label} className="bar-row">
                <div className="bar-top"><span>{b.label}</span><b className="mono">{b.v}</b></div>
                <div className="bar"><div className={`bar-fill ${b.tone}`} style={{ width: `${(b.v / s.framesChecked) * 100}%` }} /></div>
              </div>
            ))}
            <div className="bar-row">
              <div className="bar-top"><span>Look-alikes ignored</span><b className="mono">{s.lookalikes}</b></div>
              <div className="muted small">Readings caused by a person's own shape/motion near the camera</div>
            </div>
            <div className="bar-row">
              <div className="bar-top"><span>Early traces ignored</span><b className="mono">{s.traces}</b></div>
              <div className="muted small">Genuine but brief/faint readings that never passed the confirm-over-time rule</div>
            </div>
          </div>
        </section>
      </div>

      <section className="panel how">
        <div className="panel-head"><span className="eyebrow">How it decides</span></div>
        <ol className="how-grid">
          {steps.map((st) => (
            <li key={st.title}>
              <div className="how-title">{st.title}</div>
              <p>{st.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
