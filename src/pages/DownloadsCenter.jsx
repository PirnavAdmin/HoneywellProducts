import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download, FileText, Search, FileCheck, BookOpen, Eye,
  Loader2, AlertCircle, Monitor, Cpu, Package
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { productService } from '../services/productService';
import { softwareService } from '../services/softwareService';
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

  // State for Software — Drivers
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [errorDrivers, setErrorDrivers] = useState(null);

  // State for Software — Firmware
  const [firmware, setFirmware] = useState([]);
  const [loadingFirmware, setLoadingFirmware] = useState(true);
  const [errorFirmware, setErrorFirmware] = useState(null);

  // ── Fetch all 3 APIs in parallel on mount ──
  useEffect(() => {
    // 1. Fetch Products for documents
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);
        const data = await productService.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading products:', err);
        setErrorProducts(err.message);
      } finally {
        setLoadingProducts(false);
      }
    };

    // 2. Fetch Drivers
    const fetchDrivers = async () => {
      try {
        setLoadingDrivers(true);
        setErrorDrivers(null);
        const result = await softwareService.getAll({ softwareType: 'Driver' });
        setDrivers(result.items || []);
      } catch (err) {
        console.error('Error loading drivers:', err);
        setErrorDrivers(err.message);
      } finally {
        setLoadingDrivers(false);
      }
    };

    // 3. Fetch Firmware
    const fetchFirmware = async () => {
      try {
        setLoadingFirmware(true);
        setErrorFirmware(null);
        const result = await softwareService.getAll({ softwareType: 'Firmware' });
        setFirmware(result.items || []);
      } catch (err) {
        console.error('Error loading firmware:', err);
        setErrorFirmware(err.message);
      } finally {
        setLoadingFirmware(false);
      }
    };

    fetchProducts();
    fetchDrivers();
    fetchFirmware();
  }, []);

  // ── Build document list from products API data ──
  const allDocuments = products.flatMap((product) => {
    const docs = [];
    const productName = product.name || product.productName || product.title || 'Honeywell Product';
    const catName = getCategoryName(product);

    if (product.datasheetUrl || product.datasheet) {
      docs.push({
        id: `${product.id}-datasheet`,
        productId: product.id,
        productName,
        category: catName,
        title: `${productName} — Technical Datasheet`,
        type: 'datasheets',
        fileUrl: product.datasheetUrl || product.datasheet,
        format: 'PDF',
        productObj: product,
      });
    }
    if (product.manualUrl || product.manual) {
      docs.push({
        id: `${product.id}-manual`,
        productId: product.id,
        productName,
        category: catName,
        title: `${productName} — Installation & User Manual`,
        type: 'manuals',
        fileUrl: product.manualUrl || product.manual,
        format: 'PDF',
        productObj: product,
      });
    }
    if (product.brochureUrl || product.brochure) {
      docs.push({
        id: `${product.id}-brochure`,
        productId: product.id,
        productName,
        category: catName,
        title: `${productName} — Product Brochure`,
        type: 'brochures',
        fileUrl: product.brochureUrl || product.brochure,
        format: 'PDF',
        productObj: product,
      });
    }

    // Always include Certification & Quality document for every product
    docs.push({
      id: `${product.id}-certification`,
      productId: product.id,
      productName,
      category: catName,
      title: `${productName} — Certificate of Quality & Compliance`,
      type: 'documents',
      fileUrl: product.certificationUrl || product.certification || `/docs/${product.id}-certification.pdf`,
      format: 'PDF',
      productObj: product,
    });

    // If no datasheet URL, generate a spec doc entry
    if (!product.datasheetUrl && !product.datasheet) {
      docs.push({
        id: `${product.id}-spec-doc`,
        productId: product.id,
        productName,
        category: catName,
        title: `${productName} — Technical Specification Sheet`,
        type: 'datasheets',
        fileUrl: `/docs/${product.id}-specifications.pdf`,
        format: 'PDF',
        productObj: product,
      });
    }
    return docs;
  });

  // ── Build software items (drivers + firmware) ──
  const softwareItems = [
    ...drivers.map((item) => ({
      id: `sw-driver-${item.id}`,
      softwareId: item.id,
      productName: item.productName || 'Honeywell Product',
      category: 'Driver',
      title: item.softwareName,
      description: item.description,
      type: 'drivers',
      version: item.version,
      platform: item.platform,
      fileUrl: item.fileUrl || item.externalUrl,
      downloadCount: item.downloadCount || 0,
      releaseDate: item.releaseDate,
      isFeatured: item.isFeatured,
      softwareObj: item,
    })),
    ...firmware.map((item) => ({
      id: `sw-firmware-${item.id}`,
      softwareId: item.id,
      productName: item.productName || 'Honeywell Product',
      category: 'Firmware',
      title: item.softwareName,
      description: item.description,
      type: 'firmware',
      version: item.version,
      platform: item.platform,
      fileUrl: item.fileUrl || item.externalUrl,
      downloadCount: item.downloadCount || 0,
      releaseDate: item.releaseDate,
      isFeatured: item.isFeatured,
      softwareObj: item,
    })),
  ];

  // ── Extract unique categories from live product data ──
  const uniqueCategories = [...new Set(products.map(getCategoryName))].filter(Boolean).sort();

  // ── Filter logic based on active tab and search ──
  const getFilteredItems = () => {
    let items = [];

    if (activeTab === 'all' || activeTab === 'documents') {
      // For 'all' or 'documents', combine both documents and software
      if (activeTab === 'all') {
        items = [...allDocuments, ...softwareItems];
      } else {
        items = [...allDocuments];
      }
    } else if (activeTab === 'datasheets') {
      items = allDocuments.filter((d) => d.type === 'datasheets');
    } else if (activeTab === 'manuals') {
      items = allDocuments.filter((d) => d.type === 'manuals');
    } else if (activeTab === 'brochures') {
      items = allDocuments.filter((d) => d.type === 'brochures');
    } else if (activeTab === 'drivers') {
      items = softwareItems.filter((s) => s.type === 'drivers');
    } else if (activeTab === 'firmware') {
      items = softwareItems.filter((s) => s.type === 'firmware');
    }

    // Apply category filter
    if (category) {
      items = items.filter((item) =>
        (item.category || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((item) =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.productName || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      );
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const isLoading = loadingProducts || loadingDrivers || loadingFirmware;

  // ── Tab counts ──
  const tabCounts = {
    all: allDocuments.length + softwareItems.length,
    datasheets: allDocuments.filter((d) => d.type === 'datasheets').length,
    manuals: allDocuments.filter((d) => d.type === 'manuals').length,
    brochures: allDocuments.filter((d) => d.type === 'brochures').length,
    documents: allDocuments.length,
    drivers: softwareItems.filter((s) => s.type === 'drivers').length,
    firmware: softwareItems.filter((s) => s.type === 'firmware').length,
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleDocumentAction = (doc, mode = 'download') => {
    // If it's a software item, use the software download mechanism
    if (doc.softwareObj) {
      const swItem = doc.softwareObj;
      if (mode === 'view') {
        const url = swItem.externalUrl || swItem.fileUrl;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        softwareService.download(swItem.id, swItem.externalUrl || swItem.fileUrl);
      }
      return;
    }

    // For product documents
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

    generateProductPdf(doc.productObj || { name: doc.productName, category: doc.category, id: doc.productId }, doc.type, mode);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // ── Icon for doc/software type ──
  const getItemIcon = (item) => {
    if (item.type === 'drivers') return <Monitor size={24} />;
    if (item.type === 'firmware') return <Cpu size={24} />;
    if (item.type === 'manuals') return <BookOpen size={24} />;
    if (item.type === 'datasheets') return <FileText size={24} />;
    if (item.type === 'brochures') return <Package size={24} />;
    return <FileCheck size={24} />;
  };

  return (
    <>
      <PageHero
        eyebrow="DOWNLOADS &amp; DOCUMENTS"
        title="Downloads &amp; Document Center"
        description="Access official datasheets, user manuals, brochures, driver packages, firmware, and technical specifications for Honeywell products."
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
                placeholder="Search documents, drivers, firmware..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {/* Software-specific categories */}
              {softwareItems.length > 0 && (
                <>
                  <option value="Driver">Drivers</option>
                  <option value="Firmware">Firmware</option>
                </>
              )}
            </select>
          </div>

          {/* ── Tab Bar ── */}
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')}>
              All Downloads ({isLoading ? '...' : tabCounts.all})
            </button>
            <button className={`tab-btn ${activeTab === 'datasheets' ? 'active' : ''}`} onClick={() => handleTabChange('datasheets')}>
              Datasheets ({isLoading ? '...' : tabCounts.datasheets})
            </button>
            <button className={`tab-btn ${activeTab === 'manuals' ? 'active' : ''}`} onClick={() => handleTabChange('manuals')}>
              User Manuals ({isLoading ? '...' : tabCounts.manuals})
            </button>
            <button className={`tab-btn ${activeTab === 'brochures' ? 'active' : ''}`} onClick={() => handleTabChange('brochures')}>
              Brochures ({isLoading ? '...' : tabCounts.brochures})
            </button>
            <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => handleTabChange('documents')}>
              Certifications &amp; Docs ({isLoading ? '...' : tabCounts.documents})
            </button>
            <button className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => handleTabChange('drivers')}>
              Drivers ({loadingDrivers ? '...' : tabCounts.drivers})
            </button>
            <button className={`tab-btn ${activeTab === 'firmware' ? 'active' : ''}`} onClick={() => handleTabChange('firmware')}>
              Firmware ({loadingFirmware ? '...' : tabCounts.firmware})
            </button>
          </div>

          {/* ── Content ── */}
          {isLoading ? (
            <div className="route-loading" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
              <p style={{ margin: 0, color: '#64748b' }}>Loading documents, drivers, and firmware...</p>
            </div>
          ) : (errorProducts && errorDrivers && errorFirmware) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span>Unable to load download resources. Please try again later.</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <FileText size={48} className="empty-icon" style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ color: '#475569', marginBottom: '8px' }}>No documents found</h3>
              <p style={{ color: '#94a3b8' }}>Try clearing your search filters or selecting a different category.</p>
            </div>
          ) : (
            <div className="downloads-grid">
              {filteredItems.map((item) => (
                <div key={item.id} className="download-card">
                  <div className="download-card-icon">
                    {getItemIcon(item)}
                  </div>
                  <div className="download-card-info">
                    <h4>{item.title}</h4>
                    <span className="doc-category">
                      {item.category}
                      {item.version && ` • ${item.version}`}
                      {item.platform && ` • ${item.platform}`}
                      {!item.version && ` • Format: PDF`}
                    </span>
                    {item.description && item.softwareObj && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>
                    )}
                    {item.downloadCount > 0 && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'inline-block' }}>
                        {item.downloadCount.toLocaleString()} downloads
                        {item.releaseDate && ` • Released ${formatDate(item.releaseDate)}`}
                      </span>
                    )}
                  </div>
                  <div className="download-card-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="button button-outline button-small"
                      onClick={() => handleDocumentAction(item, 'view')}
                      title={item.softwareObj ? 'Open download page' : 'Open & view PDF in browser'}
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      type="button"
                      className="button button-small"
                      onClick={() => handleDocumentAction(item, 'download')}
                      title={item.softwareObj ? 'Download software' : 'Download official PDF file'}
                    >
                      <Download size={14} /> {item.softwareObj ? 'Download' : 'Download PDF'}
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
