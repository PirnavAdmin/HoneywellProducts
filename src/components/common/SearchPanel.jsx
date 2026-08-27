import { useEffect, useMemo, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { products } from '../../data/products';

export default function SearchPanel({ open, onClose }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => query.trim().length < 2 ? [] : products.filter((product) => [product.name, product.category, product.productType, product.description, ...(product.keywords || [])].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 6), [query]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="search-panel-inner">
        <button className="icon-button search-close" onClick={onClose} aria-label="Close search"><X /></button>
        <p className="eyebrow dark">PRODUCT SEARCH</p>
        <div className="search-input-wrap"><Search size={26} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product type or category" aria-label="Search products" /></div>
        {!query && <p className="search-hint">Try “CCTV camera”, “solar security” or “PoE switch”.</p>}
        {query.length >= 2 && !results.length && <div className="empty-state">No products match “{query}”.</div>}
        <div className="search-results">
          {results.map((product) => <Link key={product.id} to={`/products/${product.id}`} onClick={onClose}><img src={product.image} alt="" /><span><small>{product.category} • {product.productType}</small><strong>{product.name}</strong></span><ArrowRight size={20} /></Link>)}
        </div>
      </div>
    </div>
  );
}
