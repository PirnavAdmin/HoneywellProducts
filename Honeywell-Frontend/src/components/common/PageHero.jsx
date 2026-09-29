import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHero({ eyebrow, title, description, image, children, className = '' }) {
  return (
    <section className={`page-hero ${className}`.trim()} style={image ? { '--page-image': `url(${image})` } : undefined}>
      <div className="page-hero-overlay" />
      <div className="container page-hero-content">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>{title}</span>
        </div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h1>{title}</h1>}
        {description && <p>{description}</p>}
        {children}
      </div>
    </section>
  );
}

