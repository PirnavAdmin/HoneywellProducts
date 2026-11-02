import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Eye,
  Check,
  Plus,
  Search,
  ChevronDown,
  Scale,
  SlidersHorizontal,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { productService } from '../services/productService';
import { useUI } from '../context/UIContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Normalizes and extracts key-value specification pairs from a product.
 * Handles objects, string arrays ("Key: Value"), direct properties, and multiline text.
 */
const getProductSpecsMap = (product) => {
  if (!product) return {};
  const map = {};

  // Direct known hardware properties
  if (product.sku || product.model) map['Model / SKU'] = String(product.sku || product.model);
  if (product.brand) map['Brand'] = String(product.brand);
  if (product.manufacturer && product.manufacturer !== product.brand) {
    map['Manufacturer'] = String(product.manufacturer);
  }
  if (product.weight) map['Weight'] = String(product.weight);
  if (product.dimensions) map['Dimensions'] = String(product.dimensions);
  if (product.powerSource) map['Power Source'] = String(product.powerSource);
  if (product.material) map['Material'] = String(product.material);
  if (product.coverageUsage) map['Coverage / Range'] = String(product.coverageUsage);

  // Specifications Object
  const specObj = product.specificationsObj;
  if (specObj && typeof specObj === 'object' && !Array.isArray(specObj)) {
    Object.entries(specObj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim()) {
        const formattedKey = k
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        if (!map[formattedKey]) {
          map[formattedKey] = String(v).trim();
        }
      }
    });
  }

  // Specifications Array or String
  const rawSpecs = product.specifications;
  if (Array.isArray(rawSpecs)) {
    rawSpecs.forEach((item) => {
      if (typeof item === 'string' && item.includes(':')) {
        const colonIdx = item.indexOf(':');
        const key = item.slice(0, colonIdx).trim();
        const val = item.slice(colonIdx + 1).trim();
        if (key && val && !map[key]) {
          map[key] = val;
        }
      } else if (typeof item === 'string' && item.trim()) {
        if (!map['General Spec']) map['General Spec'] = item.trim();
      }
    });
  } else if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
    rawSpecs.split(/\r?\n/).forEach((line) => {
      if (line.includes(':')) {
        const colonIdx = line.indexOf(':');
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        if (key && val && !map[key]) {
          map[key] = val;
        }
      }
    });
  }

  return map;
};

/**
 * Searchable, category-filtered custom product picker dropdown
 */
function AddProductDropdown({
  availableProducts = [],
  compareIds = [],
  onAddProduct,
  maxProducts = 4,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const isFull = compareIds.length >= maxProducts;

  // Products not currently in the comparison list
  const remainingProducts = useMemo(() => {
    return availableProducts.filter((p) => !compareIds.includes(String(p.id)));
  }, [availableProducts, compareIds]);

  // Unique categories for filter pills
  const categories = useMemo(() => {
    const set = new Set();
    availableProducts.forEach((p) => {
      const cat = p.categoryName || p.category;
      if (cat && typeof cat === 'string') set.add(cat.trim());
    });
    return Array.from(set);
  }, [availableProducts]);

  // Filtered by keyword search & category
  const filteredProducts = useMemo(() => {
    return remainingProducts.filter((p) => {
      if (selectedCategory) {
        const cat = (p.categoryName || p.category || '').toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const text = [
          p.name,
          p.title,
          p.sku,
          p.model,
          p.category,
          p.categoryName,
          p.brand,
          p.shortDescription,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [remainingProducts, selectedCategory, search]);

  // Click outside and ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const handleSelect = (productId) => {
    onAddProduct(productId);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="compare-dropdown-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`compare-dropdown-trigger ${isOpen ? 'active' : ''} ${isFull ? 'disabled' : ''}`}
        onClick={() => !isFull && setIsOpen((prev) => !prev)}
        disabled={isFull}
        title={isFull ? 'Comparison limit reached (max 4 products)' : 'Add a product to comparison'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="compare-trigger-icon">
          <Plus size={16} />
        </span>
        <span className="compare-trigger-text">
          {isFull ? 'Comparison limit reached (4/4)' : '+ Add a product to compare...'}
        </span>
        <ChevronDown size={15} className={`compare-trigger-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="compare-dropdown-menu" role="dialog" aria-label="Select product to compare">
          {/* Header search bar */}
          <div className="compare-dropdown-search-box">
            <Search size={15} className="compare-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="compare-search-input"
              placeholder="Search by model, name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="compare-search-clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="compare-dropdown-pills">
              <button
                type="button"
                className={`compare-pill ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                All
              </button>
              {categories.slice(0, 7).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`compare-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                  title={cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Products List */}
          <div className="compare-dropdown-list">
            {filteredProducts.length === 0 ? (
              <div className="compare-dropdown-empty">
                <p>No matching products available</p>
                <small>Try another search term or clear the filter</small>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const img =
                  !p.image || String(p.image).toLowerCase().includes('placeholder')
                    ? '/honeywell-products-logo.png'
                    : p.imageUrl || p.image;
                return (
                  <div
                    key={p.id}
                    className="compare-dropdown-item"
                    onClick={() => handleSelect(p.id)}
                    title={`Add "${p.name}" to comparison`}
                  >
                    <div className="compare-item-thumb">
                      <img
                        src={img}
                        alt={p.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/honeywell-products-logo.png';
                        }}
                      />
                    </div>
                    <div className="compare-item-details">
                      <span className="compare-item-name" title={p.name}>
                        {p.name}
                      </span>
                      <div className="compare-item-meta">
                        <span className="compare-item-cat">
                          {p.categoryName || p.category || 'Hardware'}
                        </span>
                        {(p.sku || p.model) && (
                          <span className="compare-item-sku">SKU: {p.sku || p.model}</span>
                        )}
                      </div>
                    </div>
                    <span className="compare-item-add-btn">
                      <Plus size={13} /> Add
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompareProducts() {
  const [compareIds, setCompareIds] = useState(() => {
    try {
      const saved = localStorage.getItem('honeywell_compare_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [highlightDiff, setHighlightDiff] = useState(false);

  const { openEnquiry } = useUI();
  const { priceVisibility } = useSettings();

  useEffect(() => {
    localStorage.setItem('honeywell_compare_ids', JSON.stringify(compareIds));
  }, [compareIds]);

  // Load catalog for comparison suggestions and selector
  useEffect(() => {
    async function loadCatalogue() {
      try {
        const all = await productService.getAll();
        setAvailableProducts(Array.isArray(all) ? all : []);
      } catch (e) {
        console.error('Error loading catalogue for compare:', e);
      }
    }
    loadCatalogue();
  }, []);

  // Fetch full details of selected products
  useEffect(() => {
    if (compareIds.length === 0) {
      setProducts([]);
      return;
    }

    let isMounted = true;
    async function syncCompareProducts() {
      setLoading(true);
      try {
        const items = await Promise.all(
          compareIds.map(async (id) => {
            const idStr = String(id);
            const inCurrent = products.find((p) => String(p.id) === idStr);
            const inAvailable = availableProducts.find(
              (p) => String(p.id) === idStr || String(p.productId || '') === idStr
            );
            try {
              const fetched = await productService.getById(id);
              return fetched || inCurrent || inAvailable || null;
            } catch (e) {
              return inCurrent || inAvailable || null;
            }
          })
        );
        if (isMounted) {
          setProducts(items.filter(Boolean));
        }
      } catch (e) {
        console.error('Error fetching compare items:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    syncCompareProducts();
    return () => {
      isMounted = false;
    };
  }, [compareIds]);

  const removeCompareItem = (id, index) => {
    const idStr = String(id || '');

    // 1. Immediately remove from products state so UI updates instantly
    setProducts((prev) => {
      if (idStr && prev.some((p) => String(p.id || '') === idStr)) {
        return prev.filter((p) => String(p.id || '') !== idStr);
      }
      return prev.filter((_, i) => i !== index);
    });

    // 2. Immediately remove from compareIds state (persists to localStorage)
    setCompareIds((prev) => {
      if (idStr && prev.some((item) => String(item) === idStr)) {
        return prev.filter((item) => String(item) !== idStr);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const addCompareProduct = (id) => {
    if (!id) return;
    const idStr = String(id);
    if (compareIds.length >= 4) {
      alert('You can compare up to 4 products at a time.');
      return;
    }
    if (!compareIds.some((existing) => String(existing) === idStr)) {
      setCompareIds((prev) => [...prev, idStr]);
      const match = availableProducts.find(
        (p) => String(p.id) === idStr || String(p.productId || '') === idStr
      );
      if (match) {
        setProducts((prev) => {
          if (prev.some((p) => String(p.id) === idStr)) return prev;
          return [...prev, match];
        });
      }
    }
  };

  const clearAll = () => {
    setCompareIds([]);
    setProducts([]);
    try {
      localStorage.removeItem('honeywell_compare_ids');
    } catch (e) {
      // ignore
    }
  };

  // Build spec maps for each active product
  const productSpecMaps = useMemo(() => {
    return products.map((p) => getProductSpecsMap(p));
  }, [products]);

  // Dynamically extract and order all unique specification keys across products
  const allSpecKeys = useMemo(() => {
    if (products.length === 0) return [];

    const keysSet = new Set();
    const standardOrder = [
      'Resolution',
      'Image Sensor',
      'Lens',
      'Field of View',
      'Night Vision / IR',
      'Video Compression',
      'Audio / Microphone',
      'Power Source',
      'Network / Connectivity',
      'Storage Support',
      'Ingress Protection / Weather Rating',
      'Operating Temperature',
      'Dimensions',
      'Weight',
      'Material',
      'Coverage / Range',
    ];

    // Excluded from technical specs section because they are shown in dedicated sections
    const excludedKeys = new Set([
      'model / sku',
      'category',
      'brand',
      'manufacturer',
      'warranty',
      'price',
      'stock status',
    ]);

    // Check standard keys first
    standardOrder.forEach((stdKey) => {
      const matchFound = productSpecMaps.some((map) =>
        Object.keys(map).some((k) => k.toLowerCase() === stdKey.toLowerCase())
      );
      if (matchFound) {
        keysSet.add(stdKey);
      }
    });

    // Add any remaining keys found in the products
    productSpecMaps.forEach((map) => {
      Object.keys(map).forEach((k) => {
        const lowerK = k.toLowerCase();
        if (!excludedKeys.has(lowerK)) {
          const alreadyInSet = Array.from(keysSet).some(
            (existing) => existing.toLowerCase() === lowerK
          );
          if (!alreadyInSet) {
            keysSet.add(k);
          }
        }
      });
    });

    return Array.from(keysSet);
  }, [products, productSpecMaps]);

  // Helper: check if values in a row differ among compared products
  const checkRowDiff = (values) => {
    if (values.length <= 1) return false;
    const first = (values[0] || '').trim().toLowerCase();
    return values.some((val) => (val || '').trim().toLowerCase() !== first);
  };

  return (
    <section className="section compare-page-section">
      <div className="container">
        {/* Clean Header Area */}
        <header className="compare-header">
          <span className="compare-badge">PRODUCT COMPARISON</span>
          <h1 className="compare-title">Side-by-Side Product Comparison</h1>
          <p className="compare-desc">
            Compare technical specifications, hardware features, and details side-by-side to select the ideal Honeywell equipment.
          </p>
        </header>

        {/* Top Action & Control Bar */}
        <div className="compare-top-bar">
          <div className="compare-top-left">
            <AddProductDropdown
              availableProducts={availableProducts}
              compareIds={compareIds}
              onAddProduct={addCompareProduct}
              maxProducts={4}
            />

            {products.length > 0 && (
              <div className="compare-slots-badge">
                <span className="compare-slots-text">
                  <strong>{products.length}</strong> of 4 comparing
                </span>
                <div className="compare-slots-dots" title={`${products.length} of 4 slots used`}>
                  {[0, 1, 2, 3].map((idx) => (
                    <span
                      key={idx}
                      className={`slot-dot ${idx < products.length ? 'filled' : 'empty'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="compare-top-right">
            {products.length > 1 && (
              <label className="compare-diff-toggle" title="Highlight rows where specifications differ">
                <input
                  type="checkbox"
                  checked={highlightDiff}
                  onChange={(e) => setHighlightDiff(e.target.checked)}
                />
                <span className="diff-toggle-slider" />
                <span className="diff-toggle-label">
                  <SlidersHorizontal size={14} /> Highlight Differences
                </span>
              </label>
            )}

            {compareIds.length > 0 && (
              <button
                type="button"
                className="compare-clear-btn"
                onClick={clearAll}
                title="Remove all products from comparison"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="route-loading" style={{ minHeight: '300px' }}>
            <p>Loading comparison data...</p>
          </div>
        ) : products.length === 0 ? (
          /* Redesigned Rich Empty State with Suggestions */
          <div className="compare-empty-state-card">
            <div className="compare-empty-icon-wrap">
              <Scale size={36} />
            </div>
            <h2 className="compare-empty-title">Select Products to Compare</h2>
            <p className="compare-empty-desc">
              Choose up to 4 Honeywell security, surveillance, or solar products to inspect technical
              specifications, physical dimensions, and capabilities side-by-side.
            </p>

            {availableProducts.length > 0 && (
              <div className="compare-suggestions-section">
                <h3 className="compare-suggestions-heading">
                  <Sparkles size={16} /> Quick-Add Popular Products:
                </h3>
                <div className="compare-suggestions-grid">
                  {availableProducts.slice(0, 4).map((item) => {
                    const img =
                      !item.image || String(item.image).toLowerCase().includes('placeholder')
                        ? '/honeywell-products-logo.png'
                        : item.imageUrl || item.image;
                    return (
                      <div key={item.id} className="compare-suggestion-card">
                        <div className="suggestion-img-wrap">
                          <img
                            src={img}
                            alt={item.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/honeywell-products-logo.png';
                            }}
                          />
                        </div>
                        <span className="suggestion-cat">
                          {item.categoryName || item.category || 'Security'}
                        </span>
                        <h4 className="suggestion-title" title={item.name}>
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          className="button button-small suggestion-add-btn"
                          onClick={() => addCompareProduct(item.id)}
                        >
                          <Plus size={14} /> Add to Compare
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* High-End Enterprise Comparison Table */
          <div className="compare-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="spec-label-col spec-label-head">
                    <div className="spec-header-cell">
                      <span className="spec-header-title">Specifications & Features</span>
                      <span className="spec-header-sub">Side-by-side breakdown</span>
                    </div>
                  </th>
                  {products.map((item, index) => {
                    const img =
                      !item.image || String(item.image).toLowerCase().includes('placeholder')
                        ? '/honeywell-products-logo.png'
                        : item.imageUrl || item.image;
                    const colKey = item.id ? `compare-prod-${item.id}` : `compare-col-${index}`;
                    return (
                      <th key={colKey} className="compare-product-col">
                        <div className="compare-product-card">
                          <div className="compare-card-top-bar">
                            <span className="compare-card-category">
                              {item.categoryName || item.category || 'Hardware'}
                            </span>
                            <button
                              type="button"
                              className="compare-remove-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeCompareItem(item.id, index);
                              }}
                              title={`Remove ${item.name} from comparison`}
                              aria-label={`Remove ${item.name}`}
                            >
                              <X size={15} strokeWidth={2.2} />
                            </button>
                          </div>

                          <div className="compare-card-img-wrap">
                            <img
                              src={img}
                              alt={item.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/honeywell-products-logo.png';
                              }}
                            />
                          </div>

                          {(item.sku || item.model) && (
                            <span className="compare-card-sku">SKU: {item.sku || item.model}</span>
                          )}

                          <h3 className="compare-card-title" title={item.name}>
                            {item.name}
                          </h3>

                          {priceVisibility && (
                            <div className="compare-card-price-area">
                              <span className="compare-card-price">
                                {item.price
                                  ? `₹${Number(item.price).toLocaleString('en-IN')}`
                                  : 'Request Quote'}
                              </span>
                            </div>
                          )}

                          <div className="compare-card-actions">
                            <button
                              type="button"
                              className="button button-small compare-btn-enquire"
                              onClick={() => openEnquiry(item)}
                            >
                              Enquire
                            </button>
                            <Link
                              to={`/products/${item.id}`}
                              className="button button-outline button-small compare-btn-view"
                            >
                              <Eye size={13} /> View
                            </Link>
                          </div>
                        </div>
                      </th>
                    );
                  })}

                  {/* Empty Slot Card if less than 4 products */}
                  {products.length < 4 && (
                    <th className="compare-add-slot-col">
                      <div
                        className="compare-add-slot-card"
                        onClick={() => {
                          const trigger = document.querySelector('.compare-dropdown-trigger');
                          if (trigger) {
                            trigger.click();
                            trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        title="Click to add another product"
                      >
                        <div className="compare-add-slot-icon">
                          <Plus size={22} />
                        </div>
                        <h4 className="compare-add-slot-title">Add Hardware</h4>
                        <p className="compare-add-slot-desc">Compare up to 4 models</p>
                        <span className="compare-add-slot-btn">+ Select Item</span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {/* ── SECTION 1: OVERVIEW & HARDWARE ── */}
                <tr className="compare-section-header-row">
                  <td colSpan={products.length + (products.length < 4 ? 2 : 1)}>
                    OVERVIEW & IDENTIFICATION
                  </td>
                </tr>

                {/* Category */}
                {(() => {
                  const values = products.map((p) => p.categoryName || p.category || 'General');
                  const isDiff = highlightDiff && checkRowDiff(values);
                  return (
                    <tr className={isDiff ? 'row-highlight-diff' : ''}>
                      <td className="spec-label-col">Product Category</td>
                      {products.map((p) => (
                        <td key={p.id}>
                          <span className="compare-value-pill">
                            {p.categoryName || p.category || 'General'}
                          </span>
                        </td>
                      ))}
                      {products.length < 4 && <td className="compare-empty-td">—</td>}
                    </tr>
                  );
                })()}

                {/* Model / SKU */}
                {(() => {
                  const values = products.map((p) => p.sku || p.model || '—');
                  const isDiff = highlightDiff && checkRowDiff(values);
                  return (
                    <tr className={isDiff ? 'row-highlight-diff' : ''}>
                      <td className="spec-label-col">Model / SKU</td>
                      {products.map((p) => (
                        <td key={p.id}>
                          <strong className="compare-value-mono">{p.sku || p.model || '—'}</strong>
                        </td>
                      ))}
                      {products.length < 4 && <td className="compare-empty-td">—</td>}
                    </tr>
                  );
                })()}

                {/* Brand */}
                {(() => {
                  const values = products.map((p) => p.brand || 'Honeywell');
                  const isDiff = highlightDiff && checkRowDiff(values);
                  return (
                    <tr className={isDiff ? 'row-highlight-diff' : ''}>
                      <td className="spec-label-col">Brand</td>
                      {products.map((p) => (
                        <td key={p.id}>{p.brand || 'Honeywell'}</td>
                      ))}
                      {products.length < 4 && <td className="compare-empty-td">—</td>}
                    </tr>
                  );
                })()}

                {/* Stock Status */}
                {(() => {
                  const values = products.map((p) => p.stockStatus || (p.stock > 0 ? 'In Stock' : 'Order'));
                  const isDiff = highlightDiff && checkRowDiff(values);
                  return (
                    <tr className={isDiff ? 'row-highlight-diff' : ''}>
                      <td className="spec-label-col">Availability</td>
                      {products.map((p) => {
                        const inStock =
                          !String(p.stockStatus || '').toLowerCase().includes('out') &&
                          p.stock !== 0;
                        return (
                          <td key={p.id}>
                            <span className={`compare-stock-pill ${inStock ? 'in-stock' : 'order-basis'}`}>
                              {p.stockStatus || (inStock ? 'In Stock' : 'Available on Order')}
                            </span>
                          </td>
                        );
                      })}
                      {products.length < 4 && <td className="compare-empty-td">—</td>}
                    </tr>
                  );
                })()}

                {/* ── SECTION 2: KEY HIGHLIGHTS & CAPABILITIES ── */}
                <tr className="compare-section-header-row">
                  <td colSpan={products.length + (products.length < 4 ? 2 : 1)}>
                    KEY HIGHLIGHTS & FEATURES
                  </td>
                </tr>
                <tr>
                  <td className="spec-label-col">Core Features</td>
                  {products.map((p) => {
                    const rawFeatures =
                      Array.isArray(p.features) && p.features.length > 0
                        ? p.features
                        : typeof p.features === 'string'
                        ? p.features.split(',').map((f) => f.trim())
                        : [];
                    return (
                      <td key={p.id}>
                        {rawFeatures.length > 0 ? (
                          <ul className="compare-feature-list">
                            {rawFeatures.map((f, i) => (
                              <li key={i}>
                                <Check size={13} className="feature-check-icon" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="compare-value-muted">Standard enterprise features</span>
                        )}
                      </td>
                    );
                  })}
                  {products.length < 4 && <td className="compare-empty-td">—</td>}
                </tr>

                {/* ── SECTION 3: TECHNICAL SPECIFICATIONS (ROW BY ROW) ── */}
                {allSpecKeys.length > 0 && (
                  <tr className="compare-section-header-row">
                    <td colSpan={products.length + (products.length < 4 ? 2 : 1)}>
                      DETAILED TECHNICAL SPECIFICATIONS
                    </td>
                  </tr>
                )}

                {allSpecKeys.map((key) => {
                  const values = productSpecMaps.map((map) => {
                    // Search case-insensitively for key in map
                    const matchKey = Object.keys(map).find(
                      (k) => k.toLowerCase() === key.toLowerCase()
                    );
                    return matchKey ? map[matchKey] : '';
                  });
                  const isDiff = highlightDiff && checkRowDiff(values);

                  return (
                    <tr key={key} className={isDiff ? 'row-highlight-diff' : ''}>
                      <td className="spec-label-col">{key}</td>
                      {values.map((val, idx) => (
                        <td key={products[idx].id}>
                          {val ? (
                            <span className="spec-value-text">{val}</span>
                          ) : (
                            <span className="compare-value-muted">—</span>
                          )}
                        </td>
                      ))}
                      {products.length < 4 && <td className="compare-empty-td">—</td>}
                    </tr>
                  );
                })}

                {/* ── SECTION 4: WARRANTY & SUPPORT ── */}
                <tr className="compare-section-header-row">
                  <td colSpan={products.length + (products.length < 4 ? 2 : 1)}>
                    WARRANTY & ASSURANCE
                  </td>
                </tr>
                {(() => {
                  const values = products.map((p) => p.warranty || 'Standard Manufacturer Warranty');
                  const isDiff = highlightDiff && checkRowDiff(values);
                  return (
                    <tr className={isDiff ? 'row-highlight-diff' : ''}>
                      <td className="spec-label-col">Warranty / Support</td>
                      {products.map((p) => (
                        <td key={p.id}>
                          <span className="compare-warranty-badge">
                            {p.warranty || 'Standard Manufacturer Warranty'}
                          </span>
                        </td>
                      ))}
                      {products.length < 4 && <td className="compare-empty-td">—</td>}
                    </tr>
                  );
                })()}

                {/* ── SECTION 5: BOTTOM ACTION ROW ── */}
                <tr className="compare-table-footer-row">
                  <td className="spec-label-col">Action</td>
                  {products.map((item) => (
                    <td key={item.id} className="compare-footer-action-cell">
                      <div className="compare-card-actions">
                        <button
                          type="button"
                          className="button button-small compare-btn-enquire"
                          onClick={() => openEnquiry(item)}
                        >
                          Enquire
                        </button>
                        <Link
                          to={`/products/${item.id}`}
                          className="button button-outline button-small compare-btn-view"
                        >
                          <Eye size={13} /> View
                        </Link>
                      </div>
                    </td>
                  ))}
                  {products.length < 4 && <td className="compare-empty-td">—</td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
