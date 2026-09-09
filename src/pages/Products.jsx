import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X, Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/productService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import productsHeroImage from '../assets/images/products-hero.png';

export default function Products() {
  useDocumentTitle('Products', 'Explore professional surveillance, recording, networking and security product categories.');
  const [params] = useSearchParams();
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: [], subcategory: [], installation: [], connectivity: [], features: [] });
  const [sort, setSort] = useState('featured');
  const [visible, setVisible] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prods, cats] = await Promise.all([
        productService.getAll().catch(() => []),
        productService.categories().catch(() => []),
      ]);
      setProductsList(Array.isArray(prods) ? prods : []);
      setCategoriesList(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error('Failed to load products/categories:', err);
      setError(err.message || 'Unable to connect to products server. Please check backend status.');
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const categoryParam = params.get('category');
    if (!categoryParam) return;
    const match = categoriesList.find(
      (c) =>
        String(c.id) === String(categoryParam) ||
        (c.slug && c.slug.toLowerCase() === categoryParam.toLowerCase()) ||
        (c.name && c.name.toLowerCase() === categoryParam.toLowerCase())
    );
    const catName = match ? match.name : categoryParam;
    setFilters((current) => ({ ...current, category: [catName], subcategory: [] }));
  }, [params, categoriesList]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setFiltersOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  // 1. Dynamic Categories from API + real products
  const dynamicCategoryList = useMemo(() => {
    const apiCatNames = categoriesList.map((c) => c.name).filter(Boolean);
    const prodCatNames = productsList.map((p) => p.category).filter(Boolean);
    const combined = [...new Set([...apiCatNames, ...prodCatNames])];
    return combined.sort((a, b) => a.localeCompare(b));
  }, [categoriesList, productsList]);

  // 2. Dynamic Subcategories based on selected category or all loaded products
  const availableSubcategories = useMemo(() => {
    let sourceProducts = productsList;
    if (filters.category.length > 0) {
      sourceProducts = productsList.filter((product) =>
        filters.category.some((catName) => {
          if (product.category && product.category.toLowerCase() === catName.toLowerCase()) return true;
          const catObj = categoriesList.find((c) => c.name.toLowerCase() === catName.toLowerCase());
          if (catObj && String(product.categoryId) === String(catObj.id)) return true;
          return String(product.categoryId) === String(catName);
        })
      );
    }
    const subcats = sourceProducts.map((p) => p.productType).filter(Boolean);
    return [...new Set(subcats)].sort((a, b) => a.localeCompare(b));
  }, [filters.category, productsList, categoriesList]);

  // 3. Dynamic Installation options from products
  const availableInstallation = useMemo(() => {
    const options = new Set();
    productsList.forEach((p) => {
      if (Array.isArray(p.installation)) {
        p.installation.forEach((item) => item && options.add(String(item).trim()));
      } else if (typeof p.installation === 'string' && p.installation.trim()) {
        options.add(p.installation.trim());
      }
    });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [productsList]);

  // 4. Dynamic Connectivity options from products
  const availableConnectivity = useMemo(() => {
    const options = new Set();
    productsList.forEach((p) => {
      if (Array.isArray(p.connectivity)) {
        p.connectivity.forEach((item) => item && options.add(String(item).trim()));
      } else if (typeof p.connectivity === 'string' && p.connectivity.trim()) {
        options.add(p.connectivity.trim());
      }
    });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [productsList]);

  // 5. Dynamic Features options from products
  const availableFeatures = useMemo(() => {
    const options = new Set();
    productsList.forEach((p) => {
      const featList = Array.isArray(p.features)
        ? p.features
        : Array.isArray(p.keyFeatures)
        ? p.keyFeatures
        : Array.isArray(p.highlights)
        ? p.highlights
        : [];
      featList.forEach((item) => {
        if (typeof item === 'string' && item.trim() && item.length < 35) {
          options.add(item.trim());
        }
      });
    });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [productsList]);

  // 6. Filter Groups built dynamically
  const dynamicFilterGroups = useMemo(() => {
    const groups = [
      { key: 'category', label: 'Category', items: dynamicCategoryList },
      { key: 'subcategory', label: 'Sub Category', items: availableSubcategories },
    ];
    if (availableInstallation.length > 0) {
      groups.push({ key: 'installation', label: 'Installation', items: availableInstallation });
    }
    if (availableConnectivity.length > 0) {
      groups.push({ key: 'connectivity', label: 'Connectivity', items: availableConnectivity });
    }
    if (availableFeatures.length > 0) {
      groups.push({ key: 'features', label: 'Features', items: availableFeatures });
    }
    return groups;
  }, [dynamicCategoryList, availableSubcategories, availableInstallation, availableConnectivity, availableFeatures]);

  const toggle = (key, item) => setFilters((current) => {
    const currentList = current[key] || [];
    const nextItems = currentList.includes(item) ? currentList.filter((value) => value !== item) : [...currentList, item];
    return key === 'category' ? { ...current, category: nextItems, subcategory: [] } : { ...current, [key]: nextItems };
  });

  const filtered = useMemo(() => {
    const result = productsList.filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.productType,
        product.description,
        product.brand,
        product.sku,
        ...(product.keywords || []),
        ...(product.highlights || []),
        ...(product.keyFeatures || []),
      ].filter(Boolean).join(' ').toLowerCase();

      const categoryMatch = !filters.category.length || filters.category.some((name) => {
        if (product.category && product.category.toLowerCase() === name.toLowerCase()) return true;
        const catObj = categoriesList.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (catObj && String(product.categoryId) === String(catObj.id)) return true;
        return String(product.categoryId) === String(name);
      });

      const subcategoryMatch = !filters.subcategory.length || filters.subcategory.some((subName) => {
        if (product.productType && product.productType.toLowerCase() === subName.toLowerCase()) return true;
        return String(product.subcategoryId) === String(subName);
      });

      const installationMatch = !filters.installation.length || (product.installation && filters.installation.some((item) =>
        Array.isArray(product.installation) ? product.installation.includes(item) : String(product.installation).includes(item)
      ));

      const connectivityMatch = !filters.connectivity.length || (product.connectivity && filters.connectivity.some((item) =>
        Array.isArray(product.connectivity) ? product.connectivity.includes(item) : String(product.connectivity).includes(item)
      ));

      const featureMatch = !filters.features.length || filters.features.some((item) => {
        const feats = Array.isArray(product.features) ? product.features : Array.isArray(product.keyFeatures) ? product.keyFeatures : Array.isArray(product.highlights) ? product.highlights : [];
        return feats.some((f) => String(f).toLowerCase().includes(item.toLowerCase()));
      });

      return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && categoryMatch && subcategoryMatch && installationMatch && connectivityMatch && featureMatch;
    });

    if (sort === 'name') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sort === 'new') result.sort((a, b) => Number(b.newProduct || 0) - Number(a.newProduct || 0));
    if (sort === 'price-low') result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sort === 'price-high') result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sort === 'rating') result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
    return result;
  }, [productsList, categoriesList, query, filters, sort]);

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

            {dynamicFilterGroups.map((group) => {
              const items = group.items || [];
              const selectedList = filters[group.key] || [];
              const selectedCount = selectedList.length;
              return <details className="filter-dropdown" key={group.key}>
                <summary>
                  <span>{group.label}</span>
                  <span className="filter-dropdown-meta">{selectedCount > 0 && <small>{selectedCount} selected</small>}<ChevronDown size={17} /></span>
                </summary>
                <div className="filter-dropdown-panel">
                  <div className="filter-options" role="group" aria-label={group.label}>
                    {items.length ? items.map((item) => (
                      <label className="filter-option" key={item}>
                        <input type="checkbox" checked={selectedList.includes(item)} onChange={() => { toggle(group.key, item); setVisible(12); }} />
                        <span className="filter-checkbox" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                        <span className="filter-option-label">{item}</span>
                      </label>
                    )) : <p className="filter-options-empty">No options available.</p>}
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
                <button className="button outline" onClick={loadData}>Try Refreshing</button>
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
