import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileText, Search, FileCheck, BookOpen } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { productService } from '../services/productService';
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
      });
    }
    if (docs.length === 0) {
      docs.push({
        id: `${product.id}-spec-doc`,
        productId: product.id,
        productName: product.name,
        category: product.category || 'Surveillance',
        title: `${product.name} — Product Specification Document`,
        type: 'documents',
        fileUrl: `/docs/${product.id}-specifications.pdf`,
        format: 'PDF',
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
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="button button-outline button-small"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
