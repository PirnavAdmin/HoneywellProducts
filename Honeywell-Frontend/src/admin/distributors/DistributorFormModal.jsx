import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Save } from 'lucide-react';
import { validateGstin } from '../../utils/gstinValidation';

const emptyForm = {
  name: '',
  partnerType: 'Authorized Regional Distributor',
  badgeText: 'Official Verified',
  region: 'North India',
  territory: '',
  coverageLocations: '',
  address: '',
  contactPerson: '',
  contactTitle: 'Channel Director',
  phone: '',
  email: '',
  gstin: '',
  productCategories: 'CCTV Video Surveillance, 4G Solar Cameras, NVR Storage',
  dispatchSla: '24-48 Hours Express',
  bufferCapacity: '25,000+ Units Hub',
  commercialTerms: 'Wholesale Net 30 Commercial Credit',
  rating: '4.9/5 (Verified)',
  description: '',
  isVerified: true,
  isActive: true,
  displayOrder: 0
};

const partnerTypeOptions = [
  'Authorized Master Distributor',
  'Authorized Regional Distributor',
  'Authorized Dealer',
  'Authorized Reseller',
  'Certified CCTV Installer',
  'System Integrator',
  'Channel Partner'
];

const regionOptions = [
  'North India',
  'South India',
  'West India',
  'East India',
  'Central India',
  'Pan-India'
];

export default function DistributorFormModal({
  isOpen,
  onClose,
  onSubmit,
  distributor = null,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const isEdit = Boolean(distributor && distributor.id);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting, isOpen]);

  useEffect(() => {
    if (distributor) {
      setFormData({
        name: distributor.name || distributor.companyName || '',
        partnerType: distributor.partnerType || distributor.tier || 'Authorized Regional Distributor',
        badgeText: distributor.badgeText || '',
        region: distributor.region || 'North India',
        territory: distributor.territory || distributor.city || '',
        coverageLocations: distributor.coverageLocations || distributor.state || '',
        address: distributor.address || '',
        contactPerson: distributor.contactPerson || '',
        contactTitle: distributor.contactTitle || distributor.designation || 'Channel Lead',
        phone: distributor.phone || '',
        email: distributor.email || '',
        gstin: distributor.gstin || '',
        productCategories: distributor.productCategories || (Array.isArray(distributor.productLines) ? distributor.productLines.join(', ') : ''),
        dispatchSla: distributor.dispatchSla || '24-48 Hours Express',
        bufferCapacity: distributor.bufferCapacity || distributor.warehouseCapacity || '',
        commercialTerms: distributor.commercialTerms || distributor.paymentTerms || '',
        rating: distributor.rating || '4.8/5 (Verified)',
        description: distributor.description || '',
        isVerified: distributor.isVerified !== undefined ? Boolean(distributor.isVerified) : true,
        isActive: distributor.isActive !== undefined ? Boolean(distributor.isActive) : true,
        displayOrder: typeof distributor.displayOrder === 'number' ? distributor.displayOrder : 0
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [distributor, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalVal = type === 'checkbox' ? checked : value;
    if (name === 'gstin' && typeof finalVal === 'string') {
      finalVal = finalVal.toUpperCase();
    }
    setFormData((prev) => ({
      ...prev,
      [name]: finalVal
    }));
  };

  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = 'Company/Dealer name is required.';
    if (!formData.contactPerson.trim()) next.contactPerson = 'Contact person is required.';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!formData.phone.trim() || !/^[0-9+\s-]{8,15}$/.test(formData.phone.trim())) {
      next.phone = 'Enter a valid phone/mobile number.';
    }
    if (formData.gstin.trim()) {
      const gstinErr = validateGstin(formData.gstin);
      if (gstinErr) next.gstin = gstinErr;
    }
    if (!formData.region.trim()) next.region = 'Region is required.';
    if (!formData.territory.trim()) next.territory = 'City/Territory is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const modalContent = (
    <div
      onClick={() => !isSubmitting && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#1268a5', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              {isEdit ? `Edit Distributor #${distributor.id}` : 'Create New Distributor'}
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {isEdit ? formData.name || 'Update Distributor' : 'Add New Dealer / Distributor'}
            </h2>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Company Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Company / Distributor Name *
              </label>
              <input
                type="text"
                name="name"
                className="catalog-input"
                style={{ width: '100%', borderColor: errors.name ? '#dc2626' : undefined }}
                placeholder="e.g. Matrix Security Systems Pvt Ltd"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <small style={{ color: '#dc2626', fontSize: '11.5px' }}>{errors.name}</small>}
            </div>

            {/* Partner Type */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Partner Type *
              </label>
              <select
                name="partnerType"
                className="catalog-input"
                style={{ width: '100%' }}
                value={formData.partnerType}
                onChange={handleChange}
              >
                {partnerTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Badge Text */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Badge Text
              </label>
              <input
                type="text"
                name="badgeText"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="e.g. Master Hub, Official Verified"
                value={formData.badgeText}
                onChange={handleChange}
              />
            </div>

            {/* Region */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Region *
              </label>
              <select
                name="region"
                className="catalog-input"
                style={{ width: '100%', borderColor: errors.region ? '#dc2626' : undefined }}
                value={formData.region}
                onChange={handleChange}
              >
                {regionOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.region && <small style={{ color: '#dc2626', fontSize: '11.5px' }}>{errors.region}</small>}
            </div>

            {/* Territory / City */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                City / Territory *
              </label>
              <input
                type="text"
                name="territory"
                className="catalog-input"
                style={{ width: '100%', borderColor: errors.territory ? '#dc2626' : undefined }}
                placeholder="e.g. New Delhi & NCR"
                value={formData.territory}
                onChange={handleChange}
              />
              {errors.territory && <small style={{ color: '#dc2626', fontSize: '11.5px' }}>{errors.territory}</small>}
            </div>

            {/* Coverage Locations / State */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Coverage States / Locations
              </label>
              <input
                type="text"
                name="coverageLocations"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="e.g. Delhi NCR, Haryana, Punjab"
                value={formData.coverageLocations}
                onChange={handleChange}
              />
            </div>

            {/* GSTIN */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                GSTIN Number
              </label>
              <input
                type="text"
                name="gstin"
                maxLength="15"
                className="catalog-input"
                style={{ width: '100%', borderColor: errors.gstin ? '#dc2626' : undefined }}
                placeholder="15-character GSTIN"
                value={formData.gstin}
                onChange={handleChange}
              />
              {errors.gstin && <small style={{ color: '#dc2626', fontSize: '11.5px' }}>{errors.gstin}</small>}
            </div>

            {/* Contact Person */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Contact Person *
              </label>
              <input
                type="text"
                name="contactPerson"
                className="catalog-input"
                style={{ width: '100%', borderColor: errors.contactPerson ? '#dc2626' : undefined }}
                placeholder="e.g. Rajesh Malhotra"
                value={formData.contactPerson}
                onChange={handleChange}
              />
              {errors.contactPerson && <small style={{ color: '#dc2626', fontSize: '11.5px' }}>{errors.contactPerson}</small>}
            </div>

            {/* Contact Title / Designation */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Contact Title / Designation
              </label>
              <input
                type="text"
                name="contactTitle"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="e.g. Channel Director"
                value={formData.contactTitle}
                onChange={handleChange}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Phone / Mobile *
              </label>
              <input
                type="text"
                name="phone"
                className="catalog-input"
                style={{ width: '100%', borderColor: errors.phone ? '#dc2626' : undefined }}
                placeholder="+91 98112 34567"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <small style={{ color: '#dc2626', fontSize: '11.5px' }}>{errors.phone}</small>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                className="catalog-input"
                style={{ width: '100%', borderColor: errors.email ? '#dc2626' : undefined }}
                placeholder="contact@distributor.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <small style={{ color: '#dc2626', fontSize: '11.5px' }}>{errors.email}</small>}
            </div>

            {/* Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Full Operational Address
              </label>
              <input
                type="text"
                name="address"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="Plot 42, Industrial Area Phase-III, New Delhi 110020"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* Product Categories */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Product Categories / Product Lines (Comma Separated)
              </label>
              <input
                type="text"
                name="productCategories"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="CCTV Video Surveillance, 4G Solar Cameras, Enterprise NVR Storage, Access Control"
                value={formData.productCategories}
                onChange={handleChange}
              />
            </div>

            {/* Dispatch SLA */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Dispatch SLA
              </label>
              <input
                type="text"
                name="dispatchSla"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="Same-day / 24h Express"
                value={formData.dispatchSla}
                onChange={handleChange}
              />
            </div>

            {/* Buffer Capacity */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Buffer Warehouse Capacity
              </label>
              <input
                type="text"
                name="bufferCapacity"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="50,000+ Units Buffer"
                value={formData.bufferCapacity}
                onChange={handleChange}
              />
            </div>

            {/* Commercial Terms */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Commercial / Payment Terms
              </label>
              <input
                type="text"
                name="commercialTerms"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="Commercial Credit & Wholesale Net 30"
                value={formData.commercialTerms}
                onChange={handleChange}
              />
            </div>

            {/* Rating / Track Record */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Performance Rating
              </label>
              <input
                type="text"
                name="rating"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="4.9/5 (180+ Orders)"
                value={formData.rating}
                onChange={handleChange}
              />
            </div>

            {/* Display Order */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Display Order (Sequence)
              </label>
              <input
                type="number"
                name="displayOrder"
                className="catalog-input"
                style={{ width: '100%' }}
                placeholder="0"
                value={formData.displayOrder}
                onChange={handleChange}
              />
            </div>

            {/* Status & Verification Checkboxes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active Record
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleChange}
                />
                Verified Status
              </label>
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Business Profile Description
              </label>
              <textarea
                rows={3}
                name="description"
                className="catalog-input"
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Premier authorized master distributor catering to enterprise systems integrators and regional retail dealers..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ marginTop: '20px', padding: '14px 0 0', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="catalog-btn"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="catalog-btn catalog-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={15} /> {isEdit ? 'Update Distributor' : 'Create Distributor'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
