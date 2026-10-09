import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, FileText, Cookie } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { siteConfig } from '../config/siteConfig';
import heroImage from '../assets/images/capital-park2.jpg';

export default function LegalPage() {
  const { pathname } = useLocation();

  let title = 'Privacy Policy';
  let eyebrow = 'LEGAL & PRIVACY';

  if (pathname.includes('terms')) {
    title = 'Terms & Conditions';
    eyebrow = 'TERMS OF SERVICE';
  } else if (pathname.includes('cookie')) {
    title = 'Cookie Policy';
    eyebrow = 'COOKIE POLICY';
  } else if (pathname.includes('warranty')) {
    title = 'Warranty Policy';
    eyebrow = 'WARRANTY TERMS';
  }

  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description="Official legal terms, conditions, and privacy policies for Honeywell Products."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="legal-content-box">
            <section className="legal-section">
              <h2>1. Introduction &amp; Scope</h2>
              <p>
                This policy applies to all visitors, customers, and partners accessing Honeywell Products website services, e-commerce order processing, and support platforms operated under official branding.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Data Usage &amp; Customer Privacy</h2>
              <p>
                We handle customer information strictly in accordance with applicable data privacy regulations. Information submitted through contact forms, product enquiries, and orders is processed solely for order fulfillment, technical support, and account management.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Warranty &amp; Product Claims</h2>
              <p>
                Hardware products supplied by Honeywell are backed by standard manufacturer warranty coverage. For warranty eligibility checks, technical service tickets, or RMA replacement inquiries, please visit our <Link to="/warranty">Warranty Page</Link> or submit a <Link to="/service-request">Service Request</Link>.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Contact Information</h2>
              <p>
                For any questions regarding legal policies or data privacy inquiries, contact our compliance team at <strong>{siteConfig.email}</strong>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
