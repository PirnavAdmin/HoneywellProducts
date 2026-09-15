import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  ExternalLink,
  Search,
  Filter,
  X,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
  Monitor,
  Smartphone,
  Cpu,
  Layers,
  Calendar,
  HardDrive,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { softwareService } from '../services/softwareService';
import { productService } from '../services/productService';
import heroImage from '../assets/images/smart-technology-trends.png';

const SOFTWARE_TYPES = [
  'Software',
  'Firmware',
  'Driver',
  'Configuration Tool',
  'Utility',
  'Desktop Application',
  'Mobile Application',
  'Plugin',
  'Other',
];

const PLATFORMS = [
  'Windows',
  'macOS',
  'Linux',
  'Android',
  'iOS',
  'Firmware',
  'Cross-platform',
  'Other',
];

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return 'N/A';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function SoftwareDownloads() {
  const [softwareList, setSoftwareList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [rawSearch, setRawSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Modal for Release Notes & Unavailable Download Toast
  const [selectedNotesModal, setSelectedNotesModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(rawSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        const catData = await productService.categories();
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        console.warn('Could not load categories:', err);
      }
    }
    loadCats();
  }, []);

  // Fetch software items with server-side query params (search, platform, softwareType)
  const loadSoftware = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { status: 'Active' };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedPlatform) params.platform = selectedPlatform;
      if (selectedType) params.softwareType = selectedType;

      const res = await softwareService.getAll(params);
      const items = Array.isArray(res) ? res : (res?.items || []);
      setSoftwareList(items);
    } catch (err) {
      console.error('Error fetching software:', err);
      setError('Unable to load software and downloads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedPlatform, selectedType]);

  useEffect(() => {
    loadSoftware();
  }, [loadSoftware]);

  // Client-side filter — only category (search, type, platform are now server-side)
  const filteredSoftware = useMemo(() => {
    return softwareList.filter((item) => {
      // Must be active
      if (item.status && item.status.toLowerCase() !== 'active') return false;

      // Category filter (client-side only, not an API param)
      if (selectedCategory) {
        const catName = item.category || item.categoryName || '';
        const catId = item.categoryId || '';
        if (String(catId) !== String(selectedCategory) && catName.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [softwareList, selectedCategory]);

  const clearFilters = () => {
    setRawSearch('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedPlatform('');
  };

  const handleDownload = (item) => {
    if (item.id) {
      softwareService.download(item.id, item.externalUrl);
    } else if (item.fileUrl) {
      const link = document.createElement('a');
      link.href = item.fileUrl;
      link.download = item.softwareName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      setToastMessage('This software file is currently unavailable. Please contact support.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const hasActiveFilters = Boolean(rawSearch || selectedCategory || selectedType || selectedPlatform);

  return (
    <>
      <div className="product-breadcrumbs container" style={{ marginTop: '16px', marginBottom: '8px' }}>
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/resources">Resources</Link>
        <ChevronRight size={14} />
        <span>Software &amp; Downloads</span>
      </div>

      <PageHero
        eyebrow="SOFTWARE &amp; DOWNLOADS"
        title="Software &amp; Downloads"
        description="Find software, firmware, tools and applications for your Honeywell products."
        image={heroImage}
      />

      <section className="section" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <div className="container">
          {/* Search & Filter Header Container */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              marginBottom: '32px',
            }}
          >
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              />
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder="Search by product name, model, software name or version…"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  fontSize: '15px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
              />
              {rawSearch && (
                <button
                  onClick={() => setRawSearch('')}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Desktop & Tablet Filters Bar */}
            <div
              className="software-filters-desktop"
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                  Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">All Product Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                  Type:
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">All Software Types</option>
                  {SOFTWARE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                  Platform:
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">All Platforms</option>
                  {PLATFORMS.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="button outline button-small"
                  style={{ whiteSpace: 'nowrap', minHeight: '38px', borderRadius: '8px' }}
                >
                  <X size={14} /> Clear Filters
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="software-filters-mobile-toggle" style={{ display: 'none', marginTop: '12px' }}>
              <button
                className="button outline"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Filter size={16} /> Filters {hasActiveFilters ? '(Active)' : ''}
              </button>
            </div>

            {/* Mobile Filter Accordion */}
            {mobileFilterOpen && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">All Product Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">All Software Types</option>
                    {SOFTWARE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">All Platforms</option>
                    {PLATFORMS.map((plat) => (
                      <option key={plat} value={plat}>
                        {plat}
                      </option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="button outline button-small" style={{ marginTop: '4px' }}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results count & Toast alert */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
              Showing {filteredSoftware.length} software package{filteredSoftware.length !== 1 ? 's' : ''}
            </span>
          </div>

          {toastMessage && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={18} />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Software Cards Grid / Loading / Empty */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Loader2 size={40} className="animate-spin" style={{ color: '#1d4ed8', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Loading Software Directory…</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Fetching software packages and firmware tools</p>
            </div>
          ) : error ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '48px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
              }}
            >
              <AlertCircle size={44} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                {error}
              </h3>
              <button className="button" onClick={loadSoftware} style={{ marginTop: '12px' }}>
                Retry
              </button>
            </div>
          ) : filteredSoftware.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '48px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
              }}
            >
              <FileText size={44} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                No software matches your current filters.
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                Try searching with a different keyword, product model, or clearing selected filters.
              </p>
              {hasActiveFilters && (
                <button className="button" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredSoftware.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                    padding: '24px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '20px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Left Info Column */}
                    <div style={{ flex: '1 1 480px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Layers size={13} /> {item.softwareType || 'Software'}
                        </span>
                        {item.isFeatured && (
                          <span
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                        {item.softwareName}
                      </h3>

                      {(item.productName || item.productModel) && (
                        <p style={{ fontSize: '13px', color: '#475569', fontWeight: 600, margin: '0 0 12px 0' }}>
                          Product: <strong>{item.productName || 'Honeywell Device'}</strong>{' '}
                          {item.productModel && <span style={{ color: '#64748b' }}>(Model: {item.productModel})</span>}
                        </p>
                      )}

                      <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                        {item.description}
                      </p>

                      {/* Spec Badges Row */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          rowGap: '8px',
                          flexWrap: 'wrap',
                          fontSize: '12px',
                          color: '#64748b',
                        }}
                      >
                        {item.version && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Cpu size={14} style={{ color: '#1d4ed8' }} /> Version: <strong>{item.version}</strong>
                          </span>
                        )}
                        {item.platform && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Monitor size={14} style={{ color: '#1d4ed8' }} /> Platform: <strong>{item.platform}</strong>
                          </span>
                        )}
                        {item.architecture && item.architecture !== 'N/A' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <HardDrive size={14} style={{ color: '#1d4ed8' }} /> Arch: <strong>{item.architecture}</strong>
                          </span>
                        )}
                        {item.fileSize > 0 && (
                          <span>File Size: <strong>{formatFileSize(item.fileSize)}</strong></span>
                        )}
                        {item.releaseDate && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> Updated: <strong>{formatDate(item.releaseDate)}</strong>
                          </span>
                        )}
                        {item.downloadCount > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Download size={14} style={{ color: '#1d4ed8' }} /> <strong>{item.downloadCount.toLocaleString()}</strong> downloads
                          </span>
                        )}
                      </div>

                      {item.minimumRequirements && (
                        <div
                          style={{
                            marginTop: '12px',
                            fontSize: '12px',
                            color: '#64748b',
                            backgroundColor: '#f8fafc',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                          }}
                        >
                          <strong>Reqs:</strong> {item.minimumRequirements}
                        </div>
                      )}
                    </div>

                    {/* Right Actions Column */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        minWidth: '180px',
                        justifyContent: 'center',
                        alignSelf: 'center',
                      }}
                    >
                      {item.releaseNotes && (
                        <button
                          className="button outline button-small"
                          onClick={() => setSelectedNotesModal(item)}
                          style={{ justifyContent: 'center', width: '100%' }}
                        >
                          <FileText size={14} /> Release Notes
                        </button>
                      )}

                      <button
                        className="button button-small"
                        onClick={() => handleDownload(item)}
                        style={{
                          backgroundColor: '#1d4ed8',
                          color: '#ffffff',
                          justifyContent: 'center',
                          width: '100%',
                          fontWeight: 700,
                        }}
                      >
                        {item.externalUrl ? (
                          <>
                            <ExternalLink size={14} /> External Link
                          </>
                        ) : (
                          <>
                            <Download size={14} /> Download Software ↓
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Release Notes Modal */}
      {selectedNotesModal && (
        <div
          onClick={() => setSelectedNotesModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#1d4ed8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  RELEASE NOTES — V{selectedNotesModal.version}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                  {selectedNotesModal.softwareName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotesModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ color: '#334155', fontSize: '14px', lineHeight: 1.7, whitespace: 'pre-wrap' }}>
              {selectedNotesModal.releaseNotes}
            </div>

            <div
              style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button className="button outline button-small" onClick={() => setSelectedNotesModal(null)}>
                Close
              </button>
              <button
                className="button button-small"
                onClick={() => {
                  const item = selectedNotesModal;
                  setSelectedNotesModal(null);
                  handleDownload(item);
                }}
                style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
              >
                <Download size={14} /> Download Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style overrides for responsive media queries */}
      <style>{`
        @media (max-width: 768px) {
          .software-filters-desktop {
            display: none !important;
          }
          .software-filters-mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
