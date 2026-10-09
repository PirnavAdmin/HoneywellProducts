import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Settings,
  Package,
  Users,
  UserCheck,
  ShoppingCart,
  Truck,
  RotateCcw,
  Target,
  Mail,
  MessageSquare,
  ChevronRight,
  Shield,
  KeyRound,
  ClipboardCheck,
  HardDrive,
  Lock,
  Award
} from 'lucide-react';

const TableOfContent = () => {
  const sections = [
    {
      title: 'Catalog & Inventory Operations',
      desc: 'Create, update, and manage seeds, nutrients, weeders, and irrigation equipment listings.',
      links: [
        { name: 'Products Listing', path: '/admin/catalog/products', icon: <Package size={15} style={{ color: '#10b981' }} /> },
        { name: 'Products Form', path: '/admin/catalog/products-form', icon: <Package size={15} style={{ color: '#10b981' }} /> },
        { name: 'Categories Ledger', path: '/admin/catalog/categories', icon: <Package size={15} style={{ color: '#10b981' }} /> },
        { name: 'Category Form', path: '/admin/catalog/category', icon: <Package size={15} style={{ color: '#10b981' }} /> },
        { name: 'Subcategories Ledger', path: '/admin/catalog/subcategories', icon: <Package size={15} style={{ color: '#10b981' }} /> },
        { name: 'Subcategory Form', path: '/admin/catalog/subcategory', icon: <Package size={15} style={{ color: '#10b981' }} /> }
      ]
    },
    {
      title: 'Growers & Buyer Directory',
      desc: 'Analyze registered grower accounts, field land allocations, crop focuses, and bulk purchase files.',
      links: [
        { name: 'Customers Directory', path: '/admin/customers/list', icon: <Users size={15} style={{ color: '#10b981' }} /> },
        { name: 'Customer Profile Layout', path: '/admin/customers/customer', icon: <UserCheck size={15} style={{ color: '#10b981' }} /> }
      ]
    },
    {
      title: 'Order Processing & Shipments',
      desc: 'Process payments, monitor dispatch shipments, track AC-Docket numbers, and print agricultural bills.',
      links: [
        { name: 'Orders List', path: '/admin/orders', icon: <ShoppingCart size={15} style={{ color: '#10b981' }} /> },
        { name: 'Tracking Order', path: '/admin/orders/tracking', icon: <ShoppingCart size={15} style={{ color: '#10b981' }} /> },
        { name: 'Shipping Order', path: '/admin/orders/shipping', icon: <Truck size={15} style={{ color: '#10b981' }} /> },
        { name: 'Returns & Refunds', path: '/admin/returns', icon: <RotateCcw size={15} style={{ color: '#10b981' }} /> }
      ]
    },
    {
      title: 'Marketing & Support Desk',
      desc: 'Set seasonal discount vouchers, process support messages, and post agricultural advisories.',
      links: [
        { name: 'Vouchers List', path: '/admin/marketing/coupons', icon: <Target size={15} style={{ color: '#10b981' }} /> },
        { name: 'Voucher Builder', path: '/admin/marketing/coupon', icon: <Target size={15} style={{ color: '#10b981' }} /> },
        { name: 'Client Inquiries & Support Inbox', path: '/admin/tickets', icon: <Mail size={15} style={{ color: '#10b981' }} /> },
        { name: 'Chat Diagnostics Layout', path: '/admin/call-history', icon: <MessageSquare size={15} style={{ color: '#10b981' }} /> }
      ]
    }
  ];

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Banner (Header Card) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1268a5 0%, #0a4d7c 100%)',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '24px 28px',
          boxShadow: '0 4px 12px rgba(18, 104, 165, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Subtle Watermark Emblem */}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', opacity: 0.08, pointerEvents: 'none' }}>
          <Award size={220} color="#ffffff" />
        </div>

        <div style={{ zIndex: 1, maxWidth: '640px' }}>
          <h1 style={{ color: '#ffffff', fontWeight: 800, fontSize: '22px', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            Honeywell Admin Control
          </h1>
          <p style={{ color: '#eaf4fb', fontSize: '13px', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
            Welcome to the Central Administration Interface. Below is an index of all available features, controls, forms, and database listings.
          </p>
        </div>

        <NavLink
          to="/admin/settings/form"
          style={{
            background: '#ffffff',
            color: '#1268a5',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: '8px',
            padding: '10px 18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            zIndex: 1,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#eaf4fb')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          <Settings size={16} />
          <span>Quick Settings</span>
        </NavLink>
      </div>

      {/* 2x2 Grid of Main Operational Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {sections.map((section, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                {section.title}
              </h2>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                {section.desc}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%' }}>
              {section.links.map((link, lIdx) => (
                <NavLink
                  key={lIdx}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#eaf4fb';
                    e.currentTarget.style.borderColor = '#bde0fe';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ display: 'flex', alignItems: 'center', color: '#1268a5' }}>{link.icon}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {link.name}
                    </span>
                  </div>
                  <ChevronRight size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Banner: Platform Security Status */}
      <div
        style={{
          background: '#eaf4fb',
          border: '1px solid #bde0fe',
          borderRadius: '12px',
          padding: '18px 22px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} style={{ color: '#1268a5' }} />
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#102735', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PLATFORM SECURITY STATUS
            </span>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#dbeafe',
              border: '1px solid #93c5fd',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#1268a5'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1268a5', display: 'inline-block' }} />
            All Systems Secure
          </span>
        </div>

        {/* 4 Security Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px'
            }}
          >
            <KeyRound size={16} style={{ color: '#1268a5', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                JWT KEY ROTATION
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                Every 30 days · Next: 15 Aug 2026
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px'
            }}
          >
            <ClipboardCheck size={16} style={{ color: '#1268a5', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LAST AUDIT
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                01 Aug 2026 · Passed (0 violations)
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px'
            }}
          >
            <HardDrive size={16} style={{ color: '#1268a5', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LAST BACKUP
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                Today at 04:00 AM · Auto-snapshot ✓
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px'
            }}
          >
            <Lock size={16} style={{ color: '#1268a5', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SESSION ENCRYPTION
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                TLS 1.3 · AES-256 at rest
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TableOfContent;

