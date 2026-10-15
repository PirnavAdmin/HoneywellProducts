import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Eye, RefreshCw, Building, User, Mail, Phone, MapPin, 
  CheckCircle, Clock, X, Shield, FileText, Calendar 
} from 'lucide-react';
import { partnerService } from '../../services/partnerService';
import '../catalog/adminModule.css';
import './PartnerApplicationsScreen.css';

const statusConfig = {
  Pending: { label: 'Pending Review', class: 'pending', color: '#d97706', bg: '#fef3c7' },
  'In Review': { label: 'In Review', class: 'progress', color: '#2563eb', bg: '#dbeafe' },
  Approved: { label: 'Approved Partner', class: 'approved', color: '#16a34a', bg: '#dcfce7' },
  Rejected: { label: 'Rejected', class: 'rejected', color: '#dc2626', bg: '#fee2e2' }
};

export default function PartnerApplicationsScreen() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // View Details Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partnerService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load partner applications:', err);
      setError('Could not connect to live partner applications endpoint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Filtered List
  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        (item.companyName || '').toLowerCase().includes(q) ||
        (item.contactPerson || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.mobile || '').includes(q) ||
        (item.city || '').toLowerCase().includes(q) ||
        (item.state || '').toLowerCase().includes(q) ||
        (item.gstin || '').toLowerCase().includes(q) ||
        (item.businessType || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesType = typeFilter === 'All' || item.businessType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [applications, searchTerm, statusFilter, typeFilter]);

  // Unique partner types
  const partnerTypes = useMemo(() => {
    const types = new Set(applications.map(a => a.businessType).filter(Boolean));
    return ['All', ...Array.from(types)];
  }, [applications]);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="catalog-page">
      {/* Header */}
      <section className="catalog-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Channel Partner Management</span>
          <h1>Partner Applications</h1>
          <p>Review distributor, system integrator, and dealer partnership applications submitted through the Business portal.</p>
        </div>

        <div className="catalog-header__actions">
          <button 
            type="button" 
            className="catalog-btn" 
            onClick={loadApplications} 
            disabled={loading} 
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      {/* Table Card */}
      <section className="catalog-card">
        <div className="catalog-filterbar" style={{ gap: '14px' }}>
          <div className="catalog-search" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by company, contact person, GSTIN, city or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Filter Type:</span>
            <select
              className="catalog-input"
              style={{ padding: '6px 12px', minWidth: '150px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {partnerTypes.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Partner Types' : t}</option>
              ))}
            </select>
          </div>

          <span className="catalog-count">
            {loading ? 'Loading...' : `${filteredApplications.length} application${filteredApplications.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Company & Contact</th>
                <th>Partner Type</th>
                <th>Contact Details</th>
                <th>Location</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th className="catalog-center-cell" style={{ width: '110px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <RefreshCw size={20} className="spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                    Loading partner applications from backend API...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#dc2626' }}>
                    <p>{error}</p>
                    <button onClick={loadApplications} className="catalog-btn" style={{ marginTop: '10px' }}>Retry</button>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    No partner applications found.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((item) => {
                  const conf = statusConfig[item.status] || statusConfig.Pending;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                          {item.companyName || '—'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          Contact: {item.contactPerson || '—'}
                        </div>
                        {item.gstin && (
                          <div style={{ fontSize: '11px', color: '#1268a5', marginTop: '2px', fontWeight: '600' }}>
                            GSTIN: {item.gstin}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '3px 8px', 
                          background: '#f1f5f9', 
                          color: '#334155', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600' 
                        }}>
                          {item.businessType}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#334155' }}>{item.email}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.mobile}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#334155' }}>
                          {[item.city, item.state].filter(Boolean).join(', ') || '—'}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: conf.color,
                          backgroundColor: conf.bg
                        }}>
                          {conf.label}
                        </span>
                      </td>
                      <td className="catalog-center-cell">
                        <button 
                          type="button"
                          className="catalog-btn catalog-btn--sm"
                          onClick={() => {
                            setSelectedApp(item);
                            setIsDetailOpen(true);
                          }}
                          title="View Application Details"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Application Details Modal */}
      {isDetailOpen && selectedApp && createPortal(
        <div className="partner-modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="partner-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="partner-modal-header">
              <div className="partner-header-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2>Application #{selectedApp.id} — {selectedApp.companyName}</h2>
                  <span 
                    className="partner-status-pill"
                    style={{
                      color: (statusConfig[selectedApp.status] || statusConfig.Pending).color,
                      backgroundColor: (statusConfig[selectedApp.status] || statusConfig.Pending).bg
                    }}
                  >
                    {(statusConfig[selectedApp.status] || statusConfig.Pending).label}
                  </span>
                  <span className="partner-type-pill">
                    {selectedApp.businessType || 'Partner'}
                  </span>
                </div>
                <span className="partner-subtitle">Submitted on {formatDate(selectedApp.createdAt)}</span>
              </div>
              <button 
                type="button" 
                className="partner-modal-close" 
                onClick={() => setIsDetailOpen(false)}
                title="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="partner-modal-body">
              <div className="partner-modal-grid">
                {/* Left Column: Company & Contact Information + Registered Address */}
                <div className="partner-col-info">
                  <div className="partner-section-card">
                    <h4 className="partner-section-title">
                      <Building size={13} style={{ marginRight: '6px', color: '#1268a5' }} />
                      Company &amp; Contact Details
                    </h4>
                    <div className="partner-info-grid">
                      <div className="partner-info-item">
                        <span className="partner-info-label">Company Name</span>
                        <span className="partner-info-value"><strong>{selectedApp.companyName || '—'}</strong></span>
                      </div>
                      <div className="partner-info-item">
                        <span className="partner-info-label">Contact Person</span>
                        <span className="partner-info-value">{selectedApp.contactPerson || '—'}</span>
                      </div>
                      <div className="partner-info-item">
                        <span className="partner-info-label">Mobile Number</span>
                        <span className="partner-info-value">
                          {selectedApp.mobile ? (
                            <a href={`tel:${selectedApp.mobile}`} className="partner-info-link">
                              <Phone size={11} /> {selectedApp.mobile}
                            </a>
                          ) : '—'}
                        </span>
                      </div>
                      <div className="partner-info-item">
                        <span className="partner-info-label">Email Address</span>
                        <span className="partner-info-value">
                          {selectedApp.email ? (
                            <a href={`mailto:${selectedApp.email}`} className="partner-info-link" title={selectedApp.email}>
                              <Mail size={11} /> {selectedApp.email}
                            </a>
                          ) : '—'}
                        </span>
                      </div>
                      <div className="partner-info-item">
                        <span className="partner-info-label">GSTIN / Tax ID</span>
                        <span className="partner-info-value">{selectedApp.gstin || 'Not Provided'}</span>
                      </div>
                      <div className="partner-info-item">
                        <span className="partner-info-label">Business Experience</span>
                        <span className="partner-info-value">{selectedApp.yearsInBusiness || 'Not Specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Address & Location */}
                  <div className="partner-section-card">
                    <h4 className="partner-section-title">
                      <MapPin size={13} style={{ marginRight: '6px', color: '#1268a5' }} />
                      Registered Address &amp; Location
                    </h4>
                    <div className="partner-info-grid">
                      <div className="partner-info-item full-width">
                        <span className="partner-info-label">Office Address</span>
                        <span className="partner-info-value" title={selectedApp.address || '—'}>
                          {selectedApp.address || '—'}
                        </span>
                      </div>
                      <div className="partner-info-item">
                        <span className="partner-info-label">City</span>
                        <span className="partner-info-value">{selectedApp.city || '—'}</span>
                      </div>
                      <div className="partner-info-item">
                        <span className="partner-info-label">State / Region</span>
                        <span className="partner-info-value">{selectedApp.state || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Business Background & Description */}
                <div className="partner-col-message">
                  <div className="partner-section-card full-height">
                    <h4 className="partner-section-title">
                      <FileText size={13} style={{ marginRight: '6px', color: '#1268a5' }} />
                      Business Background &amp; Goals
                    </h4>
                    <div className="partner-desc-box">
                      {selectedApp.description || 'No background description provided by applicant.'}
                    </div>

                    <div className="partner-meta-row">
                      <span>
                        Terms Agreement:{' '}
                        <span className={`partner-terms-badge ${selectedApp.agreedToTerms ? 'accepted' : 'declined'}`}>
                          {selectedApp.agreedToTerms ? (
                            <>
                              <CheckCircle size={11} /> Accepted
                            </>
                          ) : (
                            <>
                              <X size={11} /> Declined
                            </>
                          )}
                        </span>
                      </span>
                      <span>Submitted: <strong>{formatDate(selectedApp.createdAt)}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="partner-modal-footer">
              <button 
                type="button" 
                className="btn-partner-secondary" 
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
