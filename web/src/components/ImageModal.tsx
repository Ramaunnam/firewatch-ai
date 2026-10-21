import { useEffect } from 'react';
import { Close } from './Icons';

export default function ImageModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, onClose]);
  if (!src) return null;
  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Incident snapshot">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Incident snapshot · CAM-04 · attached to the incident query</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Close size={16} /></button>
        </div>
        <img src={src} alt="Incident snapshot with the fire box" />
      </div>
    </div>
  );
}
