import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Handshake, Award, Store, UserCheck, LogIn, LayoutDashboard, ShieldCheck, ArrowRight } from 'lucide-react';

export default function BusinessMegaMenu({ onClose }) {
  return (
    <div className="mega-menu mega-menu-business" onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-grid">
        <div className="mega-column">
          <h4 className="mega-title">Business Opportunities</h4>
          <ul className="mega-list">
            <li>
              <Link to="/business#distributor" onClick={onClose}>
                <Truck size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Distributor Program</span>
                  <span className="mega-link-desc">Become a regional supply partner</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/business#partner" onClick={onClose}>
                <Handshake size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">System Integrator &amp; Partner</span>
                  <span className="mega-link-desc">Partner with Honeywell Products</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/partner-benefits" onClick={onClose}>
                <Award size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Partner Benefits</span>
                  <span className="mega-link-desc">Training, margins &amp; support</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/business#franchise" onClick={onClose}>
                <Store size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Franchise Opportunities</span>
                  <span className="mega-link-desc">Open an authorized outlet</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/business#careers" onClick={onClose}>
                <UserCheck size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Direct Employee / Careers</span>
                  <span className="mega-link-desc">Join our growing team</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div className="mega-column">
          <h4 className="mega-title">Partner Center</h4>
          <ul className="mega-list">
            <li>
              <Link to="/partner/login" onClick={onClose}>
                <LogIn size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Partner Login</span>
                  <span className="mega-link-desc">Access authorized partner portal</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/partner/dashboard" onClick={onClose}>
                <LayoutDashboard size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Partner Dashboard</span>
                  <span className="mega-link-desc">Manage quotes, leads &amp; orders</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/partner-benefits" onClick={onClose}>
                <ShieldCheck size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Program Tiers &amp; Terms</span>
                  <span className="mega-link-desc">Requirements &amp; certification</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mega-footer">
        <Link to="/business" className="mega-action-link" onClick={onClose}>
          View Business Portal Overview <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
