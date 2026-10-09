import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Percent,
  RotateCcw,
  Save,
  ShieldCheck,
  Tag,
  Sparkles,
  ShoppingBag,
  Layers,
  ChevronRight
} from 'lucide-react';
import { createCoupon } from './api';
import { formatDateDMY } from './CouponsList';
import { Toast } from '../components/Toast';
import './coupons.css';

const initialCoupon = {
  code: 'SUMMER20',
  description: 'Special seasonal promotion across all product collections',
  discount: '20',
  type: 'Percentage',
  minSpend: '1500',
  maxDiscount: '500',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usageLimit: '500',
  perCustomerLimit: '1',
  status: 'Active',
  audience: 'All Customers'
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const num = Number(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

const Coupon = () => {
  const [formData, setFormData] = useState(initialCoupon);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const previewDiscount = React.useMemo(() => {
    if (formData.type === 'Percentage') return `${formData.discount || 0}% OFF`;
    if (formData.type === 'Shipping') return 'FREE SHIPPING';
    return `${formatCurrency(formData.discount)} OFF`;
  }, [formData.discount, formData.type]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
  };

  const handleReset = () => {
    setFormData(initialCoupon);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createCoupon(formData);
      showToast('Coupon campaign created successfully!', 'success');
      setTimeout(() => {
        navigate('/admin/marketing/coupons');
      }, 1000);
    } catch (err) {
      showToast('Failed to create coupon. Please check details.', 'error');
      setIsSaving(false);
    }
  };

  return (
    <div className="coupons-mgmt-container">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── Top Header Card ── */}
      <section className="coupons-header-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            className="btn-coupons-secondary"
            style={{ padding: '8px 12px' }}
            to="/admin/marketing/coupons"
            title="Back to coupons list"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="coupons-title-wrap">
            <span className="coupons-kicker">
              <Sparkles size={13} /> Marketing &amp; Campaigns
            </span>
            <h1>Create New Coupon</h1>
            <p>Define voucher code, discount algorithms, cart constraints, and redemption limits.</p>
          </div>
        </div>

        <div className="coupons-header-actions">
          <button
            className="btn-coupons-secondary"
            type="button"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            className="btn-coupons-primary"
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save size={15} />
            {isSaving ? 'Creating...' : 'Save Campaign'}
          </button>
        </div>
      </section>

      {/* ── Form & Preview Layout ── */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Form Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: Campaign Details */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Campaign Details
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
                Customer-facing promo code and primary discount method.
              </p>
            </div>

            <div className="coupon-form-grid-2">
              <div className="coupon-input-group">
                <label htmlFor="code">Coupon Code *</label>
                <input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. MONSOON20"
                  required
                />
              </div>
              <div className="coupon-input-group">
                <label htmlFor="type">Discount Type *</label>
                <select id="type" name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="Percentage">Percentage (% Discount)</option>
                  <option value="Flat Amount">Flat Amount (Fixed ₹)</option>
                  <option value="Shipping">Free Delivery</option>
                </select>
              </div>
            </div>

            <div className="coupon-input-group" style={{ marginTop: '14px' }}>
              <label htmlFor="description">Campaign Description *</label>
              <textarea
                id="description"
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Explain the offer terms shown to users..."
                style={{ resize: 'none' }}
              />
            </div>
          </div>

          {/* Card 2: Discount Rules & Limits */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Discount Rules &amp; Cart Thresholds
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
                Configure minimum cart values, maximum caps, and usage limits.
              </p>
            </div>

            <div className="coupon-form-grid-3">
              <div className="coupon-input-group">
                <label htmlFor="discount">
                  {formData.type === 'Percentage' ? 'Discount % *' : 'Discount ₹ *'}
                </label>
                <input
                  id="discount"
                  name="discount"
                  type="number"
                  value={formData.discount}
                  onChange={handleInputChange}
                  disabled={formData.type === 'Shipping'}
                  required={formData.type !== 'Shipping'}
                  min="0"
                />
              </div>
              <div className="coupon-input-group">
                <label htmlFor="maxDiscount">Max Cap (₹)</label>
                <input
                  id="maxDiscount"
                  name="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  min="0"
                />
              </div>
              <div className="coupon-input-group">
                <label htmlFor="minSpend">Min Cart (₹)</label>
                <input
                  id="minSpend"
                  name="minSpend"
                  type="number"
                  value={formData.minSpend}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="coupon-form-grid-2" style={{ marginTop: '14px' }}>
              <div className="coupon-input-group">
                <label htmlFor="usageLimit">Total Global Usage Limit</label>
                <input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  placeholder="0 for unlimited"
                  min="0"
                />
              </div>
              <div className="coupon-input-group">
                <label htmlFor="perCustomerLimit">Limit Per Customer</label>
                <input
                  id="perCustomerLimit"
                  name="perCustomerLimit"
                  type="number"
                  value={formData.perCustomerLimit}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Schedule & Audience */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Schedule &amp; Target Audience
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0 0' }}>
                Set active date window and audience segmentation.
              </p>
            </div>

            <div className="coupon-form-grid-2">
              <div className="coupon-input-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="coupon-input-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="coupon-form-grid-2" style={{ marginTop: '14px' }}>
              <div className="coupon-input-group">
                <label htmlFor="status">Initial Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div className="coupon-input-group">
                <label htmlFor="audience">Target Audience</label>
                <select id="audience" name="audience" value={formData.audience} onChange={handleInputChange}>
                  <option value="All Customers">All Customers</option>
                  <option value="New Customers">New Customers Only</option>
                  <option value="Returning Customers">Returning Customers</option>
                  <option value="High Value Customers">High Value Customers (VIP)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & Summary Checklist */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live Preview Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Live Checkout Preview
              </h2>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                How customers see this voucher during checkout.
              </p>
            </div>

            <div
              style={{
                padding: '20px',
                border: '2px dashed #1268a5',
                borderRadius: '12px',
                backgroundColor: '#f0f7fc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(18, 104, 165, 0.15)'
                }}
              >
                <Tag size={24} color="#1268a5" />
              </div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '0.08em',
                  background: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1'
                }}
              >
                {formData.code || 'CODE'}
              </span>
              <strong style={{ fontSize: '26px', fontWeight: 900, color: '#1268a5' }}>
                {previewDiscount}
              </strong>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                {formData.description || 'Coupon description preview.'}
              </p>
            </div>
          </div>

          {/* Operational Checklist */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Rule Summary Checklist
              </h2>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Operational policy overview.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Percent size={16} color="#1268a5" />
                <span>
                  <strong>{previewDiscount}</strong> ({formData.type})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={16} color="#1268a5" />
                <span>
                  Min Cart: <strong>{formatCurrency(formData.minSpend)}</strong> · Cap:{' '}
                  <strong>{formData.maxDiscount ? formatCurrency(formData.maxDiscount) : 'None'}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={16} color="#1268a5" />
                <span>
                  {formatDateDMY(formData.startDate)} → {formatDateDMY(formData.endDate)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardList size={16} color="#1268a5" />
                <span>
                  {formData.usageLimit || '∞'} total uses · {formData.perCustomerLimit} per user
                </span>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default Coupon;
