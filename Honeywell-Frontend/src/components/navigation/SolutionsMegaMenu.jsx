import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Sun, Layers, Home, Building2, Factory, ShoppingBag, GraduationCap, HeartPulse, ArrowRight } from 'lucide-react';

export default function SolutionsMegaMenu({ onClose }) {
  return (
    <div className="mega-menu mega-menu-solutions" onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-grid">
        <div className="mega-column">
          <h4 className="mega-title">Solutions</h4>
          <ul className="mega-list">
            <li>
              <Link to="/solutions?solution=security-surveillance" onClick={onClose}>
                <Shield size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Security &amp; Surveillance</span>
                  <span className="mega-link-desc">High-definition monitoring systems</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/solutions?solution=smart-security" onClick={onClose}>
                <Smartphone size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Smart Security</span>
                  <span className="mega-link-desc">AI-powered analytics &amp; smart alerts</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/solutions?solution=solar-solutions" onClick={onClose}>
                <Sun size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Solar Solutions</span>
                  <span className="mega-link-desc">Off-grid &amp; hybrid solar power setups</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/solutions?solution=integrated-solutions" onClick={onClose}>
                <Layers size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Integrated Solutions</span>
                  <span className="mega-link-desc">Unified access control &amp; video control</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div className="mega-column mega-column-wide">
          <h4 className="mega-title">Industries</h4>
          <div className="mega-subgrid">
            <Link to="/industries?type=residential" onClick={onClose} className="mega-grid-item">
              <Home size={18} className="mega-icon" />
              <span>Residential</span>
            </Link>
            <Link to="/industries?type=commercial" onClick={onClose} className="mega-grid-item">
              <Building2 size={18} className="mega-icon" />
              <span>Commercial</span>
            </Link>
            <Link to="/industries?type=industrial" onClick={onClose} className="mega-grid-item">
              <Factory size={18} className="mega-icon" />
              <span>Industrial</span>
            </Link>
            <Link to="/industries?type=retail" onClick={onClose} className="mega-grid-item">
              <ShoppingBag size={18} className="mega-icon" />
              <span>Retail</span>
            </Link>
            <Link to="/industries?type=education" onClick={onClose} className="mega-grid-item">
              <GraduationCap size={18} className="mega-icon" />
              <span>Education</span>
            </Link>
            <Link to="/industries?type=healthcare" onClick={onClose} className="mega-grid-item">
              <HeartPulse size={18} className="mega-icon" />
              <span>Healthcare</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mega-footer">
        <Link to="/industries" className="mega-action-link" onClick={onClose}>
          Explore All Industry Solutions <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
