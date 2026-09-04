import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X, Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/productService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import productsHeroImage from '../assets/images/products-hero.png';

const categoryFilters = [
  ['CCTV', ['cctv-cameras']], ['IP Camera', ['ip-cameras']], ['Analog Camera', ['cctv-cameras', 'dome-cameras', 'bullet-cameras']], ['Dome', ['dome-cameras']], ['Bullet', ['bullet-cameras']], ['PTZ', ['ptz-cameras']], ['Wi-Fi', ['wifi-cameras']], ['4G', ['4g-cameras']], ['Solar Security', ['solar-cameras']], ['Solar Panels', ['solar-panels']], ['Solar Inverters', ['solar-inverters']], ['Solar Batteries', ['solar-batteries']], ['Solar Accessories', ['solar-controllers']], ['NVR', ['nvr']], ['DVR', ['dvr']], ['Storage', ['surveillance-storage']], ['Networking', ['networking']], ['Accessories', ['cctv-accessories']],
];

const filterGroups = [
  { key: 'category', label: 'Category', items: categoryFilters.map(([label]) => label) },
  { key: 'subcategory', label: 'Sub Category', items: [] },
  { key: 'installation', label: 'Installation', items: ['Indoor', 'Outdoor'] },
  { key: 'connectivity', label: 'Connectivity', items: ['PoE', 'Wi-Fi', '4G'] },
  { key: 'features', label: 'Features', items: ['AI', 'Night Vision', 'Audio', 'Remote Monitoring'] },
];

export default function Products() {
  useDocumentTitle('Products', 'Explore CCTV, IP, Wi-Fi, 4G, solar security, recording, storage and networking product categories.');
  const [params] = useSearchParams();
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: [], subcategory: [], installation: [], connectivity: [], features: [] });
  const [sort, setSort] = useState('featured');
  const [visible, setVisible] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProductsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Unable to connect to products server. Please check backend status.');
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const categoryId = params.get('category');
    if (!categoryId) return;
    const match = categoryFilters.find(([, ids]) => ids.includes(categoryId));
    setFilters((current) => ({ ...current, category: match ? [match[0]] : [], subcategory: [] }));
  }, [params]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setFiltersOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const availableSubcategories = useMemo(() => {
    if (!filters.category.length) return [];
    const categoryIds = new Set(filters.category.flatMap((name) => categoryFilters.find(([label]) => label === name)?.[1] || []));
    return [...new Set(productsList.filter((product) => categoryIds.has(product.categoryId)).map((product) => product.productType).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [filters.category, productsList]);

  const toggle = (key, item) => setFilters((current) => {
    const nextItems = current[key].includes(item) ? current[key].filter((value) => value !== item) : [...current[key], item];
    return key === 'category' ? { ...current, category: nextItems, subcategory: [] } : { ...current, [key]: nextItems };
  });

  const filtered = useMemo(() => {
    const result = productsList.filter((product) => {
      const haystack = [product.name, product.category, product.productType, product.description, ...(product.keywords || []), ...(product.highlights || [])].join(' ').toLowerCase();
      const categoryMatch = !filters.category.length || filters.category.some((name) => {
        const catObj = categoryFilters.find(([label]) => label === name);
        if (!catObj) return false;
        return catObj[1].includes(product.categoryId) || (product.category && product.category.toLowerCase().includes(name.toLowerCase()));
      });
      const subcategoryMatch = !filters.subcategory.length || filters.subcategory.includes(product.productType);
      const installationMatch = !filters.installation.length || (product.installation && filters.installation.some((item) => product.installation.includes(item)));
      const connectivityMatch = !filters.connectivity.length || (product.connectivity && filters.connectivity.some((item) => product.connectivity.includes(item)));
      const featureMatch = !filters.features.length || (product.features && filters.features.some((item) => product.features.includes(item)));
      return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && categoryMatch && subcategoryMatch && installationMatch && connectivityMatch && featureMatch;
    });

    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'new') result.sort((a, b) => Number(b.newProduct || 0) - Number(a.newProduct || 0));
    if (sort === 'price-low') result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sort === 'price-high') result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sort === 'rating') result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
    return result;
  }, [productsList, query, filters, sort]);

  const activeFilterCount = Object.values(filters).reduce((total, items) => total + items.length, 0) + (query.trim() ? 1 : 0) + (sort !== 'featured' ? 1 : 0);
  const reset = () => { setQuery(''); setFilters({ category: [], subcategory: [], installation: [], connectivity: [], features: [] }); setSort('featured'); setVisible(12); };

  return <>
    <PageHero eyebrow="PRODUCT CATALOGUE" title="Products" description="Search and filter professional surveillance, recording, networking and solar-security product categories." image={productsHeroImage} />
    <section className="catalogue section">
      <div className="container">
        <button className="filter-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} /> FILTER PRODUCTS</button>
        <div className="catalogue-layout">
          <aside className={`filters ${filtersOpen ? 'open' : ''}`} aria-label="Product filters">
            <header className="filter-panel-head">
              <div><span>REFINE CATALOGUE</span><h2>Filter products</h2></div>
              <span className={`filter-active-count ${activeFilterCount ? '' : 'empty'}`}>{activeFilterCount ? `${activeFilterCount} active` : 'All products'}</span>
              <button className="filter-panel-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button>
            </header>

            <div className="filter-block filter-search-block">
              <label htmlFor="product-search">Search products</label>
              <div className="filter-search">
                <Search size={17} />
                <input id="product-search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12); }} placeholder="Name, category or type" />
              </div>
            </div>

            {filterGroups.map((group) => {
              const items = group.key === 'subcategory' ? availableSubcategories : group.items;
              const isDisabled = group.key === 'subcategory' && !filters.category.length;
              return <details className={`filter-dropdown ${isDisabled ? 'disabled' : ''}`} key={group.key}>
                <summary aria-disabled={isDisabled} onClick={(event) => isDisabled && event.preventDefault()}>
                  <span>{group.label}</span>
                  <span className="filter-dropdown-meta">{isDisabled ? <small>Select Category First</small> : filters[group.key].length > 0 && <small>{filters[group.key].length} selected</small>}<ChevronDown size={17} /></span>
                </summary>
                <div className="filter-dropdown-panel">
                  <div className="filter-options" role="group" aria-label={group.label}>
                    {items.length ? items.map((item) => (
                      <label className="filter-option" key={item}>
                        <input type="checkbox" checked={filters[group.key].includes(item)} onChange={() => { toggle(group.key, item); setVisible(12); }} />
                        <span className="filter-checkbox" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                        <span className="filter-option-label">{item}</span>
                      </label>
                    )) : <p className="filter-options-empty">No sub categories available.</p>}
                  </div>
                </div>
              </details>;
            })}

            <footer className="filter-panel-footer">
              <div>
                <button className="reset-filters" onClick={reset} disabled={!activeFilterCount}><RotateCcw size={15} />Reset all</button>
                <span>{filtered.length} matches</span>
              </div>
              <button className="button filter-apply" onClick={() => setFiltersOpen(false)}>Show {filtered.length} products</button>
            </footer>
          </aside>

          {filtersOpen && <div className="filter-scrim" onClick={() => setFiltersOpen(false)} />}

          <div className="catalogue-results">
            <div className="catalogue-toolbar">
              <p><strong>{filtered.length}</strong> products</p>
              <label>Sort by
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="new">New Products</option>
                  <option value="rating">Customer rating</option>
                  <option value="price-low">Price: Low to high</option>
                  <option value="price-high">Price: High to low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="empty-state large" style={{ padding: '4rem 1rem' }}>
                <Loader2 size={36} className="animate-spin text-amber-500" style={{ animation: 'spin 1s linear infinite' }} />
                <h2>Loading live products...</h2>
                <p>Fetching products from API endpoint</p>
              </div>
            ) : error ? (
              <div className="empty-state large" style={{ padding: '4rem 1rem' }}>
                <AlertCircle size={40} color="#ef4444" />
                <h2>Product Service Connection Issue</h2>
                <p>{error}</p>
                <button className="button outline" onClick={loadProducts}>Try Refreshing</button>
              </div>
            ) : filtered.length ? (
              <>
                <div className="product-grid">
                  {filtered.slice(0, visible).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {visible < filtered.length && (
                  <button className="button outline load-more" onClick={() => setVisible((value) => value + 6)}>Load more products</button>
                )}
              </>
            ) : (
              <div className="empty-state large">
                <Search size={36} />
                <h2>No products found</h2>
                <p>Try a different search term or clear your filters.</p>
                <button className="button outline" onClick={reset}>Reset filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  </>;
}
