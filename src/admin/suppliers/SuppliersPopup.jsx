import React from 'react';
import { X, Mail, Phone, MapPin, Truck, DollarSign, Award, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatSupplierCurrency } from './SuppliersList';

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'verified' || s === 'approved') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '9999px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
        <CheckCircle2 size={11} /> Verified
      </span>
    );
  }
  if (s.includes('reject') || s === 'inactive') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '9999px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
        <XCircle size={11} /> {status || 'Rejected'}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '9999px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
      <Clock size={11} /> {status || 'Pending'}
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '640px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          margin: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header: Category Badge, Title & Close Button */}
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
              {supplier.category || 'Farm Tools'}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {supplier.name}
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', display: 'block' }}>
              Supplier Profile: #{supplier.id}
            </span>
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

        {/* Quick Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Rating</span>
            <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '3px' }}>
              <Award size={14} style={{ color: '#f59e0b' }} /> {supplier.rating || '4.5'}/5
            </strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Active POs</span>
            <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800, display: 'block', marginTop: '3px' }}>
              {supplier.activePo ?? 0}
            </strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Monthly Spend</span>
            <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: 800, display: 'block', marginTop: '3px' }}>
              {formatSupplierCurrency(supplier.monthlySpend)}
            </strong>
          </div>
        </div>

        {/* 2-Column Info Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          {/* Contact Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={12} style={{ color: '#059669' }} /> Contact Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Contact Person</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.contactPerson || supplier.name}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Email Address</span>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <Mail size={12} style={{ color: '#64748b' }} /> {supplier.email || 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Phone Number</span>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <Phone size={12} style={{ color: '#64748b' }} /> {supplier.phone || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Commercial Terms Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <DollarSign size={12} style={{ color: '#059669' }} /> Commercial Terms
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Payment Terms</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{supplier.terms || 'Net 30'}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Lead Time</span>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <Truck size={12} style={{ color: '#64748b' }} /> {supplier.leadTime || '4-6 days'}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block', marginBottom: '3px' }}>Onboarding Status</span>
                {getStatusBadge(supplier.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Coverage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FileText size={12} style={{ color: '#059669' }} /> Procurement Coverage &amp; Notes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <MapPin size={13} style={{ color: '#94a3b8', marginTop: '2px' }} />
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Registered Location</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>{supplier.city || supplier.address || 'N/A'}</span>
              </div>
            </div>
            <div style={{ marginTop: '2px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block', marginBottom: '3px' }}>Supplied Products &amp; Machinery</span>
              <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', color: '#334155', fontWeight: 600, fontSize: '11.5px' }}>
                {supplier.products || 'Heavy Machinery, Farm Tools, Cultivators & Agricultural Equipment'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Row: Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
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
};

export default SuppliersPopup;
