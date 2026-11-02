import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck, AlertCircle, Printer, ExternalLink, HelpCircle,
  FileText, CheckCircle2, Phone, Mail, MapPin, ChevronRight,
  Clock, ArrowUpRight, ListOrdered
} from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';
import heroImage from '../../assets/images/capital-park2.jpg';
import {
  legalPoliciesData,
  policyNavigationList,
  LEGAL_VERIFICATION_NOTICE
} from '../../data/legalPolicies';
import './PolicyPage.css';

export default function PolicyLayout({ policyKey }) {
  const policy = legalPoliciesData[policyKey];
  const { pathname } = useLocation();
  const [activeSection, setActiveSection] = useState(policy?.sections?.[0]?.id || '');

  useEffect(() => {
    if (policy) {
      document.title = `${policy.title} | ${siteConfig.name}`;
    }
  }, [policy]);

  useEffect(() => {
    if (!policy?.sections?.length) return;

    const handleScroll = () => {
      const scrollY = window.scrollY + 160;
      for (let i = policy.sections.length - 1; i >= 0; i--) {
        const sectionId = policy.sections[i].id;
        const el = document.getElementById(sectionId);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(sectionId);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [policy]);

  if (!policy) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Policy Not Found</h2>
        <p>The requested legal document could not be located.</p>
        <Link to="/privacy-policy" className="button">Return to Privacy Policy</Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
      window.history.replaceState(null, '', `#${sectionId}`);
    }
  };

  // Helper to render content with highlighted confirmation badges
  const renderParagraphContent = (text) => {
    const regex = /\[(Requires Business Confirmation|Requires Legal Confirmation): ([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const type = match[1];
      const detail = match[2];
      parts.push(
        <span key={match.index} className="policy-confirm-badge" title="Pending formal business or legal verification">
          <AlertCircle size={12} />
          <strong>{type}:</strong> {detail}
        </span>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const relatedPolicies = policyNavigationList.filter(item => item.slug !== policy.slug).slice(0, 4);

  return (
    <div className="policy-page-wrapper">
      {/* ── Compact Policy Header Banner ── */}
      <section className="policy-compact-hero" style={{ backgroundImage: `url("${heroImage}")` }}>
        <div className="policy-compact-overlay" />
        <div className="container policy-compact-content">
          <div className="policy-compact-header-row">
            <div className="policy-compact-left">
              
              <h1 className="policy-compact-title">{policy.title}</h1>
              <p className="policy-compact-summary">{policy.summary}</p>
              
              
            </div>

            <div className="policy-compact-actions">
              <button type="button" onClick={handlePrint} className="policy-hero-btn primary" title="Print this policy or save as PDF">
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
              <a href="#contact-particulars" onClick={(e) => scrollToSection(e, 'contact-particulars')} className="policy-hero-btn outline">
                <HelpCircle size={14} />
                <span>Compliance Desk</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Policy Switcher Bar ── */}
      <nav className="policy-switcher-bar" aria-label="Policy Navigation">
        <div className="policy-switcher-container">
          {policyNavigationList.map((item) => (
            <Link
              key={item.slug}
              to={item.path}
              className={`policy-switch-pill ${pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Main Layout: Sidebar TOC + Content ── */}
      <div className="policy-layout-grid">
        {/* Left Sticky TOC Sidebar */}
        <aside className="policy-sidebar" aria-label="Table of Contents">
          <div className="policy-toc-header">
            <h2 className="policy-toc-title">
              <ListOrdered size={16} />
              <span>Table of Contents</span>
            </h2>
            <span className="policy-toc-count">{policy.sections.length} Sections</span>
          </div>

          <nav>
            <ul className="policy-toc-list">
              {policy.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => scrollToSection(e, section.id)}
                    className={`policy-toc-link ${activeSection === section.id ? 'active' : ''}`}
                  >
                    <span>{section.title}</span>
                    <ChevronRight size={13} className="shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="policy-sidebar-support-card">
            <h4>
              <ShieldCheck size={15} />
              <span>Legal &amp; Compliance</span>
            </h4>
            <p>Need formal clarification on our statutory or commercial terms?</p>
            <a href={`mailto:${siteConfig.email}`}>
              <span>Email Compliance Desk</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </aside>

        {/* Right Content Body */}
        <article className="policy-content-article">
          {/* Business Review Notice Banner */}
          <div className="policy-verification-banner" role="alert">
            <AlertCircle size={20} className="policy-verification-icon" />
            <div className="policy-verification-body">
              <h4>{LEGAL_VERIFICATION_NOTICE.title}</h4>
              <p>{LEGAL_VERIFICATION_NOTICE.body}</p>
            </div>
          </div>

          {/* Executive Summary Card */}
          <section className="policy-highlights-card">
            <div className="policy-highlights-header">
              <FileText size={18} className="text-red-600" />
              <h3>Policy Overview &amp; Key Highlights</h3>
            </div>
            <p className="policy-summary-text">{policy.summary}</p>
            <div className="policy-highlights-grid">
              {policy.keyHighlights.map((highlight, index) => (
                <div key={index} className="policy-highlight-item">
                  <span className="policy-highlight-bullet">✓</span>
                  <span>{renderParagraphContent(highlight)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Numbered Sections */}
          {policy.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="policy-section-card"
            >
              <div className="policy-section-header">
                <span className="policy-section-number">{section.number}</span>
                <h3 className="policy-section-title">{section.title}</h3>
              </div>
              <div className="policy-section-content">
                {section.content.map((para, pIdx) => (
                  <p key={pIdx}>
                    {renderParagraphContent(para)}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {/* Contact & Grievance Box */}
          <section id="contact-particulars" className="policy-contact-box">
            <h3>
              <ShieldCheck size={22} />
              <span>Statutory Compliance &amp; Support Coordinates</span>
            </h3>
            <p>
              For questions regarding this policy, to exercise your statutory rights under the Digital Personal Data Protection Act, or to file a grievance under Consumer Protection Rules, please reach out to our authorized desk:
            </p>
            <div className="policy-contact-grid">
              <div className="policy-contact-item">
                <span className="label">Storefront Entity</span>
                <span className="value">{siteConfig.name}</span>
              </div>
              <div className="policy-contact-item">
                <span className="label">Compliance Email</span>
                <a href={siteConfig.emailLink}>{siteConfig.email}</a>
              </div>
              <div className="policy-contact-item">
                <span className="label">Direct Hotline</span>
                <a href={siteConfig.phoneLink}>{siteConfig.phone}</a>
              </div>
              <div className="policy-contact-item">
                <span className="label">Registered Address</span>
                <span className="value">{siteConfig.address}</span>
              </div>
              <div className="policy-contact-item">
                <span className="label">Grievance Escalation</span>
                <Link to="/grievance-redressal">View Grievance Officer Details</Link>
              </div>
              <div className="policy-contact-item">
                <span className="label">Operating Hours</span>
                <span className="value">Mon – Sat: 9:30 AM – 6:30 PM IST</span>
              </div>
            </div>
          </section>

          {/* Related Policies */}
          <section className="policy-related-section">
            <h3>Related Policies &amp; Terms</h3>
            <div className="policy-related-grid">
              {relatedPolicies.map((rel) => (
                <Link key={rel.slug} to={rel.path} className="policy-related-card">
                  <strong>
                    <span>{rel.label}</span>
                    <ArrowUpRight size={13} />
                  </strong>
                  <p>{rel.shortDesc}</p>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
