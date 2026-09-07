import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sun, ShieldCheck, Wrench, Search, GitCompare, Tag, Download, FileText, HelpCircle, ArrowRight } from 'lucide-react';

export default function ProductsMegaMenu({ onClose }) {
  return (
    <div className="mega-menu mega-menu-products" onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-grid">
        <div className="mega-column">
          <h4 className="mega-title">Product Categories</h4>
          <ul className="mega-list">
            <li>
              <Link to="/products?category=cctv-cameras" onClick={onClose}>
                <Camera size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">CCTV Cameras</span>
                  <span className="mega-link-desc">IP, PTZ, Dome &amp; Bullet Cameras</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/products?category=solar-panels" onClick={onClose}>
                <Sun size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Solar Panels</span>
                  <span className="mega-link-desc">High-Efficiency Solar Modules</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/products?category=security-products" onClick={onClose}>
                <ShieldCheck size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Security Products</span>
                  <span className="mega-link-desc">Access Control &amp; Alarm Systems</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/products?category=accessories" onClick={onClose}>
                <Wrench size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Accessories</span>
                  <span className="mega-link-desc">Cables, Power Supply &amp; Mounts</span>
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
              <Link to="/compare" onClick={onClose}>
                <GitCompare size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Compare Products</span>
                  <span className="mega-link-desc">Side-by-side spec comparison</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/offers" onClick={onClose}>
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
                  <span className="mega-link-desc">Brochures, Software &amp; Manuals</span>
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
