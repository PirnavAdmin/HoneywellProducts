import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ArrowRight, Loader2 } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { getBlogs, resolveBlogImageUrl } from '../services/blogApi';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

const fallbackCaseStudies = [
  {
    id: 'cs-1',
    title: 'Industrial Chemical Plant Perimeter Defense',
    industry: 'Industrial',
    category: 'CCTV & Thermal',
    summary: 'Deployed 120+ thermal and optical IP cameras with AI line-crossing analytics for a 50-acre chemical manufacturing plant.',
    results: '100% perimeter coverage with zero unauthorized intrusion incidents.',
  },
  {
    id: 'cs-2',
    title: 'Off-Grid Commercial Solar Array Deployment',
    industry: 'Commercial',
    category: 'Solar Power',
    summary: 'Installed high-efficiency hybrid solar panels with battery backup powering continuous security systems for a remote commercial site.',
    results: '45% reduction in grid power dependency with 99.99% system uptime.',
  },
  {
    id: 'cs-3',
    title: 'Retail Chain Loss Prevention Surveillance',
    industry: 'Retail',
    category: 'Smart Surveillance',
    summary: 'Upgraded 25 retail store locations with high-definition dome cameras integrated with POS transaction monitoring.',
    results: 'Reduced shrink and inventory loss by 38% in the first quarter.',
  }
];

export default function CaseStudies() {
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [caseStudies, setCaseStudies] = useState(fallbackCaseStudies);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveCaseStudies() {
      try {
        setLoading(true);
        const data = await getBlogs();
        if (Array.isArray(data) && data.length > 0) {
          // Filter blogs categorized as Case Study or Enterprise
          const liveStudies = data
            .filter(b => 
              (b.category || '').toLowerCase().includes('case') || 
              (b.category || '').toLowerCase().includes('study') ||
              (b.category || '').toLowerCase().includes('enterprise') ||
              (b.category || '').toLowerCase().includes('industrial')
            )
            .map(b => ({
              id: b.id,
              title: b.title,
              industry: b.category || 'Enterprise',
              category: b.category || 'Case Study',
              summary: b.summary || b.content?.substring(0, 150),
              results: b.authorName ? `Verified Project by ${b.authorName}` : 'Enterprise Deployment Verified',
              image: b.coverImage ? resolveBlogImageUrl(b.coverImage) : null,
              isLive: true
            }));

          if (liveStudies.length > 0) {
            setCaseStudies([...liveStudies, ...fallbackCaseStudies]);
          }
        }
      } catch (err) {
        console.warn('Could not load live case studies from API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLiveCaseStudies();
  }, []);

  const filteredStudies = selectedIndustry === 'All'
    ? caseStudies
    : caseStudies.filter((c) => (c.industry || '').toLowerCase().includes(selectedIndustry.toLowerCase()));

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

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px 0', color: '#64748b' }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
              <span>Loading live case studies...</span>
            </div>
          ) : (
            <div className="case-studies-grid">
              {filteredStudies.map((study) => (
                <div key={study.id} className="case-study-card">
                  {study.image && (
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#f1f5f9' }}>
                      <img src={study.image} alt={study.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="cs-card-body">
                    <span className="badge badge-info mb-2">{study.industry} • {study.category}</span>
                    <h3>{study.title}</h3>
                    <p>{study.summary}</p>
                    <div className="cs-result-box">
                      <strong>Key Result:</strong> {study.results}
                    </div>
                  </div>
                  <div className="cs-card-footer">
                    <Link to={study.isLive ? `/blogs/${study.id}` : "/contact"} className="button button-outline button-small">
                      {study.isLive ? 'Read Full Case Study →' : 'Inquire Similar Solution →'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
