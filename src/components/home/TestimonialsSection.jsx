import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Play, Star } from 'lucide-react';
import { testimonials, videoTestimonials } from '../../data/testimonials';
import SectionHeading from '../common/SectionHeading';
import Modal from '../common/Modal';

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [video, setVideo] = useState(null);
  useEffect(() => { const timer = window.setInterval(() => setActive((value) => (value + 1) % testimonials.length), 5500); return () => window.clearInterval(timer); }, []);
  const testimonial = testimonials[active];
  return <section className="testimonials-section"><div className="container"><SectionHeading eyebrow="CUSTOMER PERSPECTIVES" title="Built around real operational needs" description="The content below is illustrative and should be replaced with approved customer stories." /><div className="testimonial-layout"><div className="video-stories">{videoTestimonials.map((item) => <button key={item.id} onClick={() => setVideo(item)} className="video-story"><img src={item.image} alt="" loading="lazy" /><span className="play"><Play fill="currentColor" /></span><strong>{item.title}</strong><small>{item.company}</small></button>)}</div><article className="review-card"><div className="review-stars">{Array.from({ length: testimonial.rating }).map((_, index) => <Star key={index} size={17} fill="currentColor" />)}</div><blockquote>“{testimonial.quote}”</blockquote><div className="review-author"><img src={testimonial.image} alt={testimonial.name} loading="lazy" /><span><strong>{testimonial.name}</strong><small>{testimonial.role} • {testimonial.company}</small></span></div><div className="review-controls"><button onClick={() => setActive((active - 1 + testimonials.length) % testimonials.length)} aria-label="Previous testimonial"><ArrowLeft /></button><span>{String(active + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}</span><button onClick={() => setActive((active + 1) % testimonials.length)} aria-label="Next testimonial"><ArrowRight /></button></div></article></div></div><Modal open={!!video} onClose={() => setVideo(null)} title={video?.title || ''} eyebrow="VIDEO TESTIMONIAL"><div className="video-placeholder"><Play size={44} /><p>Video testimonial placeholder</p><small>The approved client video will play here.</small></div></Modal></section>;
}
