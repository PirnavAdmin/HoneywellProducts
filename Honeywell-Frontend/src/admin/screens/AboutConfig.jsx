import React, { useState, useEffect } from 'react';
import {
  Save, RefreshCw, CheckCircle, AlertCircle, Upload,
  Image, Plus, Trash2, Layout, FileText, Compass, Award,
  Briefcase, UserCheck, HelpCircle
} from 'lucide-react';
import { aboutApi, resolveImageUrl } from '../../services/aboutApi';
import './AboutConfig.css';

const ICON_OPTIONS = [
  'Camera', 'Sun', 'Zap', 'Network', 'ShieldCheck', 'Eye',
  'Handshake', 'CheckCircle', 'Target', 'Lock', 'Cpu', 'Globe'
];

const DEFAULT_DATA = {
  hero: {
    eyebrow: 'ABOUT US',
    title: 'Security Technology With a Clear Purpose',
    description: 'A premium framework prepared for official company story, market position and leadership content.',
    image: '/uploads/about/hero.jpg'
  },
  overview: {
    eyebrow: 'COMPANY OVERVIEW',
    title: 'Built for Product Discovery and Security Solutions',
    lead: 'The official company overview statement.',
    description: 'Scalable foundation for CCTV, security, solar product discovery, eCommerce preparation, bulk enquiries and channel partnerships.',
    image: '/uploads/about/overview.jpg'
  },
  vision: {
    title: 'Long-term Vision Statement',
    description: 'Detailed vision goals.'
  },
  mission: {
    title: 'Company Mission Statement',
    description: 'Detailed mission goals.'
  },
  portfolio: {
    eyebrow: 'PRODUCT PORTFOLIO',
    title: 'Security, CCTV & Solar Power Product Portfolio',
    description: 'Comprehensive surveillance systems, solar panels, inverters, storage batteries, and recording solutions.',
    items: [
      { icon: 'Camera', title: 'CCTV & Surveillance', text: 'Analog, Dome, Bullet, PTZ, and IP security cameras.' },
      { icon: 'Sun', title: 'Solar Panels & Energy', text: 'High-efficiency Monocrystalline, Polycrystalline, and Bifacial modules.' },
      { icon: 'Zap', title: 'Solar Inverters & Storage', text: 'Off-grid and hybrid solar inverters, lithium & gel batteries.' },
      { icon: 'Network', title: 'Recording & Networking', text: 'NVRs, DVRs, surveillance drives, and PoE network switches.' }
    ]
  },
  whyChooseUs: {
    eyebrow: 'WHY CHOOSE US',
    title: 'A Conservative, Client-Ready Approach',
    description: 'Statements avoid unsupported claims and remain ready for verified company information.',
    items: [
      { icon: 'ShieldCheck', title: 'Practical Security Focus', text: 'Product discovery organized around clear application needs.' },
      { icon: 'Eye', title: 'Transparent Product Data', text: 'Verified models and specifications.' },
      { icon: 'Handshake', title: 'Business Ready', text: 'Dedicated enquiry journeys for retail, bulk and partner requirements.' }
    ]
  },
  ceo: {
    name: 'CEO Full Name',
    designation: 'Chief Executive Officer',
    message: 'Approved executive statement.',
    subtext: 'Supporting leadership statement.',
    image: '/uploads/about/ceo.jpg'
  }
};

export default function AboutConfig() {
  const [formData, setFormData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSection, setUploadingSection] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await aboutApi.getAboutData();
      if (data) {
        setFormData({
          hero: { ...DEFAULT_DATA.hero, ...data.hero },
          overview: { ...DEFAULT_DATA.overview, ...data.overview },
          vision: { ...DEFAULT_DATA.vision, ...data.vision },
          mission: { ...DEFAULT_DATA.mission, ...data.mission },
          portfolio: {
            ...DEFAULT_DATA.portfolio,
            ...data.portfolio,
            items: Array.isArray(data.portfolio?.items) ? data.portfolio.items : DEFAULT_DATA.portfolio.items
          },
          whyChooseUs: {
            ...DEFAULT_DATA.whyChooseUs,
            ...data.whyChooseUs,
            items: Array.isArray(data.whyChooseUs?.items) ? data.whyChooseUs.items : DEFAULT_DATA.whyChooseUs.items
          },
          ceo: { ...DEFAULT_DATA.ceo, ...data.ceo }
        });
      }
    } catch (err) {
      console.warn('Failed to fetch About Us configuration:', err.message);
      setMessage({ type: 'error', text: 'Could not load About Us data from backend server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await aboutApi.updateAboutData(formData);
      setMessage({ type: 'success', text: 'About Us configuration saved and persisted successfully!' });
      if (res && res.data) {
        setFormData(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Save About Us error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to update About Us configuration.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, section) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setMessage({ type: 'error', text: 'Unsupported image format. Please select a JPG, JPEG, PNG, or WEBP file.' });
      return;
    }

    setUploadingSection(section);
    setMessage({ type: '', text: '' });

    try {
      const res = await aboutApi.uploadAboutImage(file, section);
      if (res && res.imageUrl) {
        setFormData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            image: res.imageUrl
          }
        }));
        setMessage({ type: 'success', text: `${section.toUpperCase()} image uploaded successfully! Click 'Save All Changes' to persist.` });
      } else {
        throw new Error('Server returned an empty image URL.');
      }
    } catch (err) {
      console.error(`Upload error for section ${section}:`, err);
      const errMsg = err.response?.data?.message || err.message || `Failed to upload image for ${section}.`;
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setUploadingSection(null);
      e.target.value = '';
    }
  };

  // Helper state changers
  const updateSectionField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayItem = (section, index, field, value) => {
    setFormData(prev => {
      const items = [...(prev[section]?.items || [])];
      items[index] = { ...items[index], [field]: value };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          items
        }
      };
    });
  };

  const addArrayItem = (section, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: [...(prev[section]?.items || []), defaultItem]
      }
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="ac-page">
      {/* ── Header ── */}
      <div className="ac-header">
        <div className="ac-header-text">
          <span className="ac-kicker">Settings · CMS</span>
          <h1>About Us Page Management</h1>
          <p>Update live About Us content, vision, mission, product portfolio, and leadership photos.</p>
        </div>
        <button
          type="button"
          onClick={fetchAboutData}
          disabled={loading || saving}
          className="ac-reload-btn"
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Reload Data
        </button>
      </div>

      {/* ── Alert Banner ── */}
      {message.text && (
        <div className={`ac-alert ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ── 1. Hero Section ── */}
        <div className="ac-card">
          <h2 className="ac-section-title">
            <Layout size={18} /> 1. Hero Section
          </h2>
          <div className="ac-grid">
            <div className="ac-field">
              <label className="ac-label">Eyebrow</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.hero.eyebrow}
                  onChange={e => updateSectionField('hero', 'eyebrow', e.target.value)}
                  placeholder="e.g. ABOUT US"
                  required
                />
              </div>
            </div>

            <div className="ac-field">
              <label className="ac-label">Title</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.hero.title}
                  onChange={e => updateSectionField('hero', 'title', e.target.value)}
                  placeholder="Hero Heading Title"
                  required
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">Description</label>
              <div className="ac-input-wrap">
                <textarea
                  rows={2}
                  value={formData.hero.description}
                  onChange={e => updateSectionField('hero', 'description', e.target.value)}
                  placeholder="Hero description paragraph..."
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">Hero Background / Banner Image</label>
              <div className="ac-image-upload-box">
                {formData.hero.image ? (
                  <img src={resolveImageUrl(formData.hero.image)} alt="Hero Preview" className="ac-preview-img" />
                ) : (
                  <div className="ac-preview-placeholder">No Image</div>
                )}
                <div className="ac-upload-actions">
                  <label className="ac-upload-btn">
                    <Upload size={14} />
                    {uploadingSection === 'hero' ? 'Uploading…' : 'Upload Hero Image'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      style={{ display: 'none' }}
                      disabled={uploadingSection === 'hero'}
                      onChange={e => handleImageUpload(e, 'hero')}
                    />
                  </label>
                  <p className="ac-file-hint">Current path: {formData.hero.image || 'None'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Company Overview ── */}
        <div className="ac-card">
          <h2 className="ac-section-title">
            <FileText size={18} /> 2. Company Overview
          </h2>
          <div className="ac-grid">
            <div className="ac-field">
              <label className="ac-label">Eyebrow</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.overview.eyebrow}
                  onChange={e => updateSectionField('overview', 'eyebrow', e.target.value)}
                  placeholder="e.g. COMPANY OVERVIEW"
                  required
                />
              </div>
            </div>

            <div className="ac-field">
              <label className="ac-label">Title</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.overview.title}
                  onChange={e => updateSectionField('overview', 'title', e.target.value)}
                  placeholder="Overview Section Title"
                  required
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">Lead Statement</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.overview.lead}
                  onChange={e => updateSectionField('overview', 'lead', e.target.value)}
                  placeholder="Highlighted lead sentence..."
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">Full Overview Description</label>
              <div className="ac-input-wrap">
                <textarea
                  rows={3}
                  value={formData.overview.description}
                  onChange={e => updateSectionField('overview', 'description', e.target.value)}
                  placeholder="Detailed company background description..."
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">Overview Image</label>
              <div className="ac-image-upload-box">
                {formData.overview.image ? (
                  <img src={resolveImageUrl(formData.overview.image)} alt="Overview Preview" className="ac-preview-img" />
                ) : (
                  <div className="ac-preview-placeholder">No Image</div>
                )}
                <div className="ac-upload-actions">
                  <label className="ac-upload-btn">
                    <Upload size={14} />
                    {uploadingSection === 'overview' ? 'Uploading…' : 'Upload Overview Image'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      style={{ display: 'none' }}
                      disabled={uploadingSection === 'overview'}
                      onChange={e => handleImageUpload(e, 'overview')}
                    />
                  </label>
                  <p className="ac-file-hint">Current path: {formData.overview.image || 'None'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Vision & Mission ── */}
        <div className="ac-card">
          <h2 className="ac-section-title">
            <Compass size={18} /> 3. Vision &amp; Mission
          </h2>
          <div className="ac-grid">
            {/* Vision */}
            <div className="ac-field full-width">
              <label className="ac-label">Vision Heading</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.vision.title}
                  onChange={e => updateSectionField('vision', 'title', e.target.value)}
                  placeholder="Vision Statement Title"
                  required
                />
              </div>
            </div>
            <div className="ac-field full-width">
              <label className="ac-label">Vision Description</label>
              <div className="ac-input-wrap">
                <textarea
                  rows={2}
                  value={formData.vision.description}
                  onChange={e => updateSectionField('vision', 'description', e.target.value)}
                  placeholder="Long-term vision goals..."
                />
              </div>
            </div>

            {/* Mission */}
            <div className="ac-field full-width">
              <label className="ac-label">Mission Heading</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.mission.title}
                  onChange={e => updateSectionField('mission', 'title', e.target.value)}
                  placeholder="Mission Statement Title"
                  required
                />
              </div>
            </div>
            <div className="ac-field full-width">
              <label className="ac-label">Mission Description</label>
              <div className="ac-input-wrap">
                <textarea
                  rows={2}
                  value={formData.mission.description}
                  onChange={e => updateSectionField('mission', 'description', e.target.value)}
                  placeholder="Company mission goals..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Product Portfolio ── */}
        <div className="ac-card">
          <h2 className="ac-section-title">
            <Briefcase size={18} /> 4. Product Portfolio Section
          </h2>
          <div className="ac-grid" style={{ marginBottom: '16px' }}>
            <div className="ac-field">
              <label className="ac-label">Eyebrow</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.portfolio.eyebrow}
                  onChange={e => updateSectionField('portfolio', 'eyebrow', e.target.value)}
                />
              </div>
            </div>
            <div className="ac-field">
              <label className="ac-label">Title</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.portfolio.title}
                  onChange={e => updateSectionField('portfolio', 'title', e.target.value)}
                />
              </div>
            </div>
            <div className="ac-field full-width">
              <label className="ac-label">Description</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.portfolio.description}
                  onChange={e => updateSectionField('portfolio', 'description', e.target.value)}
                />
              </div>
            </div>
          </div>

          <label className="ac-label" style={{ marginBottom: '12px' }}>Portfolio Cards</label>
          {formData.portfolio.items.map((item, index) => (
            <div className="ac-item-row" key={index}>
              <div className="ac-field" style={{ flex: '0 0 140px' }}>
                <label className="ac-label">Icon</label>
                <div className="ac-input-wrap">
                  <select
                    value={item.icon}
                    onChange={e => updateArrayItem('portfolio', index, 'icon', e.target.value)}
                  >
                    {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
              </div>
              <div className="ac-field" style={{ flex: '0 0 200px' }}>
                <label className="ac-label">Title</label>
                <div className="ac-input-wrap">
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => updateArrayItem('portfolio', index, 'title', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="ac-field">
                <label className="ac-label">Text</label>
                <div className="ac-input-wrap">
                  <input
                    type="text"
                    value={item.text}
                    onChange={e => updateArrayItem('portfolio', index, 'text', e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                className="ac-remove-item-btn"
                onClick={() => removeArrayItem('portfolio', index)}
                title="Remove Item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="ac-add-item-btn"
            onClick={() => addArrayItem('portfolio', { icon: 'Camera', title: 'New Portfolio Category', text: 'Category description details.' })}
          >
            <Plus size={15} /> Add Portfolio Card
          </button>
        </div>

        {/* ── 5. Why Choose Us ── */}
        <div className="ac-card">
          <h2 className="ac-section-title">
            <Award size={18} /> 5. Why Choose Us Section
          </h2>
          <div className="ac-grid" style={{ marginBottom: '16px' }}>
            <div className="ac-field">
              <label className="ac-label">Eyebrow</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.whyChooseUs.eyebrow}
                  onChange={e => updateSectionField('whyChooseUs', 'eyebrow', e.target.value)}
                />
              </div>
            </div>
            <div className="ac-field">
              <label className="ac-label">Title</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.whyChooseUs.title}
                  onChange={e => updateSectionField('whyChooseUs', 'title', e.target.value)}
                />
              </div>
            </div>
            <div className="ac-field full-width">
              <label className="ac-label">Description</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.whyChooseUs.description}
                  onChange={e => updateSectionField('whyChooseUs', 'description', e.target.value)}
                />
              </div>
            </div>
          </div>

          <label className="ac-label" style={{ marginBottom: '12px' }}>Why Choose Us Cards</label>
          {formData.whyChooseUs.items.map((item, index) => (
            <div className="ac-item-row" key={index}>
              <div className="ac-field" style={{ flex: '0 0 140px' }}>
                <label className="ac-label">Icon</label>
                <div className="ac-input-wrap">
                  <select
                    value={item.icon}
                    onChange={e => updateArrayItem('whyChooseUs', index, 'icon', e.target.value)}
                  >
                    {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
              </div>
              <div className="ac-field" style={{ flex: '0 0 200px' }}>
                <label className="ac-label">Title</label>
                <div className="ac-input-wrap">
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => updateArrayItem('whyChooseUs', index, 'title', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="ac-field">
                <label className="ac-label">Text</label>
                <div className="ac-input-wrap">
                  <input
                    type="text"
                    value={item.text}
                    onChange={e => updateArrayItem('whyChooseUs', index, 'text', e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                className="ac-remove-item-btn"
                onClick={() => removeArrayItem('whyChooseUs', index)}
                title="Remove Item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="ac-add-item-btn"
            onClick={() => addArrayItem('whyChooseUs', { icon: 'ShieldCheck', title: 'New Advantage', text: 'Advantage detail statement.' })}
          >
            <Plus size={15} /> Add Advantage Card
          </button>
        </div>

        {/* ── 6. CEO Corner ── */}
        <div className="ac-card">
          <h2 className="ac-section-title">
            <UserCheck size={18} /> 6. CEO Corner Section
          </h2>
          <div className="ac-grid">
            <div className="ac-field">
              <label className="ac-label">CEO Full Name</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.ceo.name}
                  onChange={e => updateSectionField('ceo', 'name', e.target.value)}
                  placeholder="e.g. Executive Full Name"
                  required
                />
              </div>
            </div>

            <div className="ac-field">
              <label className="ac-label">Designation / Title</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.ceo.designation}
                  onChange={e => updateSectionField('ceo', 'designation', e.target.value)}
                  placeholder="e.g. Chief Executive Officer"
                  required
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">Executive Quote / Message</label>
              <div className="ac-input-wrap">
                <textarea
                  rows={2}
                  value={formData.ceo.message}
                  onChange={e => updateSectionField('ceo', 'message', e.target.value)}
                  placeholder="Executive quote message..."
                  required
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">Subtext / Supporting Statement</label>
              <div className="ac-input-wrap">
                <input
                  type="text"
                  value={formData.ceo.subtext}
                  onChange={e => updateSectionField('ceo', 'subtext', e.target.value)}
                  placeholder="Supporting message details..."
                />
              </div>
            </div>

            <div className="ac-field full-width">
              <label className="ac-label">CEO Photograph</label>
              <div className="ac-image-upload-box">
                {formData.ceo.image ? (
                  <img src={resolveImageUrl(formData.ceo.image)} alt="CEO Preview" className="ac-preview-img" />
                ) : (
                  <div className="ac-preview-placeholder">No Image</div>
                )}
                <div className="ac-upload-actions">
                  <label className="ac-upload-btn">
                    <Upload size={14} />
                    {uploadingSection === 'ceo' ? 'Uploading…' : 'Upload CEO Photograph'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      style={{ display: 'none' }}
                      disabled={uploadingSection === 'ceo'}
                      onChange={e => handleImageUpload(e, 'ceo')}
                    />
                  </label>
                  <p className="ac-file-hint">Current path: {formData.ceo.image || 'None'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Save Footer ── */}
        <div className="ac-form-footer">
          <button
            type="submit"
            disabled={saving || uploadingSection !== null}
            className="ac-save-btn"
          >
            <Save size={16} className={saving ? 'saving-spin' : ''} />
            {saving ? 'Saving to Database…' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
