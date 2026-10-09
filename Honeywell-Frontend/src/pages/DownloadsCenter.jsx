import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download, FileText, Search, FileCheck, BookOpen, Eye,
  Loader2, AlertCircle, Package, Layers, X
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { productService } from '../services/productService';
import { generateProductPdf } from '../utils/pdfGenerator';
import heroImage from '../assets/images/smart-technology-trends.png';

// Helper to extract category name from product — handles both string and object shapes
const getCategoryName = (product) => {
  if (!product) return 'General';
  if (product.categoryName) return product.categoryName;
  if (typeof product.category === 'object' && product.category?.name) return product.category.name;
  if (typeof product.category === 'string' && product.category) return product.category;
  return 'General';
};

export default function DownloadsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // State for Products (documents)
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  // ── Fetch products on mount ──
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);
        const data = await productService.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading products for documents:', err);
        setErrorProducts(err.message || 'Failed to load product documents');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // ── Build complete document list for each product ──
  const allDocuments = useMemo(() => {
    return products.flatMap((product) => {
      const docs = [];
      const productName = product.name || product.productName || product.title || 'Honeywell Product';
      const catName = getCategoryName(product);

      // Helper to test if a raw URL is a real external file
      const checkRealUrl = (urlStr) => Boolean(
        urlStr &&
        typeof urlStr === 'string' &&
        (urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('blob:') || urlStr.startsWith('data:')) &&
        !urlStr.includes('/docs/')
      );

      // 1. Datasheet
      const dsUrl = product.datasheetUrl || product.datasheet;
      const isRealDs = checkRealUrl(dsUrl);
      docs.push({
        id: `${product.id}-datasheet`,
        productId: product.id,
        productName,
        category: catName,
        title: isRealDs ? `${productName} — Official Datasheet` : `${productName} — Generated Product Datasheet`,
        type: 'datasheets',
        badge: 'Datasheet',
        hasRealUrl: isRealDs,
        fileUrl: dsUrl || `/docs/${product.id}-datasheet.pdf`,
        format: isRealDs ? 'Official Doc' : 'Generated PDF',
        productObj: product,
        description: product.shortDescription || product.description || 'Comprehensive technical specifications, pin configurations, and electrical ratings.',
      });

      // 2. Installation & User Manual
      const manualUrl = product.manualUrl || product.manual;
      const isRealManual = checkRealUrl(manualUrl);
      docs.push({
        id: `${product.id}-manual`,
        productId: product.id,
        productName,
        category: catName,
        title: isRealManual ? `${productName} — Official User Manual` : `${productName} — Generated User Guide`,
        type: 'manuals',
        badge: 'User Manual',
        hasRealUrl: isRealManual,
        fileUrl: manualUrl || `/docs/${product.id}-manual.pdf`,
        format: isRealManual ? 'Official Doc' : 'Generated PDF',
        productObj: product,
        description: 'Step-by-step setup guide, hardware mounting procedures, and configuration manual.',
      });

      // 3. Product Brochure
      const brochureUrl = product.brochureUrl || product.brochure;
      const isRealBrochure = checkRealUrl(brochureUrl);
      docs.push({
        id: `${product.id}-brochure`,
        productId: product.id,
        productName,
        category: catName,
        title: isRealBrochure ? `${productName} — Official Brochure` : `${productName} — Generated Overview Sheet`,
        type: 'brochures',
        badge: 'Brochure',
        hasRealUrl: isRealBrochure,
        fileUrl: brochureUrl || `/docs/${product.id}-brochure.pdf`,
        format: isRealBrochure ? 'Official Doc' : 'Generated PDF',
        productObj: product,
        description: 'Feature overview, application scenarios, benefits, and solution deployment architecture.',
      });

      // 4. Quality & Compliance Certificate
      const certUrl = product.certificationUrl || product.certification;
      const isRealCert = checkRealUrl(certUrl);
      docs.push({
        id: `${product.id}-certification`,
        productId: product.id,
        productName,
        category: catName,
        title: isRealCert ? `${productName} — Official Quality Certificate` : `${productName} — Generated Compliance Summary`,
        type: 'documents',
        badge: 'Certification',
        hasRealUrl: isRealCert,
        fileUrl: certUrl || `/docs/${product.id}-certification.pdf`,
        format: isRealCert ? 'Official Doc' : 'Generated PDF',
        productObj: product,
        description: 'Official CE, RoHS, ISO quality compliance and commercial warranty documentation.',
      });

      return docs;
    });
  }, [products]);

  // ── Extract unique categories from live product data ──
  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(getCategoryName))].filter(Boolean).sort();
  }, [products]);

  // ── Accurate Tab counts ──
  const tabCounts = useMemo(() => ({
    all: allDocuments.length,
    datasheets: allDocuments.filter((d) => d.type === 'datasheets').length,
    manuals: allDocuments.filter((d) => d.type === 'manuals').length,
    brochures: allDocuments.filter((d) => d.type === 'brochures').length,
    documents: allDocuments.filter((d) => d.type === 'documents').length,
  }), [allDocuments]);

  // ── Tab items configuration ──
  const tabs = useMemo(() => [
    { id: 'all', label: 'All Downloads', icon: Layers, count: tabCounts.all },
    { id: 'datasheets', label: 'Datasheets', icon: FileText, count: tabCounts.datasheets },
    { id: 'manuals', label: 'User Manuals', icon: BookOpen, count: tabCounts.manuals },
    { id: 'brochures', label: 'Brochures', icon: Package, count: tabCounts.brochures },
    { id: 'documents', label: 'Certifications & Docs', icon: FileCheck, count: tabCounts.documents },
  ], [tabCounts]);

  // ── Filter logic based on active tab and search ──
  const filteredItems = useMemo(() => {
    let items = [];

    if (activeTab === 'all') {
      items = allDocuments;
    } else if (activeTab === 'datasheets') {
      items = allDocuments.filter((d) => d.type === 'datasheets');
    } else if (activeTab === 'manuals') {
      items = allDocuments.filter((d) => d.type === 'manuals');
    } else if (activeTab === 'brochures') {
      items = allDocuments.filter((d) => d.type === 'brochures');
    } else if (activeTab === 'documents') {
      items = allDocuments.filter((d) => d.type === 'documents');
    } else {
      items = allDocuments;
    }

    // Apply category filter
    if (category) {
      items = items.filter((item) =>
        (item.category || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((item) =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.productName || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.badge || '').toLowerCase().includes(q)
      );
    }

    return items;
  }, [activeTab, allDocuments, category, search]);

  const isLoading = loadingProducts;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleDocumentAction = async (doc, mode = 'download') => {
    const url = doc.fileUrl || '';
    const isRealExternalPdf = (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) && !url.includes('/docs/');

    if (isRealExternalPdf) {
      if (mode === 'view') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.setAttribute('download', `${doc.title}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return;
    }

    await generateProductPdf(
      doc.productObj || {
        name: doc.productName,
        category: doc.category,
        id: doc.productId,
      },
      doc.type,
      mode
    );
  };

  // ── Icon for doc type ──
  const getItemIcon = (item) => {
    if (item.type === 'manuals') return <BookOpen size={22} />;
    if (item.type === 'datasheets') return <FileText size={22} />;
    if (item.type === 'brochures') return <Package size={22} />;
    return <FileCheck size={22} />;
  };

  return (
    <>
      <PageHero
        eyebrow="DOCUMENTATION &amp; RESOURCES"
        title="Downloads &amp; Document Center"
        description="Access official datasheets, installation manuals, product brochures, and certifications for Honeywell security products."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          {/* ── Controls: Search + Category ── */}
          <div className="downloads-controls">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search documents, datasheets, manuals, brochures, certifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Product Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* ── Tab Bar ── */}
          <div className="tabs-header">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  <span className="tab-badge">{isLoading ? '...' : tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* ── Content ── */}
          {isLoading ? (
            <div className="route-loading" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#e30613' }} />
              <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Loading official Honeywell documentation...</p>
            </div>
          ) : errorProducts ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px', background: '#fef2f2', borderRadius: '10px', color: '#dc2626' }}>
              <AlertCircle size={24} />
              <span style={{ fontWeight: 500 }}>Unable to load documentation resources. Please check your network connection and try again.</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <FileText size={48} className="empty-icon" style={{ color: '#94a3b8', marginBottom: '14px' }} />
              <h3 style={{ color: '#334155', marginBottom: '8px', fontSize: '18px' }}>No documents match your filter</h3>
              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 16px' }}>Try searching with a different term or reset your category filters.</p>
              {(search || category || activeTab !== 'all') && (
                <button
                  type="button"
                  className="button button-outline button-small"
                  onClick={() => { setSearch(''); setCategory(''); setActiveTab('all'); setSearchParams({}); }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="downloads-grid">
              {filteredItems.map((item) => (
                <div key={item.id} className="download-card">
                  <div className="download-card-header">
                    <div className={`download-card-icon ${item.type}`}>
                      {getItemIcon(item)}
                    </div>
                    <div className="download-card-tags">
                      <span className={`doc-type-tag ${item.type}`}>
                        {item.badge}
                      </span>
                      <span
                        className="doc-format-pill"
                        style={{
                          background: item.hasRealUrl ? '#dcfce7' : '#fef3c7',
                          color: item.hasRealUrl ? '#166534' : '#92400e',
                          fontWeight: 600,
                        }}
                      >
                        {item.hasRealUrl ? 'Official Doc' : 'Generated PDF'}
                      </span>
                    </div>
                  </div>

                  <div className="download-card-info">
                    <h4>{item.title}</h4>
                    <span className="doc-category">
                      {item.category}
                    </span>
                    {item.description && (
                      <p className="doc-desc">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="download-card-actions">
                    <button
                      type="button"
                      className="btn-view"
                      onClick={() => handleDocumentAction(item, 'view')}
                      title={item.hasRealUrl ? "Open official document in browser" : "Preview generated product datasheet"}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      type="button"
                      className="btn-download"
                      onClick={() => handleDocumentAction(item, 'download')}
                      title={item.hasRealUrl ? "Download official uploaded manufacturer document" : "Generate product datasheet PDF from live product specifications"}
                    >
                      <Download size={14} /> {item.hasRealUrl ? 'Download Official PDF' : 'Generate Product PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Inline spin keyframe for loaders */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
