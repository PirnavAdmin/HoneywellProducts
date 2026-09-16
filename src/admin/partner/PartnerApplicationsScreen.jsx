import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Eye, RefreshCw, Building, User, Mail, Phone, MapPin, 
  CheckCircle, Clock, X, Shield, FileText, Calendar 
} from 'lucide-react';
import { partnerService } from '../../services/partnerService';
import '../catalog/adminModule.css';

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
      {isDetailOpen && selectedApp && (
        <div className="catalog-modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="catalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="catalog-modal-header">
              <div>
                <span style={{ fontSize: '12px', color: '#1268a5', fontWeight: '700', textTransform: 'uppercase' }}>
                  Partner Application #{selectedApp.id}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '20px' }}>{selectedApp.companyName}</h2>
              </div>
              <button 
                type="button" 
                className="catalog-modal-close" 
                onClick={() => setIsDetailOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Contact Person</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{selectedApp.contactPerson || '—'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Partner Type</span>
                  <span style={{ fontSize: '14px', color: '#1268a5', fontWeight: '600' }}>{selectedApp.businessType || '—'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Mobile Number</span>
                  <span style={{ fontSize: '14px', color: '#0f172a' }}>{selectedApp.mobile || '—'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Email Address</span>
                  <span style={{ fontSize: '14px', color: '#0f172a' }}>{selectedApp.email || '—'}</span>
                </div>
                {selectedApp.gstin && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>GSTIN</span>
                    <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{selectedApp.gstin}</span>
                  </div>
                )}
                {selectedApp.yearsInBusiness && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Experience in Business</span>
                    <span style={{ fontSize: '14px', color: '#0f172a' }}>{selectedApp.yearsInBusiness}</span>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Address / Location</span>
                  <span style={{ fontSize: '14px', color: '#0f172a' }}>
                    {[selectedApp.address, selectedApp.city, selectedApp.state].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedApp.description && (
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Business Background & Description</span>
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '6px', fontSize: '14px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {selectedApp.description}
                  </div>
                </div>
              )}

              {/* Terms Agreement & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', pt: '12px', paddingTop: '12px' }}>
                <span>Agreed to Terms: <strong style={{ color: selectedApp.agreedToTerms ? '#16a34a' : '#dc2626' }}>{selectedApp.agreedToTerms ? 'Yes' : 'No'}</strong></span>
                <span>Submitted: {formatDate(selectedApp.createdAt)}</span>
              </div>
            </div>

            <div className="catalog-modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button 
                type="button" 
                className="catalog-btn catalog-btn--primary" 
                onClick={() => setIsDetailOpen(false)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
