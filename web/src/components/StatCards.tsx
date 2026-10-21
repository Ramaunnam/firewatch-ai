import type { Detections } from '../types';

export default function StatCards({ data }: { data: Detections }) {
  const s = data.stats;
  const cards = [
    { big: `${s.leadTime} s`, small: 'smoke warning came before the fire alert' },
    { big: `${s.smokeToWarning} s`, small: 'from first visible smoke to the warning' },
    { big: `${s.falseAlarms}`, small: `false alarms · ${s.lookalikes} look-alike ignored` },
    { big: `${s.framesChecked}`, small: `frames checked · every frame at ${data.video.fps} fps` },
  ];
  return (
    <section className="stats">
      {cards.map((c) => (
        <div className="card stat" key={c.small}>
          <div className="stat-big">{c.big}</div>
          <div className="stat-small">{c.small}</div>
        </div>
      ))}
    </section>
  );
}
