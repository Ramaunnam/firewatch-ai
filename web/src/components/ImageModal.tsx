import { useEffect } from 'react';

export default function ImageModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, onClose]);
  if (!src) return null;
  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Incident snapshot · attached to the incident query</span>
          <button className="toast-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <img src={src} alt="Incident snapshot" />
      </div>
    </div>
  );
}
