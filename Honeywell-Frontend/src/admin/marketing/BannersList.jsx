import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Upload, Check, X, Image as ImageIcon, Trash2, Edit2, ExternalLink } from 'lucide-react';
import {
  fetchAdminBanners,
  createBanner,
  updateBanner,
  toggleBannerActive,
  deleteBanner,
  uploadBannerImage,
  resolveBannerImage
} from './bannersApi';
import { getApiDomain, DEFAULT_BACKEND_URL } from '../../utils/apiConfig';
import '../catalog/adminModule.css';

const BannersList = () => {
  const [banners, setBanners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    targetUrl: '/categories',
    bannerType: 'Hero',
    isActive: true,
    displayOrder: 0
  });

  const loadBanners = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchAdminBanners();
      setBanners(data);
    } catch (err) {
      console.error('Failed to load banners:', err);
      setError('Could not connect to server. Showing local state.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.displayOrder || 0)) : 0;
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      targetUrl: '/categories',
      bannerType: 'Hero',
      isActive: true,
      displayOrder: maxOrder + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      targetUrl: banner.targetUrl || '/categories',
      bannerType: banner.bannerType || 'Hero',
      isActive: banner.isActive,
      displayOrder: banner.displayOrder || 0
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadBannerImage(file);
      if (res) {
        const imageUrlStr = typeof res === 'string' ? res : (res.imageUrl || res.url || res.path || '');
        setFormData(prev => ({ ...prev, imageUrl: imageUrlStr }));
        setSuccessMsg('Banner image uploaded successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Image upload failed. You can also paste an image URL directly.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Please upload an image or provide an Image URL.');
      return;
    }

    const duplicateOrder = banners.find(b => 
      b.displayOrder === formData.displayOrder && 
      b.id !== (editingBanner?.id)
    );
    
    if (duplicateOrder) {
      alert('This display order is already in use by another banner. Please choose a unique order number.');
      return;
    }

    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
        setSuccessMsg('Banner updated successfully!');
      } else {
        await createBanner(formData);
        setSuccessMsg('New Banner created successfully!');
      }
      setIsModalOpen(false);
      loadBanners();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save banner:', err);
      alert('Error saving banner. Please try again.');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleBannerActive(id);
      setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
    } catch (err) {
      console.error('Failed to toggle banner:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
      setSuccessMsg('Banner deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to delete banner:', err);
      alert('Failed to delete banner.');
    }
  };

  const filteredBanners = banners.filter(b => {
    const matchesSearch = (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || (b.bannerType || '').toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="catalog-spread" style={{ padding: '24px' }}>
      {/* Top Header */}
      <div className="catalog-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="catalog-title" style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Hero & Promo Banners
          </h1>
          <p className="catalog-subtitle" style={{ fontSize: '13px', color: '#64748b' }}>
            Manage homepage hero sliders and promotional banner images without changing code
          </p>
        </div>
        <button
          type="button"
          className="catalog-btn catalog-btn--primary"
          onClick={handleOpenCreateModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#10b981', color: '#fff', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          <Plus size={16} /> Add New Banner
        </button>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
          ⚠ {error}
        </div>
      )}

      {/* Controls Bar */}
      <div className="catalog-controls" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="catalog-search" style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} className="catalog-search__icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="catalog-search__input"
            placeholder="Search banners by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Promo and Trust banner filters are temporarily hidden. To recall, add 'Promo', 'Trust' back to the array. */}
          {['All', 'Hero'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: filterType === type ? '2px solid #1268a5' : '1px solid #cbd5e1',
                background: filterType === type ? '#eaf4fb' : '#fff',
                color: filterType === type ? '#1268a5' : '#475569',
                cursor: 'pointer'
              }}
            >
              {type === 'All' ? 'All Banners' : `${type} Banners`}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="catalog-table-wrap" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table className="catalog-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Order</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Preview</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Title / Subtitle</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b' }}>Target Link</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>Status</th>
              <th className="catalog-center-cell" style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="catalog-center-cell" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading banners...
                </td>
              </tr>
            ) : filteredBanners.length === 0 ? (
              <tr>
                <td colSpan="7" className="catalog-center-cell" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No banners found. Click <strong>Add New Banner</strong> to create one.
                </td>
              </tr>
            ) : (
              filteredBanners.map(banner => (
                <tr key={banner.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#64748b' }}>
                    #{banner.displayOrder || banner.id}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {banner.imageUrl ? (
                      <img
                        src={resolveBannerImage(banner.imageUrl)}
                        alt={banner.title || 'Banner Preview'}
                        style={{ width: '120px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      />
                    ) : (
                      <div style={{ width: '120px', height: '50px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{banner.title || '(No Title)'}</div>
                    {banner.subtitle && <div style={{ fontSize: '11px', color: '#64748b' }}>{banner.subtitle}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: banner.bannerType === 'Hero' ? '#eaf4fb' : '#fef3c7',
                      color: banner.bannerType === 'Hero' ? '#1268a5' : '#b45309'
                    }}>
                      {banner.bannerType} Banner
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#2563eb', fontSize: '12px' }}>
                    <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit' }}>
                      {banner.targetUrl} <ExternalLink size={11} />
                    </a>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        background: banner.isActive ? '#dcfce7' : '#fee2e2',
                        color: banner.isActive ? '#15803d' : '#b91c1c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {banner.isActive ? <Check size={12} /> : <X size={12} />}
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="catalog-center-cell" style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(banner)}
                        title="Edit Banner"
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(banner.id)}
                        title="Delete Banner"
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Create/Edit Banner */}
      {isModalOpen && createPortal(
        <div
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '24px 16px',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '560px',
              maxHeight: 'calc(100vh - 48px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              margin: 'auto',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
                flexShrink: 0
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0' }}>
                  {editingBanner ? `Modify banner settings for ID #${editingBanner.id}` : 'Configure and upload a new marketing banner'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, margin: 0 }}>
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
                
                {/* Banner Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Banner Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.bannerType}
                    onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#fff',
                      color: '#0f172a',
                      fontWeight: 500,
                      outline: 'none'
                    }}
                  >
                    <option value="Hero">Hero Carousel Banner (Homepage Slider)</option>
                    {/* To recall Promo and Trust banners in the future, uncomment below options:
                    <option value="Promo">Promotional Banner (Offer Sections)</option>
                    <option value="Trust">Trust &amp; Rating Banner (Customer Testimonial Slider)</option>
                    */}
                  </select>
                </div>

                {/* Banner Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Banner Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Industrial Barcode Scanners &amp; POS Systems"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Subtitle / Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Discover enterprise-grade security, scanning and RFID solutions"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Banner Image */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Banner Image <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Paste image URL or click Upload..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                    <label
                      style={{
                        padding: '10px 16px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#475569',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Upload size={15} />
                      {isUploading ? 'Uploading…' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleImageFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {formData.imageUrl && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <img
                          src={resolveBannerImage(formData.imageUrl)}
                          alt="Preview"
                          style={{
                            height: '52px',
                            width: '90px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formData.imageUrl}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Click URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Target Click URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /products, /solutions, or /offers"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Display Order & Active Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ paddingTop: '22px' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0f172a',
                        userSelect: 'none'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                      />
                      Publish / Active Banner
                    </label>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#f8fafc',
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BannersList;

