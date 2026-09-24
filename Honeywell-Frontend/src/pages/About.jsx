import { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/common/PageHero';
import SectionHeading from '../components/common/SectionHeading';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { aboutApi, resolveImageUrl } from '../services/aboutApi';
import defaultHeroImg from '../assets/images/capital-park2.jpg';
import defaultOverviewImg from '../assets/images/smart-security-sustainable-future.png';

const getIconComponent = (iconName) => {
  if (!iconName || typeof iconName !== 'string') return Icons.ShieldCheck;
  return Icons[iconName] || Icons.ShieldCheck;
};

export default function About() {
  useDocumentTitle('About Us', 'Learn about the HONEYWELL PRODUCTS company profile, vision, mission, portfolio and leadership.');

  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAboutData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aboutApi.getAboutData();
      setAboutData(data);
    } catch (err) {
      console.error('Failed to load About Us content from backend:', err);
      setError(err.message || 'Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <div className="route-loading" role="status">
        <span />
        <p>Loading About Us experience…</p>
      </div>
    );
  }

  if (error || !aboutData) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertCircle size={48} color="var(--red, #d32f2f)" style={{ marginBottom: '16px' }} />
        <h2>Failed to Load About Us Content</h2>
        <p style={{ color: 'var(--grey-700)', marginBottom: '24px' }}>
          {error || 'Unable to fetch About Us configuration from the backend API.'}
        </p>
        <button className="button" onClick={fetchAboutData} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  const { hero, overview, vision, mission, portfolio, whyChooseUs, ceo } = aboutData;

  const heroImageSrc = resolveImageUrl(hero?.image) || defaultHeroImg;
  const overviewImageSrc = resolveImageUrl(overview?.image) || defaultOverviewImg;
  const ceoImageSrc = resolveImageUrl(ceo?.image);

  const portfolioItems = Array.isArray(portfolio?.items) ? portfolio.items : [];
  const whyItems = Array.isArray(whyChooseUs?.items) ? whyChooseUs.items : [];
  const repeatedWhyItems = whyItems.length > 0 ? [...whyItems, ...whyItems, ...whyItems, ...whyItems] : [];

  return (
    <>
      {/* ── 1. Hero Section ── */}
      {hero && (
        <PageHero
          eyebrow={hero.eyebrow || 'ABOUT US'}
          title={hero.title || 'Security Technology With a Clear Purpose'}
          description={hero.description || ''}
          image={heroImageSrc}
        />
      )}

      {/* ── 2. Company Overview ── */}
      {overview && (
        <section className="section about-overview">
          <div className="container two-column">
            <div>
              <SectionHeading
                eyebrow={overview.eyebrow || 'COMPANY OVERVIEW'}
                title={overview.title || 'Built for Product Discovery and Security Solutions'}
              />
              {overview.lead && <p className="lead">{overview.lead}</p>}
              {overview.description && <p>{overview.description}</p>}
              <Link className="arrow-link" to="/contact">
                Start a Conversation <ArrowRight />
              </Link>
            </div>
            <div className="about-image">
              <img src={overviewImageSrc} alt={overview.title || 'Company Overview'} />
              <span>Representative product portfolio visual</span>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Vision & Mission ── */}
      {(vision || mission) && (
        <section className="mission-vision">
          <div className="container">
            {vision && (
              <article>
                <span>01</span>
                <p className="eyebrow dark">OUR VISION</p>
                <h2>{vision.title}</h2>
                <p>{vision.description}</p>
              </article>
            )}
            {mission && (
              <article>
                <span>02</span>
                <p className="eyebrow dark">OUR MISSION</p>
                <h2>{mission.title}</h2>
                <p>{mission.description}</p>
              </article>
            )}
          </div>
        </section>
      )}

      {/* ── 4. Product Portfolio ── */}
      {portfolio && portfolioItems.length > 0 && (
        <section className="section portfolio-section">
          <div className="container">
            <SectionHeading
              eyebrow={portfolio.eyebrow || 'PRODUCT PORTFOLIO'}
              title={portfolio.title || 'Security, CCTV & Solar Power Product Portfolio'}
              description={portfolio.description || ''}
              align="center"
            />
            <div className="about-values">
              {portfolioItems.map((item, index) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <article key={item.title || index}>
                    <span>0{index + 1}</span>
                    <IconComponent />
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. Why Choose Us ── */}
      {whyChooseUs && whyItems.length > 0 && (
        <section className="section about-reasons">
          <div className="container">
            <SectionHeading
              eyebrow={whyChooseUs.eyebrow || 'WHY CHOOSE US'}
              title={whyChooseUs.title || 'A Conservative, Client-Ready Approach'}
              description={whyChooseUs.description || ''}
            />
          </div>
          <div className="why-scroll-container">
            <div className="why-scroll-track">
              {repeatedWhyItems.map((item, index) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <article key={`${item.title}-${index}`} className="why-scroll-card light">
                    <div className="why-icon-wrap">
                      <IconComponent size={24} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. CEO Corner ── */}
      {ceo && (
        <section className="ceo-section" id="ceo-corner">
          <div className="container">
            <div className="ceo-image">
              {ceoImageSrc ? (
                <img src={ceoImageSrc} alt={ceo.name || 'CEO'} />
              ) : (
                <div className="ceo-placeholder">
                  <span>CEO</span>
                </div>
              )}
            </div>
            <div>
              <p className="eyebrow">CEO CORNER</p>
              {ceo.message && <h2>“{ceo.message}”</h2>}
              {ceo.subtext && <p>{ceo.subtext}</p>}
              {ceo.name && <strong>{ceo.name}</strong>}
              {ceo.designation && <small>{ceo.designation}</small>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
