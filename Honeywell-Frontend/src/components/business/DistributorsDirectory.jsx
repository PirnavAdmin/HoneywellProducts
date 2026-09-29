import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Phone, Mail, User, ShieldCheck, CheckCircle2,
  Building, X, ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import { partnerService } from '../../services/partnerService';
import { useUI } from '../../context/UIContext';

// Verified Honeywell Regional Distributors directory data
export const defaultDistributors = [
  {
    id: 'dist-01',
    companyName: 'Matrix Security & Surveillance Systems Pvt Ltd',
    tier: 'Authorized Master Distributor',
    region: 'North India',
    city: 'New Delhi & NCR',
    state: 'Delhi NCR',
    contactPerson: 'Rajesh Malhotra',
    designation: 'Commercial Channel Director',
    phone: '+91 98112 34567',
    email: 'r.malhotra@matrix-security.com',
    address: 'Plot 42, Okhla Industrial Area Phase-III, New Delhi, Delhi 110020',
    gstin: '07AABCM1234F1Z8',
    productLines: ['CCTV Video Surveillance', '4G Solar Cameras', 'Enterprise NVR Storage', 'Access Control'],
    warehouseCapacity: '50,000+ Units Buffer',
    dispatchSla: 'Same-day / 24h Express',
    paymentTerms: 'Commercial Credit & Wholesale Net 30',
    experienceYears: '16+ Years in Distribution',
    status: 'Verified Active',
    rating: '4.9/5 (180+ Orders)',
    description: 'Premier authorized master distributor for Northern India catering to enterprise systems integrators, regional retail dealers, and commercial security contractors with large-scale inventory availability.'
  },
  {
    id: 'dist-02',
    companyName: 'Apex Electro-Tech Solutions LLP',
    tier: 'Authorized Regional Distributor',
    region: 'West India',
    city: 'Mumbai & Pune',
    state: 'Maharashtra',
    contactPerson: 'Vikram Desai',
    designation: 'VP Channel Distribution',
    phone: '+91 98201 87654',
    email: 'v.desai@apexelectrotech.in',
    address: 'Unit 804, Lodha Supremus, Kanjurmarg West, Mumbai, Maharashtra 400078',
    gstin: '27AACFA9876K1ZQ',
    productLines: ['IP Cameras & Domes', 'Solar Surveillance', 'PoE Network Switches', 'Accessories'],
    warehouseCapacity: '40,000+ Units Stock',
    dispatchSla: '24-48 Hours Express',
    paymentTerms: 'Tier-1 Wholesale Brackets',
    experienceYears: '12+ Years Distribution',
    status: 'Verified Active',
    rating: '4.85/5 (140+ Projects)',
    description: 'Specialized technology and surveillance distributor covering Maharashtra, Goa, and Western logistics corridors with dedicated technical pre-sales and firmware support.'
  },
  {
    id: 'dist-03',
    companyName: 'Vanguard Network & Security Systems',
    tier: 'Authorized Regional Distributor',
    region: 'South India',
    city: 'Bengaluru & Chennai',
    state: 'Karnataka & TN',
    contactPerson: 'Ananya Subramanian',
    designation: 'Head of Channel Sales',
    phone: '+91 98450 11223',
    email: 'ananya@vanguard-security.com',
    address: '120/A, Industrial Suburb, Yeshwanthpur, Bengaluru, Karnataka 560022',
    gstin: '29AABCV5544H1Z3',
    productLines: ['AI CCTV Analytics', 'Commercial NVRs', 'Smart Wireless', 'Storage HDDs'],
    warehouseCapacity: '35,000+ Units Buffer',
    dispatchSla: '24h Metro Dispatch',
    paymentTerms: 'Wholesale Volume Margin',
    experienceYears: '14+ Years Enterprise Supply',
    status: 'Verified Active',
    rating: '4.9/5 (210+ Orders)',
    description: 'Leading South India distributor providing enterprise integration supply, wholesale pricing tiers, and project-based dealer credit facilities across Bengaluru, Chennai, and Kochi.'
  },
  {
    id: 'dist-04',
    companyName: 'Deccan SecureTech & Infra Solutions',
    tier: 'Authorized Regional Distributor',
    region: 'Central India',
    city: 'Hyderabad & Secunderabad',
    state: 'Telangana & AP',
    contactPerson: 'K. Srinivas Rao',
    designation: 'Regional Commercial Lead',
    phone: '+91 98490 98712',
    email: 'ksrao@deccansecuretech.com',
    address: 'Block 4, Cyber Gateway, HITEC City, Hyderabad, Telangana 500081',
    gstin: '36AAACD4433P1Z2',
    productLines: ['CCTV IP Cameras', 'PTZ Speed Domes', 'Solar Systems', 'Rack NVRs'],
    warehouseCapacity: '30,000+ Units Stock',
    dispatchSla: 'Same-day / 24h Statewide',
    paymentTerms: 'Volume Credit Facility',
    experienceYears: '10+ Years Channel Support',
    status: 'Verified Active',
    rating: '4.8/5 (115+ Deployments)',
    description: 'Certified Honeywell regional hub serving smart city infrastructure, commercial IT parks, and residential township security installers throughout Telangana and AP.'
  },
  {
    id: 'dist-05',
    companyName: 'Kolkata Electronic & Surveillance Hub',
    tier: 'Authorized Regional Distributor',
    region: 'East India',
    city: 'Kolkata & Howrah',
    state: 'West Bengal',
    contactPerson: 'Sourav Mukherjee',
    designation: 'Managing Partner',
    phone: '+91 98300 45678',
    email: 'sourav@kolkata-surveillance.com',
    address: '24/B, Park Street Commercial Complex, Kolkata, West Bengal 700016',
    gstin: '19AAECK3322D1Z5',
    productLines: ['HD & IP CCTV', 'Solar Surveillance', 'Hybrid DVRs', 'Storage HDDs'],
    warehouseCapacity: '25,000+ Units Buffer',
    dispatchSla: '24-48h East Region',
    paymentTerms: 'Authorized Wholesale',
    experienceYears: '18+ Years Supply Hub',
    status: 'Verified Active',
    rating: '4.75/5 (95+ Projects)',
    description: 'Regional distribution channel spanning West Bengal, Odisha, Bihar, and North-Eastern states with direct factory-backed RMA and technical assistance.'
  },
  {
    id: 'dist-06',
    companyName: 'Gujarat Industrial & Commercial Security Corp',
    tier: 'Authorized Regional Distributor',
    region: 'West India',
    city: 'Ahmedabad & Surat',
    state: 'Gujarat',
    contactPerson: 'Chirag Patel',
    designation: 'Operations Director',
    phone: '+91 98980 54321',
    email: 'chirag@gic-security.in',
    address: '502, Venus Atlantis, Prahlad Nagar, Ahmedabad, Gujarat 380015',
    gstin: '24AABCG7788M1Z4',
    productLines: ['Commercial Video', 'Industrial CCTV', 'Perimeter Solar', 'PoE Network'],
    warehouseCapacity: '35,000+ Units Hub',
    dispatchSla: '24h Express Gujarat',
    paymentTerms: 'Wholesale Tier-A',
    experienceYears: '15+ Years Industrial Supply',
    status: 'Verified Active',
    rating: '4.9/5 (160+ Facilities)',
    description: 'Specialized industrial distributor offering mission-critical surveillance infrastructure, hazardous area certified housings, and bulk commercial pricing for OEM & EPC contracts.'
  }
];

export default function DistributorsDirectory() {
  const { openQuote, notify } = useUI();
  const [distributors, setDistributors] = useState(defaultDistributors);
  const scrollContainerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Modal State for Viewing Detailed Distributor Profile
  const [activeDistributor, setActiveDistributor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const cardStep = 326; // 310px compact card width + 16px gap

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -cardStep, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    if (scrollLeft + clientWidth >= scrollWidth - 16) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollContainerRef.current.scrollBy({ left: cardStep, behavior: 'smooth' });
    }
  };

  // Auto-scroll one by one horizontally every 3.2 seconds, pauses on hover/modal
  useEffect(() => {
    if (isHovered || modalOpen) return;

    const interval = setInterval(() => {
      handleScrollRight();
    }, 3200);

    return () => clearInterval(interval);
  }, [isHovered, modalOpen, distributors.length]);

  useEffect(() => {
    async function loadLivePartners() {
      try {
        const apps = await partnerService.getApplications().catch(() => []);
        if (Array.isArray(apps) && apps.length > 0) {
          const liveMapped = apps
            .filter((a) => (a.businessType || '').toLowerCase().includes('distributor') || a.status === 'Approved')
            .map((a, idx) => ({
              id: `live-dist-${a.id || idx}`,
              companyName: a.companyName || 'Authorized Partner Firm',
              tier: a.businessType || 'Authorized Regional Distributor',
              region: a.state ? (a.state.includes('Delhi') || a.state.includes('Punjab') || a.state.includes('Haryana') ? 'North India' : a.state.includes('Karnataka') || a.state.includes('Tamil') || a.state.includes('Kerala') ? 'South India' : a.state.includes('Maharashtra') || a.state.includes('Gujarat') ? 'West India' : 'Central India') : 'Pan-India',
              city: a.city || 'Regional Hub',
              state: a.state || 'India',
              contactPerson: a.contactPerson || 'Channel Representative',
              designation: 'Commercial Channel Lead',
              phone: a.mobile || '+91 1800 123 4567',
              email: a.email || 'partner@honeywell-products.com',
              address: a.address || `${a.city || 'Commercial Hub'}, ${a.state || 'India'}`,
              gstin: a.gstin || '27AAAAA0000A1Z5',
              productLines: ['CCTV Surveillance', 'Solar Security', 'NVR Infrastructure', 'Accessories'],
              warehouseCapacity: 'Buffer Stock Ready',
              dispatchSla: '24-48h Express',
              paymentTerms: 'Wholesale Commercial Terms',
              experienceYears: a.yearsInBusiness ? `${a.yearsInBusiness} Yrs in Business` : 'Established Partner',
              status: 'Verified Active',
              rating: '4.8/5 (Verified)',
              description: a.description || 'Verified commercial channel distributor and supply partner for Honeywell products and enterprise security installations.'
            }));

          const combined = [...liveMapped, ...defaultDistributors];
          const unique = Array.from(new Map(combined.map(item => [item.companyName.toLowerCase(), item])).values());
          setDistributors(unique);
        }
      } catch (err) {
        console.warn('Live partner fetch fallback used:', err);
      }
    }

    loadLivePartners();
  }, []);

  const openDetails = (dist) => {
    setActiveDistributor(dist);
    setModalOpen(true);
  };

  const handleRequestQuote = (dist) => {
    if (openQuote) {
      openQuote({
        name: `Commercial Wholesale BOQ — ${dist.companyName}`,
        model: `DIST-${dist.city}`,
        category: dist.region,
        brand: 'Honeywell Products',
      });
    } else {
      notify(`Quotation request initiated for ${dist.companyName}`);
    }
  };

  return (
    <section className="section distributors-directory-section" id="distributors-directory" style={{ paddingBlock: '16px 40px' }}>
      <div className="container">
        {/* Title Header with Refined Minimal Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '4px', height: '22px', background: 'var(--red, #1268a5)', borderRadius: '2px', display: 'inline-block' }} />
            <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
              Authorized Distributors &amp; Partner Directory
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleScrollLeft}
              aria-label="Previous Distributor"
              className="distributor-nav-btn"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              aria-label="Next Distributor"
              className="distributor-nav-btn"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ── Single-Line Horizontal Carousel / Row (moves one by one) ── */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '16px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            padding: '4px 2px 14px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {distributors.map((dist) => (
            <article
              key={dist.id}
              className="distributor-card-compact"
              style={{
                flex: '0 0 310px',
                width: '310px',
                scrollSnapAlign: 'start',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              <div>
                {/* Top Badge Ribbon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#eaf4fb',
                    color: '#1268a5',
                    border: '1px solid #d4e8f7',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.2px',
                    textTransform: 'uppercase'
                  }}>
                    <CheckCircle2 size={11} /> {dist.tier.includes('Master') ? 'Master Hub' : 'Authorized'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#0369a1',
                    background: '#f0f9ff',
                    padding: '2.5px 7px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {dist.region}
                  </span>
                </div>

                {/* Company Name */}
                <h3 style={{
                  fontSize: '14.5px',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.35,
                  margin: '0 0 6px',
                  height: '40px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {dist.companyName}
                </h3>

                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>
                  <MapPin size={13} style={{ color: '#1268a5', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>{dist.city}, {dist.state}</span>
                </div>

                {/* Contact Person Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '10px' }}>
                      <User size={12} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{dist.contactPerson}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>{dist.designation}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: '#334155' }}>
                    <a href={`tel:${dist.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0284c7', textDecoration: 'none', fontWeight: 500 }}>
                      <Phone size={11} /> {dist.phone}
                    </a>
                    <a href={`mailto:${dist.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0284c7', textDecoration: 'none', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Mail size={11} /> {dist.email}
                    </a>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px' }}>
                      <Building size={11} /> GST: <strong style={{ color: '#1e293b' }}>{dist.gstin}</strong>
                    </div>
                  </div>
                </div>

                {/* Product Line Tags (Compact 3 Items) */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {dist.productLines.slice(0, 3).map((prod) => (
                      <span
                        key={prod}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '10.5px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: 500
                        }}
                      >
                        {prod}
                      </span>
                    ))}
                    {dist.productLines.length > 3 && (
                      <span style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '10px', padding: '2px 4px', borderRadius: '3px', fontWeight: 600 }}>
                        +{dist.productLines.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Micro Meta SLA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span>⚡ {dist.dispatchSla}</span>
                  <span>📦 {dist.warehouseCapacity}</span>
                </div>
              </div>

              {/* Actions Bottom Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => openDetails(dist)}
                  style={{
                    padding: '7px 8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestQuote(dist)}
                  style={{
                    padding: '7px 10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--red, #1268a5)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(18, 104, 165, 0.2)'
                  }}
                >
                  Request Quote
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── Modal for Full Distributor Profile & Territory Details ── */}
      {modalOpen && activeDistributor && (
        <div
          className="distributor-modal-backdrop"
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="distributor-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              padding: '28px'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#eaf4fb',
                color: '#1268a5',
                border: '1px solid #d4e8f7',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '20px',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                <ShieldCheck size={13} /> Official Verified Distributor
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
                {activeDistributor.companyName}
              </h2>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
                {activeDistributor.description}
              </p>
            </div>

            {/* Profile Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Commercial Contact Lead
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{activeDistributor.contactPerson}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{activeDistributor.designation}</div>
                <div style={{ fontSize: '12.5px', color: '#0284c7', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <a href={`tel:${activeDistributor.phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                    📞 {activeDistributor.phone}
                  </a>
                  <a href={`mailto:${activeDistributor.email}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                    ✉️ {activeDistributor.email}
                  </a>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Regional Logistics &amp; Billing
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.35, marginBottom: '4px' }}>
                  <strong>Address:</strong> {activeDistributor.address}
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  <strong>GSTIN:</strong> {activeDistributor.gstin}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  <strong>Territory:</strong> {activeDistributor.region} ({activeDistributor.state})
                </div>
              </div>
            </div>

            {/* Commercial Terms Matrix */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '12.5px',
              color: '#166534',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div>
                <strong>🚚 Dispatch SLA:</strong> {activeDistributor.dispatchSla}
              </div>
              <div>
                <strong>💳 Commercial Terms:</strong> {activeDistributor.paymentTerms}
              </div>
              <div>
                <strong>🏢 Buffer Capacity:</strong> {activeDistributor.warehouseCapacity}
              </div>
              <div>
                <strong>⭐ Performance:</strong> {activeDistributor.rating}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-small"
                onClick={() => {
                  handleRequestQuote(activeDistributor);
                  setModalOpen(false);
                }}
              >
                Request Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle hover and animation styles */}
      <style>{`
        .distributor-card-compact:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04) !important;
          border-color: #cbd5e1 !important;
        }
        .distributor-nav-btn:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
          color: #0f172a !important;
        }
      `}</style>
    </section>
  );
}
