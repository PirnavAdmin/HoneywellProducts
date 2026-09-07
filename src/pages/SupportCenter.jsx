import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Wrench, ShieldCheck, Download, PhoneCall } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import heroImage from '../assets/images/capital-park2.jpg';

export default function SupportCenter() {
  return (
    <>
      <PageHero
        eyebrow="SUPPORT CENTER"
        title="Honeywell Customer Support Hub"
        description="We are here to assist with product setup, technical service, warranty claims, and documentation."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="support-hubs-grid">
            <Link to="/service-request" className="support-hub-card">
              <div className="hub-card-icon"><Wrench size={28} /></div>
              <h3>Service &amp; Repair Request</h3>
              <p>Submit a technical support or hardware repair ticket for your product.</p>
              <span className="hub-card-action">Submit Ticket &rarr;</span>
            </Link>

            <Link to="/warranty" className="support-hub-card">
              <div className="hub-card-icon"><ShieldCheck size={28} /></div>
              <h3>Warranty &amp; Returns</h3>
              <p>Check product warranty coverage, eligibility, and request RMA replacements.</p>
              <span className="hub-card-action">Check Warranty &rarr;</span>
            </Link>

            <Link to="/downloads" className="support-hub-card">
              <div className="hub-card-icon"><Download size={28} /></div>
              <h3>Downloads &amp; Software</h3>
              <p>Get official datasheets, user manuals, firmware updates, and software.</p>
              <span className="hub-card-action">Browse Downloads &rarr;</span>
            </Link>

            <Link to="/contact" className="support-hub-card">
              <div className="hub-card-icon"><PhoneCall size={28} /></div>
              <h3>Direct Contact</h3>
              <p>Get in touch with our customer assistance &amp; technical sales hotline.</p>
              <span className="hub-card-action">Contact Us &rarr;</span>
            </Link>
          </div>

          <div className="support-faqs-section mt-5">
            <h2>Frequently Asked Questions</h2>
            <div className="faqs-accordion">
              <details className="faq-item">
                <summary>How do I check if my product is eligible for warranty coverage?</summary>
                <p>You can check warranty status by visiting our <Link to="/warranty">Warranty Page</Link> and entering your Order ID or Product Serial Number.</p>
              </details>
              <details className="faq-item">
                <summary>Where can I download product datasheets and installation manuals?</summary>
                <p>All product documentation is available in the <Link to="/downloads">Downloads Center</Link> or under the Downloads tab on individual Product Details pages.</p>
              </details>
              <details className="faq-item">
                <summary>What is the standard response time for a technical service request?</summary>
                <p>Our technical team responds to submitted service requests within 24 business hours.</p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
