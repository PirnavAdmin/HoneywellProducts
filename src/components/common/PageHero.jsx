import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHero({ eyebrow, title, description, image, children }) {
  return <section className="page-hero" style={image ? { '--page-image': `url(${image})` } : undefined}><div className="page-hero-overlay" /><div className="container page-hero-content"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>{title}</span></div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}{children}</div></section>;
}
