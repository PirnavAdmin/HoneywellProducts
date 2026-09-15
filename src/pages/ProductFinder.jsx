import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RotateCcw, SlidersHorizontal, Filter, AlertCircle, Loader2 } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/productService';
import { useUI } from '../context/UIContext';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

export default function ProductFinder() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [application, setApplication] = useState('');
  const [resolution, setResolution] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const { openEnquiry } = useUI();

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching products for finder:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const toggleFeature = (feat) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setApplication('');
    setResolution('');
    setPriceRange('');
    setSelectedFeatures([]);
  };

  const filteredProducts = products.filter((item) => {
    if (search && !item.name?.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (category && item.category !== category && item.categoryId !== category && !item.category?.toLowerCase().includes(category.toLowerCase())) {
      return false;
    }
    if (application && !item.application?.toLowerCase().includes(application.toLowerCase()) && !item.description?.toLowerCase().includes(application.toLowerCase())) {
      return false;
    }
    if (resolution && !item.resolution?.toLowerCase().includes(resolution.toLowerCase()) && !item.name?.toLowerCase().includes(resolution.toLowerCase())) {
      return false;
    }
    if (priceRange) {
      const price = Number(item.price || item.unitPrice || 0);
      if ((priceRange === 'under-100' || priceRange === 'under-10000') && price > 10000) return false;
      if ((priceRange === '100-500' || priceRange === '10000-50000') && (price < 10000 || price > 50000)) return false;
      if ((priceRange === 'above-500' || priceRange === 'above-50000') && price < 50000) return false;
    }
    if (selectedFeatures.length > 0) {
      const itemFeats = Array.isArray(item.features) ? item.features.join(' ').toLowerCase() : (item.features || '').toLowerCase();
      const matchesAll = selectedFeatures.every((f) => itemFeats.includes(f.toLowerCase()));
      if (!matchesAll) return false;
    }
    return true;
  });

  return (
    <>
      <PageHero
        eyebrow="PRODUCT FINDER"
        title="Find the Right Product"
        description="Filter and find the exact Honeywell security, surveillance, or solar products for your environment."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="product-finder-layout">
            <aside className="finder-sidebar">
              <div className="finder-sidebar-header">
                <h3><Filter size={18} /> Filter Criteria</h3>
                <button className="button-text text-small" onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#ee3124', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCcw size={14} /> Clear
                </button>
              </div>

              <div className="finder-filter-group">
                <label htmlFor="finder-search">Search Keyword</label>
                <div className="search-input-wrapper">
                  <input
                    id="finder-search"
                    type="text"
                    placeholder="Search camera, solar, NVR..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="finder-filter-group">
                <label htmlFor="finder-category">Category</label>
                <select
                  id="finder-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="cctv">CCTV Cameras</option>
                  <option value="ip-cameras">IP Cameras</option>
                  <option value="ptz">PTZ Cameras</option>
                  <option value="solar">Solar Security & Panels</option>
                  <option value="security">Security Products</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div className="finder-filter-group">
                <label htmlFor="finder-application">Application Environment</label>
                <select
                  id="finder-application"
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                >
                  <option value="">Any Environment</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor / Weatherproof</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="industrial">Industrial Plant</option>
                  <option value="residential">Home / Villa</option>
                </select>
              </div>

              <div className="finder-filter-group">
                <label htmlFor="finder-resolution">Resolution / Spec</label>
                <select
                  id="finder-resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                >
                  <option value="">Any Spec</option>
                  <option value="2mp">2 MP / Full HD</option>
                  <option value="4mp">4 MP Ultra HD</option>
                  <option value="8mp">8 MP / 4K Ultra HD</option>
                  <option value="solar">Solar Powered</option>
                </select>
              </div>

              <div className="finder-filter-group">
                <label htmlFor="finder-price">Price Budget</label>
                <select
                  id="finder-price"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <option value="">All Prices</option>
                  <option value="under-10000">Under ₹10,000</option>
                  <option value="10000-50000">₹10,000 - ₹50,000</option>
                  <option value="above-50000">Above ₹50,000</option>
                </select>
              </div>

              <div className="finder-filter-group">
                <label>Key Features</label>
                <div className="feature-checkboxes">
                  {['Night Vision', 'PoE Support', 'AI Analytics', 'Weatherproof IP67', 'Solar Battery', 'Two-Way Audio'].map((feat) => (
                    <label key={feat} className="feature-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feat)}
                        onChange={() => toggleFeature(feat)}
                      />
                      <span>{feat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            <section className="finder-results-section">
              <div className="finder-results-header">
                <span>Showing <strong>{filteredProducts.length}</strong> matching products</span>
                {filteredProducts.length < products.length && (
                  <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1268a5', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                    Filtered from {products.length} total
                  </span>
                )}
              </div>

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
                      rating: product.rating || 4.8,
                      reviewCount: product.reviewCount || 16,
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
    </>
  );
}

