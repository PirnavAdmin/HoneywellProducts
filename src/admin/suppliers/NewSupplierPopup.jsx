import React from 'react';
import { X, Mail, Phone, MapPin, Shield, Calendar, Building, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

const formatPhoneNumber = (phone) => {
  if (!phone) return '—';
  const clean = String(phone).replace(/^\+?91\s*/, '').replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return String(phone);
};

const NewSupplierPopup = ({ registration, onClose, onStatusChange }) => {
  if (!registration) return null;

  const categoryLabels = {
    tools: 'Hand Tools',
    agri: 'Agri Equipment',
    power: 'Power Tools'
  };

  const getCategoryLabel = (cat) => categoryLabels[cat] || cat || 'Unassigned';

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'verified') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={12} /> Approved
        </span>
      );
    }
    if (s.includes('reject')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <XCircle size={12} /> Rejected
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
        <Clock size={12} /> Pending
      </span>
    );
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '850px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #047857 0%, #0f766e 100%)',
          padding: '18px 24px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.05em',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '3px 10px',
              borderRadius: '9999px',
              display: 'inline-block'
            }}>
              Registration Ticket Review
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 0 0' }}>
              {registration.businessName || 'Business Registration'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{
              padding: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body in Landscape Layout */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          
          {/* Left Column: Tracking Card & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
            {/* Tracking ID visual box */}
            <div style={{ backgroundColor: '#ecfdf5', border: '1px dashed #6ee7b7', borderRadius: '12px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Request Tracking ID:
              </span>
              <strong style={{ color: '#059669', fontWeight: 900, fontSize: '24px', letterSpacing: '0.04em', userSelect: 'all' }}>
                {registration.id}
              </strong>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Status:</span>
                {getStatusBadge(registration.status)}
              </div>
            </div>

            {/* Action Buttons Panel */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', margin: 0, textAlign: 'center' }}>
                Action Center
              </h4>
              {registration.status === 'Pending' && onStatusChange ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Approved')} 
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)'
                    }}
                  >
                    <CheckCircle2 size={15} /> Approve Ticket
                  </button>
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Rejected')} 
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(220, 38, 38, 0.2)'
                    }}
                  >
                    <XCircle size={15} /> Reject Ticket
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '8px 0', fontSize: '12px' }}>
                  Ticket status is <strong>{registration.status}</strong>. No further action needed.
                </div>
              )}
            </div>
          </div>

          {/* Right Columns: Registration Details Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {/* Owner Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} style={{ color: '#059669' }} /> Owner Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Full Name</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{registration.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Mobile Number</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Phone size={12} style={{ color: '#64748b' }} /> {formatPhoneNumber(registration.mobile || registration.phone)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Email Address</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Mail size={12} style={{ color: '#64748b' }} /> {registration.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={14} style={{ color: '#059669' }} /> Business Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Business / Shop Name</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{registration.businessName || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Product Category</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Shield size={12} style={{ color: '#64748b' }} /> {getCategoryLabel(registration.category)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>GSTIN Number</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{registration.gstin || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Address & Timestamp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: '#059669' }} /> Business Location &amp; Timestamp
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={15} style={{ color: '#94a3b8', marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Registered Address</span>
                    <p style={{ color: '#334155', fontWeight: 600, backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', margin: 0, fontSize: '12px', lineHeight: 1.5 }}>
                      {registration.address || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', marginTop: '4px', paddingLeft: '23px' }}>
                  <Calendar size={12} />
                  <span>Ticket Raised At: {registration.submittedAt ? new Date(registration.submittedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {registration.status !== 'Approved' && registration.status !== 'Verified' && (
              <button 
                onClick={() => onStatusChange && onStatusChange(registration.id, 'Approved')} 
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(5, 150, 105, 0.2)'
                }}
              >
                <CheckCircle2 size={14} /> Approve Supplier
              </button>
            )}
            {registration.status !== 'Rejected' && (
              <button 
                onClick={() => onStatusChange && onStatusChange(registration.id, 'Rejected')} 
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(220, 38, 38, 0.2)'
                }}
              >
                <XCircle size={14} /> Reject Application
              </button>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{
              padding: '8px 20px',
              backgroundColor: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              color: '#334155',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSupplierPopup;
