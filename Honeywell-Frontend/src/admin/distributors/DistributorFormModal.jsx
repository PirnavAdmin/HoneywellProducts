import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Save, Building2, MapPin, UserCheck, Truck, FileText } from 'lucide-react';
import { validateGstin } from '../../utils/gstinValidation';
import './Distributors.css';

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
    <div className="distributor-modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="distributor-modal-card distributor-form-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="distributor-modal-header">
          <div className="distributor-header-info">
            <div className="distributor-kicker">
              {isEdit ? `Edit Distributor Profile #${distributor.id}` : 'New Distributor Registration'}
            </div>
            <h2 className="distributor-modal-title">
              {isEdit ? (formData.name || 'Update Distributor') : 'Register New Dealer / Distributor'}
            </h2>
            <span className="distributor-subtitle">
              Manage corporate details, regional coverage, commercial terms, and contact credentials
            </span>
          </div>
          <button
            type="button"
            className="distributor-modal-close"
            disabled={isSubmitting}
            onClick={onClose}
            title="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Compact Form Body */}
        <form onSubmit={handleSubmit} className="distributor-form">
          {/* Section 1: Corporate & Classification */}
          <div className="distributor-form-section">
            <h4 className="distributor-form-section-title">
              <Building2 size={13} style={{ color: '#1268a5' }} />
              Corporate &amp; Classification
            </h4>
            <div className="distributor-form-grid-2">
              <div className="distributor-form-group">
                <label className="distributor-form-label">
                  Company / Distributor Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={`distributor-form-input ${errors.name ? 'has-error' : ''}`}
                  placeholder="e.g. Matrix Security Systems Pvt Ltd"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="distributor-form-error">{errors.name}</span>}
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">
                  Partner Type / Tier <span className="req">*</span>
                </label>
                <select
                  name="partnerType"
                  className="distributor-form-select"
                  value={formData.partnerType}
                  onChange={handleChange}
                >
                  {partnerTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Badge Text / Highlight</label>
                <input
                  type="text"
                  name="badgeText"
                  className="distributor-form-input"
                  placeholder="e.g. Master Hub, Official Verified"
                  value={formData.badgeText}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">GSTIN / Tax ID Number</label>
                <input
                  type="text"
                  name="gstin"
                  maxLength="15"
                  className={`distributor-form-input ${errors.gstin ? 'has-error' : ''}`}
                  placeholder="15-character GSTIN (e.g. 07AAAAA0000A1Z5)"
                  value={formData.gstin}
                  onChange={handleChange}
                />
                {errors.gstin && <span className="distributor-form-error">{errors.gstin}</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Territory & Operational Coverage */}
          <div className="distributor-form-section">
            <h4 className="distributor-form-section-title">
              <MapPin size={13} style={{ color: '#1268a5' }} />
              Territory &amp; Operational Coverage
            </h4>
            <div className="distributor-form-grid-2">
              <div className="distributor-form-group">
                <label className="distributor-form-label">
                  Region <span className="req">*</span>
                </label>
                <select
                  name="region"
                  className={`distributor-form-select ${errors.region ? 'has-error' : ''}`}
                  value={formData.region}
                  onChange={handleChange}
                >
                  {regionOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.region && <span className="distributor-form-error">{errors.region}</span>}
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">
                  City / Base Territory <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="territory"
                  className={`distributor-form-input ${errors.territory ? 'has-error' : ''}`}
                  placeholder="e.g. New Delhi & NCR"
                  value={formData.territory}
                  onChange={handleChange}
                />
                {errors.territory && <span className="distributor-form-error">{errors.territory}</span>}
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Coverage States / Locations</label>
                <input
                  type="text"
                  name="coverageLocations"
                  className="distributor-form-input"
                  placeholder="e.g. Delhi NCR, Haryana, Punjab, UP West"
                  value={formData.coverageLocations}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Full Operational / Warehouse Address</label>
                <input
                  type="text"
                  name="address"
                  className="distributor-form-input"
                  placeholder="Plot 42, Industrial Area Phase-III, New Delhi 110020"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Primary Contact Details */}
          <div className="distributor-form-section">
            <h4 className="distributor-form-section-title">
              <UserCheck size={13} style={{ color: '#1268a5' }} />
              Primary Contact Details
            </h4>
            <div className="distributor-form-grid-2">
              <div className="distributor-form-group">
                <label className="distributor-form-label">
                  Contact Person <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  className={`distributor-form-input ${errors.contactPerson ? 'has-error' : ''}`}
                  placeholder="e.g. Rajesh Malhotra"
                  value={formData.contactPerson}
                  onChange={handleChange}
                />
                {errors.contactPerson && <span className="distributor-form-error">{errors.contactPerson}</span>}
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Contact Title / Designation</label>
                <input
                  type="text"
                  name="contactTitle"
                  className="distributor-form-input"
                  placeholder="e.g. Channel Director / Regional Head"
                  value={formData.contactTitle}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">
                  Phone / Mobile <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  className={`distributor-form-input ${errors.phone ? 'has-error' : ''}`}
                  placeholder="+91 98112 34567"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <span className="distributor-form-error">{errors.phone}</span>}
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">
                  Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className={`distributor-form-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="contact@distributor.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="distributor-form-error">{errors.email}</span>}
              </div>
            </div>
          </div>

          {/* Section 4: Commercial & Operations Specs */}
          <div className="distributor-form-section">
            <h4 className="distributor-form-section-title">
              <Truck size={13} style={{ color: '#1268a5' }} />
              Commercial &amp; Operations Specs
            </h4>
            <div className="distributor-form-grid-3">
              <div className="distributor-form-group col-span-2">
                <label className="distributor-form-label">Product Categories / Lines (Comma Separated)</label>
                <input
                  type="text"
                  name="productCategories"
                  className="distributor-form-input"
                  placeholder="CCTV Surveillance, 4G Solar Cameras, NVR Storage, Access Control"
                  value={formData.productCategories}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Dispatch SLA</label>
                <input
                  type="text"
                  name="dispatchSla"
                  className="distributor-form-input"
                  placeholder="Same-day / 24-48h Express"
                  value={formData.dispatchSla}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Buffer Capacity</label>
                <input
                  type="text"
                  name="bufferCapacity"
                  className="distributor-form-input"
                  placeholder="25,000+ Units Buffer Hub"
                  value={formData.bufferCapacity}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Commercial Terms</label>
                <input
                  type="text"
                  name="commercialTerms"
                  className="distributor-form-input"
                  placeholder="Net 30 Commercial Credit"
                  value={formData.commercialTerms}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group">
                <label className="distributor-form-label">Performance Rating</label>
                <input
                  type="text"
                  name="rating"
                  className="distributor-form-input"
                  placeholder="4.9/5 (180+ Orders)"
                  value={formData.rating}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Profile Description & Status Flags */}
          <div className="distributor-form-section">
            <h4 className="distributor-form-section-title">
              <FileText size={13} style={{ color: '#1268a5' }} />
              Profile Description &amp; Verification Flags
            </h4>
            <div className="distributor-form-grid-2" style={{ alignItems: 'center' }}>
              <div className="distributor-form-group">
                <label className="distributor-form-label">Business Profile Description</label>
                <textarea
                  rows={2}
                  name="description"
                  className="distributor-form-textarea"
                  placeholder="Premier authorized master distributor catering to enterprise systems integrators..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="distributor-form-group" style={{ gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label className="distributor-form-label" style={{ marginBottom: 0 }}>
                    Sequence / Display Order:
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    className="distributor-form-input"
                    style={{ width: '80px', height: '28px' }}
                    placeholder="0"
                    value={formData.displayOrder}
                    onChange={handleChange}
                  />
                </div>

                <div className="distributor-checkbox-row">
                  <label className="distributor-checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    Active Record
                  </label>

                  <label className="distributor-checkbox-label">
                    <input
                      type="checkbox"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleChange}
                    />
                    Verified Partner
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="distributor-modal-footer" style={{ padding: '10px 0 0', background: 'transparent' }}>
            <button
              type="button"
              className="btn-distributor-secondary"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-distributor-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> {isEdit ? 'Update Distributor' : 'Create Distributor'}
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
