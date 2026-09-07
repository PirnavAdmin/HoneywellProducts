import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Newspaper, FileCheck, PlaySquare, Download, FileText, HelpCircle, LifeBuoy, Wrench, ShieldAlert, ArrowRight } from 'lucide-react';

export default function ResourcesMegaMenu({ onClose }) {
  return (
    <div className="mega-menu mega-menu-resources" onClick={(e) => e.stopPropagation()}>
      <div className="mega-menu-grid">
        <div className="mega-column">
          <h4 className="mega-title">Learn</h4>
          <ul className="mega-list">
            <li>
              <Link to="/resources" onClick={onClose}>
                <BookOpen size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Resource Hub</span>
                  <span className="mega-link-desc">All technical &amp; product guides</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/blogs" onClick={onClose}>
                <Newspaper size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Blog &amp; Articles</span>
                  <span className="mega-link-desc">Latest security &amp; solar insights</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/case-studies" onClick={onClose}>
                <FileCheck size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Case Studies</span>
                  <span className="mega-link-desc">Real customer implementations</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/videos" onClick={onClose}>
                <PlaySquare size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Video Center</span>
                  <span className="mega-link-desc">Demos, tutorials &amp; webinars</span>
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
                  <span className="mega-link-title">Downloads Center</span>
                  <span className="mega-link-desc">Firmware, software &amp; manuals</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/downloads?tab=documents" onClick={onClose}>
                <FileText size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Product Documents</span>
                  <span className="mega-link-desc">Specifications &amp; datasheets</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/support?tab=faqs" onClick={onClose}>
                <HelpCircle size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">FAQs</span>
                  <span className="mega-link-desc">Frequent questions &amp; answers</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div className="mega-column">
          <h4 className="mega-title">Customer Support</h4>
          <ul className="mega-list">
            <li>
              <Link to="/support" onClick={onClose}>
                <LifeBuoy size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Support Center</span>
                  <span className="mega-link-desc">Help, contact &amp; resolution hub</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/service-request" onClick={onClose}>
                <Wrench size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Service Request</span>
                  <span className="mega-link-desc">Submit repair or inspection ticket</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/warranty" onClick={onClose}>
                <ShieldAlert size={18} className="mega-icon" />
                <div>
                  <span className="mega-link-title">Warranty &amp; Returns</span>
                  <span className="mega-link-desc">Check status &amp; claim warranty</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mega-footer">
        <Link to="/support" className="mega-action-link" onClick={onClose}>
          Visit Main Customer Support Hub <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
