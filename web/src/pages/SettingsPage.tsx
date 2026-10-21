import type { Thresholds, Timeline } from '../types';
import type { Settings } from '../lib/settings';

interface Props {
  settings: Settings;
  defaults: Thresholds;
  tl: Timeline;
  onChange: (s: Settings) => void;
}

interface SliderDef {
  key: keyof Thresholds;
  label: string;
  help: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}

const smokeDefs: SliderDef[] = [
  { key: 'smoke', label: 'Alarm level', help: 'How sure the model must be before a frame counts as smoke', min: 0.1, max: 0.7, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'smokeWindow', label: 'Confirm window', help: 'How long to watch before warning', min: 0.4, max: 3, step: 0.1, fmt: (v) => `${v.toFixed(1)} s` },
  { key: 'smokeRatio', label: 'Frames needed', help: 'Share of frames in the window that must show smoke', min: 0.3, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
];
const fireDefs: SliderDef[] = [
  { key: 'fire', label: 'Alarm level', help: 'How sure the model must be before a frame counts as fire', min: 0.2, max: 0.8, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'fireWindow', label: 'Confirm window', help: 'How long to watch before the fire alert', min: 0.2, max: 2, step: 0.1, fmt: (v) => `${v.toFixed(1)} s` },
  { key: 'fireRatio', label: 'Frames needed', help: 'Share of frames in the window that must show fire', min: 0.3, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
];

export default function SettingsPage({ settings, defaults, tl, onChange }: Props) {
  const th = settings.thresholds;
  const set = (k: keyof Thresholds, v: number) => onChange({ ...settings, thresholds: { ...th, [k]: v } });
  const group = (title: string, tone: string, defs: SliderDef[]) => (
    <section className="panel">
      <div className="panel-head"><span className={`eyebrow dot ${tone}`}>{title}</span></div>
      <div className="sliders">
        {defs.map((d) => (
          <div className="slider" key={d.key}>
            <div className="slider-top">
              <label htmlFor={`s-${d.key}`}>{d.label}</label>
              <span className="mono">{d.fmt(th[d.key])}</span>
            </div>
            <input id={`s-${d.key}`} type="range" min={d.min} max={d.max} step={d.step} value={th[d.key]} onChange={(e) => set(d.key, Number(e.target.value))} className={tone} />
            <div className="slider-help">{d.help}</div>
          </div>
        ))}
      </div>
    </section>
  );
  const s = tl.stats;
  return (
    <div className="page-body">
      <section className={`panel preview ${s.falseAlarms ? 'bad' : ''}`}>
        <div className="panel-head"><span className="eyebrow">Result on this clip</span><span className="muted small">updates as you move the sliders</span></div>
        <div className="preview-grid">
          <div><span>Smoke warning</span><b className="mono">{tl.smokeWarnAt !== undefined ? `${tl.smokeWarnAt.toFixed(1)} s` : 'never'}</b></div>
          <div><span>Fire alert</span><b className="mono">{tl.fireAlertAt !== undefined ? `${tl.fireAlertAt.toFixed(1)} s` : 'never'}</b></div>
          <div><span>Early warning</span><b className="mono">{s.leadTime !== null ? `${s.leadTime.toFixed(1)} s` : '—'}</b></div>
          <div><span>False alarms</span><b className="mono">{s.falseAlarms}</b></div>
          <div><span>Look-alikes ignored</span><b className="mono">{s.lookalikes}</b></div>
        </div>
        {s.falseAlarms > 0 && <p className="warn-text">These settings raise a false alarm on the worker’s grey shirt. Raise the smoke alarm level or the frames needed.</p>}
        {tl.fireAlertAt === undefined && <p className="warn-text">With these settings the fire is never confirmed. Lower the fire alarm level.</p>}
      </section>
      <div className="two-col">
        {group('Smoke', 'warn', smokeDefs)}
        {group('Fire', 'crit', fireDefs)}
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><span className="eyebrow">Display and sound</span></div>
          <div className="toggles">
            <label className="toggle"><input id="t-sound" type="checkbox" checked={settings.sound} onChange={(e) => onChange({ ...settings, sound: e.target.checked })} /><span className="sw" /> Alarm sound (beep for smoke, siren for fire)</label>
            <label className="toggle"><input id="t-boxes" type="checkbox" checked={settings.boxes} onChange={(e) => onChange({ ...settings, boxes: e.target.checked })} /><span className="sw" /> Show AI boxes on the video</label>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><span className="eyebrow">Who gets alerted</span><span className="muted small">simulated in this demo</span></div>
          <ul className="channels">
            <li><b>Smoke warning</b><span>Shift supervisor · SMS + call</span></li>
            <li><b>Fire alert</b><span>Siren and beacon · PLC output DO-04</span></li>
            <li><b>Fire alert</b><span>Fire team · Teams, WhatsApp, email with clip</span></li>
            <li><b>Fire alert</b><span>Incident query · P1 with snapshot</span></li>
          </ul>
        </section>
      </div>
      <div>
        <button className="btn" onClick={() => onChange({ ...settings, thresholds: defaults })}>Reset to recommended settings</button>
      </div>
    </div>
  );
}
