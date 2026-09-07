import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Home, Building2, Factory, ShoppingBag, GraduationCap, HeartPulse, ShieldCheck, Eye } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { productService } from '../services/productService';
import { useUI } from '../context/UIContext';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

const industryList = [
  {
    id: 'residential',
    name: 'Residential Security & Solar',
    icon: Home,
    description: 'Comprehensive home monitoring, outdoor smart perimeter surveillance, and off-grid solar power for villas and residential complexes.',
    features: ['24/7 Smart Motion Surveillance', 'Off-Grid & Hybrid Solar Power', 'Mobile App Remote Control', 'Tamper-proof Storage & Cloud Backup']
  },
  {
    id: 'commercial',
    name: 'Commercial & Office Buildings',
    icon: Building2,
    description: 'Enterprise access control, multi-floor IP camera networks, license plate recognition, and centralized security monitoring centers.',
    features: ['Biometric & Card Access Control', 'Multi-Site Central Monitoring', 'Visitor & Contractor Management', 'High-Definition Dome & Bullet Cameras']
  },
  {
    id: 'industrial',
    name: 'Industrial & Manufacturing Facilities',
    icon: Factory,
    description: 'Ruggedized explosion-proof surveillance, high-efficiency industrial solar arrays, thermal monitoring, and perimeter defense.',
    features: ['Thermal & Intrusion Detection', 'Weatherproof & Explosion-proof Housing', 'Heavy Duty Industrial Solar Solutions', '24/7 Perimeter Line Crossing Alerts']
  },
  {
    id: 'retail',
    name: 'Retail Stores & Supermarkets',
    icon: ShoppingBag,
    description: 'Loss prevention, customer heatmapping, POS transaction video integration, and store traffic analytics.',
    features: ['Loss Prevention & Theft Deterrence', 'Customer Flow & Heatmap Analytics', 'Discreet Dome Camera Layouts', 'Remote Store Management']
  },
  {
    id: 'education',
    name: 'Schools & University Campuses',
    icon: GraduationCap,
    description: 'Campus-wide emergency alerts, wide-angle indoor/outdoor coverage, gate access barriers, and student safety surveillance.',
    features: ['Campus-Wide High Def Coverage', 'Automated Gate & Vehicle Access', 'Emergency Panic Alert Systems', 'High-Capacity Video Storage']
  },
  {
    id: 'healthcare',
    name: 'Hospitals & Healthcare Facilities',
    icon: HeartPulse,
    description: 'Strict patient privacy compliance, pharmacy security access control, thermal fever scanning, and emergency entrance monitoring.',
    features: ['Pharmacy & Lab Restricted Access', 'HIPAA/Privacy Compliant Layouts', '24/7 Ward & Corridor Surveillance', 'Uninterrupted Backup Power Integration']
  }
];

export default function Industries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get('type') || 'residential';
  const activeIndustry = industryList.find((i) => i.id === selectedType) || industryList[0];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openQuote, openEnquiry } = useUI();

  useEffect(() => {
    async function loadRelevantProducts() {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setProducts(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (err) {
        console.error('Error fetching products for industry:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRelevantProducts();
  }, [selectedType]);

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
          <div className="industry-selector-grid">
            {industryList.map((ind) => {
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

          <div className="industry-details-box">
            <div className="ind-details-content">
              <div className="ind-header-badge">
                {React.createElement(activeIndustry.icon, { size: 28 })}
                <h2>{activeIndustry.name}</h2>
              </div>
              <p className="ind-description">{activeIndustry.description}</p>

              <h4>Key Capabilities &amp; Features</h4>
              <ul className="ind-feature-list">
                {activeIndustry.features.map((feat, idx) => (
                  <li key={idx}><ShieldCheck size={16} /> {feat}</li>
                ))}
              </ul>

              <div className="ind-actions">
                <button className="button" onClick={openQuote}>
                  Request Industry Consultation
                </button>
              </div>
            </div>
          </div>

          <div className="industry-products-section mt-5">
            <h3>Recommended Products for {activeIndustry.name.split(' ')[0]}</h3>
            {loading ? (
              <div className="products-grid-skeleton">
                {[1, 2, 3, 4].map((n) => <div key={n} className="product-card-skeleton" />)}
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image-container">
                      <img src={product.imageUrl || product.image || '/placeholder-product.jpg'} alt={product.name} />
                    </div>
                    <div className="product-info">
                      <span className="product-category">{product.categoryName || product.category || 'Surveillance'}</span>
                      <h3 className="product-title">{product.name}</h3>
                      <p className="product-description">{product.shortDescription || product.description?.slice(0, 80) + '...'}</p>
                    </div>
                    <div className="product-card-actions">
                      <Link to={`/products/${product.id}`} className="button button-outline button-small">
                        <Eye size={15} /> View
                      </Link>
                      <button className="button button-small" onClick={() => openEnquiry(product)}>
                        Enquire
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
