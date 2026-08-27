import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import ProductCard from '../components/products/ProductCard';
import { products } from '../data/products';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import productsHeroImage from '../assets/images/products-hero.png';

const categoryFilters = [
  ['CCTV', ['cctv-cameras']], ['IP Camera', ['ip-cameras']], ['Analog Camera', ['cctv-cameras', 'dome-cameras', 'bullet-cameras']], ['Dome', ['dome-cameras']], ['Bullet', ['bullet-cameras']], ['PTZ', ['ptz-cameras']], ['Wi-Fi', ['wifi-cameras']], ['4G', ['4g-cameras']], ['Solar', ['solar-cameras']], ['NVR', ['nvr']], ['DVR', ['dvr']], ['Storage', ['surveillance-storage']], ['Networking', ['networking']], ['Accessories', ['cctv-accessories']],
];
const filterGroups = [
  { key: 'category', label: 'Category', items: categoryFilters.map(([label]) => label) },
  { key: 'installation', label: 'Installation', items: ['Indoor', 'Outdoor'] },
  { key: 'connectivity', label: 'Connectivity', items: ['PoE', 'Wi-Fi', '4G'] },
  { key: 'features', label: 'Features', items: ['AI', 'Night Vision', 'Audio', 'Remote Monitoring'] },
];

export default function Products() {
  useDocumentTitle('Products', 'Explore CCTV, IP, Wi-Fi, 4G, solar security, recording, storage and networking product categories.');
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: [], installation: [], connectivity: [], features: [] });
  const [sort, setSort] = useState('featured');
  const [visible, setVisible] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const categoryId = params.get('category');
    if (!categoryId) return;
    const match = categoryFilters.find(([, ids]) => ids.includes(categoryId));
    setFilters((current) => ({ ...current, category: match ? [match[0]] : [] }));
  }, [params]);
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setFiltersOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const toggle = (key, item) => setFilters((current) => ({ ...current, [key]: current[key].includes(item) ? current[key].filter((value) => value !== item) : [...current[key], item] }));
  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const haystack = [product.name, product.category, product.productType, product.description, ...(product.keywords || [])].join(' ').toLowerCase();
      const categoryMatch = !filters.category.length || filters.category.some((name) => categoryFilters.find(([label]) => label === name)?.[1].includes(product.categoryId));
      const installationMatch = !filters.installation.length || filters.installation.some((item) => product.installation.includes(item));
      const connectivityMatch = !filters.connectivity.length || filters.connectivity.some((item) => product.connectivity.includes(item));
      const featureMatch = !filters.features.length || filters.features.some((item) => product.features.includes(item));
      return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && categoryMatch && installationMatch && connectivityMatch && featureMatch;
    });
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'new') result.sort((a, b) => Number(b.newProduct) - Number(a.newProduct));
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'rating') result.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    return result;
  }, [query, filters, sort]);
  const activeFilterCount = Object.values(filters).reduce((total, items) => total + items.length, 0) + (query.trim() ? 1 : 0) + (sort !== 'featured' ? 1 : 0);
  const reset = () => { setQuery(''); setFilters({ category: [], installation: [], connectivity: [], features: [] }); setSort('featured'); setVisible(12); };

  return <>
    <PageHero eyebrow="PRODUCT CATALOGUE" title="Products" description="Search and filter professional surveillance, recording, networking and solar-security product categories." image={productsHeroImage} />
    <section className="catalogue section"><div className="container"><button className="filter-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} /> FILTER PRODUCTS</button><div className="catalogue-layout">
      <aside className={`filters ${filtersOpen ? 'open' : ''}`} aria-label="Product filters">
        <header className="filter-panel-head"><div><span>REFINE CATALOGUE</span><h2>Filter products</h2></div><span className={`filter-active-count ${activeFilterCount ? '' : 'empty'}`}>{activeFilterCount ? `${activeFilterCount} active` : 'All products'}</span><button className="filter-panel-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button></header>
        <div className="filter-block filter-search-block"><label htmlFor="product-search">Search products</label><div className="filter-search"><Search size={17} /><input id="product-search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12); }} placeholder="Name, category or type" /></div></div>
        {filterGroups.map((group) => <details className="filter-dropdown" key={group.key}><summary><span>{group.label}</span><span className="filter-dropdown-meta">{filters[group.key].length > 0 && <small>{filters[group.key].length} selected</small>}<ChevronDown size={17} /></span></summary><div className="filter-dropdown-panel"><div className="filter-options" role="group" aria-label={group.label}>{group.items.map((item) => <label className="filter-option" key={item}><input type="checkbox" checked={filters[group.key].includes(item)} onChange={() => { toggle(group.key, item); setVisible(12); }} /><span className="filter-checkbox" aria-hidden="true"><Check size={12} strokeWidth={3} /></span><span className="filter-option-label">{item}</span></label>)}</div></div></details>)}
        <footer className="filter-panel-footer"><div><button className="reset-filters" onClick={reset} disabled={!activeFilterCount}><RotateCcw size={15} />Reset all</button><span>{filtered.length} matches</span></div><button className="button filter-apply" onClick={() => setFiltersOpen(false)}>Show {filtered.length} products</button></footer>
      </aside>
      {filtersOpen && <div className="filter-scrim" onClick={() => setFiltersOpen(false)} />}
      <div className="catalogue-results"><div className="catalogue-toolbar"><p><strong>{filtered.length}</strong> products</p><label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="new">New Products</option><option value="rating">Customer rating</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name A–Z</option></select></label></div>{filtered.length ? <><div className="product-grid">{filtered.slice(0, visible).map((product) => <ProductCard key={product.id} product={product} />)}</div>{visible < filtered.length && <button className="button outline load-more" onClick={() => setVisible((value) => value + 6)}>Load more products</button>}</> : <div className="empty-state large"><Search size={36} /><h2>No products found</h2><p>Try a different search term or clear your filters.</p><button className="button outline" onClick={reset}>Reset filters</button></div>}</div>
    </div><p className="demo-disclaimer">Product information is representative demo content. Replace all specifications, model details, pricing, ratings, imagery and availability with client-verified catalogue data.</p></div></section>
  </>;
}
