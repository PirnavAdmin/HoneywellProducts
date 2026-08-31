import React from 'react';
import { 
  X, Mail, Phone, MapPin, Shield, Calendar, Building, 
  FileText, CheckCircle2, XCircle, Clock, Building2, User 
} from 'lucide-react';

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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={12} /> Approved
        </span>
      );
    }
    if (s.includes('reject')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <XCircle size={12} /> Rejected
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
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
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          border: '1px solid #f1f5f9',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Header Bar */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {registration.businessName || 'Business Registration'}
                </h2>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
                Ticket ID: <strong style={{ color: '#334155' }}>#{registration.id}</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Tracking Card & Action Center Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Tracking Box */}
            <div style={{ backgroundColor: '#ecfdf5', border: '1px dashed #6ee7b7', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tracking ID</span>
              <strong style={{ color: '#059669', fontWeight: 900, fontSize: '22px', marginTop: '2px', letterSpacing: '0.04em', userSelect: 'all' }}>
                {registration.id}
              </strong>
              <div style={{ marginTop: '8px' }}>
                {getStatusBadge(registration.status)}
              </div>
            </div>

            {/* Action Center Box */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', display: 'block' }}>Approval Action</span>
              {registration.status === 'Pending' && onStatusChange ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Approved')} 
                    style={{
                      flex: 1,
                      padding: '8px',
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
                      gap: '4px',
                      boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)'
                    }}
                  >
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button 
                    onClick={() => onStatusChange(registration.id, 'Rejected')} 
                    style={{
                      flex: 1,
                      padding: '8px',
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
                      gap: '4px',
                      boxShadow: '0 1px 3px rgba(220, 38, 38, 0.2)'
                    }}
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  Ticket Status: <strong style={{ color: '#0f172a' }}>{registration.status}</strong>
                </div>
              )}
            </div>

          </div>

          {/* 2-Column Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Owner Details Card */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} style={{ color: '#059669' }} /> Owner Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Full Name</span>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>{registration.name || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Mobile Number</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Phone size={13} style={{ color: '#94a3b8' }} /> {formatPhoneNumber(registration.mobile || registration.phone)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Email Address</span>
                  <span style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Mail size={13} style={{ color: '#94a3b8' }} /> {registration.email || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Business Info Card */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={15} style={{ color: '#059669' }} /> Business Info
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Business Name</span>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>{registration.businessName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Product Category</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Shield size={13} style={{ color: '#94a3b8' }} /> {getCategoryLabel(registration.category)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>GSTIN Number</span>
                  <strong style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{registration.gstin || 'N/A'}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Business Address Card */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} style={{ color: '#059669' }} /> Registered Location
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={15} style={{ color: '#64748b', marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>{registration.address || 'N/A'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', marginTop: '4px', paddingLeft: '23px' }}>
                <Calendar size={12} />
                <span>Submitted At: {registration.submittedAt ? new Date(registration.submittedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Row */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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
                <XCircle size={14} /> Reject Ticket
              </button>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{
              padding: '9px 24px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
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
