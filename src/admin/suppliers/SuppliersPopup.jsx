import React from 'react';
import { X, Mail, Phone, MapPin, Truck, DollarSign, Award, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatSupplierCurrency } from './SuppliersList';

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'verified' || s === 'approved') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
        <CheckCircle2 size={12} /> Verified
      </span>
    );
  }
  if (s.includes('reject') || s === 'inactive') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
        <XCircle size={12} /> {status || 'Rejected'}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
      <Clock size={12} /> {status || 'Pending'}
    </span>
  );
};

const SuppliersPopup = ({ supplier, onClose }) => {
  if (!supplier) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
          maxWidth: '680px',
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
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
          padding: '20px 24px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
              {supplier.category || 'Farm Tools'}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 2px 0', lineHeight: 1.2 }}>
              {supplier.name}
            </h2>
            <p style={{ fontSize: '12px', color: '#a7f3d0', margin: 0 }}>
              Supplier Profile: #{supplier.id}
            </p>
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
            title="Close Profile"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '18px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Rating</span>
              <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                <Award size={15} style={{ color: '#f59e0b' }} /> {supplier.rating || '4.5'}/5
              </strong>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Active POs</span>
              <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                {supplier.activePo ?? 0}
              </strong>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Monthly Spend</span>
              <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                {formatSupplierCurrency(supplier.monthlySpend)}
              </strong>
            </div>
          </div>

          {/* Grid Info Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            
            {/* Contact Details Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: '#059669' }} /> Contact Info
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Contact Person</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.contactPerson || supplier.name}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Email Address</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <Mail size={13} style={{ color: '#64748b' }} /> {supplier.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Phone Number</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <Phone size={13} style={{ color: '#64748b' }} /> {supplier.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commercial Terms Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} style={{ color: '#059669' }} /> Commercial Terms
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Payment Terms</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.terms || 'Net 30'}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Lead Time</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <Truck size={13} style={{ color: '#64748b' }} /> {supplier.leadTime || '4-6 days'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Onboarding Status</span>
                  {getStatusBadge(supplier.status)}
                </div>
              </div>
            </div>

          </div>

          {/* Location & Coverage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '6px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} style={{ color: '#059669' }} /> Procurement Coverage &amp; Notes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={15} style={{ color: '#94a3b8', marginTop: '2px' }} />
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Registered Location</span>
                  <span style={{ color: '#334155', fontWeight: 600 }}>{supplier.city || supplier.address || 'N/A'}</span>
                </div>
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Supplied Products &amp; Machinery</span>
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', color: '#334155', fontWeight: 600, fontSize: '12px' }}>
                  {supplier.products || 'Heavy Machinery, Farm Tools, Cultivators & Agricultural Equipment'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0
        }}>
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

export default SuppliersPopup;
