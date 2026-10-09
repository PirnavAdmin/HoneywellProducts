import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const categoryLabels = {
    cctv: 'CCTV',
    solar: 'Solar',
    electrical: 'Electrical',
    electronics: 'Electronics'
  };

  const getCategoryLabel = (cat) => categoryLabels[String(cat || '').toLowerCase()] || cat || 'General Supplier';

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'verified' || s === 'active') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={11} /> Approved
        </span>
      );
    }
    if (s.includes('reject')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <XCircle size={11} /> Rejected
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
        <Clock size={11} /> Pending
      </span>
    );
  };

  const modalContent = (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          maxWidth: '640px',
          width: '100%',
          padding: '18px 22px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          margin: 'auto',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Row: Header & Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.05em',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              padding: '3px 10px',
              borderRadius: '9999px',
              border: '1px solid #a7f3d0',
              display: 'inline-block',
              marginBottom: '6px'
            }}>
              Registration Ticket Review
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {registration.businessName || 'Business Registration'}
            </h2>
          </div>

          <button 
            onClick={onClose} 
            style={{
              padding: '6px',
              backgroundColor: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          {/* Left Column: Tracking Card & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            {/* Tracking ID visual box */}
            <div style={{ backgroundColor: '#ecfdf5', border: '1px dashed #6ee7b7', borderRadius: '10px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 600, fontSize: '11px', display: 'block', marginBottom: '2px' }}>
                Request Tracking ID:
              </span>
              <strong style={{ color: '#059669', fontWeight: 900, fontSize: '18px', letterSpacing: '0.04em', userSelect: 'all' }}>
                {registration.id}
              </strong>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Status:</span>
                {getStatusBadge(registration.status)}
              </div>
            </div>

            {/* Action Buttons Panel */}
            <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h4 style={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px', margin: 0, textAlign: 'center' }}>
                Action Center
              </h4>
              {registration.status === 'Pending' && onStatusChange ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Approved')} 
                    style={{
                      width: '100%',
                      padding: '7px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)'
                    }}
                  >
                    <CheckCircle2 size={13} /> Approve Ticket
                  </button>
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Rejected')} 
                    style={{
                      width: '100%',
                      padding: '7px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 1px 3px rgba(220, 38, 38, 0.2)'
                    }}
                  >
                    <XCircle size={13} /> Reject Ticket
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '2px 0', fontSize: '11px' }}>
                  Ticket status is <strong>{registration.status}</strong>.
                </div>
              )}
            </div>
          </div>

          {/* Right Columns: Registration Details Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {/* Owner Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={12} style={{ color: '#059669' }} /> Owner Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Full Name</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{registration.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Mobile Number</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                      <Phone size={11} style={{ color: '#64748b' }} /> {formatPhoneNumber(registration.mobile || registration.phone)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Email Address</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                      <Mail size={11} style={{ color: '#64748b' }} /> {registration.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building size={12} style={{ color: '#059669' }} /> Business Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Business / Shop Name</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{registration.businessName || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Product Category</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                      <Shield size={11} style={{ color: '#64748b' }} /> {getCategoryLabel(registration.category)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>GSTIN Number</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{registration.gstin || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Address & Timestamp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={12} style={{ color: '#059669' }} /> Location &amp; Timestamp
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={13} style={{ color: '#94a3b8', marginTop: '1px' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block', marginBottom: '2px' }}>Registered Address</span>
                    <p style={{ color: '#334155', fontWeight: 600, backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9', margin: 0, fontSize: '11px', lineHeight: 1.4 }}>
                      {registration.address || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '10px', marginTop: '2px', paddingLeft: '19px' }}>
                  <Calendar size={11} />
                  <span>Ticket Raised At: {registration.submittedAt ? new Date(registration.submittedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Row: Actions & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {registration.status !== 'Approved' && registration.status !== 'Verified' && (
              <button 
                onClick={() => onStatusChange && onStatusChange(registration.id, 'Approved')} 
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(5, 150, 105, 0.2)'
                }}
              >
                <CheckCircle2 size={13} /> Approve Supplier
              </button>
            )}
            {registration.status !== 'Rejected' && (
              <button 
                onClick={() => onStatusChange && onStatusChange(registration.id, 'Rejected')} 
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(220, 38, 38, 0.2)'
                }}
              >
                <XCircle size={13} /> Reject Application
              </button>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{
              padding: '8px 20px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default NewSupplierPopup;
