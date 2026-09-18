import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper, FileCheck, PlaySquare, FileText, DownloadCloud,
  Phone, Mail, Clock, Loader2, AlertCircle, Download, ArrowRight,
  Calendar, User, ChevronRight
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { softwareService } from '../services/softwareService';
import { getBlogs, resolveBlogImageUrl } from '../services/blogApi';
import { getSupportConfig } from '../services/settingsApi';
import heroImage from '../assets/images/smart-technology-trends.png';

export default function ResourcesHub() {
  // ── State for all 3 APIs ──
  const [software, setSoftware] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [supportConfig, setSupportConfig] = useState(null);

  const [loadingSoftware, setLoadingSoftware] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingSupport, setLoadingSupport] = useState(true);

  const [errorSoftware, setErrorSoftware] = useState(null);
  const [errorBlogs, setErrorBlogs] = useState(null);
  const [errorSupport, setErrorSupport] = useState(null);

  // ── Fetch all 3 APIs in parallel on mount ──
  useEffect(() => {
    // 1. Fetch Software
    const fetchSoftware = async () => {
      try {
        setLoadingSoftware(true);
        setErrorSoftware(null);
        const result = await softwareService.getAll({ status: 'Active' });
        setSoftware(result.items || []);
      } catch (err) {
        console.error('Failed to fetch software:', err);
        setErrorSoftware(err.message);
      } finally {
        setLoadingSoftware(false);
      }
    };

    // 2. Fetch Blogs
    const fetchBlogs = async () => {
      try {
        setLoadingBlogs(true);
        setErrorBlogs(null);
        const data = await getBlogs();
        setBlogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch blogs:', err);
        setErrorBlogs(err.message);
      } finally {
        setLoadingBlogs(false);
      }
    };

    // 3. Fetch Support Config
    const fetchSupport = async () => {
      try {
        setLoadingSupport(true);
        setErrorSupport(null);
        const data = await getSupportConfig();
        setSupportConfig(data);
      } catch (err) {
        console.error('Failed to fetch support config:', err);
        setErrorSupport(err.message);
      } finally {
        setLoadingSupport(false);
      }
    };

    fetchSoftware();
    fetchBlogs();
    fetchSupport();
  }, []);

  // ── Derived stats ──
  const totalDownloads = software.reduce((sum, item) => sum + (item.downloadCount || 0), 0);
  const featuredSoftware = software.filter(item => item.isFeatured);
  const latestBlogs = [...blogs]
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
    .slice(0, 3);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <PageHero
        eyebrow="RESOURCES &amp; LEARNING"
        title="Honeywell Resources &amp; Learning Hub"
        description="Technical whitepapers, case studies, video guides, software downloads, and security articles."
        image={heroImage}
      />

      {/* ── Quick Nav Cards ── */}
      <section className="section">
        <div className="container">
          <div className="resources-sections-grid">
            <Link to="/downloads" className="resource-section-card">
              <FileText size={32} className="res-icon" />
              <h3>Certifications &amp; Docs</h3>
              <p>Access official datasheets, user manuals, certificates, and product documentation.</p>
              <span className="res-link">Explore Docs &rarr;</span>
            </Link>

            <Link to="/resources/software" className="resource-section-card">
              <DownloadCloud size={32} className="res-icon" />
              <h3>Software &amp; Downloads</h3>
              <p>
                {loadingSoftware
                  ? 'Loading software listings...'
                  : errorSoftware
                    ? 'Software, firmware, tools and product applications'
                    : `${software.length} software packages available • ${totalDownloads.toLocaleString()} total downloads`
                }
              </p>
              <span className="res-link">Find Software &rarr;</span>
            </Link>

            <Link to="/blogs" className="resource-section-card">
              <Newspaper size={32} className="res-icon" />
              <h3>Blog &amp; Technical Articles</h3>
              <p>
                {loadingBlogs
                  ? 'Loading articles...'
                  : errorBlogs
                    ? 'Read the latest industry insights on CCTV surveillance, solar integration, and smart security.'
                    : `${blogs.length} published articles covering latest security and technology insights.`
                }
              </p>
              <span className="res-link">Explore Articles &rarr;</span>
            </Link>

            <Link to="/case-studies" className="resource-section-card">
              <FileCheck size={32} className="res-icon" />
              <h3>Customer Case Studies</h3>
              <p>Discover real-world enterprise deployments across industrial, retail, and healthcare environments.</p>
              <span className="res-link">Read Case Studies &rarr;</span>
            </Link>

            <Link to="/videos" className="resource-section-card">
              <PlaySquare size={32} className="res-icon" />
              <h3>Video &amp; Demonstration Center</h3>
              <p>Watch product walkthroughs, installation tutorials, and camera quality side-by-side demos.</p>
              <span className="res-link">Watch Videos &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Software Downloads (Live from API) ── */}
      <section className="section" style={{ background: 'var(--surface, #f8fafc)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '4px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: 'var(--red, #e53935)', textTransform: 'uppercase' }}>SOFTWARE &amp; DRIVERS</p>
              <h2 style={{ margin: 0 }}>Featured Downloads</h2>
            </div>
            <Link to="/resources/software" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--red, #e53935)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loadingSoftware ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', gap: '10px', color: '#64748b' }}>
              <Loader2 size={22} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading software downloads...</span>
            </div>
          ) : errorSoftware ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span>Unable to load software listings. Please try again later.</span>
            </div>
          ) : featuredSoftware.length === 0 && software.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>No software downloads available at this time.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {(featuredSoftware.length > 0 ? featuredSoftware : software.slice(0, 3)).map((item) => (
                <div key={item.id} style={{
                  background: 'var(--white, #fff)',
                  border: '1px solid var(--grey-200, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Download size={20} style={{ color: 'var(--red, #e53935)', flexShrink: 0 }} />
                      <h4 style={{ margin: 0, fontSize: '15px', lineHeight: 1.4 }}>{item.softwareName}</h4>
                    </div>
                    {item.isFeatured && (
                      <span style={{
                        background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap'
                      }}>Featured</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{item.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', padding: '3px 10px', borderRadius: '6px', fontWeight: 500 }}>
                      {item.softwareType}
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', padding: '3px 10px', borderRadius: '6px', fontWeight: 500 }}>
                      {item.version}
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', padding: '3px 10px', borderRadius: '6px', fontWeight: 500 }}>
                      {item.platform}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {item.downloadCount?.toLocaleString() || 0} downloads
                    </span>
                    <Link to="/resources/software" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      color: 'var(--red, #e53935)', textDecoration: 'none', fontWeight: 600, fontSize: '13px',
                    }}>
                      Download <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Latest Blog Articles (Live from API) ── */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '4px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: 'var(--red, #e53935)', textTransform: 'uppercase' }}>BLOG &amp; INSIGHTS</p>
              <h2 style={{ margin: 0 }}>Latest Articles</h2>
            </div>
            <Link to="/blogs" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--red, #e53935)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loadingBlogs ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', gap: '10px', color: '#64748b' }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading articles...</span>
            </div>
          ) : errorBlogs ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span>Unable to load blog articles. Please try again later.</span>
            </div>
          ) : latestBlogs.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>No articles published yet. Check back soon!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {latestBlogs.map((blog) => (
                <Link to={`/blogs/${blog.id}`} key={blog.id} style={{
                  textDecoration: 'none', color: 'inherit',
                  background: 'var(--white, #fff)',
                  border: '1px solid var(--grey-200, #e2e8f0)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  {blog.coverImage && (
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#f1f5f9' }}>
                      <img
                        src={resolveBlogImageUrl(blog.coverImage)}
                        alt={blog.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {blog.category && (
                      <span style={{
                        alignSelf: 'flex-start', background: '#eff6ff', color: '#1d4ed8',
                        fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px',
                        textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>
                        {blog.category}
                      </span>
                    )}
                    <h4 style={{ margin: 0, fontSize: '16px', lineHeight: 1.4, color: '#1e293b' }}>{blog.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {blog.summary}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} /> {blog.authorName}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {formatDate(blog.publishDate)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Support Contact Info (Live from API) ── */}
      <section className="section" style={{ background: 'var(--surface, #f8fafc)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p className="eyebrow" style={{ marginBottom: '4px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: 'var(--red, #e53935)', textTransform: 'uppercase' }}>NEED HELP?</p>
            <h2 style={{ margin: 0 }}>Customer Support</h2>
          </div>

          {loadingSupport ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 0', gap: '10px', color: '#64748b' }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading support info...</span>
            </div>
          ) : errorSupport ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span>Unable to load support information. Please try again later.</span>
            </div>
          ) : supportConfig ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
              {/* Phone */}
              <a
                href={`tel:${supportConfig.supportPhoneNumber?.replace(/\s/g, '')}`}
                style={{
                  textDecoration: 'none', color: 'inherit',
                  background: 'var(--white, #fff)',
                  border: '1px solid var(--grey-200, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '28px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  textAlign: 'center',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', display: 'grid', placeItems: 'center' }}>
                  <Phone size={22} style={{ color: 'var(--red, #e53935)' }} />
                </div>
                <h4 style={{ margin: 0, fontSize: '15px' }}>Call Us</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                  {supportConfig.supportPhoneNumber}
                </p>
              </a>

              {/* Email */}
              <a
                href={`mailto:${supportConfig.supportEmail}`}
                style={{
                  textDecoration: 'none', color: 'inherit',
                  background: 'var(--white, #fff)',
                  border: '1px solid var(--grey-200, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '28px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  textAlign: 'center',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', display: 'grid', placeItems: 'center' }}>
                  <Mail size={22} style={{ color: '#2563eb' }} />
                </div>
                <h4 style={{ margin: 0, fontSize: '15px' }}>Email Support</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                  {supportConfig.supportEmail}
                </p>
              </a>

              {/* Hours */}
              <div style={{
                background: 'var(--white, #fff)',
                border: '1px solid var(--grey-200, #e2e8f0)',
                borderRadius: '10px',
                padding: '28px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4', display: 'grid', placeItems: 'center' }}>
                  <Clock size={22} style={{ color: '#16a34a' }} />
                </div>
                <h4 style={{ margin: 0, fontSize: '15px' }}>Working Hours</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                  {supportConfig.workTimings}
                </p>
              </div>
            </div>
          ) : null}

          {/* Support hub link */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/support" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--red, #e53935)', color: '#fff',
              padding: '12px 28px', borderRadius: '8px',
              textDecoration: 'none', fontWeight: 600, fontSize: '14px',
              transition: 'opacity 0.2s',
            }}>
              Visit Main Customer Support Hub <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Inline spin keyframe for loaders */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
