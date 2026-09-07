import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Newspaper, FileCheck, PlaySquare, Download } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import heroImage from '../assets/images/smart-technology-trends.png';

export default function ResourcesHub() {
  return (
    <>
      <PageHero
        eyebrow="RESOURCES &amp; LEARNING"
        title="Honeywell Resources &amp; Learning Hub"
        description="Technical whitepapers, case studies, video guides, software downloads, and security articles."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="resources-sections-grid">
            <Link to="/blogs" className="resource-section-card">
              <Newspaper size={32} className="res-icon" />
              <h3>Blog &amp; Technical Articles</h3>
              <p>Read the latest industry insights on CCTV surveillance, solar integration, and smart security.</p>
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

            <Link to="/downloads" className="resource-section-card">
              <Download size={32} className="res-icon" />
              <h3>Downloads &amp; Documentation</h3>
              <p>Access official datasheets, user manuals, certificates, and software packages.</p>
              <span className="res-link">Go to Downloads &rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
