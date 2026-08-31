import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Play, Star, MessageSquare } from 'lucide-react';
import { getActiveTestimonials, getTestimonials, resolveImageUrl } from '../../services/testimonialsApi';
import SectionHeading from '../common/SectionHeading';
import Modal from '../common/Modal';

export default function TestimonialsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [video, setVideo] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        // Attempt to fetch active testimonials from backend API
        let data = await getActiveTestimonials().catch(() => []);
        if ((!data || data.length === 0)) {
          // Fallback to general list if active endpoint returns empty
          data = await getTestimonials().catch(() => []);
        }

        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setItems(list);
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

  // Autoplay timer
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % items.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const currentItem = items[active];

  return (
    <section className="testimonials-section">
      <div className="container">
        <SectionHeading
          eyebrow="CUSTOMER PERSPECTIVES"
          title="Built around real operational needs"
          description="Hear directly from clients and business owners who rely on our solutions."
        />

        <div className="testimonial-layout">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', width: '100%' }}>
              Loading testimonials from server...
            </div>
          ) : items.length > 0 && currentItem ? (
            <article className="review-card" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <div className="review-stars">
                {Array.from({ length: currentItem.rating || 5 }).map((_, index) => (
                  <Star key={index} size={17} fill="currentColor" />
                ))}
              </div>
              <blockquote>“{currentItem.text || currentItem.quote}”</blockquote>
              <div className="review-author">
                {(currentItem.imageUrl || currentItem.image) ? (
                  <img
                    src={resolveImageUrl(currentItem.imageUrl || currentItem.image)}
                    alt={currentItem.name || 'Client'}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentItem.name || 'Client') + '&background=e2e8f0&color=64748b';
                    }}
                  />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#005F53', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                    {(currentItem.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <span>
                  <strong>{currentItem.name}</strong>
                  <small>{currentItem.role || 'Client'}{currentItem.company ? ` • ${currentItem.company}` : ''}</small>
                </span>
              </div>
              {items.length > 1 && (
                <div className="review-controls">
                  <button
                    onClick={() => setActive((active - 1 + items.length) % items.length)}
                    aria-label="Previous testimonial"
                  >
                    <ArrowLeft />
                  </button>
                  <span>
                    {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setActive((active + 1) % items.length)}
                    aria-label="Next testimonial"
                  >
                    <ArrowRight />
                  </button>
                </div>
              )}
            </article>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', width: '100%', maxWidth: '700px', margin: '0 auto', border: '1px dashed #cbd5e1' }}>
              <MessageSquare size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#334155' }}>No Testimonials Available</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Client reviews added in the Admin panel will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!video} onClose={() => setVideo(null)} title={video?.title || ''} eyebrow="VIDEO TESTIMONIAL">
        <div className="video-placeholder">
          <Play size={44} />
          <p>Video testimonial placeholder</p>
          <small>The approved client video will play here.</small>
        </div>
      </Modal>
    </section>
  );
}
