import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Home, Building2, Factory, ShoppingBag, GraduationCap, HeartPulse,
  ShieldCheck, ChevronRight, ArrowRight, Wrench, AlertCircle, Loader2,
  CheckCircle2, Cpu, Lock, Activity, Layers, Sparkles, Sliders, Server
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import ProductCard from '../components/products/ProductCard';
import { INDUSTRY_VERTICALS, getIndustryVertical } from '../data/industryData';
import { SOLUTION_PILLARS } from '../data/solutionsData';
import { applications } from '../data/solutions';
import { productService } from '../services/productService';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { industryImages, applicationImages } from '../data/imageLibrary';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

export default function Industries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get('type') || 'residential';
  const activeIndustry = getIndustryVertical(selectedType);

  useDocumentTitle(`${activeIndustry.name} - Industry Solutions`, activeIndustry.description);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { openQuote } = useUI();

  // Load matching live products from API
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
        if (isMounted) setError('Unable to load recommended industry products.');
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

  const activeBgImage = industryImages[activeIndustry.id] || heroImage;

  // Resolve matching use cases (operational environments)
  const matchedUseCases = applications.filter((app) =>
    (activeIndustry.useCaseIds || []).includes(app.id)
  );

  // Architecture workflow steps for deployment
  const workflowSteps = [
    {
      step: '01',
      title: 'Perimeter & Threat Assessment',
      desc: 'High-accuracy boundary scanning, vulnerability auditing, and entrance point topology mapping.'
    },
    {
      step: '02',
      title: 'High-Definition Edge Deployment',
      desc: 'Optical, AI bullet, dome cameras, and biometric sensors configured for 24/7 continuous capture.'
    },
    {
      step: '03',
      title: 'Central Storage & AI Analytics',
      desc: 'Enterprise NVR recording, encrypted storage arrays, and real-time motion classification.'
    },
    {
      step: '04',
      title: 'Command Center & Alert Dispatch',
      desc: 'Centralized VMS console, automated mobile push triggers, and guard desk monitoring.'
    }
  ];

  return (
    <>
      <PageHero
        eyebrow={`INDUSTRY SOLUTIONS • ${activeIndustry.eyebrow}`}
        title="Industry Specific Security Solutions"
        description="Tailored Honeywell technology architectures built for specific operational environments."
        image={heroImage}
      />

      <section className="section" style={{ paddingTop: '28px', paddingBottom: '70px' }}>
        <div className="container">
          {/* Breadcrumbs */}
          <div className="breadcrumbs" style={{ marginBottom: '20px', fontSize: '13px' }}>
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/industries">Industries</Link>
            <ChevronRight size={14} />
            <span style={{ color: '#1268a5', fontWeight: 600 }}>{activeIndustry.name}</span>
          </div>

          {/* Industry Horizontal Selector Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginBottom: '36px'
          }}>
            {Object.values(INDUSTRY_VERTICALS).map((ind) => {
              const Icon = ind.icon;
              const isActive = ind.id === activeIndustry.id;
              return (
                <button
                  key={ind.id}
                  onClick={() => setSearchParams({ type: ind.id })}
                  style={{
                    background: isActive ? '#1268a5' : '#ffffff',
                    color: isActive ? '#ffffff' : '#1e293b',
                    border: `1px solid ${isActive ? '#1268a5' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 6px 18px rgba(18, 104, 165, 0.22)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#1268a5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.18)' : '#f0f7ff',
                    color: isActive ? '#ffffff' : '#1268a5',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <span style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: isActive ? '#93c5fd' : '#e53935'
                    }}>
                      {ind.eyebrow.split('&')[0]}
                    </span>
                    <strong style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>
                      {ind.name.split('&')[0]}
                    </strong>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Executive Sector Showcase (Split Card) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
            marginBottom: '44px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '0'
            }}>
              {/* Left Column: Details & Technical Capabilities */}
              <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '4px 12px', marginBottom: '14px' }}>
                    {React.createElement(activeIndustry.icon, { size: 16, color: '#1268a5' })}
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {activeIndustry.eyebrow}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', lineHeight: 1.25 }}>
                    {activeIndustry.name}
                  </h2>

                  <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                    {activeIndustry.description}
                  </p>

                  <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    Core Sector Capabilities
                  </h4>

                  {/* Capabilities 2x2 Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                    marginBottom: '28px'
                  }}>
                    {activeIndustry.capabilities.map((feat, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}
                      >
                        <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Operational Metrics Pills */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '16px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    marginBottom: '28px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                      <CheckCircle2 size={16} color="#16a34a" /> 99.98% System Uptime SLA
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                      <Cpu size={16} color="#16a34a" /> Real-Time AI Event Analytics
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                      <Lock size={16} color="#16a34a" /> Encrypted NVR Local Storage
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    className="button"
                    onClick={handleConsultation}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      padding: '12px 24px',
                      borderRadius: '8px'
                    }}
                  >
                    <Wrench size={16} /> Request {activeIndustry.name.split(' ')[0]} Consultation
                  </button>
                  <Link
                    to="/products"
                    className="button outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      padding: '12px 20px',
                      borderRadius: '8px'
                    }}
                  >
                    Browse Sector Hardware <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Sector Showcase Card */}
              <div style={{
                position: 'relative',
                minHeight: '340px',
                background: '#0f172a',
                overflow: 'hidden'
              }}>
                <img
                  src={activeBgImage}
                  alt={activeIndustry.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    opacity: 0.88
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = heroImage;
                  }}
                />
                {/* Gradient Overlays */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0.1) 100%)'
                }} />

                {/* Top Status Badges */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    4K LIVE ULTRA-HD MONITORING
                  </span>

                  <span style={{
                    background: '#1268a5',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.05em'
                  }}>
                    HONEYWELL CERTIFIED
                  </span>
                </div>

                {/* Bottom Snapshot Info */}
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', color: '#ffffff' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ENTERPRISE ARCHITECTURE
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '4px 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {activeIndustry.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: 1.4, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    {activeIndustry.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment Architecture & Workflow Topology */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '40px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
                DEPLOYMENT TOPOLOGY
              </p>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {activeIndustry.name.split(' ')[0]} Architecture &amp; Workflow
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              {workflowSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#1268a5',
                      background: '#eff6ff',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}>
                      PHASE {step.step}
                    </span>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                      {step.title}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Environments / Use Cases */}
          {matchedUseCases.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
                  OPERATIONAL ENVIRONMENTS
                </p>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Specific Use-Case Deployments
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Select the specialized environment where you are installing surveillance or power architectures.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px'
              }}>
                {matchedUseCases.map((useCase) => (
                  <Link
                    key={useCase.id}
                    to={`/solutions?application=${useCase.id}`}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.04)';
                    }}
                  >
                    <div style={{ height: '140px', overflow: 'hidden', background: '#0f172a' }}>
                      <img
                        src={useCase.image || applicationImages[useCase.id] || heroImage}
                        alt={useCase.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {useCase.name}
                      </h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: '#64748b', lineHeight: 1.45, flex: 1 }}>
                        {useCase.description}
                      </p>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1268a5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        View Solution Architecture <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Architecture Solutions Pillars */}
          {activeIndustry.relatedSolutionIds && activeIndustry.relatedSolutionIds.length > 0 && (
            <div style={{ marginBottom: '40px', background: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
                ARCHITECTURE PACKAGES
              </p>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
                Related Security Architecture Pillars
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
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
                        borderRadius: '12px',
                        padding: '20px',
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
                      }}
                    >
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {sol.eyebrow}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {sol.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
                        {sol.subtitle}
                      </p>
                      <span style={{ fontSize: '12px', color: '#1268a5', fontWeight: 700, marginTop: 'auto', paddingTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Explore Solution <ArrowRight size={14} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Real Hardware Products (Live API) */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  RECOMMENDED HARDWARE
                </p>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Products for {activeIndustry.name.split(' ')[0]}
                </h3>
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

          {/* Solution Architect Consultation CTA Strip */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '36px 32px',
            color: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px'
          }}>
            <div style={{ maxWidth: '600px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px' }}>
                EXPERT CONSULTATION &amp; TENDER SUPPORT
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '6px 0 8px 0' }}>
                Plan Your {activeIndustry.name.split('&')[0]} Security Deployment
              </h3>
              <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                Speak directly with a certified Honeywell solutions architect for project bill of quantities (BOQ), site topology design, and distributor partner quotations.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                className="button light"
                onClick={handleConsultation}
                style={{
                  fontWeight: 700,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: '#1268a5',
                  borderColor: '#1268a5',
                  color: '#ffffff'
                }}
              >
                Schedule Architect Call
              </button>
              <Link
                to="/contact"
                className="button outline light-outline"
                style={{
                  fontWeight: 700,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: '#ffffff'
                }}
              >
                Contact Sales Team
              </Link>
            </div>
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


