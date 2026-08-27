import { useEffect } from 'react';

export function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = `${title} | HONEYWELL PRODUCTS`;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
