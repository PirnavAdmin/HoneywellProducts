import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, MapPin, Truck, DollarSign, Award, FileText, CheckCircle2, Clock, XCircle, Building2 } from 'lucide-react';
import { formatSupplierCurrency } from './SuppliersList';

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'verified' || s === 'approved' || s === 'active') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
        <CheckCircle2 size={11} /> {status || 'Verified'}
      </span>
    );
  }
  if (s.includes('reject') || s === 'inactive') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
        <XCircle size={11} /> {status || 'Inactive'}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
      <Clock size={11} /> {status || 'Pending'}
    </span>
  );
};

const SuppliersPopup = ({ supplier, onClose }) => {
  if (!supplier) return null;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          maxWidth: '580px',
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
        {/* Modal Header: Category Badge, Title & Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          <div>
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.05em',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid #a7f3d0',
              display: 'inline-block',
              marginBottom: '4px'
            }}>
              {supplier.category || 'General Supplier'}
            </span>
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0', lineHeight: 1.2 }}>
              {supplier.name}
            </h2>
            <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={12} style={{ color: '#94a3b8' }} /> Supplier Profile: #{supplier.id}
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Rating</span>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
              <Award size={13} style={{ color: '#f59e0b' }} /> {supplier.rating || '4.5'}/5
            </strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Active POs</span>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 800, display: 'block', marginTop: '2px' }}>
              {supplier.activePo ?? 0}
            </strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Monthly Spend</span>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 800, display: 'block', marginTop: '2px' }}>
              {formatSupplierCurrency(supplier.monthlySpend)}
            </strong>
          </div>
        </div>

        {/* 2-Column Info Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Contact Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={12} style={{ color: '#1268a5' }} /> Contact Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Contact Person</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.contactPerson || supplier.name}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Email Address</span>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={12} style={{ color: '#64748b' }} /> {supplier.email || 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Phone Number</span>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={12} style={{ color: '#64748b' }} /> {supplier.phone || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Commercial Terms Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <DollarSign size={12} style={{ color: '#1268a5' }} /> Commercial Terms
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Payment Terms</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.terms || supplier.commercialTerms || 'Net 30'}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>Lead Time</span>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Truck size={12} style={{ color: '#64748b' }} /> {supplier.leadTime || '4-6 days'}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block', marginBottom: '2px' }}>Onboarding Status</span>
                {getStatusBadge(supplier.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Coverage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FileText size={12} style={{ color: '#1268a5' }} /> Procurement Coverage &amp; Notes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={12} style={{ color: '#94a3b8' }} />
              <span style={{ color: '#94a3b8', fontSize: '10.5px' }}>Location:</span>
              <span style={{ color: '#334155', fontWeight: 600 }}>{supplier.city || supplier.address || 'N/A'}</span>
            </div>
            <div>
              <div style={{ backgroundColor: '#f8fafc', padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600, fontSize: '11px', lineHeight: 1.35 }}>
                {supplier.products || (supplier.category ? `${supplier.category} Equipment & Related Hardware Accessories` : 'CCTV Cameras, Surveillance Hardware, Solar Panels & Electronic Components')}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Row: Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
          <button 
            type="button"
            onClick={onClose} 
            style={{
              padding: '6px 20px',
              backgroundColor: '#1268a5',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              boxShadow: '0 1px 3px rgba(18,104,165,0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0a4d7c'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1268a5'}
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SuppliersPopup;
