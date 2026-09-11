import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileText, Search, FileCheck, BookOpen, Eye } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { productService } from '../services/productService';
import { generateProductPdf } from '../utils/pdfGenerator';
import heroImage from '../assets/images/smart-technology-trends.png';

export default function DownloadsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading product documents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, []);

  const allDocuments = products.flatMap((product) => {
    const docs = [];
    if (product.datasheetUrl || product.datasheet) {
      docs.push({
        id: `${product.id}-datasheet`,
        productId: product.id,
        productName: product.name,
        category: product.category || 'Surveillance',
        title: `${product.name} — Technical Datasheet`,
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
        productName: product.name,
        category: product.category || 'Surveillance',
        title: `${product.name} — Installation & User Manual`,
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
        productName: product.name,
        category: product.category || 'Surveillance',
        title: `${product.name} — Product Brochure`,
        type: 'brochures',
        fileUrl: product.brochureUrl || product.brochure,
        format: 'PDF',
        productObj: product,
      });
    }

    // Always include Certification & Quality document for EVERY product
    docs.push({
      id: `${product.id}-certification`,
      productId: product.id,
      productName: product.name,
      category: product.category || 'Surveillance',
      title: `${product.name} — Certificate of Quality & Compliance`,
      type: 'documents',
      fileUrl: product.certificationUrl || product.certification || `/docs/${product.id}-certification.pdf`,
      format: 'PDF',
      productObj: product,
    });

    if (!product.datasheetUrl && !product.datasheet) {
      docs.push({
        id: `${product.id}-spec-doc`,
        productId: product.id,
        productName: product.name,
        category: product.category || 'Surveillance',
        title: `${product.name} — Technical Specification Sheet`,
        type: 'datasheets',
        fileUrl: `/docs/${product.id}-specifications.pdf`,
        format: 'PDF',
        productObj: product,
      });
    }
    return docs;
  });

  const filteredDocs = allDocuments.filter((doc) => {
    if (activeTab !== 'all' && activeTab !== 'documents' && doc.type !== activeTab) {
      return false;
    }
    if (category && doc.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) && !doc.productName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const handleDocumentAction = (doc, mode = 'download') => {
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

  return (
    <>
      <PageHero
        eyebrow="DOWNLOADS &amp; DOCUMENTS"
        title="Downloads &amp; Document Center"
        description="Access official datasheets, user manuals, brochures, and technical specifications for Honeywell products."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="downloads-controls">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search document title or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="cctv-cameras">CCTV Cameras</option>
              <option value="solar-panels">Solar Panels</option>
              <option value="security-products">Security Products</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')}>
              All Downloads ({allDocuments.length})
            </button>
            <button className={`tab-btn ${activeTab === 'datasheets' ? 'active' : ''}`} onClick={() => handleTabChange('datasheets')}>
              Datasheets
            </button>
            <button className={`tab-btn ${activeTab === 'manuals' ? 'active' : ''}`} onClick={() => handleTabChange('manuals')}>
              User Manuals
            </button>
            <button className={`tab-btn ${activeTab === 'brochures' ? 'active' : ''}`} onClick={() => handleTabChange('brochures')}>
              Brochures
            </button>
            <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => handleTabChange('documents')}>
              Certifications &amp; Docs
            </button>
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '200px' }}>
              <p>Loading document repository...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <h3>No documents found</h3>
              <p>Try clearing your search filters or selecting a different category.</p>
            </div>
          ) : (
            <div className="downloads-grid">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="download-card">
                  <div className="download-card-icon">
                    {doc.type === 'manuals' ? <BookOpen size={24} /> : doc.type === 'datasheets' ? <FileText size={24} /> : <FileCheck size={24} />}
                  </div>
                  <div className="download-card-info">
                    <h4>{doc.title}</h4>
                    <span className="doc-category">{doc.category} • Format: {doc.format}</span>
                  </div>
                  <div className="download-card-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="button button-outline button-small"
                      onClick={() => handleDocumentAction(doc, 'view')}
                      title="Open & view PDF in browser"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      type="button"
                      className="button button-small"
                      onClick={() => handleDocumentAction(doc, 'download')}
                      title="Download official PDF file"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
