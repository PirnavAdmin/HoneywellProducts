import { useEffect } from 'react';

export function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = 'HONEYWELL PRODUCTS | SMART TECHNOLOGY. STRONGER PROTECTION';
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}

