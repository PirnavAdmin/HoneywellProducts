import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { bannerService } from '../../services/bannerService';
import productsHeroImage from '../../assets/images/products-hero.png';
import smartSecurityImage from '../../assets/images/smart-security-sustainable-future.png';
import smartTechnologyImage from '../../assets/images/smart-technology-trends.png';

const fallbackSlides = [
  { eyebrow: 'TECHNOLOGY • SECURITY • RELIABILITY', title: 'SMART TECHNOLOGY. STRONGER PROTECTION.', text: 'Professional security, surveillance and technology solutions designed for homes, businesses and industrial environments.', primary: 'EXPLORE PRODUCTS', to: '/products', secondary: 'CONTACT SALES', secondaryTo: '/contact', image: smartSecurityImage },
  { eyebrow: 'CCTV • IP CAMERAS • RECORDING', title: 'ADVANCED SECURITY PRODUCTS.', text: 'Discover professional surveillance products designed for reliable monitoring, intelligent security and scalable installations.', primary: 'VIEW PRODUCTS', to: '/products', secondary: 'GET A QUOTE', quote: true, image: productsHeroImage },
  { eyebrow: 'AI • IOT • REMOTE MONITORING', title: 'TECHNOLOGY TRENDS SHAPING TOMORROW.', text: 'Follow developments in intelligent security, connected infrastructure, automation and sustainable technology.', primary: 'EXPLORE SOLUTIONS', to: '/solutions', secondary: 'TALK TO OUR TEAM', secondaryTo: '/contact', image: smartTechnologyImage },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slides, setSlides] = useState(fallbackSlides);
  const { openQuote } = useUI();

  useEffect(() => {
    let isMounted = true;
    bannerService.getActiveBanners()
      .then((banners) => {
        if (isMounted && Array.isArray(banners) && banners.length > 0) {
          const liveSlides = banners.map(b => ({
            eyebrow: 'FEATURED PROMO BANNER',
            title: b.title || 'SPECIAL PROMOTION',
            text: b.subtitle || 'Explore our latest Honeywell products and solution offers.',
            primary: 'EXPLORE OFFERS',
            to: b.targetUrl || '/products',
            secondary: 'GET A QUOTE',
            quote: true,
            image: b.imageUrl || smartSecurityImage
          }));
          setSlides(liveSlides);
        }
      })
      .catch((err) => {
        console.warn('Could not load live hero banners from API:', err);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (paused || slides.length <= 1) return undefined;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 3500);
    return () => window.clearInterval(timer);
  }, [active, paused, slides.length]);

  const move = (direction) => setActive((value) => (value + direction + slides.length) % slides.length);

  return (
    <section className="hero-carousel" aria-roledescription="carousel" aria-label="Featured content" tabIndex="0" onKeyDown={(event) => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((slide, index) => (
        <article key={`${slide.eyebrow}-${index}`} className={`hero-slide ${index === active ? 'active' : ''}`} aria-hidden={index !== active} style={{ '--hero-image': `url(${slide.image})` }}>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">{slide.eyebrow}</p>
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>
            <div className="hero-actions">
              <Link className="button" to={slide.to}>{slide.primary} <ArrowRight size={18} /></Link>
              {slide.quote ? <button className="text-link" onClick={() => openQuote()}>{slide.secondary} <ArrowRight size={18} /></button> : <Link className="text-link" to={slide.secondaryTo}>{slide.secondary} <ArrowRight size={18} /></Link>}
            </div>
          </div>
        </article>
      ))}
      <div className="hero-controls">
        <button onClick={() => move(-1)} aria-label="Previous slide"><ArrowLeft /></button>
        <div className="hero-dots">
          {slides.map((_, index) => <button key={index} className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Go to slide ${index + 1}`} aria-current={index === active} />)}
        </div>
        <span><strong>0{active + 1}</strong> / 0{slides.length}</span>
        <button onClick={() => move(1)} aria-label="Next slide"><ArrowRight /></button>
      </div>
    </section>
  );
}
