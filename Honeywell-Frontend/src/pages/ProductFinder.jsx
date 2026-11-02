import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, Filter, AlertCircle, Loader2, ChevronDown, Check, X } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/productService';
import { useUI } from '../context/UIContext';
import { useSettings } from '../context/SettingsContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const normalizeText = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

const CATEGORY_ALIASES = {
  'cctv-cameras': ['Network Cameras', 'Turbo HD Cameras', 'CCTV Cameras'],
  'cctv': ['Network Cameras', 'Turbo HD Cameras'],
  'ip-cameras': ['Network Cameras'],
  'network-cameras': ['Network Cameras'],
  'turbo-hd-cameras': ['Turbo HD Cameras'],
  'solar-cameras': ['Solar kit', 'Solar panels'],
  'solar-kit': ['Solar kit'],
  'solar-panels': ['Solar panels'],
};

const checkCategoryMatch = (product, filterCategory, categoriesList = [], subcategoriesList = []) => {
  if (!filterCategory) return true;

  const targetNorm = normalizeText(filterCategory);
  const prodCatName = typeof product.category === 'string'
    ? product.category
    : (product.categoryName || product.category?.name || '');
  const prodCatNorm = normalizeText(prodCatName);
  const prodCatId = String(product.categoryId ?? '').trim();
  const prodSubCatId = String(product.subcategoryId ?? '').trim();

  // 1. Direct match on normalized category name or category ID
  if (prodCatNorm && prodCatNorm === targetNorm) return true;
  if (prodCatId && prodCatId === targetNorm) return true;

  // 2. Check categoriesList for matching category object
  const catObj = categoriesList.find(
    (c) =>
      String(c.id) === String(filterCategory) ||
      normalizeText(c.name) === targetNorm ||
      normalizeText(c.slug) === targetNorm
  );

  if (catObj) {
    if (prodCatId && prodCatId === String(catObj.id)) return true;
    if (prodCatNorm && (prodCatNorm === normalizeText(catObj.name) || prodCatNorm === normalizeText(catObj.slug))) return true;
    if (prodSubCatId) {
      const sub = subcategoriesList.find((s) => String(s.id) === prodSubCatId);
      if (sub && String(sub.categoryId) === String(catObj.id)) return true;
    }
  }

  // 3. Fallback for alias mapping
  const slugKey = Object.keys(CATEGORY_ALIASES).find(
    (k) => normalizeText(k) === targetNorm
  );
  if (slugKey) {
    const targets = CATEGORY_ALIASES[slugKey];
    if (targets && targets.some((t) => normalizeText(t) === prodCatNorm)) {
      return true;
    }
  }

  // 4. Substring / partial match fallback
  if (prodCatNorm && targetNorm && (prodCatNorm.includes(targetNorm) || targetNorm.includes(prodCatNorm))) {
    return true;
  }

  return false;
};

const matchesApplication = (item, app) => {
  if (!app) return true;
  const appLower = app.toLowerCase();

  const combinedText = [
    item.name,
    item.title,
    item.description,
    item.shortDescription,
    item.details,
    item.coverageUsage,
    item.coverage,
    item.subcategory,
    item.subcategoryName,
    item.productType,
    Array.isArray(item.features) ? item.features.join(' ') : item.features,
    Array.isArray(item.highlights) ? item.highlights.join(' ') : item.highlights,
    item.specifications ? JSON.stringify(item.specifications) : '',
  ].filter(Boolean).join(' ').toLowerCase();

  if (appLower === 'indoor') {
    return combinedText.includes('indoor') ||
      combinedText.includes('dome') ||
      combinedText.includes('turret') ||
      combinedText.includes('office') ||
      combinedText.includes('retail');
  }

  if (appLower === 'outdoor') {
    return combinedText.includes('outdoor') ||
      combinedText.includes('weatherproof') ||
      combinedText.includes('ip67') ||
      combinedText.includes('ip66') ||
      combinedText.includes('bullet') ||
      combinedText.includes('solar') ||
      combinedText.includes('colorvu');
  }

  if (appLower === 'commercial') {
    return combinedText.includes('commercial') ||
      combinedText.includes('building') ||
      combinedText.includes('office') ||
      combinedText.includes('enterprise') ||
      combinedText.includes('acusense') ||
      combinedText.includes('nvr') ||
      combinedText.includes('pro series') ||
      combinedText.includes('network');
  }

  if (appLower === 'industrial') {
    return combinedText.includes('industrial') ||
      combinedText.includes('factory') ||
      combinedText.includes('warehouse') ||
      combinedText.includes('plant') ||
      combinedText.includes('12mp') ||
      combinedText.includes('16mp') ||
      combinedText.includes('solar kit') ||
      combinedText.includes('ip67') ||
      combinedText.includes('varifocal');
  }

  if (appLower === 'residential') {
    return combinedText.includes('residential') ||
      combinedText.includes('home') ||
      combinedText.includes('villa') ||
      combinedText.includes('wifi') ||
      combinedText.includes('wi-fi') ||
      combinedText.includes('colorvu') ||
      combinedText.includes('mini bullet') ||
      combinedText.includes('2 mp') ||
      combinedText.includes('2mp') ||
      combinedText.includes('4 mp') ||
      combinedText.includes('4mp') ||
      combinedText.includes('small solar');
  }

  return combinedText.includes(appLower);
};

const matchesResolution = (item, res) => {
  if (!res) return true;
  const resLower = res.toLowerCase();
  const text = [
    item.name,
    item.title,
    item.description,
    item.shortDescription,
    item.details,
    item.category,
    item.categoryName,
    item.subcategory,
    Array.isArray(item.features) ? item.features.join(' ') : item.features,
    item.specifications ? JSON.stringify(item.specifications) : '',
  ].filter(Boolean).join(' ').toLowerCase();

  if (resLower === '2mp') {
    return text.includes('2mp') || text.includes('2 mp') || text.includes('1080p') || text.includes('full hd');
  }
  if (resLower === '4mp') {
    return text.includes('4mp') || text.includes('4 mp') || text.includes('ultra hd') || text.includes('2k');
  }
  if (resLower === '8mp') {
    return text.includes('8mp') || text.includes('8 mp') || text.includes('4k') || text.includes('3840');
  }
  if (resLower === 'ultra-res') {
    return text.includes('12mp') || text.includes('12 mp') || text.includes('16mp') || text.includes('16 mp') || text.includes('uhd');
  }
  if (resLower === 'solar') {
    return text.includes('solar') || text.includes('panel') || text.includes('kit') || text.includes('watt') || text.includes('4g');
  }
  return text.includes(resLower);
};

const matchesFeature = (item, featureName) => {
  const text = [
    item.name,
    item.title,
    item.description,
    item.shortDescription,
    item.details,
    Array.isArray(item.features) ? item.features.join(' ') : item.features,
    Array.isArray(item.highlights) ? item.highlights.join(' ') : item.highlights,
    item.specifications ? JSON.stringify(item.specifications) : '',
  ].filter(Boolean).join(' ').toLowerCase();

  const fn = featureName.toLowerCase();
  if (fn.includes('night vision')) {
    return text.includes('night vision') || text.includes('colorvu') || text.includes('darkfighter') || text.includes('ir') || text.includes('low-light') || text.includes('hybrid light');
  }
  if (fn.includes('poe')) {
    return text.includes('poe') || text.includes('power over ethernet') || text.includes('poc') || text.includes('network');
  }
  if (fn.includes('ai') || fn.includes('analytics')) {
    return text.includes('ai') || text.includes('acusense') || text.includes('deep learning') || text.includes('human detection') || text.includes('motion') || text.includes('classification');
  }
  if (fn.includes('weatherproof') || fn.includes('ip67')) {
    return text.includes('weatherproof') || text.includes('ip67') || text.includes('ip66') || text.includes('outdoor') || text.includes('waterproof');
  }
  if (fn.includes('solar') || fn.includes('battery')) {
    return text.includes('solar') || text.includes('battery') || text.includes('panel') || text.includes('power');
  }
  if (fn.includes('audio')) {
    return text.includes('audio') || text.includes('two-way') || text.includes('speaker') || text.includes('mic') || text.includes('siren') || text.includes('sound');
  }
  return text.includes(fn);
};

function FinderDropdown({ label, id, value, onChange, options, placeholder = 'Select Option' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const isSelected = Boolean(value);

  return (
    <div className={`finder-filter-group ${isOpen ? 'dropdown-active' : ''}`} ref={containerRef}>
      <label htmlFor={id} onClick={() => setIsOpen((prev) => !prev)}>
        <span>{label}</span>
      </label>
      <div className="finder-dropdown-container">
        <button
          type="button"
          id={id}
          className={`finder-dropdown-trigger ${isOpen ? 'active' : ''} ${isSelected ? 'has-value' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title={displayLabel}
        >
          <span className="finder-dropdown-text">{displayLabel}</span>
          <ChevronDown size={15} className={`finder-dropdown-arrow ${isOpen ? 'open' : ''}`} />
        </button>

        {isOpen && (
          <div className="finder-dropdown-menu" role="listbox">
            {options.map((opt) => {
              const active = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  className={`finder-dropdown-item ${active ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={active}
                  title={opt.label}
                >
                  <span className="finder-dropdown-item-label" title={opt.label}>{opt.label}</span>
                  {active && <Check size={14} className="finder-dropdown-item-check" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductFinder() {
  useDocumentTitle(
    'Find the Right Product | Honeywell Products',
    'Filter and find the exact Honeywell security, surveillance, or solar products for your environment.'
  );

  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState(() => searchParams.get('search') || searchParams.get('q') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [application, setApplication] = useState(() => searchParams.get('application') || '');
  const [resolution, setResolution] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');

  const { priceVisibility } = useSettings();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, subcats, prods] = await Promise.all([
          productService.categories().catch(() => []),
          productService.subcategories().catch(() => []),
          productService.getAll().catch(() => []),
        ]);

        const validCats = (Array.isArray(cats) ? cats : []).slice().sort((a, b) => {
          const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
          const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
          if (orderA !== orderB && (orderA > 0 || orderB > 0)) {
            if (orderA === 0) return 1;
            if (orderB === 0) return -1;
            return orderA - orderB;
          }
          return (Number(a.id) || 0) - (Number(b.id) || 0);
        }).map((c) => ({ ...c, id: String(c.id), name: (c.name || '').trim() }));

        const validSubcats = (Array.isArray(subcats) ? subcats : []).map((s) => ({
          ...s,
          id: String(s.id),
          name: (s.name || '').trim(),
          categoryName: (s.categoryName || '').trim(),
        }));

        const normalizedProds = (Array.isArray(prods) ? prods : []).map((p) => {
          const cat = validCats.find((c) => String(c.id) === String(p.categoryId));
          const sub = validSubcats.find((s) => String(s.id) === String(p.subcategoryId));
          const resolvedCatName = (p.category || p.categoryName || cat?.name || '').trim();
          const resolvedSubcatName = (p.productType || p.subcategory || p.subcategoryName || sub?.name || '').trim();
          return {
            ...p,
            categoryId: String(p.categoryId || cat?.id || ''),
            subcategoryId: String(p.subcategoryId || sub?.id || ''),
            category: resolvedCatName,
            categoryName: resolvedCatName,
            productType: resolvedSubcatName,
            subcategory: resolvedSubcatName,
            subcategoryName: resolvedSubcatName,
          };
        });

        setCategoriesList(validCats);
        setSubcategoriesList(validSubcats);
        setProducts(normalizedProds);
      } catch (err) {
        console.error('Error fetching data for product finder:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute available categories combining API categories & products
  const availableCategories = useMemo(() => {
    const map = new Map();
    categoriesList.forEach((c) => {
      if (c.name && c.status !== 'Inactive') {
        map.set(normalizeText(c.name), { id: c.id, name: c.name });
      }
    });
    products.forEach((p) => {
      const cName = p.categoryName || p.category;
      if (cName && typeof cName === 'string' && cName.trim() && !map.has(normalizeText(cName))) {
        map.set(normalizeText(cName), { id: p.categoryId || cName, name: cName.trim() });
      }
    });
    if (map.size === 0) {
      ['Network Cameras', 'Turbo HD Cameras', 'Solar panels', 'Solar kit'].forEach((c) => {
        map.set(normalizeText(c), { id: c, name: c });
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesList, products]);

  // Dropdown options configurations
  const categoryOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...availableCategories.map((cat) => ({
      value: cat.name,
      label: cat.name,
    })),
  ], [availableCategories]);

  const applicationOptions = [
    { value: '', label: 'Any Environment' },
    { value: 'indoor', label: 'Indoor (Dome / Turret / Office)' },
    { value: 'outdoor', label: 'Outdoor / Weatherproof (Bullet / Solar)' },
    { value: 'commercial', label: 'Commercial Building & Enterprise' },
    { value: 'industrial', label: 'Industrial Plant & Warehouse' },
    { value: 'residential', label: 'Home / Villa / Residential' },
  ];

  const resolutionOptions = [
    { value: '', label: 'Any Spec' },
    { value: '2mp', label: '2 MP / Full HD (1080p)' },
    { value: '4mp', label: '4 MP Ultra HD (2K)' },
    { value: '8mp', label: '8 MP / 4K Ultra HD' },
    { value: 'ultra-res', label: '12 MP – 16 MP Ultra High Res' },
    { value: 'solar', label: 'Solar Powered / Kit' },
  ];

  const priceOptions = [
    { value: '', label: 'All Prices' },
    { value: 'under-10000', label: 'Under ₹10,000' },
    { value: '10000-50000', label: '₹10,000 – ₹50,000' },
    { value: 'above-50000', label: 'Above ₹50,000' },
  ];

  const keyFilterOptions = [
    { value: '', label: 'Select Filter' },
    { value: 'Night Vision', label: 'Night Vision (ColorVu / DarkFighter)' },
    { value: 'PoE Support', label: 'PoE Support (Power over Ethernet)' },
    { value: 'AI Analytics', label: 'AI Analytics (AcuSense & Detection)' },
    { value: 'Weatherproof IP67', label: 'Weatherproof IP67 Protection' },
    { value: 'Solar Battery', label: 'Solar Battery & Off-Grid' },
    { value: 'Two-Way Audio', label: 'Two-Way Audio & Siren' },
  ];

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setApplication('');
    setResolution('');
    setPriceRange('');
    setSelectedFeature('');
  };

  const filteredProducts = products.filter((item) => {
    // 1. Search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const combined = [
        item.name,
        item.title,
        item.sku,
        item.model,
        item.category,
        item.categoryName,
        item.subcategory,
        item.subcategoryName,
        item.brand,
        item.description,
        item.shortDescription,
        item.details,
        Array.isArray(item.features) ? item.features.join(' ') : item.features,
      ].filter(Boolean).join(' ').toLowerCase();

      if (!combined.includes(q)) return false;
    }

    // 2. Category filter
    if (category) {
      if (!checkCategoryMatch(item, category, categoriesList, subcategoriesList)) {
        return false;
      }
    }

    // 3. Application Environment filter
    if (application) {
      if (!matchesApplication(item, application)) {
        return false;
      }
    }

    // 4. Resolution / Spec filter
    if (resolution) {
      if (!matchesResolution(item, resolution)) {
        return false;
      }
    }

    // 5. Price filter
    if (priceVisibility && priceRange) {
      const price = Number(item.price || item.unitPrice || item.sellingPrice || item.mrp || 0);
      if (priceRange === 'under-10000' && price > 10000) return false;
      if (priceRange === '10000-50000' && (price < 10000 || price > 50000)) return false;
      if (priceRange === 'above-50000' && price < 50000) return false;
    }

    // 6. Features filter
    if (selectedFeature) {
      if (!matchesFeature(item, selectedFeature)) {
        return false;
      }
    }

    return true;
  });

  return (
    <section className="section product-finder-page">
      <div className="container">
        {/* Clean Header Area */}
        <header className="product-finder-header">
          <span className="product-finder-badge">PRODUCT FINDER</span>
          <h1 className="product-finder-title">Find the Right Product</h1>
          <p className="product-finder-desc">
            Filter and find the exact Honeywell security, surveillance, or solar products for your environment.
          </p>
        </header>

        <div className="product-finder-layout">
            <aside className="finder-sidebar">
              <div className="finder-sidebar-header">
                <h3><Filter size={18} /> Filter Criteria</h3>
                <button className="button-text text-small" onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#1268a5', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCcw size={14} /> Clear
                </button>
              </div>

              {/* 1. Search Keyword */}
              <div className="finder-filter-group">
                <label htmlFor="finder-search">
                  <span>Search Keyword</span>
                </label>
                <div className="finder-search-wrapper">
                  <Search size={16} className="finder-search-icon" />
                  <input
                    id="finder-search"
                    type="text"
                    className="finder-search-input"
                    placeholder="Search camera, solar, NVR..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="finder-search-clear"
                      onClick={() => setSearch('')}
                      aria-label="Clear search keyword"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Category Dropdown */}
              <FinderDropdown
                label="Category"
                id="finder-category"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                placeholder="All Categories"
              />

              {/* 3. Application Environment Dropdown */}
              <FinderDropdown
                label="Application Environment"
                id="finder-application"
                value={application}
                onChange={setApplication}
                options={applicationOptions}
                placeholder="Any Environment"
              />

              {/* 4. Resolution / Spec Dropdown */}
              <FinderDropdown
                label="Resolution / Spec"
                id="finder-resolution"
                value={resolution}
                onChange={setResolution}
                options={resolutionOptions}
                placeholder="Any Spec"
              />

              {/* 5. Price Budget Dropdown (if enabled) */}
              {priceVisibility && (
                <FinderDropdown
                  label="Price Budget"
                  id="finder-price"
                  value={priceRange}
                  onChange={setPriceRange}
                  options={priceOptions}
                  placeholder="All Prices"
                />
              )}

              {/* 6. Key Filters Dropdown */}
              <FinderDropdown
                label="Key Filters"
                id="finder-key-filters"
                value={selectedFeature}
                onChange={setSelectedFeature}
                options={keyFilterOptions}
                placeholder="Select Filter"
              />
            </aside>

            <section className="finder-results-section">
              {!loading && !error && filteredProducts.length > 0 && (
                <div className="finder-results-header">
                  {filteredProducts.length < products.length && (
                    <span className="finder-filtered-pill">
                      Filtered from {products.length} total
                    </span>
                  )}
                  <span className="finder-results-count">
                    Showing <strong>{filteredProducts.length}</strong> matching products
                  </span>
                </div>
              )}

              {loading ? (
                <div className="empty-state large" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                  <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: '#1268a5', margin: '0 auto 12px' }} />
                  <h3>Loading recommended products...</h3>
                </div>
              ) : error ? (
                <div className="empty-state large" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                  <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                  <h3>Product Service Connection Issue</h3>
                  <p>{error}</p>
                  <button className="button button-small" onClick={() => window.location.reload()}>Retry</button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="empty-state large" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                  <Search size={36} style={{ margin: '0 auto 12px', color: '#64748b' }} />
                  <h3>No matching products found</h3>
                  <p>Try adjusting your search criteria or clearing specific filters.</p>
                  <button className="button button-small" onClick={resetFilters}>Reset All Filters</button>
                </div>
              ) : (
                <div className="product-grid">
                  {filteredProducts.map((product) => {
                    const normalizedProduct = {
                      ...product,
                      id: product.id,
                      name: product.name,
                      slug: product.slug || product.id,
                      category: product.categoryName || product.category || 'Surveillance',
                      productType: product.productType || product.type || 'Security Hardware',
                      image: (!product.image || String(product.image).toLowerCase().includes('placeholder')) ? '/honeywell-products-logo.png' : (product.imageUrl || product.image),
                      rating: product.rating || 0,
                      reviewCount: product.reviewCount || product.totalReviews || 0,
                      model: product.model || product.code || 'HW-SEC-2026',
                      highlights: Array.isArray(product.highlights)
                        ? product.highlights
                        : (Array.isArray(product.features) ? product.features : (product.features || 'Night Vision, PoE, Weatherproof IP67').split(',').map(s => s.trim())),
                      priceLabel: product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : (product.priceLabel || 'Request Quote'),
                      priceNote: product.priceNote || ''
                    };

                    return <ProductCard key={product.id} product={normalizedProduct} />;
                  })}
                </div>
              )}
            </section>
        </div>
      </div>
    </section>
  );
}

