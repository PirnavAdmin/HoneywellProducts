import { useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import { applications } from '../data/solutions';
import { solutionService } from '../services/solutionService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePageBanner } from '../hooks/usePageBanner';

const DEFAULT_FALLBACK_IMG = '/honeywell-products-logo.png';
 
export default function Solutions() {
  const { banner } = usePageBanner('Solutions');
 
  useDocumentTitle('Security Solutions', 'Explore solution starting points for homes, offices, retail, warehouses, factories and outdoor sites.');
  const [params] = useSearchParams();
  const [solutionsList, setSolutionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const selectedApplication = applications.find((item) => item.id === params.get('application'));
 
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
  }, []);
 
  return (
    <>
      {banner && banner.isDynamic && (
        <PageHero
          eyebrow="SECURITY SOLUTIONS"
          title={banner.title}
          description={banner.description}
          image={banner.image}
        />
      )}
 
      {selectedApplication ? (
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
              <>
                {!banner && (
                  <SectionHeading eyebrow="SOLUTION PORTFOLIO" title="Complete Security Solutions" description="These solution concepts guide early discovery; final product suitability requires project review." />
                )}
                <div className="solution-grid solution-page-grid">
                  {solutionsList.map((solution) => (
                    <article className="solution-card" key={solution.id}>
                      <img
                        src={(!solution.image || String(solution.image).toLowerCase().includes('placeholder')) ? DEFAULT_FALLBACK_IMG : solution.image}
                        alt={`${solution.title} environment`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_FALLBACK_IMG;
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
              </>
            ) : (
              <div className="empty-state large">
                <h2>No Solutions Found</h2>
                <p>No active security solutions currently available.</p>
              </div>
            )}
          </div>
        </section>
      )}
 
      <section className="section applications-section">
        <div className="container">
          <SectionHeading eyebrow="APPLICATION FINDER" title="Choose Your Environment" description="Select the kind of place you are protecting for a focused starting point." />
          <div className="application-grid">
            {applications.map((application) => (
              <Link key={application.id} to={`/solutions?application=${application.id}`} className="application-card">
                <img
                  src={(!application.image || String(application.image).toLowerCase().includes('placeholder')) ? DEFAULT_FALLBACK_IMG : application.image}
                  alt={`${application.name} security application`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_FALLBACK_IMG;
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
 
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
