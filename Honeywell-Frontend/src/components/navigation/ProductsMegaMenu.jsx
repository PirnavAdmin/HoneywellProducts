import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sun, ShieldCheck, Wrench, Search, Tag, Download, FileText, HelpCircle, ArrowRight, Layers, Video } from 'lucide-react';
import { categoryService } from '../../services/categoryService';

const getCategoryIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('solar') || lower.includes('sun') || lower.includes('panel') || lower.includes('kit')) {
    return <Sun size={18} className="mega-icon" />;
  }
  if (lower.includes('turbo') || lower.includes('shield') || lower.includes('security')) {
    return <ShieldCheck size={18} className="mega-icon" />;
  }
  if (lower.includes('nvr') || lower.includes('dvr') || lower.includes('recorder') || lower.includes('video')) {
    return <Video size={18} className="mega-icon" />;
  }
  if (lower.includes('camera') || lower.includes('cctv') || lower.includes('network') || lower.includes('dome') || lower.includes('bullet') || lower.includes('ptz')) {
    return <Camera size={18} className="mega-icon" />;
  }
  return <Layers size={18} className="mega-icon" />;
};

const defaultCategories = [
  { id: 'network-cameras', slug: 'network-cameras', name: 'Network Cameras', description: 'High-Definition IP Network Cameras' },
  { id: 'solar-kit', slug: 'solar-kit', name: 'Solar kit', description: 'Complete Solar Power Kit Systems' },
  { id: 'solar-panels', slug: 'solar-panels', name: 'Solar panels', description: 'High-Efficiency Solar Modules' },
  { id: 'turbo-hd-cameras', slug: 'turbo-hd-cameras', name: 'Turbo HD Cameras', description: 'High-Definition Turbo HD Cameras' },
];

export default function ProductsMegaMenu({ onClose }) {
  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    let isMounted = true;
    categoryService.getAll()
      .then((cats) => {
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          const activeOnly = cats.filter(c => c.status !== 'Inactive' && c.isActive !== false);
          if (activeOnly.length > 0) {
            setCategories(activeOnly);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load categories for mega menu:', err);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="mega-menu mega-menu-products" onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-grid">
        <div className="mega-column">
          <h4 className="mega-title">Product Categories</h4>
          <ul className="mega-list">
            {categories.map((cat) => (
              <li key={cat.id || cat.slug}>
                <Link to={`/products?category=${cat.id || cat.slug}`} onClick={onClose}>
                  {getCategoryIcon(cat.name)}
                  <div>
                    <span className="mega-link-title">{cat.name}</span>
                    <span className="mega-link-desc">{cat.description || `Explore ${cat.name}`}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mega-column">
          <h4 className="mega-title">Product Tools</h4>
          <ul className="mega-list">
            <li>
              <Link to="/product-finder" onClick={onClose}>
                <Search size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Product Finder</span>
                  <span className="mega-link-desc">Find the right product by specs</span>
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/offers#offers-deals"
                onClick={(e) => {
                  if (onClose) onClose();
                  setTimeout(() => {
                    const el = document.getElementById('offers-deals');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 50);
                }}
              >
                <Tag size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Offers &amp; Deals</span>
                  <span className="mega-link-desc">Current promotions &amp; discounts</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div className="mega-column">
          <h4 className="mega-title">Product Resources</h4>
          <ul className="mega-list">
            <li>
              <Link to="/downloads" onClick={onClose}>
                <Download size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Downloads</span>
                  <span className="mega-link-desc">Brochures &amp; User Manuals</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/downloads?tab=documents" onClick={onClose}>
                <FileText size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Product Documents</span>
                  <span className="mega-link-desc">Datasheets &amp; Certifications</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/support?tab=faqs" onClick={onClose}>
                <HelpCircle size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Product FAQs</span>
                  <span className="mega-link-desc">Common technical questions</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mega-footer">
        <Link to="/products" className="mega-action-link" onClick={onClose}>
          View All Products <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
