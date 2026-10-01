import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Upload, Edit, RefreshCw, AlertCircle, Loader2, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { solutionService } from '../../services/solutionService';
import { resolveMediaUrl } from '../../utils/apiConfig';
import { apiCache } from '../../utils/apiCache';
import { Toast } from '../components/Toast';
import '../catalog/adminModule.css';

export default function SolutionsManager() {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit Modal State
  const [editingSolution, setEditingSolution] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  const loadSolutions = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      const data = await solutionService.getAll(showToast);
      setSolutions(Array.isArray(data) ? data : []);
      if (showToast) setToast({ message: 'Solutions refetched directly from live backend API.', type: 'success' });
    } catch (err) {
      console.error('Failed to load solutions:', err);
      setSolutions([]); // Ensure no data shown on server error
      setToast({ message: err.message || 'Failed to load solutions from API.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSolutions();
  }, []);

  const handleOpenEdit = (sol) => {
    const currentImg = sol.imageUrl || sol.image || '';
    setEditingSolution({
      ...sol,
      title: sol.title || '',
      description: sol.description || '',
      application: sol.application || '',
      categoryId: sol.categoryId || '',
      imageUrl: currentImg,
    });
    setImageUrlInput(currentImg);
    setPreviewImage(resolveMediaUrl(currentImg));
  };

  const handleCloseEdit = () => {
    setEditingSolution(null);
    setPreviewImage('');
    setImageUrlInput('');
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setPreviewImage(dataUrl);
      setImageUrlInput(dataUrl);
      setEditingSolution((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Handle direct image URL input
  const handleUrlInputChange = (e) => {
    const val = e.target.value;
    setImageUrlInput(val);
    setEditingSolution((prev) => ({ ...prev, imageUrl: val }));
    setPreviewImage(resolveMediaUrl(val));
  };

  // Submit PUT /api/Solutions/{id}
  const handleSaveSolution = async (e) => {
    e.preventDefault();
    if (!editingSolution) return;

    try {
      setSaving(true);
      const updatedPayload = {
        id: editingSolution.id,
        title: editingSolution.title,
        description: editingSolution.description,
        application: editingSolution.application,
        categoryId: editingSolution.categoryId,
        imageUrl: editingSolution.imageUrl || imageUrlInput,
        image: editingSolution.imageUrl || imageUrlInput,
        features: editingSolution.features || ['Application-led planning', 'Scalable product selection', '24/7 Monitoring Capability'],
      };

      await solutionService.update(editingSolution.id, updatedPayload);
      apiCache.invalidate('solutions');
      apiCache.invalidate('solutions_all');

      setToast({ message: `Solution "${editingSolution.title}" updated successfully!`, type: 'success' });
      handleCloseEdit();
      await loadSolutions();
    } catch (err) {
      console.error('Failed to save solution:', err);
      setToast({ message: err.message || 'Failed to update solution.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-module-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="catalog-header-card">
        <div className="catalog-header-title-row">
          <div>
            <span className="catalog-badge">SOLUTION CMS</span>
            <h1 className="catalog-main-title">Security Solutions Manager</h1>
            <p className="catalog-subtitle">
              Manage cover images, titles, descriptions, and category links for the 6 Complete Security Solutions.
            </p>
          </div>
          <button
            type="button"
            className="catalog-btn catalog-btn--secondary"
            onClick={() => loadSolutions(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh API'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="catalog-card" style={{ padding: '60px', textAlign: 'center' }}>
          <Loader2 size={36} className="spin" style={{ color: '#1268a5', marginBottom: '12px' }} />
          <h3>Loading Solutions from GET /api/Solutions...</h3>
        </div>
      ) : solutions.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {solutions.map((sol) => {
            const displayImg = resolveMediaUrl(sol.imageUrl || sol.image || '');
            return (
              <div
                key={sol.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ position: 'relative', height: '190px', background: '#f1f5f9' }}>
                  <img
                    src={displayImg || '/assets/images/smart-technology-trends.png'}
                    alt={sol.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/images/smart-technology-trends.png';
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {sol.application || 'SOLUTION'}
                  </span>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                    {sol.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0', flex: 1 }}>
                    {sol.description}
                  </p>

                  <div
                    style={{
                      fontSize: '12px',
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                    }}
                  >
                    <strong>Category Slug:</strong> <code>{sol.categoryId}</code>
                  </div>

                  <button
                    type="button"
                    className="catalog-btn catalog-btn--primary"
                    onClick={() => handleOpenEdit(sol)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Edit size={16} /> Edit Solution & Upload Image
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="catalog-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
          <h3>No Solutions Returned</h3>
          <p>The backend API returned an empty solutions list.</p>
        </div>
      )}

      {/* Edit Solution Modal — Portal rendered on document.body for top-level Z-Index */}
      {editingSolution &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflowY: 'auto',
            }}
            onClick={handleCloseEdit}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '620px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
                padding: '32px',
                position: 'relative',
                animation: 'modalFadeIn 0.2s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span className="catalog-badge">EDIT SOLUTION DETAILS</span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0 0', color: '#0f172a' }}>
                    {editingSolution.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSolution}>
                {/* Cover Image Upload & Preview Box */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Solution Cover Image *
                  </label>

                  {/* Image Preview Box */}
                  <div
                    style={{
                      height: '200px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      position: 'relative',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Solution Cover Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/images/smart-technology-trends.png';
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <ImageIcon size={40} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '13px' }}>No cover image selected</p>
                      </div>
                    )}
                  </div>

                  {/* Dual Upload Options: File Upload OR Direct URL */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* File Upload Button */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: '#eff6ff',
                        border: '1px dashed #3b82f6',
                        borderRadius: '8px',
                        color: '#1d4ed8',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <Upload size={16} /> Choose File...
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Image URL Input */}
                    <div style={{ position: 'relative' }}>
                      <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748b' }} />
                      <input
                        type="text"
                        placeholder="Paste Image URL..."
                        value={imageUrlInput}
                        onChange={handleUrlInputChange}
                        style={{
                          width: '100%',
                          padding: '9px 10px 9px 30px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSolution.title}
                    onChange={(e) => setEditingSolution((prev) => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                {/* Application Tag */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Application / Eyebrow Tag *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSolution.application}
                    onChange={(e) => setEditingSolution((prev) => ({ ...prev, application: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Description *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={editingSolution.description}
                    onChange={(e) => setEditingSolution((prev) => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                {/* Category Slug */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Category Slug (Hardware Category Filter) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSolution.categoryId}
                    onChange={(e) => setEditingSolution((prev) => ({ ...prev, categoryId: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <button
                    type="button"
                    className="catalog-btn catalog-btn--secondary"
                    onClick={handleCloseEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="catalog-btn catalog-btn--primary" disabled={saving}>
                    {saving ? 'Saving to Backend API...' : 'Save & Publish Solution'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
