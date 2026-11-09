import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download, FileText, Search, FileCheck, BookOpen, Eye,
  Loader2, AlertCircle, Package, Layers, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { productService } from '../services/productService';
import { documentService } from '../services/documentService';
import { generateProductPdf } from '../utils/pdfGenerator';

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const mapCategoryToType = (cat) => {
  const c = (cat || '').toLowerCase().trim();
  if (c.includes('datasheet')) return 'datasheets';
  if (c.includes('manual')) return 'manuals';
  if (c.includes('brochure')) return 'brochures';
  return 'documents';
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // State for Products and Uploaded Documents
  const [products, setProducts] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  // ── Fetch products and uploaded documents on mount ──
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);
        const [productsData, docsData] = await Promise.all([
          productService.getAll().catch((err) => {
            console.error('Error loading products for documents:', err);
            return [];
          }),
          documentService.getAll({ status: 'Active' }).catch((err) => {
            console.error('Error loading uploaded documents:', err);
            return [];
          }),
        ]);
        if (!isMounted) return;
        setProducts(Array.isArray(productsData) ? productsData : []);
        setUploadedDocs(Array.isArray(docsData) ? docsData : []);
      } catch (err) {
        console.error('Error loading document center resources:', err);
        if (isMounted) setErrorProducts(err.message || 'Failed to load product documents');
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; };
  }, []);

  // ── Build complete document list incorporating uploaded documents & product documentation ──
  const allDocuments = useMemo(() => {
    const list = [];
    const productsById = new Map();
    products.forEach((p) => {
      if (p.id) productsById.set(String(p.id), p);
    });

    // Track which (productId, type) combinations already have real uploaded documents
    const uploadedCategoryProductKeys = new Set();

    // 1. Primary: Add all real uploaded documents (Datasheets, Manuals, Brochures, Certifications, etc.)
    uploadedDocs.forEach((doc) => {
      const pIdStr = String(doc.productId);
      const matchedProduct = productsById.get(pIdStr);
      const productName = doc.productName || matchedProduct?.name || 'Honeywell Product';
      const catName = matchedProduct ? getCategoryName(matchedProduct) : (doc.productCategoryName || 'General');
      const docType = mapCategoryToType(doc.category);

      uploadedCategoryProductKeys.add(`${pIdStr}-${docType}`);

      list.push({
        id: `uploaded-${doc.id}`,
        dbId: doc.id,
        isUploadedDoc: true,
        productId: doc.productId,
        productName,
        category: catName,
        docCategory: doc.category,
        title: doc.title,
        type: docType,
        badge: doc.category || 'Official Document',
        hasRealUrl: true,
        fileUrl: documentService.getViewUrl(doc.id),
        downloadUrl: documentService.getDownloadUrl(doc.id),
        originalFileName: doc.originalFileName,
        format: 'Official Doc',
        productObj: matchedProduct,
        description: doc.description || `${doc.category} for ${productName}.`,
        revision: doc.revision,
        language: doc.language,
        fileSize: doc.fileSize,
        documentDate: doc.documentDate,
      });
    });

    // Helper to test if a raw URL is a real external file
    const checkRealUrl = (urlStr) => Boolean(
      urlStr &&
      typeof urlStr === 'string' &&
      (urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('blob:') || urlStr.startsWith('data:')) &&
      !urlStr.includes('/docs/')
    );

    // 2. Secondary: Include ONLY products with genuine real external files (if any exist)
    // DO NOT generate dummy placeholder documents for products without documents
    products.forEach((product) => {
      const pIdStr = String(product.id);
      const productName = product.name || product.productName || product.title || 'Honeywell Product';
      const catName = getCategoryName(product);

      // 1. Datasheet (Only if real URL exists)
      const dsUrl = product.datasheetUrl || product.datasheet;
      if (checkRealUrl(dsUrl) && !uploadedCategoryProductKeys.has(`${pIdStr}-datasheets`)) {
        list.push({
          id: `${product.id}-datasheet-ext`,
          productId: product.id,
          productName,
          category: catName,
          title: `${productName} — Official Datasheet`,
          type: 'datasheets',
          badge: 'Datasheet',
          hasRealUrl: true,
          fileUrl: dsUrl,
          format: 'Official Doc',
          productObj: product,
          description: product.shortDescription || product.description || 'Comprehensive technical specifications and ratings.',
        });
      }

      // 2. Installation & User Manual (Only if real URL exists)
      const manualUrl = product.manualUrl || product.manual;
      if (checkRealUrl(manualUrl) && !uploadedCategoryProductKeys.has(`${pIdStr}-manuals`)) {
        list.push({
          id: `${product.id}-manual-ext`,
          productId: product.id,
          productName,
          category: catName,
          title: `${productName} — Official User Manual`,
          type: 'manuals',
          badge: 'User Manual',
          hasRealUrl: true,
          fileUrl: manualUrl,
          format: 'Official Doc',
          productObj: product,
          description: 'Step-by-step setup guide and configuration manual.',
        });
      }

      // 3. Product Brochure (Only if real URL exists)
      const brochureUrl = product.brochureUrl || product.brochure;
      if (checkRealUrl(brochureUrl) && !uploadedCategoryProductKeys.has(`${pIdStr}-brochures`)) {
        list.push({
          id: `${product.id}-brochure-ext`,
          productId: product.id,
          productName,
          category: catName,
          title: `${productName} — Official Brochure`,
          type: 'brochures',
          badge: 'Brochure',
          hasRealUrl: true,
          fileUrl: brochureUrl,
          format: 'Official Doc',
          productObj: product,
          description: 'Feature overview and product architecture.',
        });
      }

      // 4. Quality & Compliance Certificate (Only if real URL exists)
      const certUrl = product.certificationUrl || product.certification;
      if (checkRealUrl(certUrl) && !uploadedCategoryProductKeys.has(`${pIdStr}-documents`)) {
        list.push({
          id: `${product.id}-certification-ext`,
          productId: product.id,
          productName,
          category: catName,
          title: `${productName} — Official Quality Certificate`,
          type: 'documents',
          badge: 'Certification',
          hasRealUrl: true,
          fileUrl: certUrl,
          format: 'Official Doc',
          productObj: product,
          description: 'Official CE, RoHS, ISO quality compliance and certification.',
        });
      }
    });

    return list;
  }, [products, uploadedDocs]);

  // ── Extract unique categories from live product data & documents ──
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    allDocuments.forEach((d) => {
      if (d.category) cats.add(d.category);
    });
    products.forEach((p) => {
      const c = getCategoryName(p);
      if (c && c !== 'General') cats.add(c);
    });
    return [...cats].filter(Boolean).sort();
  }, [allDocuments, products]);

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

  // Reset pagination to first page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, activeTab]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage, ITEMS_PER_PAGE]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    const targetEl = document.getElementById('downloads-top');
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isLoading = loadingProducts;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleDocumentAction = async (doc, mode = 'download') => {
    if (doc.isUploadedDoc && doc.dbId) {
      if (mode === 'view') {
        await documentService.openPreview(doc.dbId);
      } else {
        await documentService.download(doc.dbId, doc.originalFileName || `${doc.title}.pdf`);
      }
      return;
    }

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
      <section className="section downloads-page-section" id="downloads-top">
        <div className="container">
          {/* ── Compact Professional Header (Banner & Breadcrumbs Removed) ── */}
          <header className="downloads-header">
            <span className="downloads-badge">DOCUMENTATION &amp; RESOURCES</span>
            <h1 className="downloads-title">Downloads &amp; Document Center</h1>
            <p className="downloads-desc">
              Access official datasheets, installation manuals, product brochures, and certifications for Honeywell security products.
            </p>
          </header>

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

          {/* ── Results Bar ── */}
          {!isLoading && !errorProducts && filteredItems.length > 0 && (
            <div className="downloads-results-bar">
              <div className="downloads-results-count">
                Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</strong> of <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'document' : 'documents'}
                {category && (
                  <span className="downloads-active-filter-pill">
                    Category: {category}
                  </span>
                )}
                {search && (
                  <span className="downloads-active-filter-pill">
                    "{search}"
                  </span>
                )}
              </div>
              {totalPages > 1 && (
                <div className="downloads-page-indicator">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </div>
              )}
            </div>
          )}

          {/* ── Content ── */}
          {isLoading ? (
            <div className="route-loading" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
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
                  className="downloads-reset-btn"
                  onClick={() => { setSearch(''); setCategory(''); setActiveTab('all'); setSearchParams({}); }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="downloads-grid">
                {paginatedItems.map((item) => (
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
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Responsive Pagination Bar ── */}
              {totalPages > 1 && (
                <div className="downloads-pagination-wrapper">
                  <div className="downloads-pagination-info">
                    Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</strong> of <strong>{filteredItems.length}</strong> documents
                  </div>
                  <div className="downloads-pagination-controls">
                    <button
                      type="button"
                      className="downloads-page-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <div className="downloads-page-numbers">
                      {pageNumbers.map((p, idx) =>
                        p === '...' ? (
                          <span key={`ellipsis-${idx}`} className="downloads-page-ellipsis">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            className={`downloads-page-num ${currentPage === p ? 'active' : ''}`}
                            onClick={() => handlePageChange(p)}
                            aria-current={currentPage === p ? 'page' : undefined}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      className="downloads-page-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
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
