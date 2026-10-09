import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ShieldCheck, ArrowRight, Eye, Wrench, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import ArchitectureDiagram from './ArchitectureDiagram';
import SolarEstimatorWidget from './SolarEstimatorWidget';
import ProductCard from '../products/ProductCard';
import { SOLUTION_PILLARS } from '../../data/solutionsData';
import { INDUSTRY_VERTICALS } from '../../data/industryData';
import { applications } from '../../data/solutions';
import { productService } from '../../services/productService';
import { useUI } from '../../context/UIContext';
import heroImage from '../../assets/images/smart-technology-trends.png';

export default function SolutionDetailView({ activeSolutionId = 'security-surveillance', onSelectSolution }) {
  const pillar = SOLUTION_PILLARS[activeSolutionId] || SOLUTION_PILLARS['security-surveillance'];
  const { openQuote } = useUI();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  // Fetch live real products for the active solution's categoryIds
  useEffect(() => {
    let isMounted = true;
    async function loadSolutionProducts() {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);
        const data = await productService.getAll();
        if (!isMounted) return;

        const allList = Array.isArray(data) ? data : [];
        const categoryKeys = pillar.categoryIds || [];

        const filtered = allList.filter((p) => {
          const catId = String(p.categoryId || '').toLowerCase();
          const catName = String(p.category || '').toLowerCase();
          const pName = String(p.name || '').toLowerCase();
          const pId = String(p.id || '').toLowerCase();

          return categoryKeys.some((cId) => {
            const cleanCId = cId.toLowerCase();
            return catId.includes(cleanCId) || catName.includes(cleanCId.replace(/-/g, ' ')) || pId.includes(cleanCId);
          });
        });

        setProducts(filtered.slice(0, 4));
      } catch (err) {
        console.error('Error fetching products for solution:', err);
        if (isMounted) setErrorProducts('Unable to load recommended products.');
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }
    loadSolutionProducts();
    return () => { isMounted = false; };
  }, [activeSolutionId, pillar.categoryIds]);

  // Pre-fill context for Quote modal
  const handleConsultation = () => {
    openQuote({
      name: `${pillar.title} Consultation`,
      solution: pillar.title,
      description: pillar.subtitle,
    });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ marginBottom: '16px' }}>
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/solutions">Solutions</Link>
        <ChevronRight size={14} />
        <span>{pillar.title}</span>
      </div>

      {/* Reusable Solution Switcher Bar */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '28px',
        padding: '12px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}>
        {Object.values(SOLUTION_PILLARS).map((item) => {
          const isActive = item.id === pillar.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSolution(item.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderColor: isActive ? '#1268a5' : '#cbd5e1',
                background: isActive ? '#1268a5' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
              }}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Solution Overview Split Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
      }}>
        <p style={{ fontSize: '12px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px 0' }}>
          {pillar.eyebrow}
        </p>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
          {pillar.title}
        </h2>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px 0', maxWidth: '800px' }}>
          {pillar.description}
        </p>

        {/* Verified Capabilities Badges */}
        {pillar.verifiedCapabilities && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Verified Solution Capabilities
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {pillar.verifiedCapabilities.map((cap, idx) => (
                <span key={idx} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
                  fontSize: '13px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px'
                }}>
                  <ShieldCheck size={16} /> {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="button" onClick={handleConsultation} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <Wrench size={16} /> Request {pillar.title} Consultation
        </button>
      </div>

      {/* System Architecture Topology Diagram */}
      <ArchitectureDiagram steps={pillar.architecture} title={`${pillar.title} Topology`} />

      {/* Render Indicative Solar Solution Estimator Widget for Solar Solutions */}
      {pillar.id === 'solar-solutions' && (
        <SolarEstimatorWidget />
      )}

      {/* Recommended Products (Live from productService API) */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>RECOMMENDED HARDWARE</p>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Products for {pillar.title}</h3>
          </div>
          <Link to="/products" style={{ fontSize: '14px', fontWeight: 700, color: '#1268a5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            View All Products <ChevronRight size={16} />
          </Link>
        </div>

        {loadingProducts ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', gap: '10px', color: '#64748b' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
            <span>Loading recommended products from API...</span>
          </div>
        ) : errorProducts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
            <AlertCircle size={18} /> {errorProducts}
          </div>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
            No specific products currently categorized for this solution. Explore our full catalog for tailored hardware options.
          </div>
        )}
      </div>

      {/* Recommended Industries */}
      <div style={{ marginBottom: '40px', background: '#f8fafc', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>INDUSTRY VERTICALS</p>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Recommended Industries</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {pillar.recommendedIndustryIds.map((indId) => {
            const ind = INDUSTRY_VERTICALS[indId];
            if (!ind) return null;
            const Icon = ind.icon;
            return (
              <Link
                key={ind.id}
                to={`/industries?type=${ind.id}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '18px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#1268a5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{ind.name.split('&')[0]}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    Explore Vertical <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recommended Environments / Applications */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>APPLICATION FINDER</p>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Choose Your Environment</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {pillar.environmentSubtitle || 'Select the environment where you are deploying security solutions.'}
          </p>
        </div>

        {applications.filter((app) => (pillar.applicationIds || []).includes(app.id)).length > 0 ? (
          <div className="application-grid">
            {applications
              .filter((app) => (pillar.applicationIds || []).includes(app.id))
              .map((application) => (
                <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card">
                  <img
                    src={application.image || heroImage}
                    alt={`${application.name} security application`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = heroImage;
                    }}
                  />
                  <div>
                    <span>{application.name}</span>
                    <p>{application.description}</p>
                    <b>View recommendation <ArrowRight size={16} /></b>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
            No specific environments are currently mapped to this solution.
          </div>
        )}
      </div>
    </div>
  );
}
