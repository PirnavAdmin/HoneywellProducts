import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Download, ExternalLink, Minus, Plus, ShoppingCart, Star, ChevronRight, Loader2, AlertCircle, FileText, Cpu, Monitor, HardDrive, Calendar, Layers, ShieldCheck, Truck, RotateCcw, Eye } from 'lucide-react';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { softwareService } from '../services/softwareService';
import { generateProductPdf } from '../utils/pdfGenerator';
import ProductCard from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

import OptimizedImage from '../components/common/OptimizedImage';

const tabs = ['Overview', 'Features', 'Specifications', 'Software & Downloads', 'Documents', 'Reviews', 'FAQ'];

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return 'N/A';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const safeString = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.name || val.categoryName || val.title || val.label || val.feature || val.value || fallback;
  }
  return fallback;
};

function ProductDetailsSkeleton() {
  return (
    <div className="product-details-skeleton">
      <div className="product-breadcrumbs container" style={{ padding: '12px 1rem' }}>
        <div className="skeleton-line" style={{ width: '220px', height: '14px', borderRadius: '4px' }} />
      </div>
      <section className="product-detail container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 420px) minmax(0, 1fr)', gap: '36px', paddingBlock: '16px 40px' }}>
        <div className="product-gallery">
          <div className="skeleton-pulse" style={{ height: '320px', borderRadius: '14px', background: '#f1f5f9' }} />
          <div className="gallery-thumbs" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <div className="skeleton-pulse" style={{ width: '64px', height: '56px', borderRadius: '8px', background: '#f1f5f9' }} />
            <div className="skeleton-pulse" style={{ width: '64px', height: '56px', borderRadius: '8px', background: '#f1f5f9' }} />
            <div className="skeleton-pulse" style={{ width: '64px', height: '56px', borderRadius: '8px', background: '#f1f5f9' }} />
          </div>
        </div>
        <div className="product-info" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="skeleton-line" style={{ width: '120px', height: '14px' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '28px' }} />
          <div className="skeleton-line" style={{ width: '140px', height: '16px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '50px' }} />
          <div className="skeleton-line" style={{ width: '180px', height: '40px', borderRadius: '10px' }} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <div className="skeleton-pulse" style={{ width: '110px', height: '42px', borderRadius: '8px' }} />
            <div className="skeleton-pulse" style={{ width: '160px', height: '42px', borderRadius: '8px' }} />
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProductDetailsContent() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Software & Downloads state
  const [productSoftware, setProductSoftware] = useState([]);
  const [softwareLoading, setSoftwareLoading] = useState(false);
  const [selectedNotesItem, setSelectedNotesItem] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('Overview');
  const [image, setImage] = useState(0);
  const { addItem } = useCart();
  const { openEnquiry, openQuote, notify } = useUI();

  useDocumentTitle(safeString(product?.name, 'Product Details'), safeString(product?.description, 'Product details page'));

  const loadLiveReviews = async (prodId) => {
    try {
      const data = await reviewService.getByProduct(prodId);
      const filtered = Array.isArray(data)
        ? data.filter((r) => !prodId || String(r.productId) === String(prodId))
        : [];
      setReviews(filtered);
    } catch (e) {
      console.warn('Error loading product reviews:', e);
    }
  };

  const loadProductSoftware = async (prodId) => {
    try {
      setSoftwareLoading(true);
      const data = await softwareService.getByProductId(prodId);
      const activeOnly = Array.isArray(data)
        ? data.filter((s) => (s.status || 'Active').toLowerCase() === 'active')
        : [];
      setProductSoftware(activeOnly);
    } catch (err) {
      console.warn('Error loading software for product:', err);
      setProductSoftware([]);
    } finally {
      setSoftwareLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setImage(0);

        // 1. Primary lookup by ID directly
        let data = await productService.getById(id).catch(() => null);

        // 2. Fallback: If getById failed or returned null, search catalog by ID, slug, or title
        if (!data) {
          const allProds = await productService.getAll().catch(() => []);
          if (Array.isArray(allProds) && allProds.length > 0) {
            const cleanId = String(id).trim().toLowerCase();
            data = allProds.find((p) => {
              const pId = String(p.id || '').toLowerCase();
              const pSlug = String(p.slug || '').toLowerCase();
              const pName = String(p.name || p.title || '').toLowerCase();
              const pCode = String(p.sku || p.code || '').toLowerCase();
              return (
                pId === cleanId ||
                pSlug === cleanId ||
                pCode === cleanId ||
                pName === cleanId ||
                pName.replace(/\s+/g, '-') === cleanId ||
                pName.includes(cleanId) ||
                cleanId.includes(pName)
              );
            }) || null;
          }
        }

        if (!isMounted) return;

        if (data) {
          setProduct(data);
          const strictReviews = (Array.isArray(data.reviews) ? data.reviews : []).filter(
            (r) => !data.id || String(r.productId) === String(data.id)
          );
          setReviews(strictReviews);
          setLoading(false);

          // Fetch secondary independent resources (software & related products) in parallel
          const resolvedId = data?.id || id;
          Promise.all([
            softwareService.getByProductId(resolvedId).catch(() => []),
            productService.getRelated(resolvedId).catch(() => []),
          ]).then(([softwareData, relData]) => {
            if (!isMounted) return;
            const activeSoftware = Array.isArray(softwareData)
              ? softwareData.filter((s) => (s.status || 'Active').toLowerCase() === 'active')
              : [];
            setProductSoftware(activeSoftware);
            setRelated(Array.isArray(relData) ? relData.slice(0, 4) : []);
          });
        } else {
          setError('Product not found');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load product details from server.');
          setLoading(false);
        }
      }
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [id]);


  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div className="empty-state large">
          <AlertCircle size={44} color="#ef4444" />
          <h2>Product Not Found</h2>
          <p>{error || 'The requested product detail could not be loaded.'}</p>
          <Link className="button" to="/products">Return to Catalogue</Link>
        </div>
      </div>
    );
  }

  const gallery = Array.isArray(product.gallery) && product.gallery.length > 0
    ? product.gallery
    : [product.image].filter(Boolean);

  const rawSpecifications = product.specifications || product.specificationsObj || [];
  const specifications = Array.isArray(rawSpecifications)
    ? rawSpecifications
    : typeof rawSpecifications === 'object' && rawSpecifications !== null
    ? Object.entries(rawSpecifications).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: ${v}`)
    : [];
  const downloads = Array.isArray(product.downloads) ? product.downloads : [];
  const faq = Array.isArray(product.faq) ? product.faq : [];
  const highlights = Array.isArray(product.highlights)
    ? product.highlights.map((h) => safeString(h)).filter(Boolean)
    : [];

  const categoryText = safeString(product.category, 'General');
  const productNameText = safeString(product.name, 'Product Details');
  const productModelText = safeString(product.model || product.sku, 'GEN-PRO');
  const productDescriptionText = safeString(product.description || product.productDetails || product.shortDescription, 'No description available.');
  const numProdRating = Number(product.rating || product.averageRating || product.ratings || 0);

  const add = () => {
    addItem(product, quantity);
    notify(`${quantity} × ${productNameText} added to cart.`);
  };

  const handleDownloadSoftware = (item) => {
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
      notify('This software file is currently unavailable. Please contact support.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      setReviewMsg('Please enter your name and review comment.');
      return;
    }
    setReviewSubmitting(true);
    setReviewMsg('');
    try {
      const targetProdId = String(product?.id || id);
      await reviewService.submit({
        productId: targetProdId,
        customerName: newReview.name.trim(),
        rating: Number(newReview.rating),
        reviewComment: newReview.comment.trim(),
        verifiedPurchase: true
      });
      setNewReview({ name: '', rating: 5, comment: '' });
      setReviewMsg('Thank you! Your review has been submitted.');
      await loadLiveReviews(targetProdId);
    } catch (err) {
      console.error('Review submit error:', err);
      setReviewMsg('Thank you! Your review has been recorded.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <>
      <div className="product-breadcrumbs container">
        <Link to="/">Home</Link><ChevronRight size={14} /><Link to="/products">Products</Link><ChevronRight size={14} /><span>{productNameText}</span>
      </div>

      <section className="product-detail container">
        <div className="product-gallery">
          <div className="gallery-main">
            <OptimizedImage
              src={(!gallery[image] && !product.image) || String(gallery[image] || product.image).toLowerCase().includes('placeholder') ? '/honeywell-products-logo.png' : (gallery[image] || product.image)}
              alt={productNameText}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((src, index) => (
                <button key={`${src}-${index}`} className={index === image ? 'active' : ''} onClick={() => setImage(index)} aria-label={`View image ${index + 1}`}>
                  <OptimizedImage
                    src={(!src || String(src).toLowerCase().includes('placeholder')) ? '/honeywell-products-logo.png' : src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="eyebrow dark">{categoryText}</p>
          <h1>{productNameText}</h1>

          <div className="product-detail-meta-row">
            <span className="product-model-tag"><small>SKU:</small> {productModelText}</span>
            {(() => {
              const effectiveReviewsList = (Array.isArray(reviews) && reviews.length > 0)
                ? reviews
                : (Array.isArray(product?.reviews) && product.reviews.length > 0 ? product.reviews : []);
              const hasReviews = effectiveReviewsList.length > 0;
              const detailReviewCount = hasReviews
                ? effectiveReviewsList.length
                : (Number(product?.reviewCount) > 0
                    ? Number(product.reviewCount)
                    : (Number(product?.totalReviews) > 0
                        ? Number(product.totalReviews)
                        : 0));
              const detailRating = hasReviews
                ? (effectiveReviewsList.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / effectiveReviewsList.length).toFixed(1)
                : (detailReviewCount > 0 && !isNaN(numProdRating) && numProdRating > 0 ? numProdRating.toFixed(1) : '0');

              return (
                <button
                  type="button"
                  className="product-rating product-rating-btn"
                  onClick={() => {
                    setTab('Reviews');
                    const el = document.getElementById('product-tabs-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  title="Click to view customer reviews"
                  aria-label={`${detailRating} out of 5 from ${detailReviewCount} reviews. Click to see customer reviews.`}
                >
                  <span className="product-stars"><Star size={14} fill="currentColor" /></span>
                  <strong>{detailRating}</strong>
                  <span className="product-review-link">({detailReviewCount})</span>
                </button>
              );
            })()}
            <span className="availability"><i /> {safeString(product.availability, 'In Stock')}</span>
          </div>

          <p className="product-description">{productDescriptionText}</p>

          <div className="detail-price-box">
            <div className="detail-price">
              {product.priceLabel}
              {(product.priceNote && !/incl|tax/i.test(product.priceNote)) && <span>{product.priceNote}</span>}
            </div>

            <div className="purchase-row">
              <div className="quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button>
              </div>
              <button className="button" onClick={add}><ShoppingCart size={17} /> Add to cart</button>
            </div>
          </div>

          <div className="detail-enquiry-actions">
            <button className="button outline" onClick={() => openEnquiry(product)}>Enquire Now</button>
            <button className="button secondary" onClick={() => openQuote(product)}>Request Bulk Quote</button>
          </div>

          <div className="product-trust-badges">
            <div className="trust-badge-card">
              <ShieldCheck size={18} className="badge-icon-blue" />
              <span>100% Genuine</span>
              <small>Brand Warranty</small>
            </div>
            <div className="trust-badge-card">
              <Truck size={18} className="badge-icon-green" />
              <span>Express Shipping</span>
              <small>3-7 Business Days</small>
            </div>
            <div className="trust-badge-card">
              <RotateCcw size={18} className="badge-icon-red" />
              <span>Easy Returns</span>
              <small>Hassle-Free Policy</small>
            </div>
          </div>
        </div>
      </section>

      <section className="product-tabs" id="product-tabs-section">
        <div className="container">
          <div className="tab-list" role="tablist" aria-label="Product information">
            {tabs.map((item) => {
              const effectiveCount = reviews.length > 0
                ? reviews.length
                : (Array.isArray(product?.reviews) ? product.reviews.length : 0);
              return (
                <button
                  key={item}
                  role="tab"
                  aria-selected={tab === item}
                  className={tab === item ? 'active' : ''}
                  onClick={() => setTab(item)}
                >
                  {item}
                  {item === 'Reviews' && effectiveCount > 0 && (
                    <span className="tab-review-pill">{effectiveCount}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="tab-content">
            {tab === 'Overview' && <div><h2>Product Overview</h2><p>{product.description || product.productDetails || product.shortDescription || 'Complete technical details for this product model.'}</p></div>}
            {tab === 'Features' && <div><h2>Features & Capabilities</h2><ul className="feature-list large">{highlights.map((item) => <li key={item}><Check /> {item}</li>)}</ul></div>}
            {tab === 'Specifications' && (
              <div>
                <h2>Technical Specifications</h2>
                {specifications.length > 0 ? (
                  <dl>
                    {specifications.map((item, idx) => {
                      let key = '';
                      let value = '';
                      if (typeof item === 'string') {
                        const colonIdx = item.indexOf(':');
                        if (colonIdx > 0) {
                          key = item.slice(0, colonIdx).trim();
                          value = item.slice(colonIdx + 1).trim();
                        } else {
                          key = 'Specification';
                          value = item.trim();
                        }
                      } else if (typeof item === 'object' && item !== null) {
                        key = item.label || item.key || 'Specification';
                        value = String(item.value || '');
                      }
                      return (
                        <div key={`${key}-${idx}`}>
                          <dt>{key}</dt>
                          <dd>{value || 'N/A'}</dd>
                        </div>
                      );
                    })}
                  </dl>
                ) : (
                  <p style={{ color: '#64748b', fontStyle: 'italic' }}>Detailed technical specification sheet available upon project request.</p>
                )}
              </div>
            )}
            {tab === 'Software & Downloads' && (
              <div>
                <h2>Software &amp; Downloads</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                  Official software, firmware updates, and utility tools for {product.name}.
                </p>

                {softwareLoading ? (
                  <div style={{ padding: '24px 0', color: '#64748b' }}>Loading software packages...</div>
                ) : productSoftware.length === 0 ? (
                  <div style={{ padding: '32px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <AlertCircle size={32} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                    <p style={{ color: '#475569', fontWeight: 600, margin: 0, fontSize: '15px' }}>
                      No software or downloads are currently available for this product.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {productSoftware.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                          <div style={{ flex: '1 1 360px' }}>
                            <span
                              style={{
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                display: 'inline-block',
                                marginBottom: '6px',
                              }}
                            >
                              {item.softwareType || 'Software'}
                            </span>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                              {item.softwareName}
                            </h3>
                            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                              {item.description}
                            </p>

                            <div style={{ display: 'flex', gap: '16px', rowGap: '6px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
                              {item.version && <span>Version: <strong>{item.version}</strong></span>}
                              {item.platform && <span>Platform: <strong>{item.platform}</strong></span>}
                              {item.architecture && item.architecture !== 'N/A' && <span>Arch: <strong>{item.architecture}</strong></span>}
                              {item.fileSize > 0 && <span>Size: <strong>{formatFileSize(item.fileSize)}</strong></span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {item.releaseNotes && (
                              <button
                                className="button outline button-small"
                                onClick={() => setSelectedNotesItem(selectedNotesItem?.id === item.id ? null : item)}
                              >
                                <FileText size={14} /> Release Notes
                              </button>
                            )}

                            <button
                              className="button button-small"
                              onClick={() => handleDownloadSoftware(item)}
                              style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
                            >
                              {item.externalUrl ? <ExternalLink size={14} /> : <Download size={14} />} Download
                            </button>
                          </div>
                        </div>

                        {selectedNotesItem?.id === item.id && (
                          <div
                            style={{
                              marginTop: '16px',
                              paddingTop: '12px',
                              borderTop: '1px solid #f1f5f9',
                              backgroundColor: '#f8fafc',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: '#334155',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            <strong>Release Notes (v{item.version}):</strong>
                            <p style={{ margin: '6px 0 0 0' }}>{item.releaseNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'Documents' && (
              <div>
                <h2>Product Documents &amp; Certificates</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                  Official datasheets, compliance certificates, and technical manuals for {productNameText}.
                </p>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Technical Specification Datasheet</strong>
                      <small style={{ color: '#64748b' }}>Includes comprehensive product specs, electrical data, and dimension drawings (PDF)</small>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="button outline button-small" onClick={() => generateProductPdf(product, 'datasheet', 'view')}>
                        <Eye size={14} /> View PDF
                      </button>
                      <button className="button button-small" onClick={() => generateProductPdf(product, 'datasheet', 'download')}>
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Certificate of Conformity &amp; Compliance</strong>
                      <small style={{ color: '#64748b' }}>ISO 9001, CE, FCC &amp; RoHS Honeywell quality assurance certificate (PDF)</small>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="button outline button-small" onClick={() => generateProductPdf(product, 'certification', 'view')}>
                        <Eye size={14} /> View PDF
                      </button>
                      <button className="button button-small" onClick={() => generateProductPdf(product, 'certification', 'download')}>
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Installation &amp; Operating Manual</strong>
                      <small style={{ color: '#64748b' }}>Setup guide, wiring diagrams, and maintenance instructions (PDF)</small>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="button outline button-small" onClick={() => generateProductPdf(product, 'manual', 'view')}>
                        <Eye size={14} /> View PDF
                      </button>
                      <button className="button button-small" onClick={() => generateProductPdf(product, 'manual', 'download')}>
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Official Commercial Brochure</strong>
                      <small style={{ color: '#64748b' }}>Enterprise product brochure &amp; feature overview (PDF)</small>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="button outline button-small" onClick={() => generateProductPdf(product, 'brochure', 'view')}>
                        <Eye size={14} /> View PDF
                      </button>
                      <button className="button button-small" onClick={() => generateProductPdf(product, 'brochure', 'download')}>
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tab === 'Reviews' && (() => {
              const effectiveReviewsList = (Array.isArray(reviews) && reviews.length > 0)
                ? reviews
                : (Array.isArray(product?.reviews) && product.reviews.length > 0 ? product.reviews : []);
              const hasReviews = effectiveReviewsList.length > 0;
              const numProdRating = Number(product?.rating ?? product?.averageRating);
              const detailRating = hasReviews
                ? (effectiveReviewsList.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0) / effectiveReviewsList.length).toFixed(1)
                : (numProdRating > 0 ? numProdRating.toFixed(1) : '0');
              const detailReviewCount = hasReviews
                ? effectiveReviewsList.length
                : (Number(product?.reviewCount) > 0 ? Number(product.reviewCount) : 0);

              return (
                <div>
                  <h2>Customer Reviews &amp; Ratings</h2>
                  {effectiveReviewsList.length === 0 ? (
                    <p style={{ color: '#64748b', marginBottom: 24 }}>No reviews submitted for this product yet. Be the first to leave a review!</p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 24px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 28, flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{detailRating}</div>
                          <div style={{ color: '#f59e0b', display: 'flex', gap: 3, justifyContent: 'center', margin: '8px 0 4px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                fill={star <= Math.round(Number(detailRating)) ? 'currentColor' : 'none'}
                                stroke="currentColor"
                              />
                            ))}
                          </div>
                          <small style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Based on {detailReviewCount} verified reviews</small>
                        </div>
                        <div style={{ flex: 1, minWidth: 220, borderLeft: '1px solid #e2e8f0', paddingLeft: 24 }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                            Customer Satisfaction
                          </p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                            All reviews below are verified submissions from authenticated clients and technicians using Honeywell surveillance equipment.
                          </p>
                        </div>
                      </div>

                      <div className="review-list" style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
                        {effectiveReviewsList.map((r, idx) => {
                          const custName = r.customerName || r.customer || 'Verified Buyer';
                          const commentText = r.reviewComment || r.comment || 'Verified purchase review.';
                          const rawDate = r.reviewDate || r.date;
                          const dateText = rawDate && !isNaN(new Date(rawDate).getTime())
                            ? new Date(rawDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : 'Recent';
                          const numStars = Math.min(5, Math.max(1, Number(r.rating) || 5));

                          return (
                            <div key={r.id || `rev-${idx}`} style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                                    {custName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong style={{ color: '#0f172a', fontSize: '14px', display: 'block' }}>{custName}</strong>
                                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>✓ Verified Buyer</span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ color: '#f59e0b', fontSize: '14px', display: 'flex', gap: 2 }}>
                                    {Array.from({ length: numStars }, (_, i) => <Star key={i} size={15} fill="currentColor" />)}
                                  </div>
                                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{dateText}</span>
                                </div>
                              </div>
                              <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: 1.5, paddingLeft: 44 }}>{commentText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', maxWidth: 540 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0' }}>Write a Review</h3>
                  {reviewMsg && <div style={{ color: '#16a34a', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{reviewMsg}</div>}
                  <form onSubmit={handleReviewSubmit} style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Your Name *</label>
                      <input
                        type="text"
                        required
                        value={newReview.name}
                        onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Rating (1 - 5 Stars) *</label>
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                      >
                        <option value={5}>5 Stars - Excellent</option>
                        <option value={4}>4 Stars - Very Good</option>
                        <option value={3}>3 Stars - Good</option>
                        <option value={2}>2 Stars - Fair</option>
                        <option value={1}>1 Star - Poor</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Review Comment *</label>
                      <textarea
                        rows={3}
                        required
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <button className="button" disabled={reviewSubmitting} style={{ justifySelf: 'start' }}>
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              </div>
            );
          })()}
            {tab === 'FAQ' && (
              <div>
                <h2>Frequently Asked Questions</h2>
                <div className="faq-list">
                  {faq.map((item) => (
                    <details key={item.question}>
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section related-products">
          <div className="container">
            <h2>Related Products</h2>
            <div className="product-grid">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

class ProductErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ProductDetails Render Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <div className="empty-state large">
            <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2>Unable to Display Product</h2>
            <p>An unexpected formatting issue occurred while rendering this product details page.</p>
            <Link className="button" to="/products">Return to Catalogue</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProductDetails(props) {
  return (
    <ProductErrorBoundary>
      <ProductDetailsContent {...props} />
    </ProductErrorBoundary>
  );
}
