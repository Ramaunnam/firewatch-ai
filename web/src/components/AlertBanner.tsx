import type { Status } from '../types';

interface Props {
  status: Status;
  conf: number;
  acknowledged: boolean;
  onRespond: () => void;
}

export default function AlertBanner({ status, conf, acknowledged, onRespond }: Props) {
  if (status === 'clear') return null;
  const fire = status === 'fire';
  return (
    <div className={`banner ${status} ${acknowledged ? 'acked' : ''}`} role="alert">
      <span className="banner-icon" aria-hidden="true">{fire ? '!' : '≈'}</span>
      <div className="banner-text">
        <strong>{fire ? 'Fire detected' : 'Smoke detected'}</strong>
        <span>
          CAM-04 · Machine room, Floor B · {Math.round(conf * 100)}% confidence
          {acknowledged ? ' · acknowledged' : fire ? ' · evacuate and respond' : ' · check the machine area now'}
        </span>
      </div>
      <button className="banner-btn" onClick={onRespond}>
        {fire ? 'Open response' : 'View camera'}
      </button>
    </div>
  );
}
