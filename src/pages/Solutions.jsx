import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, AlertCircle, Shield, Smartphone, Sun, Layers } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import SolutionDetailView from '../components/solutions/SolutionDetailView';
import { applications } from '../data/solutions';
import { SOLUTION_PILLARS } from '../data/solutionsData';
import { solutionService } from '../services/solutionService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import heroImage from '../assets/images/smart-technology-trends.png';

export default function Solutions() {
  useDocumentTitle('Security Solutions', 'Explore solution starting points for homes, offices, retail, warehouses, factories and outdoor sites.');
  const [params, setSearchParams] = useSearchParams();
  const [solutionsList, setSolutionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const solutionId = params.get('solution');
  const selectedApplication = applications.find((item) => item.id === params.get('application'));

  // Active solution pillar ID if selected
  const activePillarId = solutionId && SOLUTION_PILLARS[solutionId] ? solutionId : (solutionId ? 'security-surveillance' : null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const data = await solutionService.getAll();
        if (!isMounted) return;
        setSolutionsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch solutions:', err);
        if (isMounted) setError(err.message || 'Unable to load security solutions from API.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [solutionId]);

  const handleSelectSolutionPillar = (pillarKey) => {
    setSearchParams({ solution: pillarKey });
  };

  return (
    <>
      <PageHero
        eyebrow="SECURITY SOLUTIONS"
        title="Protect What Matters"
        description="Start with your environment, then explore suitable product categories with our sales team."
        image={heroImage}
      />

      {/* If a Solution Pillar or Application is selected, display rich detail view */}
      {activePillarId ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SolutionDetailView
              activeSolutionId={activePillarId}
              onSelectSolution={handleSelectSolutionPillar}
            />
          </div>
        </section>
      ) : selectedApplication ? (
        <section className="selected-solution">
          <div className="container">
            <div>
              <small>SUGGESTED APPLICATION STARTING POINT</small>
              <h2>{`${selectedApplication?.name} Security`}</h2>
              <p>{selectedApplication?.description}</p>
            </div>
            <Link className="button" to={`/products?category=${selectedApplication?.categoryId}`}>
              Explore Suggested Products <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="container">
            {/* Quick Switcher Bar for 4 Solution Pillars */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '40px'
            }}>
              {Object.values(SOLUTION_PILLARS).map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => handleSelectSolutionPillar(pillar.id)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    {pillar.eyebrow}
                  </span>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    {pillar.subtitle}
                  </p>
                </button>
              ))}
            </div>

            <SectionHeading eyebrow="SOLUTION PORTFOLIO" title="Complete Security Solutions" description="These solution concepts guide early discovery; final product suitability requires project review." />
            
            {loading ? (
              <div className="empty-state large" style={{ padding: '4rem 1rem' }}>
                <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
                <h2>Loading Security Solutions...</h2>
                <p>Fetching active solution packages from API</p>
              </div>
            ) : error ? (
              <div className="empty-state large" style={{ padding: '4rem 1rem' }}>
                <AlertCircle size={40} color="#ef4444" />
                <h2>Solution Service Connection Issue</h2>
                <p>{error}</p>
              </div>
            ) : solutionsList.length > 0 ? (
              <div className="solution-grid solution-page-grid">
                {solutionsList.map((solution) => (
                  <article className="solution-card" key={solution.id}>
                    <img
                      src={(!solution.image || String(solution.image).toLowerCase().includes('placeholder')) ? heroImage : solution.image}
                      alt={`${solution.title} environment`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = heroImage;
                      }}
                    />
                    <div>
                      <small>{solution.application}</small>
                      <h3>{solution.title}</h3>
                      <p>{solution.description}</p>
                      <ul>
                        {(solution.features || ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation']).map((feat, idx) => (
                          <li key={idx}><Check size={15} /> {feat}</li>
                        ))}
                      </ul>
                      <Link to={`/products?category=${solution.categoryId}`}>
                        View Suggested Products <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state large">
                <h2>No Solutions Found</h2>
                <p>No active security solutions currently available.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {!activePillarId && (
        <section className="section applications-section">
          <div className="container">
            <SectionHeading eyebrow="APPLICATION FINDER" title="Choose Your Environment" description="Select the kind of place you are protecting for a focused starting point." />
            <div className="application-grid">
              {applications.map((application) => (
                <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card">
                  <img
                    src={(!application.image || String(application.image).toLowerCase().includes('placeholder')) ? heroImage : application.image}
                    alt={`${application.name} security application`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = heroImage;
                    }}
                  />
                  <div>
                    <span>{application.name}</span>
                    <p>{application.description}</p>
                    <b>View recommendation <ArrowRight size={16} /></b>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

