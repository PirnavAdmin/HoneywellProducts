import React, { useState } from 'react';
import { PlaySquare, Play, X } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import heroImage from '../assets/images/smart-technology-trends.png';

const videoList = [
  {
    id: 'v1',
    title: 'Honeywell High Definition IP Camera Overview',
    category: 'Product Demos',
    duration: '3:45',
    thumbnail: '/placeholder-video.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'v2',
    title: 'Solar Security Camera Installation & Configuration Guide',
    category: 'Installation',
    duration: '5:20',
    thumbnail: '/placeholder-video.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'v3',
    title: 'AI Motion Analytics & Line Crossing Setup Tutorial',
    category: 'Tutorials',
    duration: '4:10',
    thumbnail: '/placeholder-video.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

export default function Videos() {
  const [activeVideo, setActiveVideo] = useState(null);

  return (
    <>
      <PageHero
        eyebrow="VIDEO CENTER"
        title="Video &amp; Demonstration Center"
        description="Watch official Honeywell product walkthroughs, installation tutorials, and feature guides."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="videos-grid">
            {videoList.map((vid) => (
              <div key={vid.id} className="video-card" onClick={() => setActiveVideo(vid)}>
                <div className="video-thumbnail-box">
                  <div className="play-overlay">
                    <Play size={32} />
                  </div>
                  <span className="video-duration">{vid.duration}</span>
                </div>
                <div className="video-card-info">
                  <span className="doc-category">{vid.category}</span>
                  <h4>{vid.title}</h4>
                </div>
              </div>
            ))}
          </div>

          {activeVideo && (
            <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
              <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="video-modal-close" onClick={() => setActiveVideo(null)} aria-label="Close Video">
                  <X size={20} />
                </button>
                <h3>{activeVideo.title}</h3>
                <div className="video-player-wrapper">
                  <iframe
                    src={activeVideo.videoUrl}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
