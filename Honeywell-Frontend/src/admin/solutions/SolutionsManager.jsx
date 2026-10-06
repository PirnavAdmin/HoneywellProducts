import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Upload,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  Tag
} from 'lucide-react';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Form Data State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    application: '',
    categoryId: 'cctv-cameras',
    imageUrl: '',
    features: ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation'],
  });

  const [newFeatureText, setNewFeatureText] = useState('');

  const loadSolutions = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await solutionService.getAll(forceRefresh);
      setSolutions(Array.isArray(data) ? data : []);
      if (forceRefresh) {
        setToast({ message: 'Solutions portfolio refreshed from live API.', type: 'success' });
      }
    } catch (err) {
      console.error('Failed to load solutions:', err);
      setSolutions([]);
      setToast({ message: err.message || 'Failed to connect to solutions API.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSolutions();
  }, []);

  // Open Edit Modal
  const handleOpenEdit = (sol) => {
    setIsCreatingNew(false);
    setEditingSolution(sol);
    const currentImg = sol.imageUrl || sol.image || '';
    setFormData({
      id: sol.id || '',
      title: sol.title || '',
      description: sol.description || '',
      application: sol.application || '',
      categoryId: sol.categoryId || 'cctv-cameras',
      imageUrl: currentImg,
      features: Array.isArray(sol.features) && sol.features.length > 0
        ? [...sol.features]
        : ['Application-led planning', 'Scalable product selection', '24/7 Monitoring Capability'],
    });
    setImageUrlInput(currentImg);
    setPreviewImage(resolveMediaUrl(currentImg) || currentImg);
    setIsModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsCreatingNew(true);
    setEditingSolution(null);
    const generatedId = `solution-${Date.now()}`;
    setFormData({
      id: generatedId,
      title: '',
      description: '',
      application: 'Commercial & Industrial',
      categoryId: 'cctv-cameras',
      imageUrl: '',
      features: ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation'],
    });
    setImageUrlInput('');
    setPreviewImage('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSolution(null);
    setIsCreatingNew(false);
    setPreviewImage('');
    setImageUrlInput('');
    setUploadingImage(false);
    setNewFeatureText('');
  };

  // Image File Upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show immediate local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      const serverUrl = await solutionService.uploadImage(file);
      if (serverUrl) {
        setImageUrlInput(serverUrl);
        setFormData((prev) => ({ ...prev, imageUrl: serverUrl }));
        setPreviewImage(resolveMediaUrl(serverUrl));
        setToast({ message: 'Cover image uploaded successfully to server!', type: 'success' });
      }
    } catch (uploadErr) {
      console.warn('Direct upload endpoint unavailable, keeping local preview payload:', uploadErr);
      const readerFallback = new FileReader();
      readerFallback.onloadend = () => {
        const dataUrl = readerFallback.result;
        setImageUrlInput(dataUrl);
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      };
      readerFallback.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  // Image URL Input
  const handleUrlInputChange = (e) => {
    const val = e.target.value;
    setImageUrlInput(val);
    setFormData((prev) => ({ ...prev, imageUrl: val }));
    setPreviewImage(resolveMediaUrl(val) || val);
  };

  // Add Feature Tag
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeatureText.trim()],
    }));
    setNewFeatureText('');
  };

  // Remove Feature Tag
  const handleRemoveFeature = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Save (Create or Update)
  const handleSaveSolution = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a solution title.');
      return;
    }

    const finalImage = formData.imageUrl || imageUrlInput || previewImage;

    try {
      setSaving(true);
      const payload = {
        id: formData.id || `solution-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        application: formData.application.trim(),
        categoryId: formData.categoryId.trim(),
        imageUrl: finalImage,
        image: finalImage,
        features: formData.features.length > 0 ? formData.features : ['Application-led planning', 'Scalable product selection', 'Sales-assisted recommendation'],
      };

      if (isCreatingNew) {
        await solutionService.create(payload);
        setToast({ message: `New solution "${payload.title}" created successfully!`, type: 'success' });
      } else {
        await solutionService.update(payload.id, payload);
        setToast({ message: `Solution "${payload.title}" updated successfully!`, type: 'success' });
      }

      apiCache.invalidate('solutions');
      apiCache.invalidate('solutions_all');

      handleCloseModal();
      await loadSolutions(true);
    } catch (err) {
      console.error('Failed to save solution:', err);
      setToast({ message: err.message || 'Failed to save solution.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Solution
  const handleDeleteSolution = async (sol) => {
    if (!window.confirm(`Are you sure you want to delete the solution "${sol.title}"?`)) return;

    try {
      await solutionService.delete(sol.id);
      apiCache.invalidate('solutions');
      apiCache.invalidate('solutions_all');
      setToast({ message: `Solution "${sol.title}" removed.`, type: 'success' });
      await loadSolutions(true);
    } catch (err) {
      console.error('Failed to delete solution:', err);
      setToast({ message: err.message || 'Failed to delete solution.', type: 'error' });
    }
  };

  return (
    <div className="catalog-page" style={{ padding: '0px', maxWidth: '100%', margin: '0px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Header Card */}
      <section
        className="catalog-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '24px 28px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #1268a5',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: '20px',
        }}
      >
        <div className="catalog-title-wrap" style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Solutions Portfolio
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            Manage solution packages, cover images, descriptions, feature points, and product category mappings.
          </p>
        </div>

        <div className="catalog-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'nowrap', flexShrink: 0 }}>
          <button
            type="button"
            className="catalog-btn catalog-btn--secondary"
            onClick={() => loadSolutions(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh API'}
          </button>

          <button
            type="button"
            className="catalog-btn catalog-btn--primary"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} /> Add New Solution
          </button>
        </div>
      </section>

      {/* Main Table View */}
      <div
        className="catalog-table-wrap"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <table className="catalog-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, width: '150px' }}>Preview</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700 }}>Title &amp; Environment</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700 }}>Category Slug</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700 }}>Description &amp; Highlights</th>
              <th className="catalog-center-cell" style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontWeight: 700, width: '110px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="catalog-center-cell" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <Loader2 size={28} className="spin" style={{ color: '#1268a5', marginBottom: '8px', display: 'inline-block' }} />
                  <div>Loading solutions portfolio...</div>
                </td>
              </tr>
            ) : solutions.length === 0 ? (
              <tr>
                <td colSpan="5" className="catalog-center-cell" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <AlertCircle size={36} color="#94a3b8" style={{ marginBottom: '8px', display: 'inline-block' }} />
                  <div style={{ fontWeight: 700, color: '#334155' }}>No solutions found.</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Click <strong>Add New Solution</strong> to create your first solution card.</div>
                </td>
              </tr>
            ) : (
              solutions.map((sol) => {
                const displayImg = resolveMediaUrl(sol.imageUrl || sol.image || '');
                return (
                  <tr key={sol.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* Cover Image Preview */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      {displayImg ? (
                        <img
                          src={displayImg}
                          alt={sol.title || 'Solution Preview'}
                          style={{
                            width: '130px',
                            height: '68px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'block',
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/images/smart-technology-trends.png';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '130px',
                            height: '68px',
                            background: '#f1f5f9',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                          }}
                        >
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>

                    {/* Title & Environment */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginBottom: '6px' }}>
                        {sol.title || '(Untitled Solution)'}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#eaf4fb',
                          color: '#1268a5',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {sol.application || 'General Security'}
                      </span>
                    </td>

                    {/* Category Slug Link */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <a
                        href={`/products?category=${sol.categoryId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#2563eb',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          background: '#f8fafc',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <Tag size={12} /> {sol.categoryId} <ExternalLink size={11} />
                      </a>
                    </td>

                    {/* Description & Feature Highlights */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.45, marginBottom: '8px', maxWidth: '420px' }}>
                        {sol.description}
                      </div>
                      {Array.isArray(sol.features) && sol.features.length > 0 && (
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {sol.features.slice(0, 3).map((feat, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f1f5f9',
                                color: '#334155',
                                fontSize: '11px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}
                            >
                              <Check size={11} color="#16a34a" /> {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="catalog-center-cell" style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sol)}
                          title="Edit Solution & Image"
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#2563eb',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSolution(sol)}
                          title="Delete Solution"
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            background: '#ffffff',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ADD / EDIT MODAL DIALOG ================= */}
      {isModalOpen &&
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
            onClick={handleCloseModal}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '680px',
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
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    {isCreatingNew ? 'CREATE NEW SOLUTION' : 'EDIT SOLUTION PACKAGE'}
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0 0', color: '#0f172a' }}>
                    {isCreatingNew ? 'Add Solution Portfolio Card' : formData.title || 'Edit Solution'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                    Cover Image &amp; Media *
                  </label>

                  {/* Image Preview Box */}
                  <div
                    style={{
                      height: '210px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#f8fafc',
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
                        <ImageIcon size={42} style={{ marginBottom: '8px', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No cover image selected</p>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Upload a photo or paste a URL below</span>
                      </div>
                    )}
                  </div>

                  {/* Dual Upload Controls */}
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
                        cursor: uploadingImage ? 'wait' : 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <Upload size={16} className={uploadingImage ? 'spin' : ''} />
                      {uploadingImage ? 'Uploading Image...' : 'Choose Local File...'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Direct URL Input */}
                    <div style={{ position: 'relative' }}>
                      <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '13px', color: '#64748b' }} />
                      <input
                        type="text"
                        placeholder="Or paste image URL / path..."
                        value={imageUrlInput}
                        onChange={handleUrlInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 10px 10px 32px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Fields: Two Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Solution Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                      Solution Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Commercial CCTV & AI Surveillance"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  {/* Application / Environment */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                      Environment / Eyebrow Tag *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Commercial & Industrial"
                      value={formData.application}
                      onChange={(e) => setFormData((prev) => ({ ...prev, application: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Category Slug */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Linked Category Slug (Hardware Filter on Store) *
                  </label>
                  <input
                    type="text"
                    required
                    list="solutionCategoryOptions"
                    placeholder="e.g. cctv-cameras, networking, solar-cameras"
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <datalist id="solutionCategoryOptions">
                    <option value="cctv-cameras">Commercial CCTV & AI Surveillance (Network & Turbo HD Cameras)</option>
                    <option value="networking">Access Control & Perimeter Defense (Networking & Controllers)</option>
                    <option value="dome-camera">Retail Store & POS Security (Dome Cameras)</option>
                    <option value="wifi-cameras">Smart Home Security (Wi-Fi & Wireless Cameras)</option>
                    <option value="bullet-cameras">Warehouse & Logistics Security (Bullet Cameras)</option>
                    <option value="solar-cameras">Off-Grid Solar Surveillance (Solar Kits & 4G)</option>
                    <option value="network-cameras">Network Cameras</option>
                    <option value="turbo-hd-cameras">Turbo HD Cameras</option>
                    <option value="solar-kit">Solar Kit Solutions</option>
                    <option value="solar-panels">Solar Panels</option>
                    <option value="ptz-cameras">PTZ & Speed Dome Cameras</option>
                  </datalist>
                  <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    When users click &ldquo;View Suggested Products&rdquo;, they are taken to <code>/products?category=&#123;slug&#125;</code>.
                  </small>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Solution Description *
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Describe the solution architecture and security benefits..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: 1.5 }}
                  />
                </div>

                {/* Dynamic Features List Manager */}
                <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                    Key Features / Highlight Bullets
                  </label>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Add a feature point (e.g. 4K Ultra-HD Resolution)..."
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      style={{
                        padding: '8px 14px',
                        background: '#1268a5',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.features.map((feat, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#334155',
                        }}
                      >
                        <Check size={13} color="#16a34a" />
                        {feat}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0,
                          }}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving}
                    style={{
                      padding: '10px 18px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    style={{
                      padding: '10px 22px',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {saving ? 'Publishing Changes...' : isCreatingNew ? 'Create & Publish Solution' : 'Save & Publish Solution'}
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
