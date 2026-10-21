import type { Detections } from '../types';

export default function HowItDecides({ th }: { th: Detections['thresholds'] }) {
  const steps = [
    {
      title: 'Look at every frame',
      text: 'A fire and smoke detection model checks each CCTV frame and draws a box around anything that looks like smoke or flame.',
    },
    {
      title: 'Confirm over time',
      text: `Smoke must appear in ${Math.round(th.smokeRatio * 100)}% of frames over ${th.smokeWindow} second; fire in ${Math.round(
        th.fireRatio * 100,
      )}% over ${th.fireWindow} s. One-off look-alikes, like a grey shirt walking past, are ignored.`,
    },
    {
      title: 'Warn early',
      text: 'Smoke raises an amber warning first, so someone can check and cut power before flames appear.',
    },
    {
      title: 'Escalate and log',
      text: 'A confirmed fire sets off the siren, alerts the fire team and raises an incident query with a snapshot.',
    },
  ];
  return (
    <section className="card how">
      <div className="label">How it decides</div>
      <div className="how-grid">
        {steps.map((s, i) => (
          <div className="how-step" key={s.title}>
            <div className="how-title">
              <span className="how-num">{i + 1}</span>
              {s.title}
            </div>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
