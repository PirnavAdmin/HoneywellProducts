import React from 'react';
import { 
  X, Mail, Phone, MapPin, Truck, DollarSign, Award, 
  FileText, CheckCircle2, Clock, XCircle, Building2, 
  ShieldCheck, PackageCheck, User
} from 'lucide-react';
import { formatSupplierCurrency } from './SuppliersList';

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'verified' || s === 'approved') {
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '5px', 
        padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', 
        fontWeight: 700, background: '#dcfce7', color: '#15803d', 
        border: '1px solid #bbf7d0' 
      }}>
        <CheckCircle2 size={12} /> Verified
      </span>
    );
  }
  if (s.includes('reject') || s === 'inactive') {
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '5px', 
        padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', 
        fontWeight: 700, background: '#fee2e2', color: '#b91c1c', 
        border: '1px solid #fecaca' 
      }}>
        <XCircle size={12} /> {status || 'Rejected'}
      </span>
    );
  }
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: '5px', 
      padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', 
      fontWeight: 700, background: '#fef3c7', color: '#b45309', 
      border: '1px solid #fde68a' 
    }}>
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
          maxWidth: '660px',
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
                  {supplier.name}
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  padding: '2px 9px',
                  borderRadius: '9999px'
                }}>
                  {supplier.category || 'Farm Tools'}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
                Supplier Account Code: <strong style={{ color: '#334155' }}>#{supplier.id}</strong>
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

          {/* Stat Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Vendor Rating</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Award size={18} style={{ color: '#f59e0b' }} />
                <span>{supplier.rating || '4.5'} <small style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>/ 5.0</small></span>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Active POs</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <PackageCheck size={18} style={{ color: '#2563eb' }} />
                <span>{supplier.activePo ?? 0} Orders</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Monthly Spend</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <DollarSign size={18} style={{ color: '#059669' }} />
                <span>{formatSupplierCurrency(supplier.monthlySpend)}</span>
              </div>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Contact Details Card */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} style={{ color: '#059669' }} /> Contact Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Contact Representative</span>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>{supplier.contactPerson || supplier.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Official Email</span>
                  <span style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Mail size={13} style={{ color: '#94a3b8' }} /> {supplier.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Phone Number</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Phone size={13} style={{ color: '#94a3b8' }} /> {supplier.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commercial Terms Card */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} style={{ color: '#059669' }} /> Commercial Terms
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Payment Terms</span>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>{supplier.terms || 'Net 30 Days'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Fulfillment Lead Time</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Truck size={13} style={{ color: '#94a3b8' }} /> {supplier.leadTime || '4-6 Days'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Account Status</span>
                  {getStatusBadge(supplier.status)}
                </div>
              </div>
            </div>

          </div>

          {/* Location & Supplied Products Card */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} style={{ color: '#059669' }} /> Coverage &amp; Location
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} style={{ color: '#64748b' }} />
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>Registered Location: </span>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>{supplier.city || supplier.address || 'N/A'}</strong>
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Supplied Products &amp; Machinery</span>
                <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600, fontSize: '12.5px' }}>
                  {supplier.products || 'Heavy Machinery, Farm Tools, Cultivators & Agricultural Equipment'}
                </div>
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
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
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

export default SuppliersPopup;
