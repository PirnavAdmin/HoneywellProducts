import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle2, Loader2, Calendar, Globe, Tag, Hash } from 'lucide-react';
import { documentService } from '../../services/documentService';

const DOCUMENT_CATEGORIES = [
  'Datasheets',
  'User Manuals',
  'Brochures',
  'Certifications',
  'Technical Documents',
];

const emptyDocForm = {
  category: 'Datasheets',
  title: '',
  description: '',
  revision: '',
  language: 'English',
  documentDate: new Date().toISOString().split('T')[0],
  status: 'Active',
};

const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default function AdminDocumentModal({
  isOpen,
  onClose,
  productId,
  productName,
  editingItem,
  onSaved,
  onAddPending, // For Add Product mode
}) {
  const [formData, setFormData] = useState(emptyDocForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplacingFile, setIsReplacingFile] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        id: editingItem.id,
        category: editingItem.category || 'Datasheets',
        title: editingItem.title || '',
        description: editingItem.description || '',
        revision: editingItem.revision || '',
        language: editingItem.language || 'English',
        documentDate: editingItem.documentDate ? editingItem.documentDate.split('T')[0] : '',
        status: editingItem.status || 'Active',
      });
      setSelectedFile(null);
      setIsReplacingFile(false);
    } else {
      setFormData({
        ...emptyDocForm,
        documentDate: new Date().toISOString().split('T')[0],
      });
      setSelectedFile(null);
      setIsReplacingFile(false);
    }
    setValidationError('');
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setValidationError('Only PDF documents (.pdf) are supported.');
      e.target.value = '';
      return;
    }

    // 50 MB limit (consistent with backend)
    if (file.size > 50 * 1024 * 1024) {
      setValidationError('PDF file size exceeds the 50 MB maximum limit.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setValidationError('');

    // Auto-fill title from filename if title is currently empty
    if (!formData.title) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      setFormData((prev) => ({ ...prev, title: cleanTitle }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!formData.category || !formData.category.trim()) {
      setValidationError('Document Category is required.');
      return;
    }

    if (!formData.title || !formData.title.trim()) {
      setValidationError('Document Title is required.');
      return;
    }

    // New upload requires a file
    if (!editingItem && !selectedFile) {
      setValidationError('A PDF file is required to upload a document.');
      return;
    }

    // Editing mode with replacement requires file
    if (editingItem && isReplacingFile && !selectedFile) {
      setValidationError('Please select a replacement PDF file or uncheck file replacement.');
      return;
    }

    // If we're in "Add Product" mode (no productId yet saved in backend)
    if (!productId && onAddPending) {
      onAddPending({
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file: selectedFile,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        metadata: {
          category: formData.category.trim(),
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          revision: formData.revision?.trim() || '',
          language: formData.language?.trim() || 'English',
          documentDate: formData.documentDate || new Date().toISOString(),
          status: formData.status || 'Active',
          productName: productName || '',
        },
      });
      onClose();
      return;
    }

    // Otherwise, perform direct backend call (Edit Product mode)
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await documentService.update(
          editingItem.id,
          {
            ...formData,
            productId: Number(productId),
            productName: productName || '',
          },
          selectedFile,
          !isReplacingFile // keepExistingFile
        );
      } else {
        await documentService.create(
          Number(productId),
          {
            ...formData,
            productName: productName || '',
          },
          selectedFile
        );
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving document:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save product document.';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="catalog-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="catalog-modal-content"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {editingItem ? 'Edit Product Document' : 'Upload Product Document'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              {productName ? `For: ${productName}` : 'Add technical documentation, datasheets, or certificates'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {validationError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13px',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Category & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Document Category <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Publication Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#0f172a',
                  outline: 'none',
                }}
              >
                <option value="Active">Active (Visible to Customers)</option>
                <option value="Inactive">Inactive (Draft / Unpublished)</option>
              </select>
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Document Title <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Honeywell 4K Ultra HD Bullet Camera Datasheet"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                color: '#0f172a',
              }}
            />
          </div>

          {/* PDF File Upload Zone */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              PDF Document File {!editingItem && <span style={{ color: '#dc2626' }}>*</span>}
            </label>

            {editingItem && !isReplacingFile ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} style={{ color: '#1268a5' }} />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'block' }}>
                      {editingItem.originalFileName || editingItem.title || 'Attached PDF Document'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {editingItem.fileSize > 0 ? formatBytes(editingItem.fileSize) : 'Existing PDF stored'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReplacingFile(true)}
                  className="catalog-btn"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Replace File
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#1268a5';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    if (e.dataTransfer.files?.[0]) {
                      const file = e.dataTransfer.files[0];
                      if (!file.name.toLowerCase().endsWith('.pdf')) {
                        setValidationError('Only PDF documents are allowed.');
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <Upload size={28} style={{ color: '#1268a5', margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    {selectedFile ? selectedFile.name : 'Click or drag PDF file here to upload'}
                  </p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {selectedFile
                      ? `Size: ${formatBytes(selectedFile.size)} • PDF format verified`
                      : 'Accepted: PDF only (max 50 MB)'}
                  </span>
                </div>

                {editingItem && isReplacingFile && (
                  <div style={{ marginTop: '6px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplacingFile(false);
                        setSelectedFile(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Keep existing file instead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Short Description <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              placeholder="Brief summary of document content, specifications, or compliance standards..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                color: '#0f172a',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Revision, Language & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Revision / Version <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="text"
                name="revision"
                value={formData.revision}
                onChange={handleInputChange}
                placeholder="e.g., Rev 1.2 or v2.0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  color: '#0f172a',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Language
              </label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                placeholder="e.g., English"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  color: '#0f172a',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Document Date
              </label>
              <input
                type="date"
                name="documentDate"
                value={formData.documentDate}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="catalog-btn"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="catalog-btn catalog-btn--primary"
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving Document...</span>
                </>
              ) : editingItem ? (
                'Save Changes'
              ) : (
                'Upload Document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
