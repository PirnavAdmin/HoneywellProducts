import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Eye, Check } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { productService } from '../services/productService';
import { useUI } from '../context/UIContext';
import heroImage from '../assets/images/smart-technology-trends.png';

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
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const { openEnquiry } = useUI();

  useEffect(() => {
    localStorage.setItem('honeywell_compare_ids', JSON.stringify(compareIds));
  }, [compareIds]);

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

  useEffect(() => {
    async function fetchCompareProducts() {
      if (compareIds.length === 0) {
        setProducts([]);
        return;
      }
      setLoading(true);
      try {
        const items = await Promise.all(
          compareIds.map(async (id) => {
            try {
              return await productService.getById(id);
            } catch (e) {
              return null;
            }
          })
        );
        setProducts(items.filter(Boolean));
      } catch (e) {
        console.error('Error fetching compare items:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCompareProducts();
  }, [compareIds]);

  const removeCompareId = (id) => {
    setCompareIds((prev) => prev.filter((item) => String(item) !== String(id)));
  };

  const addCompareProduct = (id) => {
    if (!id) return;
    if (compareIds.length >= 4) {
      alert('You can compare up to 4 products at a time.');
      return;
    }
    if (!compareIds.includes(String(id))) {
      setCompareIds((prev) => [...prev, String(id)]);
    }
    setSelectedToAdd('');
  };

  const clearAll = () => {
    setCompareIds([]);
    setProducts([]);
  };

  return (
    <>
      <PageHero
        eyebrow="PRODUCT COMPARISON"
        title="Side-by-Side Product Comparison"
        description="Compare technical specifications, features, and details side-by-side to select the ideal hardware."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="compare-top-actions">
            <div className="add-compare-selector">
              <select
                value={selectedToAdd}
                onChange={(e) => addCompareProduct(e.target.value)}
                disabled={compareIds.length >= 4}
              >
                <option value="">+ Add a product to compare...</option>
                {availableProducts
                  .filter((p) => !compareIds.includes(String(p.id)))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || 'Product'})
                    </option>
                  ))}
              </select>
            </div>

            {compareIds.length > 0 && (
              <button className="button button-outline button-small" onClick={clearAll}>
                Clear All
              </button>
            )}
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '250px' }}>
              <p>Loading comparison data...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state compare-empty">
              <h3>No products selected for comparison</h3>
              <p>Select products from the catalog or dropdown above to compare their specifications.</p>
              <Link to="/products" className="button button-small">
                Browse Product Catalog
              </Link>
            </div>
          ) : (
            <div className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th className="spec-label-col">Specification</th>
                    {products.map((item) => (
                      <th key={item.id} className="compare-product-col">
                        <div className="compare-card-head">
                          <button
                            className="compare-remove-btn"
                            onClick={() => removeCompareId(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <X size={16} />
                          </button>
                          <img
                            src={(!item.image || String(item.image).toLowerCase().includes('placeholder')) ? '/honeywell-products-logo.png' : (item.imageUrl || item.image)}
                            alt={item.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/honeywell-products-logo.png';
                            }}
                            style={{ width: '120px', height: '120px', objectFit: 'contain', margin: '0 auto 12px', display: 'block' }}
                          />
                          <h4>{item.name}</h4>
                          <span className="compare-category">{item.categoryName || item.category || 'Product'}</span>
                          <div className="compare-head-actions">
                            <Link to={`/products/${item.id}`} className="button button-outline button-small">
                              <Eye size={14} /> View
                            </Link>
                            <button className="button button-small" onClick={() => openEnquiry(item)}>
                              Enquire
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="spec-label-col">Category</td>
                    {products.map((item) => (
                      <td key={item.id}>{item.categoryName || item.category || 'Surveillance'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="spec-label-col">Price / Unit</td>
                    {products.map((item) => (
                      <td key={item.id} className="compare-price">
                        {item.price ? `$${Number(item.price).toFixed(2)}` : 'Request Quote'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="spec-label-col">Key Features</td>
                    {products.map((item) => (
                      <td key={item.id}>
                        <ul className="compare-feature-list">
                          {Array.isArray(item.features)
                            ? item.features.map((f, i) => <li key={i}><Check size={12} /> {f}</li>)
                            : (item.features || 'Standard specs').split(',').map((f, i) => <li key={i}><Check size={12} /> {f.trim()}</li>)}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="spec-label-col">Technical Specs</td>
                    {products.map((item) => (
                      <td key={item.id}>
                        {item.specifications ? (
                          typeof item.specifications === 'object' ? (
                            <ul className="compare-spec-list">
                              {Object.entries(item.specifications).map(([k, v]) => (
                                <li key={k}><strong>{k}:</strong> {String(v)}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{item.specifications}</p>
                          )
                        ) : (
                          <p>Standard Honeywell Enterprise Spec</p>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="spec-label-col">Warranty / Support</td>
                    {products.map((item) => (
                      <td key={item.id}>{item.warranty || 'Standard Manufacturer Warranty'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
