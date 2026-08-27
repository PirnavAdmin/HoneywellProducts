import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, eyebrow, children, size = '' }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.classList.remove('modal-open'); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={21} /></button>
        {eyebrow && <p className="eyebrow dark">{eyebrow}</p>}
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
