import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { getBlogs, resolveBlogImageUrl } from '../services/blogApi';
import { usePageBanner } from '../hooks/usePageBanner';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

export default function CaseStudies() {
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { banner } = usePageBanner(
    'Case Studies',
    'Customer Case Studies',
    'Explore real-world enterprise deployments of Honeywell products and security solutions.',
    heroImage
  );

  useEffect(() => {
    async function loadLiveCaseStudies() {
      try {
        setLoading(true);
        setError(null);
        const data = await getBlogs();
        if (Array.isArray(data)) {
          // Filter strictly by case study category values
          const liveStudies = data
            .filter(b => {
              const cat = (b.category || '').trim().toLowerCase();
              return cat.includes('case study') || cat.includes('case-study') || cat === 'case studies' || cat.includes('case');
            })
            .map(b => ({
              id: b.id,
              title: b.title,
              industry: b.category || 'Enterprise',
              category: b.category || 'Case Study',
              summary: b.summary || (b.description ? b.description.substring(0, 150) : ''),
              results: b.authorName ? `Verified Project by ${b.authorName}` : 'Enterprise Deployment Verified',
              image: b.coverImage ? resolveBlogImageUrl(b.coverImage) : null,
              isLive: true
            }));

          setCaseStudies(liveStudies);
        } else {
          setCaseStudies([]);
        }
      } catch (err) {
        console.error('Could not load live case studies from API:', err);
        setError('Unable to load case studies from server.');
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
        title={banner.title}
        description={banner.description}
        image={banner.image}
      />

      <section className="section">
        <div className="container">
          <div className="tabs-header justify-center mb-4">
            {['All', 'Industrial', 'Commercial', 'Retail', 'General'].map((ind) => (
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
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : filteredStudies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <FileCheck size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ color: '#475569', marginBottom: '8px' }}>No case studies found</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>No published case studies available in this category.</p>
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
                    <Link to={`/blogs/${study.id}`} className="button button-outline button-small">
                      Read Full Case Study &rarr;
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
