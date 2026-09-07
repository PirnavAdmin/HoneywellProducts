import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, AlertCircle, Clock } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { partnerService } from '../services/partnerService';
import heroImage from '../assets/images/capital-park2.jpg';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const partnerEmail = localStorage.getItem('partnerEmail') || 'Partner User';
  const isLoggedIn = Boolean(localStorage.getItem('partnerToken') || localStorage.getItem('partnerEmail'));

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/partner/login');
      return;
    }

    async function loadPartnerMetrics() {
      try {
        setLoading(true);
        const data = await partnerService.getDashboardData();
        setPartnerData(data);
      } catch (err) {
        console.error('Error fetching partner dashboard data:', err);
        setError('Backend partner integration pending or offline.');
      } finally {
        setLoading(false);
      }
    }
    loadPartnerMetrics();
  }, [isLoggedIn, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('partnerToken');
    localStorage.removeItem('partnerEmail');
    navigate('/partner/login');
  };

  return (
    <>
      <PageHero
        eyebrow="PARTNER PORTAL"
        title="Partner Center Dashboard"
        description={`Logged in as: ${partnerEmail}`}
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="flex-between mb-4">
            <h2>Account Summary</h2>
            <button className="button button-outline button-small" onClick={handleLogout}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '200px' }}>
              <p>Loading partner account data...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertCircle size={44} className="text-warning" />
              <h3>Partner Backend Service Pending Integration</h3>
              <p>{error}</p>
              <p className="text-muted">Once connected to the live enterprise server, partner metrics, quotes, and leads will display here automatically.</p>
            </div>
          ) : partnerData ? (
            <div className="partner-data-view">
              <div className="partner-kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Partner Tier</span>
                  <span className="kpi-value">{partnerData.tier || 'Authorized'}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Active Quotes</span>
                  <span className="kpi-value">{partnerData.activeQuotes || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Clock size={44} className="empty-icon" />
              <h3>No Partner Records Available</h3>
              <p>Your partner account is active. Deal registrations and quote history will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
