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

      {/* Promo Coupons Grid Section */}
      <section className="section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Active Coupon Codes</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Apply these promotional codes at checkout for instant savings.</p>
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '180px' }}>
              <p>Loading promotional coupon codes...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="empty-state">
              <Tag size={48} className="empty-icon" />
              <h3>No active promotional codes currently listed</h3>
              <p>Contact our sales team directly for bulk order pricing and custom quotes.</p>
              <button className="button button-small" onClick={openQuote} style={{ marginTop: '12px' }}>
                Get a Custom Bulk Quote
              </button>
            </div>
          ) : (
            <div className="offers-grid">
              {coupons.map((coupon) => (
                <div key={coupon.id || coupon.code} className="offer-card">
                  <div className="offer-card-badge">
                    <Percent size={16} /> Discount Offer
                  </div>
                  <div className="offer-card-body">
                    <h3>{coupon.title || coupon.name || `Promo ${coupon.code}`}</h3>
                    <p>{coupon.description || `Apply discount code ${coupon.code} at checkout.`}</p>
                    {coupon.discountAmount && (
                      <div className="offer-discount-value">
                        {coupon.discountType === 'Percentage' ? `${coupon.discountAmount}% OFF` : `$${coupon.discountAmount} OFF`}
                      </div>
                    )}
                    {coupon.expiryDate && (
                      <div className="offer-expiry">
                        <Calendar size={13} /> Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="offer-card-footer">
                    <div className="coupon-code-box">
                      <code>{coupon.code}</code>
                      <button
                        className="button-icon-only"
                        onClick={() => copyCode(coupon.code)}
                        title="Copy Code"
                      >
                        {copiedCode === coupon.code ? <Check size={16} color="green" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <Link to="/products" className="button button-small">
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
