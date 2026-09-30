import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin, Phone, Mail, User, ShieldCheck, CheckCircle2,
  Building, X, ChevronLeft, ChevronRight, Search, Filter,
  RefreshCw, AlertCircle, Send, Check
} from 'lucide-react';
import { distributorService } from '../../services/distributorService';
import { useUI } from '../../context/UIContext';

export default function DistributorsDirectory({ showHeading = true }) {
  const { notify } = useUI();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);

  // Dropdown options from API
  const [regions, setRegions] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Carousel & Scroll
  const scrollContainerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Modal State for Viewing Detailed Distributor Profile (Step 4)
  const [activeDistributor, setActiveDistributor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Quote Request Modal State (Step 7)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteDistributor, setQuoteDistributor] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    companyName: '',
    email: '',
    mobile: '',
    productRequirement: '',
    quantity: 1,
    notes: ''
  });
  const [quoteErrors, setQuoteErrors] = useState({});
  const [quoteStatus, setQuoteStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [quoteErrorMsg, setQuoteErrorMsg] = useState('');

  const cardStep = 326; // 310px compact card width + 16px gap

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load Filter Options (Regions and Types) once
  useEffect(() => {
    let isMounted = true;
    async function loadFilters() {
      setLoadingFilters(true);
      try {
        const [regionsData, typesData] = await Promise.allSettled([
          distributorService.getRegions(),
          distributorService.getPartnerTypes()
        ]);

        if (isMounted) {
          if (regionsData.status === 'fulfilled' && Array.isArray(regionsData.value)) {
            setRegions(regionsData.value);
          }
          if (typesData.status === 'fulfilled' && Array.isArray(typesData.value)) {
            setPartnerTypes(typesData.value);
          }
        }
      } catch (err) {
        console.warn('Failed to load filter options:', err);
      } finally {
        if (isMounted) setLoadingFilters(false);
      }
    }

    loadFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Distributors from API (Step 3)
  const fetchDistributors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedRegion !== 'All') params.region = selectedRegion;
      if (selectedType !== 'All') params.type = selectedType;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (isVerifiedOnly) params.isVerified = true;

      const data = await distributorService.getDistributors(params);
      const list = Array.isArray(data) ? data : [];
      // Only show active distributors in public website view
      const activeList = list.filter((d) => d.isActive !== false);
      setDistributors(activeList);
    } catch (err) {
      console.error('Failed to load distributors from API:', err);
      setError(err.message || 'Unable to retrieve distributors. Please check backend connection.');
      setDistributors([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedRegion, selectedType, selectedCategory, isVerifiedOnly]);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  // Real-time synchronization when distributors are deleted/updated/added from admin
  useEffect(() => {
    const handleSync = () => {
      fetchDistributors();
    };
    const handleStorage = (e) => {
      if (e.key === 'distributors_last_sync') {
        fetchDistributors();
      }
    };

    window.addEventListener('distributors_changed', handleSync);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('distributors_changed', handleSync);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleSync);
    };
  }, [fetchDistributors]);

  // Carousel Navigation
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

  // Auto-scroll one by one horizontally, pauses on hover/modal
  useEffect(() => {
    if (isHovered || modalOpen || quoteModalOpen || distributors.length <= 1) return;

    const interval = setInterval(() => {
      handleScrollRight();
    }, 3500);

    return () => clearInterval(interval);
  }, [isHovered, modalOpen, quoteModalOpen, distributors.length]);

  // Open Details Modal and fetch fresh data by ID (Step 4)
  const openDetails = async (dist) => {
    setActiveDistributor(dist);
    setModalOpen(true);
    setLoadingDetails(true);
    setDetailsError(null);

    try {
      if (dist.id) {
        const fullDetails = await distributorService.getDistributorById(dist.id);
        if (fullDetails) {
          setActiveDistributor(fullDetails);
        }
      }
    } catch (err) {
      console.warn('Failed to load full distributor details from server:', err);
      setDetailsError(err.message || 'Failed to load live distributor profile details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Dedicated Quote Modal (Step 7)
  const handleRequestQuote = (dist) => {
    setQuoteDistributor(dist);
    setQuoteForm({
      name: '',
      companyName: '',
      email: '',
      mobile: '',
      productRequirement: '',
      quantity: 1,
      notes: ''
    });
    setQuoteErrors({});
    setQuoteStatus('idle');
    setQuoteErrorMsg('');
    setQuoteModalOpen(true);
  };

  // Validate Quote Form
  const validateQuote = () => {
    const errs = {};
    if (!quoteForm.name.trim()) errs.name = 'Please enter your full name.';
    if (!quoteForm.companyName.trim()) errs.companyName = 'Please enter your company name.';
    if (!quoteForm.email.trim() || !/^\S+@\S+\.\S+$/.test(quoteForm.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!quoteForm.mobile.trim() || !/^[0-9+\s-]{8,15}$/.test(quoteForm.mobile.trim())) {
      errs.mobile = 'Please enter a valid contact phone/mobile number.';
    }
    if (!quoteForm.productRequirement.trim()) {
      errs.productRequirement = 'Please specify the products or requirements.';
    }
    if (Number(quoteForm.quantity) < 1) {
      errs.quantity = 'Quantity must be at least 1.';
    }
    setQuoteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Quote Request (Step 7)
  const submitQuote = async (e) => {
    e.preventDefault();
    if (!validateQuote()) return;

    setQuoteStatus('submitting');
    setQuoteErrorMsg('');

    try {
      const payload = {
        distributorId: quoteDistributor?.id || null,
        distributorName: quoteDistributor?.companyName || quoteDistributor?.name || '',
        name: quoteForm.name.trim(),
        companyName: quoteForm.companyName.trim(),
        email: quoteForm.email.trim(),
        mobile: quoteForm.mobile.trim(),
        productRequirement: quoteForm.productRequirement.trim(),
        quantity: Number(quoteForm.quantity) || 1,
        notes: quoteForm.notes.trim()
      };

      await distributorService.submitQuoteRequest(payload);
      setQuoteStatus('success');
      if (notify) {
        notify(`Quote request submitted successfully to ${quoteDistributor?.companyName || 'Distributor'}`);
      }
    } catch (err) {
      console.error('Quote submission failed:', err);
      setQuoteStatus('error');
      setQuoteErrorMsg(err.message || 'Failed to submit quote request. Please try again.');
    }
  };

  return (
    <section className="section distributors-directory-section" id="distributors-directory" style={{ paddingBlock: '16px 40px' }}>
      <div className="container">
        {/* Title Header with Minimal Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
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
              disabled={loading || distributors.length === 0}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || distributors.length === 0 ? 'not-allowed' : 'pointer',
                color: '#475569',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
                opacity: loading || distributors.length === 0 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              aria-label="Next Distributor"
              className="distributor-nav-btn"
              disabled={loading || distributors.length === 0}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || distributors.length === 0 ? 'not-allowed' : 'pointer',
                color: '#475569',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
                opacity: loading || distributors.length === 0 ? 0.5 : 1
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ── Search & Filter Controls Bar ── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: '1 1 220px',
            minWidth: '200px'
          }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search distributor, city, GSTIN or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>

          {/* Region Dropdown (Step 5) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12.5px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155'
              }}
            >
              <option value="All">All Regions</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Partner / Dealer Type Dropdown (Step 6) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12.5px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155'
              }}
            >
              <option value="All">All Partner Types</option>
              {partnerTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Verified Checkbox Filter */}
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            color: '#334155',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}>
            <input
              type="checkbox"
              checked={isVerifiedOnly}
              onChange={(e) => setIsVerifiedOnly(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600 }}>Verified Only</span>
          </label>
        </div>

        {/* ── Loading State ── */}
        {loading ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <RefreshCw size={24} className="spin" style={{ display: 'inline-block', marginBottom: '10px', color: '#1268a5' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Loading distributors...</p>
          </div>
        ) : error ? (
          /* ── Error State ── */
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '32px 20px',
            textAlign: 'center',
            color: '#991b1b'
          }}>
            <AlertCircle size={24} style={{ display: 'inline-block', marginBottom: '8px', color: '#dc2626' }} />
            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>{error}</p>
            <button
              type="button"
              onClick={fetchDistributors}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #dc2626',
                background: '#ffffff',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : distributors.length === 0 ? (
          /* ── Empty State ── */
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: '0 0 6px' }}>
              No distributors found matching your criteria.
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
              Try adjusting your search query, region, or partner type filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedRegion('All');
                setSelectedType('All');
                setSelectedCategory('All');
                setIsVerifiedOnly(false);
              }}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* ── Single-Line Horizontal Carousel / Row ── */
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
                key={dist.id || dist.companyName}
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
                      <CheckCircle2 size={11} /> {dist.badgeText || (dist.tier && dist.tier.includes('Master') ? 'Master Hub' : 'Authorized')}
                    </span>
                    {dist.region && (
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
                    )}
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
                    {dist.companyName || dist.name}
                  </h3>

                  {/* Location */}
                  {(dist.city || dist.state) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>
                      <MapPin size={13} style={{ color: '#1268a5', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: '#334155' }}>{[dist.city, dist.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

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
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{dist.contactPerson || 'Channel Lead'}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{dist.designation || dist.contactTitle || 'Representative'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: '#334155' }}>
                      {dist.phone && (
                        <a href={`tel:${dist.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0284c7', textDecoration: 'none', fontWeight: 500 }}>
                          <Phone size={11} /> {dist.phone}
                        </a>
                      )}
                      {dist.email && (
                        <a href={`mailto:${dist.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0284c7', textDecoration: 'none', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Mail size={11} /> {dist.email}
                        </a>
                      )}
                      {dist.gstin && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px' }}>
                          <Building size={11} /> GST: <strong style={{ color: '#1e293b' }}>{dist.gstin}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Line Tags (Compact) */}
                  {dist.productLines && dist.productLines.length > 0 && (
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
                  )}

                  {/* Micro Meta SLA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <span>⚡ {dist.dispatchSla || '24-48h SLA'}</span>
                    <span>📦 {dist.warehouseCapacity || dist.bufferCapacity || 'Stock Ready'}</span>
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
        )}
      </div>

      {/* ── Modal for Full Distributor Profile (Step 4) ── */}
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

            {loadingDetails ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <RefreshCw size={24} className="spin" style={{ display: 'inline-block', marginBottom: '8px', color: '#1268a5' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Loading dealer details...</p>
              </div>
            ) : (
              <>
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
                    <ShieldCheck size={13} /> {activeDistributor.isVerified ? 'Official Verified Distributor' : 'Authorized Channel Partner'}
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
                    {activeDistributor.companyName || activeDistributor.name}
                  </h2>
                  {activeDistributor.description && (
                    <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
                      {activeDistributor.description}
                    </p>
                  )}
                </div>

                {detailsError && (
                  <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '12px', marginBottom: '16px' }}>
                    {detailsError}
                  </div>
                )}

                {/* Profile Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Commercial Contact Lead
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{activeDistributor.contactPerson || 'Channel Lead'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{activeDistributor.designation || activeDistributor.contactTitle || 'Lead'}</div>
                    <div style={{ fontSize: '12.5px', color: '#0284c7', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {activeDistributor.phone && (
                        <a href={`tel:${activeDistributor.phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                          📞 {activeDistributor.phone}
                        </a>
                      )}
                      {activeDistributor.email && (
                        <a href={`mailto:${activeDistributor.email}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                          ✉️ {activeDistributor.email}
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Regional Logistics &amp; Billing
                    </div>
                    {activeDistributor.address && (
                      <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.35, marginBottom: '4px' }}>
                        <strong>Address:</strong> {activeDistributor.address}
                      </div>
                    )}
                    {activeDistributor.gstin && (
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        <strong>GSTIN:</strong> {activeDistributor.gstin}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                      <strong>Territory:</strong> {activeDistributor.region || 'Regional'} {activeDistributor.state ? `(${activeDistributor.state})` : ''}
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
                    <strong>🚚 Dispatch SLA:</strong> {activeDistributor.dispatchSla || '24-48 Hours Express'}
                  </div>
                  <div>
                    <strong>💳 Commercial Terms:</strong> {activeDistributor.commercialTerms || activeDistributor.paymentTerms || 'Wholesale Terms'}
                  </div>
                  <div>
                    <strong>🏢 Buffer Capacity:</strong> {activeDistributor.bufferCapacity || activeDistributor.warehouseCapacity || 'Stock Hub'}
                  </div>
                  <div>
                    <strong>⭐ Performance:</strong> {activeDistributor.rating || '4.8/5 (Verified)'}
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
                      setModalOpen(false);
                      handleRequestQuote(activeDistributor);
                    }}
                  >
                    Request Quote
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal for Quote Request (Step 7) ── */}
      {quoteModalOpen && quoteDistributor && (
        <div
          className="distributor-modal-backdrop"
          onClick={() => {
            if (quoteStatus !== 'submitting') setQuoteModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            className="distributor-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '560px',
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
              disabled={quoteStatus === 'submitting'}
              onClick={() => setQuoteModalOpen(false)}
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
                cursor: quoteStatus === 'submitting' ? 'not-allowed' : 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            {quoteStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Check size={32} strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                  Quote Request Submitted
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px' }}>
                  Your wholesale quotation request has been sent to <strong>{quoteDistributor.companyName || quoteDistributor.name}</strong>. Their commercial team will review your requirements and reach out to you shortly.
                </p>
                <button
                  type="button"
                  className="button"
                  onClick={() => setQuoteModalOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1268a5', textTransform: 'uppercase' }}>
                    Wholesale B2B Quotation
                  </span>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                    Request Quote from {quoteDistributor.companyName || quoteDistributor.name}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Provide your commercial requirements and quantity for authorized project rates.
                  </p>
                </div>

                {quoteErrorMsg && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
                    {quoteErrorMsg}
                  </div>
                )}

                <form onSubmit={submitQuote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Your Name *</span>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={quoteForm.name}
                        onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                        style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${quoteErrors.name ? '#dc2626' : '#cbd5e1'}` }}
                      />
                      {quoteErrors.name && <small style={{ color: '#dc2626', fontSize: '11px' }}>{quoteErrors.name}</small>}
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Company Name *</span>
                      <input
                        type="text"
                        placeholder="Company / Enterprise"
                        value={quoteForm.companyName}
                        onChange={(e) => setQuoteForm({ ...quoteForm, companyName: e.target.value })}
                        style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${quoteErrors.companyName ? '#dc2626' : '#cbd5e1'}` }}
                      />
                      {quoteErrors.companyName && <small style={{ color: '#dc2626', fontSize: '11px' }}>{quoteErrors.companyName}</small>}
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Email Address *</span>
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                        style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${quoteErrors.email ? '#dc2626' : '#cbd5e1'}` }}
                      />
                      {quoteErrors.email && <small style={{ color: '#dc2626', fontSize: '11px' }}>{quoteErrors.email}</small>}
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Mobile Number *</span>
                      <input
                        type="text"
                        placeholder="10-digit mobile"
                        value={quoteForm.mobile}
                        onChange={(e) => setQuoteForm({ ...quoteForm, mobile: e.target.value })}
                        style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${quoteErrors.mobile ? '#dc2626' : '#cbd5e1'}` }}
                      />
                      {quoteErrors.mobile && <small style={{ color: '#dc2626', fontSize: '11px' }}>{quoteErrors.mobile}</small>}
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Product Requirement *</span>
                      <input
                        type="text"
                        placeholder="e.g. CCTV Dome Cameras, NVR 32Ch"
                        value={quoteForm.productRequirement}
                        onChange={(e) => setQuoteForm({ ...quoteForm, productRequirement: e.target.value })}
                        style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${quoteErrors.productRequirement ? '#dc2626' : '#cbd5e1'}` }}
                      />
                      {quoteErrors.productRequirement && <small style={{ color: '#dc2626', fontSize: '11px' }}>{quoteErrors.productRequirement}</small>}
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Quantity *</span>
                      <input
                        type="number"
                        min="1"
                        value={quoteForm.quantity}
                        onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
                        style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${quoteErrors.quantity ? '#dc2626' : '#cbd5e1'}` }}
                      />
                      {quoteErrors.quantity && <small style={{ color: '#dc2626', fontSize: '11px' }}>{quoteErrors.quantity}</small>}
                    </label>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Additional Notes (Optional)</span>
                    <textarea
                      rows={2}
                      placeholder="Project details, site delivery timeline, or technical specs..."
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                      style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      disabled={quoteStatus === 'submitting'}
                      className="button button-outline button-small"
                      onClick={() => setQuoteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quoteStatus === 'submitting'}
                      className="button button-small"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {quoteStatus === 'submitting' ? (
                        <>
                          <RefreshCw size={14} className="spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Submit Quote Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
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
        .distributor-nav-btn:hover:not(:disabled) {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
          color: #0f172a !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </section>
  );
}
