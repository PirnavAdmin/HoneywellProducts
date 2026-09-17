import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Home, Building2, Factory, ShoppingBag, GraduationCap, HeartPulse, ShieldCheck, Eye, ChevronRight, ArrowRight, Wrench, AlertCircle, Loader2 } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import ProductCard from '../components/products/ProductCard';
import { INDUSTRY_VERTICALS, getIndustryVertical } from '../data/industryData';
import { SOLUTION_PILLARS } from '../data/solutionsData';
import { productService } from '../services/productService';
import { useUI } from '../context/UIContext';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

export default function Industries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get('type') || 'residential';
  const activeIndustry = getIndustryVertical(selectedType);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { openQuote } = useUI();

  useEffect(() => {
    let isMounted = true;
    async function loadRelevantProducts() {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getAll();
        if (!isMounted) return;

        const allList = Array.isArray(data) ? data : [];
        const industryCategoryKeys = activeIndustry.categoryIds || [];
        const industryKeywords = activeIndustry.keywords || [];

        const filtered = allList.filter((p) => {
          const catId = String(p.categoryId || '').toLowerCase();
          const catName = String(p.category || '').toLowerCase();
          const subCat = String(p.subcategoryId || p.productType || '').toLowerCase();
          const pName = String(p.name || '').toLowerCase();
          const pKeywords = Array.isArray(p.keywords) ? p.keywords.join(' ').toLowerCase() : String(p.keywords || '').toLowerCase();
          const pId = String(p.id || '').toLowerCase();

          const matchesCategory = industryCategoryKeys.some((cId) => {
            const cleanCId = cId.toLowerCase();
            return catId.includes(cleanCId) || catName.includes(cleanCId.replace(/-/g, ' ')) || pId.includes(cleanCId);
          });

          const matchesKeyword = industryKeywords.some((kw) => {
            const cleanKw = kw.toLowerCase();
            return catName.includes(cleanKw) || pName.includes(cleanKw) || subCat.includes(cleanKw) || pKeywords.includes(cleanKw);
          });

          return matchesCategory || matchesKeyword;
        });

        setProducts(filtered.slice(0, 4));
      } catch (err) {
        console.error('Error fetching products for industry:', err);
        if (isMounted) setError('Unable to load industry products.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRelevantProducts();
    return () => { isMounted = false; };
  }, [selectedType, activeIndustry.categoryIds, activeIndustry.keywords]);

  const handleConsultation = () => {
    openQuote({
      name: `${activeIndustry.name} Consultation`,
      industry: activeIndustry.name,
      description: activeIndustry.subtitle,
    });
  };

  return (
    <>
      <PageHero
        eyebrow="INDUSTRIES &amp; VERTICALS"
        title="Industry Specific Security Solutions"
        description="Tailored Honeywell technology architectures built for specific operational environments."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          {/* Breadcrumbs */}
          <div className="breadcrumbs" style={{ marginBottom: '20px' }}>
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/industries">Industries</Link>
            <ChevronRight size={14} />
            <span>{activeIndustry.name}</span>
          </div>

          {/* Reusable Industry Switcher */}
          <div className="industry-selector-grid">
            {Object.values(INDUSTRY_VERTICALS).map((ind) => {
              const Icon = ind.icon;
              const isActive = ind.id === activeIndustry.id;
              return (
                <button
                  key={ind.id}
                  className={`industry-select-card ${isActive ? 'active' : ''}`}
                  onClick={() => setSearchParams({ type: ind.id })}
                >
                  <Icon size={24} className="ind-card-icon" />
                  <span>{ind.name.split('&')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Industry Details Banner */}
          <div className="industry-details-box" style={{ marginBottom: '40px' }}>
            <div className="ind-details-content">
              <div className="ind-header-badge">
                {React.createElement(activeIndustry.icon, { size: 28 })}
                <h2>{activeIndustry.name}</h2>
              </div>
              <p className="ind-description">{activeIndustry.description}</p>

              <h4>Key Capabilities &amp; Features</h4>
              <ul className="ind-feature-list">
                {activeIndustry.capabilities.map((feat, idx) => (
                  <li key={idx}><ShieldCheck size={16} /> {feat}</li>
                ))}
              </ul>

              <div className="ind-actions">
                <button className="button" onClick={handleConsultation} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <Wrench size={16} /> Request {activeIndustry.name.split(' ')[0]} Consultation
                </button>
              </div>
            </div>
          </div>

          {/* Related Solutions Pillars */}
          {activeIndustry.relatedSolutionIds && activeIndustry.relatedSolutionIds.length > 0 && (
            <div style={{ marginBottom: '40px', background: '#f8fafc', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>ARCHITECTURE PILLARS</p>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Related Security Solutions</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {activeIndustry.relatedSolutionIds.map((solId) => {
                  const sol = SOLUTION_PILLARS[solId];
                  if (!sol) return null;
                  return (
                    <Link
                      key={sol.id}
                      to={`/solutions?solution=${sol.id}`}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '18px',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase' }}>{sol.eyebrow}</span>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{sol.title}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{sol.subtitle}</p>
                      <span style={{ fontSize: '12px', color: '#1268a5', fontWeight: 700, marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Explore Solution <ArrowRight size={13} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Real Products (Live API) */}
          <div className="industry-products-section mt-5" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>RECOMMENDED HARDWARE</p>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Products for {activeIndustry.name.split(' ')[0]}</h3>
              </div>
              <Link to="/products" style={{ fontSize: '14px', fontWeight: 700, color: '#1268a5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Browse Full Catalog <ChevronRight size={16} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', gap: '10px', color: '#64748b' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
                <span>Loading recommended products from API...</span>
              </div>
            ) : error ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
                <AlertCircle size={18} /> {error}
              </div>
            ) : products.length > 0 ? (
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id || product.slug} product={product} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
                No specific hardware products currently categorized for {activeIndustry.name}. Explore our full product catalog for tailored options.
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

