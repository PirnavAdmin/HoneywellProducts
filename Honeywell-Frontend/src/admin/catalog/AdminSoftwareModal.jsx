import React, { useState, useEffect } from 'react';
import { X, Upload, ExternalLink, AlertTriangle, FileCheck, Loader2 } from 'lucide-react';
import { softwareService } from '../../services/softwareService';

const SOFTWARE_TYPES = [
  'Software',
  'Firmware',
  'Driver',
  'Configuration Tool',
  'Utility',
  'Desktop Application',
  'Mobile Application',
  'Plugin',
  'Other',
];

const PLATFORMS = [
  'Windows',
  'macOS',
  'Linux',
  'Android',
  'iOS',
  'Firmware',
  'Cross-platform',
  'Other',
];

const ARCHITECTURES = ['32-bit', '64-bit', 'ARM', 'ARM64', 'Universal', 'N/A'];

const emptyForm = {
  softwareName: '',
  softwareType: 'Software',
  version: '',
  platform: 'Windows',
  architecture: '64-bit',
  description: '',
  fileUrl: '',
  externalUrl: '',
  releaseDate: new Date().toISOString().split('T')[0],
  releaseNotes: '',
  minimumRequirements: '',
  status: 'Active',
  isFeatured: false,
  sortOrder: 1,
};

export default function AdminSoftwareModal({
  isOpen,
  onClose,
  productId,
  productName,
  productModel,
  editingItem,
  onSaved,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        id: editingItem.id,
        softwareName: editingItem.softwareName || '',
        softwareType: editingItem.softwareType || 'Software',
        version: editingItem.version || '',
        platform: editingItem.platform || 'Windows',
        architecture: editingItem.architecture || '64-bit',
        description: editingItem.description || '',
        fileUrl: editingItem.fileUrl || '',
        externalUrl: editingItem.externalUrl || '',
        releaseDate: editingItem.releaseDate ? editingItem.releaseDate.split('T')[0] : '',
        releaseNotes: editingItem.releaseNotes || '',
        minimumRequirements: editingItem.minimumRequirements || editingItem.minimumOS || '',
        status: editingItem.status || 'Active',
        isFeatured: Boolean(editingItem.isFeatured),
        sortOrder: editingItem.sortOrder || 1,
      });
      setSelectedFile(null);
    } else {
      setFormData({
        ...emptyForm,
        releaseDate: new Date().toISOString().split('T')[0],
      });
      setSelectedFile(null);
    }
    setValidationError('');
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (validationError) setValidationError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationError('');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const isValidUrl = (string) => {
    if (!string) return true;
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Field Validations
    if (!formData.softwareName.trim()) {
      setValidationError('Software Name is required.');
      return;
    }
    if (!formData.version.trim()) {
      setValidationError('Version is required.');
      return;
    }
    if (!formData.description.trim()) {
      setValidationError('Description is required.');
      return;
    }

    // Rule 15: Software File OR External Download URL required!
    const hasFile = selectedFile !== null || Boolean(formData.fileUrl);
    const hasUrl = Boolean(formData.externalUrl && formData.externalUrl.trim());

    if (!hasFile && !hasUrl) {
      setValidationError('Please upload a software file or provide an external download URL.');
      return;
    }

    if (hasUrl && !isValidUrl(formData.externalUrl.trim())) {
      setValidationError('External Download URL must be a valid http:// or https:// URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        productId: String(productId || ''),
        productName: productName || '',
        productModel: productModel || '',
      };

      if (editingItem?.id) {
        await softwareService.update(editingItem.id, payload, selectedFile, !selectedFile);
      } else {
        await softwareService.create(payload, selectedFile);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving software:', err);
      setValidationError(err.message || 'Failed to save software details.');
    } finally {
      setIsSubmitting(false);
    }
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px 28px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#1d4ed8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              PRODUCT SOFTWARE
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
              {editingItem ? 'Edit Software & Downloads' : 'Add Software & Downloads'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {validationError && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          {/* Software Name & Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Software Name *
              </label>
              <input
                type="text"
                name="softwareName"
                value={formData.softwareName}
                onChange={handleInputChange}
                placeholder="e.g. Honeywell Device Manager"
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Software Type *
              </label>
              <select
                name="softwareType"
                value={formData.softwareType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {SOFTWARE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Version, Platform, Architecture */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Version *
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                placeholder="2.4.1"
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Platform *
              </label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Architecture
              </label>
              <select
                name="architecture"
                value={formData.architecture}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {ARCHITECTURES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Description *
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the software utility or firmware package"
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          {/* File Upload OR External URL Section */}
          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>
              DOWNLOAD SOURCE (File Upload OR External URL Required)
            </span>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Option A: Upload Software File
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ fontSize: '12px', color: '#475569' }}
                  />
                  {selectedFile && (
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileCheck size={14} /> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                      <button type="button" onClick={removeSelectedFile} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '6px' }}>Remove</button>
                    </span>
                  )}
                </div>
                {!selectedFile && formData.fileUrl && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Current File: <code>{formData.fileUrl}</code> (Upload new file to replace)
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Option B: External Download URL
                </label>
                <input
                  type="url"
                  name="externalUrl"
                  value={formData.externalUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/downloads/setup.exe"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Release Date & Minimum OS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Release Date
              </label>
              <input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Minimum OS / Requirements
              </label>
              <input
                type="text"
                name="minimumRequirements"
                value={formData.minimumRequirements}
                onChange={handleInputChange}
                placeholder="Windows 10 or later, 4GB RAM"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Release Notes */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Release Notes
            </label>
            <textarea
              name="releaseNotes"
              rows={3}
              value={formData.releaseNotes}
              onChange={handleInputChange}
              placeholder="Bug fixes, performance improvements, new features..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          {/* Status, Featured, Sort Order */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Sort Order
              </label>
              <input
                type="number"
                name="sortOrder"
                min="1"
                value={formData.sortOrder}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                />
                Featured Software
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="catalog-btn"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="catalog-btn catalog-btn--primary"
              disabled={isSubmitting}
              style={{ padding: '8px 18px', fontSize: '13px', minWidth: '120px' }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingItem ? 'Update Software' : 'Save Software'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
