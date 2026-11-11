import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, eyebrow, children, size = '', hideHeader = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('modal-open');
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`modal ${size} ${hideHeader ? 'no-header' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={!hideHeader && title ? 'modal-title' : undefined}
      >
        {hideHeader ? (
          <button
            className="modal-close modal-close-floating"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        ) : (
          <div className="modal-header">
            {eyebrow && <p className="eyebrow dark">{eyebrow}</p>}
            {title && <h2 id="modal-title">{title}</h2>}
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={21} />
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
