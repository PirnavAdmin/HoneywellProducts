import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import productsHeroImage from '../../assets/images/products-hero.png';
import smartSecurityImage from '../../assets/images/smart-security-sustainable-future.png';
import smartTechnologyImage from '../../assets/images/smart-technology-trends.png';

const slides = [
  { eyebrow: 'TECHNOLOGY • SECURITY • RELIABILITY', title: <>SMART TECHNOLOGY.<br /><em>STRONGER PROTECTION.</em></>, text: 'Professional security, surveillance and technology solutions designed for homes, businesses and industrial environments.', primary: 'EXPLORE PRODUCTS', to: '/products', secondary: 'CONTACT SALES', secondaryTo: '/contact', image: smartSecurityImage },
  { eyebrow: 'CCTV • IP CAMERAS • RECORDING', title: <>ADVANCED SECURITY<br /><em>PRODUCTS.</em></>, text: 'Discover professional surveillance products designed for reliable monitoring, intelligent security and scalable installations.', primary: 'VIEW PRODUCTS', to: '/products', secondary: 'GET A QUOTE', quote: true, image: productsHeroImage },
  { eyebrow: 'AI • IOT • REMOTE MONITORING', title: <>TECHNOLOGY TRENDS<br /><em>SHAPING TOMORROW.</em></>, text: 'Follow developments in intelligent security, connected infrastructure, automation and sustainable technology.', primary: 'EXPLORE SOLUTIONS', to: '/solutions', secondary: 'TALK TO OUR TEAM', secondaryTo: '/contact', image: smartTechnologyImage },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const { openQuote } = useUI();
  useEffect(() => { if (paused) return undefined; const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6500); return () => window.clearInterval(timer); }, [paused]);
  const move = (direction) => setActive((value) => (value + direction + slides.length) % slides.length);
  return (
    <section className="hero-carousel" aria-roledescription="carousel" aria-label="Featured content" tabIndex="0" onKeyDown={(event) => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); }} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((slide, index) => <article key={slide.eyebrow} className={`hero-slide ${index === active ? 'active' : ''}`} aria-hidden={index !== active} style={{ '--hero-image': `url(${slide.image})` }}><div className="hero-overlay" /><div className="hero-content"><p className="eyebrow">{slide.eyebrow}</p><h1>{slide.title}</h1><p>{slide.text}</p><div className="hero-actions"><Link className="button" to={slide.to}>{slide.primary} <ArrowRight size={18} /></Link>{slide.quote ? <button className="text-link" onClick={() => openQuote()}>{slide.secondary} <ArrowRight size={18} /></button> : <Link className="text-link" to={slide.secondaryTo}>{slide.secondary} <ArrowRight size={18} /></Link>}</div></div></article>)}
      <div className="hero-controls"><button onClick={() => move(-1)} aria-label="Previous slide"><ArrowLeft /></button><div className="hero-dots">{slides.map((_, index) => <button key={index} className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Go to slide ${index + 1}`} aria-current={index === active} />)}</div><span><strong>0{active + 1}</strong> / 0{slides.length}</span><button onClick={() => move(1)} aria-label="Next slide"><ArrowRight /></button></div>
    </section>
  );
}
