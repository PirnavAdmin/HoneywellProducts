import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, Share2, BookOpen, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { getBlogById, getBlogs, resolveBlogImageUrl } from '../services/blogApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentTitle(blog?.title || 'Article Details', blog?.summary || 'Read latest security and market trends.');

  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      try {
        setLoading(true);
        setError(null);

        // Load all blogs from API for related articles
        const list = await getBlogs().catch(() => []);
        const validList = Array.isArray(list) ? list : [];
        if (isMounted) setAllBlogs(validList);

        if (id) {
          try {
            const data = await getBlogById(id);
            if (isMounted && data && (data.title || data.id)) {
              setBlog(data);
              return;
            }
          } catch (e) {
            console.warn('API getBlogById failed, searching list fallback:', e);
          }

          // Fallback search in list
          const found = validList.find((b) => String(b.id) === String(id) || String(b.slug) === String(id));
          if (isMounted) {
            if (found) {
              setBlog(found);
            } else {
              setError('Article not found.');
            }
          }
        } else if (validList.length > 0) {
          setBlog(validList[0]);
        } else {
          if (isMounted) setError('No articles available.');
        }
      } catch (err) {
        console.error('Error loading blog article:', err);
        if (isMounted) setError('Unable to load article content.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArticle();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div className="empty-state large">
          <Loader2 size={40} className="animate-spin text-amber-500" style={{ animation: 'spin 1s linear infinite' }} />
          <h2>Loading Article Details...</h2>
          <p>Fetching article content and metadata</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div className="empty-state large">
          <AlertCircle size={44} color="#ef4444" />
          <h2>Article Not Found</h2>
          <p>{error || 'The requested blog article could not be loaded.'}</p>
          <Link className="button" to="/">Return to Home</Link>
        </div>
      </div>
    );
  }

  const coverUrl = resolveBlogImageUrl(blog.coverImage || blog.imageUrl || blog.image) || '/honeywell-products-logo.png';
  const category = blog.category || 'General';
  const author = blog.authorName || blog.author || 'Honeywell Team';
  const rawDate = blog.publishDate || blog.dateCreated || blog.date || new Date().toISOString();
  const formattedDate = new Date(rawDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const summary = blog.summary || blog.shortSummary || blog.description?.slice(0, 180) || '';
  const fullContent = blog.description || blog.content || blog.fullContent || summary;

  const relatedArticles = allBlogs
    .filter((b) => String(b.id) !== String(blog.id))
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: blog.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Article link copied to clipboard!');
    }
  };

  return (
    <article className="blog-details-page">
      {/* Breadcrumbs */}
      <div className="product-breadcrumbs container">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/">Market Trends</Link>
        <ChevronRight size={14} />
        <span>{blog.title}</span>
      </div>

      {/* Featured Cover Banner */}
      <header className="blog-hero-banner" style={{ background: '#0f172a', color: '#ffffff', padding: '40px 0 60px', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '24px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ maxWidth: '850px' }}>
            <span style={{ display: 'inline-block', background: '#e30613', color: '#ffffff', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
              {category}
            </span>

            <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.2, color: '#ffffff', marginBottom: '20px' }}>
              {blog.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', fontSize: '14px', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color="#38bdf8" /> <strong>{author}</strong>
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#38bdf8" /> {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container" style={{ padding: '40px 1rem 80px', maxWidth: '900px' }}>
        {/* Featured Cover Image */}
        <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '32px', marginTop: '-60px', position: 'relative', zIndex: 3, background: '#f8fafc' }}>
          <img
            src={coverUrl}
            alt={blog.title}
            style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/honeywell-products-logo.png';
            }}
          />
        </div>

        {/* Short Summary Highlight Box */}
        {summary && (
          <div style={{ background: '#f0f9ff', borderLeft: '4px solid #0284c7', borderRadius: '0 8px 8px 0', padding: '20px 24px', marginBottom: '36px' }}>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#0369a1', fontWeight: 800, letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Short Summary
            </h3>
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#0c4a6e', margin: 0, fontWeight: 500 }}>
              {summary}
            </p>
          </div>
        )}

        {/* Full Content Description */}
        <div className="blog-full-description" style={{ fontSize: '16px', lineHeight: 1.8, color: '#334155' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Full Content Description
          </h2>

          {fullContent.split('\n\n').map((paragraph, index) => (
            <p key={index} style={{ marginBottom: '20px' }}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Article Toolbar / Share */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '16px 0', margin: '40px 0' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
            Category: <strong style={{ color: '#0f172a' }}>{category}</strong>
          </span>
          <button
            onClick={handleShare}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Share2 size={16} /> Share Article
          </button>
        </div>

        {/* Related Market Trends */}
        {relatedArticles.length > 0 && (
          <section style={{ marginTop: '50px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
              Related Market Trends
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {relatedArticles.map((item) => {
                const itemImg = resolveBlogImageUrl(item.coverImage || item.imageUrl || item.image) || '/honeywell-products-logo.png';
                return (
                  <article key={item.id || item.title} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <img src={itemImg} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#e30613', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        {item.category || 'Market Trend'}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.3 }}>
                        {item.title}
                      </h4>
                      <Link to={`/blogs/${item.id}`} style={{ marginTop: 'auto', color: '#2563eb', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Read Article <ChevronRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
