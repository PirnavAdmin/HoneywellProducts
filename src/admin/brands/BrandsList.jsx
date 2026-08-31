import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Image as ImageIcon, Tag, Edit3, Trash2 } from 'lucide-react';

import { getApiDomain } from '../../utils/apiConfig';
import './brands.css';
import { Toast } from '../components/Toast';

// Inline API utilities
const API_BASE = `${getApiDomain()}/api/Brand`;
const API_DOMAIN = getApiDomain();
const API_ITEM = (id) => `${getApiDomain()}/api/Brand/${encodeURIComponent(id)}`;

// Normalize brand object: map any possible image field name to `logo`
const normalizeBrand = (b) => {
  if (!b) return {};
  return {
    ...b,
    id: b.id !== undefined && b.id !== null ? String(b.id) : '',
    name: b.name || b.Name || b.brandName || b.BrandName || '',
    description: b.description || b.Description || '',
    logo: b.LogoImage || b.logoImage || b.logo || b.logoUrl || b.imageUrl || b.image || b.logoURL || b.ImageUrl || b.Logo || b.LogoUrl || '',
  };
};

// Resolve logo value to a valid <img src> regardless of what format the API returns
export const getLogoSrc = (logo) => {
  if (!logo) return '';
  if (logo.startsWith('data:')) return logo;
  if (/^https?:\/\//i.test(logo)) return logo;
  if (logo.startsWith('/') || logo.includes('.') || logo.includes('/')) {
    const path = logo.startsWith('/') ? logo : `/${logo}`;
    return `${API_DOMAIN}${path}`;
  }
  return `data:image/png;base64,${logo}`;
};

// State-managed BrandLogo component to robustly handle load errors without DOM traversal
export const BrandLogo = ({ logo, name }) => {
  const [error, setError] = useState(false);
  const src = getLogoSrc(logo);

  if (!logo || error || !src) {
    return (
      <div className="brand-card__logo-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <ImageIcon size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      onError={() => setError(true)}
    />
  );
};

export const fetchBrands = async () => {
  // Try primary Brand API (/api/Brand)
  try {
    const res = await fetch(API_BASE, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeBrand) : [];
    }
    console.warn(`Primary brand fetch API returned status: ${res.status}`);
  } catch (e) {
    console.warn('Failed to fetch from primary Brand API, trying Catalog/brands API...', e);
  }

  // Fallback to Catalog brands API (/api/Catalog/brands)
  try {
    const res = await fetch(`${API_DOMAIN}/api/Catalog/brands`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Fallback fetch brands failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeBrand) : [];
  } catch (e) {
    console.error('All brand fetch APIs failed:', e);
    throw e;
  }
};

export const deleteBrand = async (id) => {
  // Try primary Brand API (/api/Brand/{id})
  try {
    const res = await fetch(API_ITEM(id), {
      method: 'DELETE',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (res.ok) return true;
    console.warn(`Primary delete brand API returned status: ${res.status}`);
  } catch (e) {
    console.warn('Failed to delete using primary Brand API, trying Catalog/brands API...', e);
  }

  // Fallback to Catalog brands API (/api/Catalog/brands/{id})
  const res = await fetch(`${API_DOMAIN}/api/Catalog/brands/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'ngrok-skip-browser-warning': 'true' },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Delete brand failed: ${res.status} ${err}`);
  }
  return true;
};

const BrandsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBrands();
        setBrands(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the brand "${name}"?`)) {
      try {
        await deleteBrand(id);
        setBrands(prev => prev.filter(b => b.id !== id));
        setToastMessage(`Brand "${name}" deleted successfully.`);
        setToastType('success');
      } catch (e) {
        setToastMessage(`Failed to delete brand: ${e.message}`);
        setToastType('error');
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/brands/form?id=${id}`);
  };

  const filteredBrands = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return brands
      .filter(brand => 
        String(brand.name || '').toLowerCase().includes(query) ||
        String(brand.id || '').toLowerCase().includes(query)
      )
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [brands, searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const pagedBrands = filteredBrands.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="brands-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <span className="catalog-kicker" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#059669', fontWeight: 800, display: 'block', letterSpacing: '0.05em', marginBottom: '2px' }}>CATALOG SETTINGS</span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Brands Directory</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Manage manufacturers and brands assigned to products.</p>
        </div>
        <div>
          <Link to="/admin/brands/form" style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Brand
          </Link>
        </div>
      </div>

      {/* Toolbar / Search Filter */}
      <div className="brands-toolbar" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div className="brands-search" style={{ flex: '0 1 450px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search brands by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 38px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', backgroundColor: '#f8fafc' }}
          />
        </div>
        <span className="brands-count" style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '6px 14px', borderRadius: '999px' }}>
          {filteredBrands.length} {filteredBrands.length === 1 ? 'brand' : 'brands'}
        </span>
      </div>

      {/* Cards Grid */}
      {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading brands...</div>}
      {error && <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#ef4444', borderRadius: '8px' }}>{error}</div>}
      
      {!loading && !error && filteredBrands.length === 0 && (
        <div className="brands-empty-state" style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <Tag size={40} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>No brands found</h3>
          <p style={{ fontSize: '12px', color: '#64748b' }}>{searchTerm ? "We couldn't find any brands matching your search." : "There are no brands registered in the catalog yet."}</p>
          {!searchTerm && (
            <Link to="/admin/brands/form" style={{ marginTop: '12px', display: 'inline-flex', backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
              <Plus size={16} style={{ marginRight: '4px' }} /> Add Your First Brand
            </Link>
          )}
        </div>
      )}

      {!loading && !error && filteredBrands.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="brands-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {pagedBrands.map((brand) => (
              <div className="brand-card" key={brand.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', height: '175px', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div className="brand-card__content" style={{ padding: '16px 12px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
                  <div className="brand-card__logo-frame" style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <BrandLogo logo={brand.logo} name={brand.name} />
                  </div>
                  <span className="brand-card__id" style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '2px 10px', borderRadius: '999px', marginBottom: '6px' }}>{brand.id}</span>
                  <h3 className="brand-card__name" style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{brand.name}</h3>
                </div>
                
                <div className="brand-card__actions" style={{ borderTop: '1px solid #f1f5f9', padding: '8px 16px', display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                  <button onClick={() => handleEdit(brand.id)} title="Edit Brand" style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '2px' }}>
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(brand.id, brand.name)} title="Delete Brand" style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '2px' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              Showing {filteredBrands.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredBrands.length)} of {filteredBrands.length} entries
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: page === currentPage ? 'none' : '1px solid #e2e8f0',
                    backgroundColor: page === currentPage ? '#2563eb' : '#ffffff',
                    color: page === currentPage ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {page}
                </button>
              ))}
              {currentPage < totalPages && (
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer' }}
                >
                  Next &gt;
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandsList;

