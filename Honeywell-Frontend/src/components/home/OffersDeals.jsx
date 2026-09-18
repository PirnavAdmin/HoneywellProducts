import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Tag, Loader2 } from 'lucide-react';
import { offersService } from '../../services/offersService';
import { productService } from '../../services/productService';
import ProductCard from '../products/ProductCard';

export default function OffersDeals() {
  const location = useLocation();
  const isOffersPage = location.pathname === '/offers';
  const scrollRef = useRef(null);
  const [offersList, setOffersList] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const pauseTimerRef = useRef(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, prods] = await Promise.all([
        offersService.getAll(''),
        productService.getAll().catch(() => [])
      ]);
      setOffersList(Array.isArray(data) ? data : []);
      setAllProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.error('Failed to load public offers:', err);
      setError('Unable to load promotional offers.');
      setOffersList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const displayOffers = offersList;

  const handleUserInteraction = useCallback(() => {
    setIsPaused(true);
    setUserInteracted(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      setUserInteracted(false);
    }, 4000);
  }, []);

  const handlePrev = () => {
    handleUserInteraction();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    handleUserInteraction();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (loading || displayOffers.length === 0) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animId;
    let lastTime = performance.now();

    const scrollStep = (currentTime) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      if (!isPaused && scrollRef.current) {
        const container = scrollRef.current;
        container.scrollLeft += (30 * delta) / 1000;

        const halfWidth = container.scrollWidth / 2;
        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);

    return () => {
      cancelAnimationFrame(animId);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isPaused, loading, displayOffers.length]);

  return (
    <section className="section offers-section" id="offers-deals" aria-label="Offers and Deals">
      <div className="container">
        {/* Header Section */}
        <div className="offers-header-row" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="section-heading">
            <p className="eyebrow dark">OFFERS &amp; DEALS</p>
            <h2>Exclusive Deals for You</h2>
            <p>
              Discover special offers on CCTV security solutions, solar products, accessories and more.
            </p>
          </div>

          {offersList.length > 0 && (
            <div className="offers-controls-bar">
              <button
                type="button"
                className="offers-nav-btn"
                onClick={handlePrev}
                aria-label="Previous offers"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                className="offers-nav-btn"
                onClick={handleNext}
                aria-label="Next offers"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="route-loading" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: '#1268a5' }} />
            <p style={{ fontSize: '14px', color: '#64748b' }}>Loading promotional offers...</p>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
            <Tag size={40} style={{ color: '#94a3b8', marginBottom: '8px' }} />
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{error}</p>
          </div>
        ) : offersList.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
            <Tag size={40} style={{ color: '#94a3b8', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No active offers available</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Check back soon for new promotional updates.</p>
          </div>
        ) : (
          <div
            className="offers-carousel-track"
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              if (!userInteracted) setIsPaused(false);
            }}
            onTouchStart={handleUserInteraction}
            style={{ gap: '20px' }}
          >
            {displayOffers.map((offer, idx) => {
              const origPrice = Number(offer.originalPrice || 0);
              const dealPrice = Number(offer.dealPrice || offer.price || offer.offerPrice || 0);

              // Smart resolution of actual target product (by ID, exact title, or title substring)
              const matchedProduct = (offer.productId && allProducts.find(p => String(p.id) === String(offer.productId))) ||
                (offer.title && allProducts.find(p => (p.name || p.title) && String(p.name || p.title).trim().toLowerCase() === offer.title.trim().toLowerCase())) ||
                (offer.title && allProducts.find(p => (p.name || p.title) && (
                  String(p.name || p.title).toLowerCase().includes(offer.title.toLowerCase().trim()) ||
                  offer.title.toLowerCase().includes(String(p.name || p.title).toLowerCase().trim())
                )));

              const productSlug = matchedProduct
                ? (matchedProduct.id || matchedProduct.slug)
                : (offer.productId ? offer.productId : offer.id || null);

              const targetUrl = productSlug
                ? `/products/${productSlug}`
                : `/products?search=${encodeURIComponent(offer.title || '')}`;

              const rawImg = offer.imageUrl || offer.image || matchedProduct?.image || '';
              const cleanImage = (!rawImg || String(rawImg).toLowerCase().includes('placeholder'))
                ? '/honeywell-products-logo.png'
                : (rawImg.startsWith('http') || rawImg.startsWith('data:')
                    ? rawImg
                    : `https://wildlife-unwieldy-devotee.ngrok-free.dev${rawImg.startsWith('/') ? '' : '/'}${rawImg}`);

              const mappedProduct = {
                id: String(matchedProduct?.id || offer.productId || offer.id || ''),
                slug: String(productSlug || offer.id || ''),
                customUrl: targetUrl,
                ctaLabel: 'View',
                name: offer.title || matchedProduct?.name || 'Honeywell Product',
                category: offer.category || matchedProduct?.category || 'Promotional Deal',
                productType: offer.badgeTag || matchedProduct?.productType || 'Special Offer',
                price: dealPrice > 0 ? dealPrice : Number(matchedProduct?.price || 0),
                mrp: origPrice > dealPrice ? origPrice : Number(matchedProduct?.mrp || 0),
                priceLabel: dealPrice > 0 ? `₹${dealPrice.toLocaleString('en-IN')}` : '',
                priceNote: origPrice > dealPrice ? `MRP ₹${origPrice.toLocaleString('en-IN')}` : '',
                image: cleanImage,
                imageUrl: cleanImage,
                shortDescription: offer.description || matchedProduct?.shortDescription || '',
                highlights: [
                  offer.description || matchedProduct?.shortDescription || 'Exclusive deal on Honeywell products',
                  offer.endDate ? `Ends: ${offer.endDate}` : 'Limited time offer'
                ],
                availability: 'In Stock',
                rating: matchedProduct?.rating || '0',
                reviewCount: matchedProduct?.reviewCount || matchedProduct?.totalReviews || 0,
                model: offer.badgeTag || matchedProduct?.model || 'SPECIAL DEAL'
              };

              return (
                <div key={`${offer.id}-${idx}`} className="offers-product-item">
                  <ProductCard product={mappedProduct} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
