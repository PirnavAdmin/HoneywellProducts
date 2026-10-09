import { useEffect, useState } from 'react';
import { Search, X, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../products/ProductCard';

const quickChips = ['CCTV Camera', 'IP Camera', 'Solar Camera', 'NVR', 'PoE Switch', 'Accessories'];

export default function SearchPanel({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      productService.search(query.trim())
        .then((data) => {
          if (isMounted) setResults(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Search API error:', err);
          if (isMounted) setResults([]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('modal-open');
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="search-panel-inner">
        <button className="icon-button search-close" onClick={onClose} aria-label="Close search"><X size={22} /></button>
        
        <div className="search-header">
          <p className="eyebrow dark">PRODUCT DISCOVERY</p>
          <h1>Search Products & Solutions</h1>
          <p className="search-subtitle">Find CCTV cameras, NVRs, IP surveillance, solar security and networking equipment.</p>
        </div>

        <div className="search-box-container">
          <form className="search-input-wrap" onSubmit={(e) => e.preventDefault()}>
            <Search size={22} className="search-box-icon" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product type, category, or keyword..."
              aria-label="Search products"
            />
            {query && (
              <button type="button" className="search-clear-button" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </form>

          <div className="search-chips">
            <span>Popular searches:</span>
            {quickChips.map((chip) => (
              <button key={chip} type="button" className={`search-chip ${query.toLowerCase() === chip.toLowerCase() ? 'active' : ''}`} onClick={() => setQuery(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>

        {!query.trim() && (
          <div className="search-initial-state">
            <div className="search-state-icon"><Search size={32} /></div>
            <h3>Start Searching</h3>
            <p>Enter a product name, category, solution, or select a popular search keyword above.</p>
          </div>
        )}

        {query.trim().length === 1 && (
          <p className="search-hint">Please enter at least 2 characters to search.</p>
        )}

        {query.trim().length >= 2 && (
          <div className="search-results-section">
            <div className="search-results-meta">
              <h2>{loading ? 'Searching live products...' : results.length > 0 ? `${results.length} result${results.length === 1 ? '' : 's'} found for "${query}"` : `No results found for "${query}"`}</h2>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : results.length > 0 ? (
              <div className="product-grid search-results-grid">
                {results.map((product) => (
                  <div key={product.id} onClick={onClose}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state large search-no-results">
                <ShoppingBag size={42} />
                <h2>No products match "{query}"</h2>
                <p>Try checking for spelling errors, using simpler keywords, or browse our complete product catalogue.</p>
                <Link className="button" to="/products" onClick={onClose}>Browse Product Catalogue <ArrowRight size={18} /></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
