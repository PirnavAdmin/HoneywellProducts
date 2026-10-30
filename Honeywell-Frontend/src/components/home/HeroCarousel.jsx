import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { bannerService } from '../../services/bannerService';
import { resolveBannerImage } from '../../admin/marketing/bannersApi';
import heroPoster from '../../assets/images/cctv-hero-poster.jpg';
import solarHero from '../../assets/images/smart-security-sustainable-future.png';

const HERO_SLIDES_CACHE_KEY = 'home_hero_slides';

const defaultHeroSlides = [
  {
    id: 'default-1',
    eyebrow: 'INTELLIGENT SURVEILLANCE • COMMERCIAL SECURITY',
    title: 'Advanced AI Surveillance & Security Systems',
    text: 'High-definition network cameras, smart video analytics, and unified surveillance infrastructure for enterprise protection.',
    primary: 'EXPLORE PRODUCTS',
    to: '/products',
    secondary: 'GET A QUOTE',
    quote: true,
    image: heroPoster
  },
  {
    id: 'default-2',
    eyebrow: 'SMART SECURITY • SUSTAINABLE FUTURE',
    title: 'Solar Powered Security & Off-Grid Solutions',
    text: 'Clean energy integrated CCTV systems designed for agricultural, perimeter and remote industrial monitoring.',
    primary: 'EXPLORE SOLAR KITS',
    to: '/products?category=solar-kit',
    secondary: 'CONTACT SALES',
    quote: false,
    image: solarHero
  }
];

const getCachedHeroSlides = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(HERO_SLIDES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

const setCachedHeroSlides = (slidesData) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(HERO_SLIDES_CACHE_KEY, JSON.stringify(slidesData));
  } catch {}
};

// Curated slide button architecture providing complete, zero-404 navigation
// across all primary areas of Honeywell Products:
const SLIDE_PRESETS = [
  // Slide 1: Hardware & Direct Quote
  {
    primary: 'EXPLORE PRODUCTS',
    to: '/products',
    secondary: 'GET A QUOTE',
    quote: true,
    secondaryTo: null,
    showSecondary: true
  },
  // Slide 2: Solutions & Business Partnerships
  {
    primary: 'EXPLORE SOLUTIONS',
    to: '/solutions',
    secondary: 'BUSINESS & PARTNERS',
    quote: false,
    secondaryTo: '/business',
    showSecondary: true
  },
  // Slide 3: About Us & Knowledge / Resources Hub
  {
    primary: 'ABOUT US',
    to: '/about-us',
    secondary: 'RESOURCES & GUIDES',
    quote: false,
    secondaryTo: '/resources',
    showSecondary: true
  },
  // Slide 4: Contact Sales & Customer Support / Help
  {
    primary: 'CONTACT SALES',
    to: '/contact',
    secondary: 'SUPPORT & FAQS',
    quote: false,
    secondaryTo: '/support',
    showSecondary: true
  }
];

export function getHeroSlideActions(banner, index = 0) {
  const customPrimary = (banner.ctaText || banner.buttonText || banner.primaryText || '').trim();
  const customSecondary = (banner.secondaryType || '').trim().toLowerCase();

  // Pick preset based on slide index
  const preset = SLIDE_PRESETS[index % SLIDE_PRESETS.length];

  // Resolve target URL safely (sanitizing any legacy /category or /product links to prevent 404s)
  let rawTo = banner.targetUrl ? String(banner.targetUrl).trim() : '';
  let to = preset.to;
  if (rawTo && !['/', '/category', '/categories', '/product'].includes(rawTo.toLowerCase())) {
    to = rawTo;
  }

  let primary = customPrimary || preset.primary;
  let secondary = preset.secondary;
  let quote = preset.quote;
  let secondaryTo = preset.secondaryTo;
  let showSecondary = preset.showSecondary;

  // Respect admin secondary override if explicitly selected
  if (customSecondary === 'none') {
    showSecondary = false;
  } else if (customSecondary === 'quote') {
    quote = true;
    secondary = 'GET A QUOTE';
    secondaryTo = null;
    showSecondary = true;
  } else if (customSecondary === 'contact') {
    quote = false;
    secondary = 'CONTACT SALES';
    secondaryTo = '/contact';
    showSecondary = true;
  }

  return {
    primary,
    to,
    secondary,
    quote,
    secondaryTo,
    showSecondary
  };
}

function HeroSlideItem({ slide, isActive, openQuote }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <article
      className={`hero-slide ${isActive ? 'active' : ''}`}
      aria-hidden={!isActive}
      style={{
        backgroundImage: slide.image ? `url("${slide.image}")` : 'none',
        '--hero-image': slide.image ? `url("${slide.image}")` : 'none'
      }}
    >
      {slide.image && (
        <img
          src={slide.image}
          alt={slide.title || 'Banner'}
          aria-hidden="true"
          style={{ display: 'none' }}
          onLoad={() => setImageLoaded(true)}
        />
      )}
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-text-wrap">
          {slide.eyebrow && <span className="eyebrow">{slide.eyebrow}</span>}
          {slide.title && <h1>{slide.title}</h1>}
          {slide.text && <p>{slide.text}</p>}
          <div className="hero-actions">
            <Link className="button" to={slide.to || '/products'} style={{ textDecoration: 'none' }}>
              {slide.primary || 'EXPLORE PRODUCTS'} <ArrowRight size={18} />
            </Link>
            {slide.showSecondary !== false && slide.secondary && (
              slide.quote ? (
                <button type="button" className="text-link" onClick={() => openQuote()} style={{ textDecoration: 'none' }}>
                  {slide.secondary} <ArrowRight size={18} />
                </button>
              ) : (
                <Link className="text-link" to={slide.secondaryTo || '/contact'} style={{ textDecoration: 'none' }}>
                  {slide.secondary} <ArrowRight size={18} />
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  
  // Instant mount using persistent cache or default slides (0ms delay on refresh)
  const [slides, setSlides] = useState(() => {
    const cached = getCachedHeroSlides();
    return cached || defaultHeroSlides;
  });
  
  const [isLoading, setIsLoading] = useState(() => !getCachedHeroSlides());
  const { openQuote } = useUI();
  const isMountedRef = useRef(true);

  const loadDynamicBanners = async () => {
    try {
      const banners = await bannerService.getActiveBanners('Hero');
      if (!isMountedRef.current) return;

      if (Array.isArray(banners) && banners.length > 0) {
        const heroBanners = banners.filter(
          (b) => !b.bannerType || b.bannerType.toLowerCase() === 'hero'
        );
        const finalBanners = heroBanners.length > 0 ? heroBanners : banners;

        // Map dynamic banner items created in Admin with distinct button actions per slide
        const liveSlides = finalBanners.map((b, idx) => {
          const actions = getHeroSlideActions(b, idx);
          return {
            id: b.id || idx,
            eyebrow: b.eyebrow || b.tag || b.badge || 'TECHNOLOGY • SECURITY • RELIABILITY',
            title: b.title || '',
            text: b.subtitle || b.description || '',
            primary: actions.primary,
            to: actions.to,
            secondary: actions.secondary,
            quote: actions.quote,
            secondaryTo: actions.secondaryTo,
            showSecondary: actions.showSecondary,
            image: resolveBannerImage(b.imageUrl)
          };
        });

        setSlides(liveSlides);
        setCachedHeroSlides(liveSlides);

        // Preload the primary slide image for immediate rendering
        if (liveSlides.length > 0 && liveSlides[0].image) {
          const preloader = new Image();
          preloader.src = liveSlides[0].image;
        }
      }
    } catch (err) {
      console.warn('[HeroCarousel] Could not load dynamic banners from API:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadDynamicBanners();

    const handleUpdate = () => {
      loadDynamicBanners();
    };
    window.addEventListener('banners-updated', handleUpdate);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('banners-updated', handleUpdate);
    };
  }, []);

  // Preload first slide image if present
  useEffect(() => {
    if (slides.length > 0 && slides[0].image) {
      const img = new Image();
      img.src = slides[0].image;
    }
  }, [slides]);

  useEffect(() => {
    if (paused || slides.length <= 1) return undefined;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % slides.length),
      2800
    );
    return () => window.clearInterval(timer);
  }, [active, paused, slides.length]);

  const move = (direction) =>
    setActive((value) => (value + direction + slides.length) % slides.length);

  if (isLoading && slides.length === 0) {
    return (
      <section
        className="hero-carousel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '450px'
        }}
      >
        <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
          Loading banners...
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Featured content"
      tabIndex="0"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') move(-1);
        if (event.key === 'ArrowRight') move(1);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, index) => (
        <HeroSlideItem
          key={`hero-slide-${slide.id || index}-${index}`}
          slide={slide}
          isActive={index === active}
          openQuote={openQuote}
        />
      ))}

      {slides.length > 1 && (
        <div className="hero-controls">
          <button onClick={() => move(-1)} aria-label="Previous slide">
            <ArrowLeft />
          </button>
          <div className="hero-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={index === active ? 'active' : ''}
                onClick={() => setActive(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === active}
              />
            ))}
          </div>
          <span>
            <strong>0{active + 1}</strong> / 0{slides.length}
          </span>
          <button onClick={() => move(1)} aria-label="Next slide">
            <ArrowRight />
          </button>
        </div>
      )}
    </section>
  );
}
