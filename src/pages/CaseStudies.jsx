import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ArrowRight } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

const caseStudiesData = [
  {
    id: 1,
    title: 'Industrial Chemical Plant Perimeter Defense',
    industry: 'Industrial',
    category: 'CCTV & Thermal',
    summary: 'Deployed 120+ thermal and optical IP cameras with AI line-crossing analytics for a 50-acre chemical manufacturing plant.',
    results: '100% perimeter coverage with zero unauthorized intrusion incidents.',
    image: '/placeholder-casestudy.jpg'
  },
  {
    id: 2,
    title: 'Off-Grid Commercial Solar Array Deployment',
    industry: 'Commercial',
    category: 'Solar Power',
    summary: 'Installed high-efficiency hybrid solar panels with battery backup powering continuous security systems for a remote commercial site.',
    results: '45% reduction in grid power dependency with 99.99% system uptime.',
    image: '/placeholder-casestudy.jpg'
  },
  {
    id: 3,
    title: 'Retail Chain Loss Prevention Surveillance',
    industry: 'Retail',
    category: 'Smart Surveillance',
    summary: 'Upgraded 25 retail store locations with high-definition dome cameras integrated with POS transaction monitoring.',
    results: 'Reduced shrink and inventory loss by 38% in the first quarter.',
    image: '/placeholder-casestudy.jpg'
  }
];

export default function CaseStudies() {
  const [selectedIndustry, setSelectedIndustry] = useState('All');

  const filteredStudies = selectedIndustry === 'All'
    ? caseStudiesData
    : caseStudiesData.filter((c) => c.industry === selectedIndustry);

  return (
    <>
      <PageHero
        eyebrow="CASE STUDIES"
        title="Customer Case Studies"
        description="Explore real-world enterprise deployments of Honeywell products and security solutions."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="tabs-header justify-center mb-4">
            {['All', 'Industrial', 'Commercial', 'Retail'].map((ind) => (
              <button
                key={ind}
                className={`tab-btn ${selectedIndustry === ind ? 'active' : ''}`}
                onClick={() => setSelectedIndustry(ind)}
              >
                {ind}
              </button>
            ))}
          </div>

          <div className="case-studies-grid">
            {filteredStudies.map((study) => (
              <div key={study.id} className="case-study-card">
                <div className="cs-card-body">
                  <span className="badge badge-info mb-2">{study.industry} • {study.category}</span>
                  <h3>{study.title}</h3>
                  <p>{study.summary}</p>
                  <div className="cs-result-box">
                    <strong>Key Result:</strong> {study.results}
                  </div>
                </div>
                <div className="cs-card-footer">
                  <Link to="/contact" className="button button-outline button-small">
                    Inquire Similar Solution <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
