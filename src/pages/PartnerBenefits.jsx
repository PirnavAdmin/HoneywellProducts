import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Handshake, LogIn, LayoutDashboard, ShieldCheck } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { useUI } from '../context/UIContext';
import heroImage from '../assets/images/capital-park2.jpg';

export default function PartnerBenefits() {
  const { openQuote } = useUI();

  return (
    <>
      <PageHero
        eyebrow="PARTNER PROGRAM"
        title="Honeywell Partner Program &amp; Benefits"
        description="Join our network of authorized distributors, system integrators, and commercial partners."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefit-card">
              <Handshake size={28} className="benefit-icon" />
              <h3>Dedicated Business Support</h3>
              <p>Direct channel access to sales representatives, technical pre-sales support, and project design consultation.</p>
            </div>

            <div className="benefit-card">
              <ShieldCheck size={28} className="benefit-icon" />
              <h3>Product Training &amp; Enablement</h3>
              <p>Technical training courses, product certification access, and technical documentation portal access.</p>
            </div>

            <div className="benefit-card">
              <LayoutDashboard size={28} className="benefit-icon" />
              <h3>Partner Center Portal</h3>
              <p>Access the authorized Partner Dashboard to track deal registration, quotes, and order status.</p>
            </div>
          </div>

          <div className="partner-cta-box text-center mt-5">
            <h3>Become a Honeywell Authorized Partner</h3>
            <p>Submit your company details for partner account registration and evaluation.</p>
            <div className="btn-group justify-center mt-3">
              <Link to="/business#partner" className="button">
                Submit Partner Registration &rarr;
              </Link>
              <Link to="/partner/login" className="button button-outline">
                <LogIn size={15} /> Partner Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
