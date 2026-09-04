import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, Star, MapPin, ShieldCheck, Sun } from 'lucide-react';
import { getActiveTestimonials, getTestimonials, resolveImageUrl } from '../../services/testimonialsApi';
import SectionHeading from '../common/SectionHeading';
import Modal from '../common/Modal';
import cctvCamera from '../../assets/images/catalog/cctv-camera.jpg';
import solarCamera from '../../assets/images/catalog/solar-camera.jpg';
import ipCamera from '../../assets/images/catalog/ip-camera.jpg';

const defaultTestimonials = [
  {
    id: 1,
    name: 'Robert Chen',
    role: 'Security Manager',
    company: 'Apex Logistics',
    rating: 5,
    quote: 'The CCTV surveillance and perimeter monitoring setup exceeded our expectations. Crystal clear HD streams, reliable NVR recording, and responsive mobile remote access.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    category: 'CCTV Security',
  },
  {
    id: 2,
    name: 'Ananya Sharma',
    role: 'Operations Director',
    company: 'GreenEnergy Tech',
    rating: 5,
    quote: 'Outstanding rooftop solar panel installation and hybrid inverter commissioning. Our facility energy cost has dropped significantly with 100% clean power reliability.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    category: 'Solar Installation',
  },
  {
    id: 3,
    name: 'Vikram Malhotra',
    role: 'Infrastructure Head',
    company: 'Metro Warehousing',
    rating: 5,
    quote: 'Comprehensive IP camera, PoE switch, and 4G security integration. Professional deployment team, clean cabling, and excellent post-installation support.',
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=300&q=80',
    category: 'Connected Security',
  },
  {
    id: 4,
    name: 'Priya Nair',
    role: 'Regional Manager',
    company: 'Horizon Retail Chain',
    rating: 4.9,
    quote: 'High-resolution dome and bullet camera setup across 12 retail branches. Night vision clarity is superb and remote store monitoring is seamless.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    category: 'Commercial CCTV',
  },
  {
    id: 5,
    name: 'Siddharth Rao',
    role: 'Project Engineer',
    company: 'SunPower Solutions',
    rating: 5,
    quote: 'High-efficiency bifacial solar panels and smart micro-inverter setup. Excellent power generation yield and real-time app monitoring.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    category: 'Solar Micro-Inverter',
  },
  {
    id: 6,
    name: 'Meera Kulkarni',
    role: 'Estate Administrator',
    company: 'Greenfield Heights',
    rating: 4.8,
    quote: '4G solar security cameras for gate entry and perimeter fence. Zero wiring required, easy setup, and 24/7 battery backup power.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80',
    category: 'Wireless & 4G Security',
  },
  {
    id: 7,
    name: 'Arjun Deshmukh',
    role: 'Operations Manager',
    company: 'Titan Industrial Estate',
    rating: 5,
    quote: 'Heavy-duty solar gel battery bank and 10kVA hybrid inverter system. Flawless performance during grid outages with zero power drop for automated machinery.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    category: 'Solar Battery & Inverter',
  },
  {
    id: 8,
    name: 'Kavita Reddy',
    role: 'Chief Security Officer',
    company: 'Apex Hospitals Group',
    rating: 4.9,
    quote: 'AI-enabled IP dome cameras and 64-channel NVR system. Crystal-clear corridor monitoring, facial recognition integration, and strict HIPAA-level privacy compliance.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    category: 'Hospital CCTV & NVR',
  },
  {
    id: 9,
    name: 'Rajesh Varma',
    role: 'Managing Director',
    company: 'Varma Agro Tech',
    rating: 5,
    quote: 'Solar-powered water pump inverter system and farm solar array. High flow rate irrigation without relying on diesel generators or unstable rural grid power.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    category: 'Solar Water Pump',
  },
];

const installationVideos = [
  {
    id: 'install-1',
    title: 'Commercial CCTV & NVR Installation',
    category: 'CCTV Installation',
    location: 'Bengaluru Facility',
    thumbnail: cctvCamera,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '2:45',
    icon: ShieldCheck,
  },
  {
    id: 'install-2',
    title: 'Rooftop Solar Panel & Inverter Setup',
    category: 'Solar Installation',
    location: 'Industrial Park',
    thumbnail: solarCamera,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '3:12',
    icon: Sun,
  },
  {
    id: 'install-3',
    title: 'High-Resolution IP Camera Setup',
    category: 'CCTV & Perimeter',
    location: 'Corporate Campus',
    thumbnail: ipCamera,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: '2:10',
    icon: ShieldCheck,
  },
];

export default function TestimonialsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState(null);
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
          const list = Array.isArray(data) && data.length > 0 ? data : defaultTestimonials;
          setItems(list);
        }
      } catch (err) {
        console.error('Error fetching testimonials from API:', err);
        if (isMounted) setItems(defaultTestimonials);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  return (
    <section className="testimonials-section">
      <div className="container">
        <SectionHeading
          eyebrow="CUSTOMER PERSPECTIVES"
          title="Built around real operational needs"
          description="Hear directly from clients and business owners who rely on our CCTV and solar solutions."
        />

        {/* HORIZONTAL SCROLLABLE REVIEWS */}
        <div className="reviews-scroll-wrapper">
          <div className="reviews-scroll-header">
            <span className="reviews-count-badge">{items.length} Verified Reviews</span>
            <div className="reviews-scroll-actions">
              <button onClick={handleScrollLeft} aria-label="Scroll reviews left">
                <ArrowLeft size={17} />
              </button>
              <button onClick={handleScrollRight} aria-label="Scroll reviews right">
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', width: '100%' }}>
              Loading testimonials from server...
            </div>
          ) : (
            <div className="reviews-scroll-track" ref={scrollRef}>
              {items.map((item, idx) => {
                const rating = Number(item.rating || 5);
                return (
                  <article key={item.id || idx} className="review-card">
                    <div className="review-rating-wrap" aria-label={`Rated ${rating} out of 5 stars`}>
                      <div className="review-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < rating ? '#f59e0b' : 'none'}
                            color={i < rating ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                      </div>
                      <span className="review-score">{rating.toFixed(1)}</span>
                      {item.category && <span className="review-category-badge">{item.category}</span>}
                    </div>
                    <blockquote>“{item.text || item.quote}”</blockquote>
                    <div className="review-author">
                      {(item.imageUrl || item.image) ? (
                        <img
                          src={resolveImageUrl(item.imageUrl || item.image)}
                          alt={item.name || 'Client'}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.name || 'Client') + '&background=e2e8f0&color=64748b';
                          }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                          {(item.name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.role || 'Client'}{item.company ? ` • ${item.company}` : ''}</small>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* INSTALLATION VIDEOS SHOWCASE */}
        <div className="installation-videos-section">
          <div className="installation-videos-grid">
            {installationVideos.map((item) => {
              const IconComp = item.icon;
              return (
                <article
                  key={item.id}
                  className="installation-video-card"
                  onClick={() => setVideo(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setVideo(item)}
                  aria-label={`Play video: ${item.title}`}
                >
                  <div className="video-card-thumb">
                    <img src={item.thumbnail} alt={item.title} loading="lazy" />
                    <div className="thumb-overlay" />
                    <div className="play-button-overlay">
                      <Play size={22} fill="currentColor" color="#ffffff" style={{ marginLeft: '3px' }} />
                    </div>
                    <span className="video-duration">{item.duration}</span>
                    <span className="video-category-tag">
                      <IconComp size={13} style={{ marginRight: '4px' }} />
                      {item.category}
                    </span>
                  </div>
                  <div className="video-card-body">
                    <h3>{item.title}</h3>
                    <small className="video-location">
                      <MapPin size={13} style={{ marginRight: '4px', color: 'var(--red)' }} />
                      {item.location}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIDEO LIGHTBOX MODAL */}
      <Modal open={!!video} onClose={() => setVideo(null)} title={video?.title || ''} eyebrow="INSTALLATION VIDEO HIGHLIGHT" size="wide">
        {video && (
          <div className="video-modal-container">
            <video
              src={video.videoUrl}
              controls
              autoPlay
              preload="metadata"
              poster={video.thumbnail}
              className="video-modal-player"
            >
              Your browser does not support HTML5 video playback.
            </video>
            <div className="video-modal-meta">
              <span className="video-category-tag">
                {video.category}
              </span>
              <small className="video-location">
                <MapPin size={13} style={{ marginRight: '4px', color: 'var(--red)' }} />
                {video.location}
              </small>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
