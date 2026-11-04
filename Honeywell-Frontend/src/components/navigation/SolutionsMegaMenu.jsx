import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Building2, Factory, ShoppingBag, GraduationCap, HeartPulse, ArrowRight } from 'lucide-react';

export default function SolutionsMegaMenu({ onClose }) {
  return (
    <div className="mega-menu mega-menu-solutions" onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="mega-column">
          <h4 className="mega-title">Industry Solutions</h4>
          <div className="mega-subgrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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

      <div className="mega-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/solutions" className="mega-action-link" onClick={onClose}>
          Solutions Overview <ArrowRight size={16} />
        </Link>
        <Link to="/industries" className="mega-action-link" onClick={onClose}>
          Explore All Industries <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
