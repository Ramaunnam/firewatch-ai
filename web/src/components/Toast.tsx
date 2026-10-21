import type { Detections, Status } from '../types';

interface Props {
  status: Status;
  camera: Detections['camera'];
  onClose: () => void;
}

export default function Toast({ status, camera, onClose }: Props) {
  if (status === 'clear') return null;
  const fire = status === 'fire';
  return (
    <div className={`toast toast-${status}`} role="alert">
      <span className="toast-bar" />
      <div className="toast-body">
        <div className="toast-from">FireWatch AI · now</div>
        <div className="toast-title">
          {fire ? 'Fire detected' : 'Smoke detected'} · {camera.id}
        </div>
        <div className="toast-text">
          {camera.name} · {fire ? 'evacuate and respond' : 'check machine area now'}
        </div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
