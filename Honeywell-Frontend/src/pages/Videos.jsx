import React, { useState, useEffect, useMemo } from 'react';
import { PlaySquare, Play, X, Search, Loader2, AlertCircle, Clock, Tag, Film } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { API_BASE_URL } from '../services/api';
import heroImage from '../assets/images/smart-technology-trends.png';

const VIDEO_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  Accept: 'application/json',
};

async function fetchVideos(category) {
  const url = category && category !== 'All'
    ? `${API_BASE_URL}/api/Support/videos?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/api/Support/videos`;
  const res = await fetch(url, { headers: VIDEO_HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch videos (${res.status})`);
  return res.json();
}

const CATEGORIES = ['All', 'Product Demos', 'Installation', 'Tutorials'];

const resolveThumbnail = (url) => {
  if (!url) return heroImage;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanBase = (API_BASE_URL || '').replace(/\/$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  // Load videos from API when category changes
  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchVideos(selectedCategory);
        setVideos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load videos:', err);
        setError('Unable to load videos from API. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [selectedCategory]);

  // Client-side search filtering
  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (vid.title || '').toLowerCase().includes(q) ||
        (vid.description || '').toLowerCase().includes(q) ||
        (vid.category || '').toLowerCase().includes(q)
      );
    });
  }, [videos, search]);

  return (
    <>
      <PageHero
        eyebrow="VIDEO CENTER"
        title="Video &amp; Demonstration Center"
        description="Watch official Honeywell product walkthroughs, installation tutorials, and AI feature guides."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          {/* Controls: Category Pills & Search */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px', marginBottom: '32px',
          }}>
            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: 700,
                    border: '1px solid', cursor: 'pointer', transition: 'all 0.15s ease',
                    borderColor: selectedCategory === cat ? '#1268a5' : '#cbd5e1',
                    background: selectedCategory === cat ? '#1268a5' : '#ffffff',
                    color: selectedCategory === cat ? '#ffffff' : '#475569',
                  }}
                >
                  {cat === 'All' ? 'All Videos' : cat}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos by title..."
                style={{
                  width: '100%', padding: '10px 14px 10px 40px',
                  borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '14px', outline: 'none', background: '#fff',
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
          </div>

          {/* Video Grid / Loading / Error */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '12px' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#1268a5' }} />
              <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 600 }}>Loading video center directory...</p>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px', background: '#fef2f2', borderRadius: '10px', color: '#dc2626' }}>
              <AlertCircle size={22} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <PlaySquare size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ color: '#475569', marginBottom: '8px' }}>No videos found</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>Try selecting a different category or clearing your search term.</p>
            </div>
          ) : (
            <div className="videos-grid">
              {filteredVideos.map((vid) => {
                const thumb = resolveThumbnail(vid.thumbnailUrl);
                return (
                  <div
                    key={vid.id}
                    className="video-card"
                    onClick={() => setActiveVideo(vid)}
                    style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                      overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    <div className="video-thumbnail-box" style={{ position: 'relative', width: '100%', height: '190px', background: '#0f172a', overflow: 'hidden' }}>
                      <img
                        src={thumb}
                        alt={vid.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = heroImage;
                        }}
                      />
                      <div className="play-overlay" style={{
                        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                        background: 'rgba(15, 23, 42, 0.35)', transition: 'background 0.2s ease',
                      }}>
                        <div style={{
                          width: '52px', height: '52px', borderRadius: '50%', background: '#e53935',
                          color: '#fff', display: 'grid', placeItems: 'center', paddingLeft: '4px',
                          boxShadow: '0 4px 14px rgba(229, 57, 53, 0.4)',
                        }}>
                          <Play size={24} fill="#fff" />
                        </div>
                      </div>
                      {vid.duration && (
                        <span className="video-duration" style={{
                          position: 'absolute', bottom: '10px', right: '10px',
                          background: 'rgba(15, 23, 42, 0.85)', color: '#fff',
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          <Clock size={11} /> {vid.duration}
                        </span>
                      )}
                    </div>

                    <div className="video-card-info" style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {vid.category && (
                        <span className="doc-category" style={{
                          fontSize: '11px', fontWeight: 700, color: '#1268a5',
                          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
                        }}>
                          {vid.category}
                        </span>
                      )}
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                        {vid.title}
                      </h4>
                      {vid.description && (
                        <p style={{
                          margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {vid.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Video Player */}
          {activeVideo && (
            <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
              <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="video-modal-close" onClick={() => setActiveVideo(null)} aria-label="Close Video">
                  <X size={20} />
                </button>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#e53935', textTransform: 'uppercase' }}>
                    {activeVideo.category} {activeVideo.duration ? `• ${activeVideo.duration}` : ''}
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {activeVideo.title}
                  </h3>
                </div>
                <div className="video-player-wrapper">
                  <iframe
                    src={activeVideo.videoUrl}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {activeVideo.description && (
                  <p style={{ marginTop: '14px', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    {activeVideo.description}
                  </p>
                )}
              </div>
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
