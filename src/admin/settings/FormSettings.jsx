import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Settings, CheckCircle } from 'lucide-react';

const FormSettings = () => {
  const [formData, setFormData] = useState({
    shippingFlat: '250',
    seedsGst: '5',
    machineryGst: '12',
    minAdvisoryLevel: 'Active Grower',
    allowCreditTerms: true,
    platformCurrency: 'INR',
    farmerVerification: 'Auto-Verify'
  });
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  return (
    <div style={{ padding: '16px 20px', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '24px 28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          maxWidth: '860px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              aria-label="Go back"
              type="button"
              onClick={() => navigate(-1)}
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                System Preferences & Settings
              </h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Configure tax limits, flat shipping rates, and advisory verification rules.
              </p>
            </div>
          </div>

          <div>
            {isSaved ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 700, fontSize: '12.5px', padding: '0 16px', height: '38px', borderRadius: '8px' }}>
                <CheckCircle size={16} /> Saved Settings
              </span>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit} 
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  height: '38px',
                  padding: '0 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'background 0.15s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#047857')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#059669')}
              >
                <Save size={15} />
                <span>Update Settings</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Row 1: Shipping Fee & Base Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Flat Shipping Fee (₹)
              </label>
              <input
                type="number"
                name="shippingFlat"
                value={formData.shippingFlat}
                onChange={handleInputChange}
                style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Platform Base Currency
              </label>
              <select
                name="platformCurrency"
                value={formData.platformCurrency}
                onChange={handleInputChange}
                style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff', cursor: 'pointer' }}
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
              </select>
            </div>
          </div>

          {/* Section 1: GST TAX LEVELS (%) Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>
              <Settings size={16} style={{ color: '#059669' }} />
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                GST TAX LEVELS (%)
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Seeds & propagation tax rate
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', height: '40px' }}>
                  <input
                    type="number"
                    name="seedsGst"
                    value={formData.seedsGst}
                    onChange={handleInputChange}
                    style={{ flex: 1, padding: '0 14px', border: 'none', fontSize: '13px', color: '#0f172a', outline: 'none', background: 'transparent' }}
                    min="0"
                    max="100"
                  />
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#f1f5f9', borderLeft: '1px solid #cbd5e1', fontWeight: 700, fontSize: '12.5px', color: '#64748b', userSelect: 'none' }}>
                    %
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Heavy farming machinery tax rate
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', height: '40px' }}>
                  <input
                    type="number"
                    name="machineryGst"
                    value={formData.machineryGst}
                    onChange={handleInputChange}
                    style={{ flex: 1, padding: '0 14px', border: 'none', fontSize: '13px', color: '#0f172a', outline: 'none', background: 'transparent' }}
                    min="0"
                    max="100"
                  />
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#f1f5f9', borderLeft: '1px solid #cbd5e1', fontWeight: 700, fontSize: '12.5px', color: '#64748b', userSelect: 'none' }}>
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: GROWER ADVISORY POLICIES */}
          <div>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                GROWER ADVISORY POLICIES
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Verification workflow
                </label>
                <select
                  name="farmerVerification"
                  value={formData.farmerVerification}
                  onChange={handleInputChange}
                  style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff', cursor: 'pointer' }}
                >
                  <option value="Auto-Verify">Auto-Verify with Mobile OTP</option>
                  <option value="Manual">Manual Land Doc Review</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Advisory premium level required
                </label>
                <select
                  name="minAdvisoryLevel"
                  value={formData.minAdvisoryLevel}
                  onChange={handleInputChange}
                  style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff', cursor: 'pointer' }}
                >
                  <option value="Free Tier">All Registered Accounts</option>
                  <option value="Active Grower">Active Growers only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Checkbox Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <input
              type="checkbox"
              name="allowCreditTerms"
              checked={formData.allowCreditTerms}
              onChange={handleInputChange}
              id="allowCreditTerms"
              style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
            />
            <label htmlFor="allowCreditTerms" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', margin: 0 }}>
              Allow credit settlement terms for Wholesalers (supports up to ₹50,000 credit limit defaults)
            </label>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FormSettings;

