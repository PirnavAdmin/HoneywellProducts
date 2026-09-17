import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tag, Percent, Calendar, Copy, Check, ArrowRight } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import OffersDeals from '../components/home/OffersDeals';
import { couponService } from '../services/couponService';
import { useUI } from '../context/UIContext';
import heroImage from '../assets/images/products-hero.png';

export default function Offers() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const { openQuote } = useUI();
  const location = useLocation();

  useEffect(() => {
    async function loadOffers() {
      try {
        setLoading(true);
        const data = await couponService.getAll();
        setCoupons(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, []);

  useEffect(() => {
    if (location.hash === '#offers-deals' || location.hash === '#offers') {
      setTimeout(() => {
        const el = document.getElementById('offers-deals');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  const copyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <>
      <PageHero
        eyebrow="OFFERS &amp; PROMOTIONS"
        title="Promotional Offers &amp; Deals"
        description="Explore current discounts, volume pricing promotions, and special deals for Honeywell Products."
        image={heroImage}
      />

      {/* Offers & Deals Section */}
      <OffersDeals />

      {/* Active Coupon Codes Section */}
      <section className="section" style={{ paddingTop: '40px', paddingBottom: '60px', backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div className="section-heading" style={{ marginBottom: '32px' }}>
            <p className="eyebrow dark">PROMOTIONAL COUPONS</p>
            <h2>Active Coupon Codes</h2>
            <p>Apply these promotional codes at checkout for instant savings on Honeywell products.</p>
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Loading promotional coupon codes...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="coupon-empty-card" style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              maxWidth: '560px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#1268a5'
              }}>
                <Tag size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
                No Active Promotional Codes
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0', maxWidth: '420px', lineHeight: '1.5' }}>
                Contact our sales team directly for bulk order pricing, dealer discounts, and custom quotes.
              </p>
              <button className="button button-primary button-small" onClick={openQuote} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Get a Custom Bulk Quote
              </button>
            </div>
          ) : (
            <div className="coupon-promo-grid">
              {coupons.map((coupon) => (
                <div key={coupon.id || coupon.code} className="coupon-promo-card">
                  <div>
                    <div className="coupon-promo-badge">
                      <Percent size={14} /> Discount Offer
                    </div>
                    <div className="coupon-promo-body">
                      <h3>{coupon.title || coupon.name || `Promo ${coupon.code}`}</h3>
                      <p>{coupon.description || `Apply discount code ${coupon.code} at checkout.`}</p>
                      {coupon.discountAmount && (
                        <div className="coupon-promo-discount">
                          {coupon.discountType === 'Percentage' ? `${coupon.discountAmount}% OFF` : `₹${coupon.discountAmount} OFF`}
                        </div>
                      )}
                      {coupon.expiryDate && (
                        <div className="coupon-promo-expiry">
                          <Calendar size={13} /> Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="coupon-promo-footer">
                    <div className="coupon-code-box">
                      <code>{coupon.code}</code>
                      <button
                        className="button-icon-only"
                        onClick={() => copyCode(coupon.code)}
                        title="Copy Code"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      >
                        {copiedCode === coupon.code ? <Check size={16} color="#16a34a" /> : <Copy size={16} color="#64748b" />}
                      </button>
                    </div>
                    <Link to="/products" className="button button-small" style={{ textDecoration: 'none' }}>
                      Shop Products <ArrowRight size={14} />
                    </Link>
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
