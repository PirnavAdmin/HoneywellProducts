import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Star, ShieldCheck, CheckCircle2, Quote, Award } from 'lucide-react';
import { getActiveTestimonials, getTestimonials, resolveImageUrl } from '../../services/testimonialsApi';
import SectionHeading from '../common/SectionHeading';

export default function TestimonialsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        let data = await getActiveTestimonials().catch(() => []);
        if (!data || data.length === 0) {
          data = await getTestimonials().catch(() => []);
        }

        if (isMounted) {
          const apiList = Array.isArray(data) ? data : [];
          setItems(apiList);
        }
      } catch (err) {
        console.error('Error fetching testimonials from API:', err);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Automatic smooth horizontal auto-scroll
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      
      // If reached the end, smoothly scroll back to start
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [items, isPaused]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft <= 10) {
        scrollRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
      }
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }
  };

  const avgRating = items.length > 0
    ? (items.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0) / items.length).toFixed(1)
    : '5.0';

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="testimonials-header-block">
          <SectionHeading
            eyebrow="CUSTOMER SUCCESS STORIES"
            title="Real Experiences from Customers Who Trust Our Solutions"
          />
          <div className="testimonials-stats-ribbon">
            <div className="trust-stat-item">
              <Award size={18} className="trust-stat-icon" />
              <div>
                <strong>{avgRating} / 5.0</strong>
                <span>Average Satisfaction</span>
              </div>
            </div>
            <div className="trust-stat-divider" />
            <div className="trust-stat-item">
              <ShieldCheck size={18} className="trust-stat-icon" />
              <div>
                <strong>100% Verified</strong>
                <span>Authentic Client Reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* HORIZONTAL SCROLLABLE REVIEWS */}
        <div className="reviews-scroll-wrapper">
          <div className="reviews-scroll-header">
            <div className="reviews-trust-pills">
              <span className="reviews-count-badge">
                <CheckCircle2 size={14} style={{ color: '#10b981' }} /> {items.length} Client Testimonials
              </span>
              <span className="reviews-rating-pill">
                ⭐ Rated <strong>{avgRating} / 5.0</strong> by Project Owners
              </span>
            </div>
            <div className="reviews-scroll-actions">
              <button onClick={handleScrollLeft} aria-label="Scroll reviews left">
                <ArrowLeft size={18} />
              </button>
              <button onClick={handleScrollRight} aria-label="Scroll reviews right">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', width: '100%' }}>
              Loading testimonials from server...
            </div>
          ) : (
            <div
              className="reviews-scroll-track"
              ref={scrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {items.map((item, idx) => {
                const rating = Number(item.rating || 5);
                const roleText = item.role || 'Verified Client';
                const companyText = item.company ? ` • ${item.company}` : '';
                const categoryText = item.category || 'Security & Solar Solution';

                return (
                  <article key={item.id || idx} className="review-card">
                    <div className="review-card-top">
                      <div className="review-rating-wrap" aria-label={`Rated ${rating} out of 5 stars`}>
                        <div className="review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={15}
                              fill={i < rating ? '#f59e0b' : 'none'}
                              color={i < rating ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                        <span className="review-score">{rating.toFixed(1)}</span>
                      </div>
                      <span className="review-badge">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    </div>

                    <div className="review-quote-body">
                      <Quote size={26} className="review-quote-icon" />
                      <blockquote>“{item.text || item.quote}”</blockquote>
                    </div>

                    <div className="review-card-footer">
                      <div className="review-author">
                        {(item.imageUrl || item.image) ? (
                          <img
                            src={resolveImageUrl(item.imageUrl || item.image)}
                            alt={item.name || 'Client'}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.name || 'Client') + '&background=e2e8f0&color=0f172a&bold=true';
                            }}
                          />
                        ) : (
                          <div className="review-avatar-fallback">
                            {(item.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="review-author-info">
                          <strong className="review-author-name">{item.name || 'Client'}</strong>
                          <small className="review-author-role">{roleText}{companyText}</small>
                        </div>
                      </div>
                      <span className="review-category-tag">{categoryText}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
