import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, User, Search, X, Loader2, AlertCircle, ArrowRight, BookOpen
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { getBlogs, resolveBlogImageUrl } from '../services/blogApi';
import heroImage from '../assets/images/smart-technology-trends.png';

export default function BlogsListing() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch all blogs from GET /api/Blog
  useEffect(() => {
    async function loadBlogs() {
      try {
        setLoading(true);
        setError(null);
        const data = await getBlogs();
        setBlogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch blogs:', err);
        setError('Unable to load blog articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  // Extract unique categories from live API data
  const categories = useMemo(() => {
    return [...new Set(blogs.map((b) => b.category).filter(Boolean))].sort();
  }, [blogs]);

  // Filter blogs by search and category
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      if (selectedCategory && blog.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          (blog.title || '').toLowerCase().includes(q) ||
          (blog.summary || '').toLowerCase().includes(q) ||
          (blog.authorName || '').toLowerCase().includes(q) ||
          (blog.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [blogs, search, selectedCategory]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <PageHero
        eyebrow="BLOG &amp; ARTICLES"
        title="Blog &amp; Technical Articles"
        description="Read the latest industry insights on CCTV surveillance, solar integration, smart security, and Honeywell product news."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          {/* Search & Filter Controls */}
          <div style={{
            display: 'flex', gap: '16px', flexWrap: 'wrap',
            marginBottom: '32px', alignItems: 'center',
          }}>
            <div style={{
              position: 'relative', flex: '1 1 300px', minWidth: '260px',
            }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles by title, topic, or author..."
                style={{
                  width: '100%', padding: '12px 40px 12px 44px',
                  border: '1px solid #cbd5e1', borderRadius: '8px',
                  fontSize: '14px', background: '#fff', outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '12px 36px 12px 16px', border: '1px solid #cbd5e1',
                borderRadius: '8px', fontSize: '14px', background: '#fff',
                appearance: 'none', cursor: 'pointer', minWidth: '180px',
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          {!loading && !error && (
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginBottom: '20px' }}>
              Showing {filteredBlogs.length} article{filteredBlogs.length !== 1 ? 's' : ''}
              {selectedCategory && ` in "${selectedCategory}"`}
              {search && ` matching "${search}"`}
            </p>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '14px' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
              <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600 }}>Loading articles from API...</p>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '24px',
              background: '#fef2f2', borderRadius: '10px', color: '#dc2626',
            }}>
              <AlertCircle size={22} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <BookOpen size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ color: '#475569', marginBottom: '8px' }}>No articles found</h3>
              <p style={{ color: '#94a3b8' }}>Try a different search term or clear your filters.</p>
              {(search || selectedCategory) && (
                <button
                  onClick={() => { setSearch(''); setSelectedCategory(''); }}
                  className="button button-outline"
                  style={{ marginTop: '16px' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px',
            }}>
              {filteredBlogs.map((blog) => (
                <Link
                  to={`/blogs/${blog.id}`}
                  key={blog.id}
                  style={{
                    textDecoration: 'none', color: 'inherit',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(18,104,165,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Cover Image */}
                  {blog.coverImage && (
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#f1f5f9' }}>
                      <img
                        src={resolveBlogImageUrl(blog.coverImage)}
                        alt={blog.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Card Content */}
                  <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {/* Category Badge */}
                    {blog.category && (
                      <span style={{
                        alignSelf: 'flex-start', background: '#fef2f2', color: '#e53935',
                        fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '12px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {blog.category}
                      </span>
                    )}

                    {/* Title */}
                    <h3 style={{
                      margin: 0, fontSize: '17px', fontWeight: 700, lineHeight: 1.35,
                      color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {blog.title}
                    </h3>

                    {/* Summary */}
                    <p style={{
                      margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {blog.summary}
                    </p>

                    {/* Meta: Author + Date */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      marginTop: 'auto', paddingTop: '14px',
                      borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} /> {blog.authorName || 'Honeywell Team'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} /> {formatDate(blog.publishDate)}
                      </span>
                    </div>

                    {/* Read More Link */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      color: '#e53935', fontWeight: 700, fontSize: '13px', marginTop: '6px',
                    }}>
                      Read Full Article <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
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
