import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sun, ShieldCheck, Wrench, Search, Tag, Download, FileText, HelpCircle, ArrowRight } from 'lucide-react';

export default function ProductsMegaMenu({ onClose }) {
  return (
    <div className="mega-menu mega-menu-products" onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-grid">
        <div className="mega-column">
          <h4 className="mega-title">Product Categories</h4>
          <ul className="mega-list">
            <li>
              <Link to="/products?category=network-cameras" onClick={onClose}>
                <Camera size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Network Cameras</span>
                  <span className="mega-link-desc">High-Definition IP Network Cameras</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/products?category=solar-kit" onClick={onClose}>
                <Sun size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Solar kit</span>
                  <span className="mega-link-desc">Complete Solar Power Kit Systems</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/products?category=solar-panels" onClick={onClose}>
                <Sun size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Solar panels</span>
                  <span className="mega-link-desc">High-Efficiency Solar Modules</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/products?category=turbo-hd-cameras" onClick={onClose}>
                <ShieldCheck size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Turbo HD Cameras</span>
                  <span className="mega-link-desc">High-Definition Turbo HD Cameras</span>
                </div>
              </Link>
            </li>
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
