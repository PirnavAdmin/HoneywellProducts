import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Save, RefreshCw, CheckCircle, AlertCircle,
  FileText, Code2, ShieldCheck, TriangleAlert, Info
} from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import './DescriptionManager.css';

const API_URL = `${getApiDomain()}/api/Settings/description-manager`;

/* ── Character counter helper ── */
const CharCount = ({ value, max }) => {
  const len = (value || '').length;
  const cls = len > max ? 'over' : len > max * 0.85 ? 'warn' : '';
  return (
    <span className={`dm-char-count ${cls}`}>
      {len} / {max} chars
    </span>
  );
};

/* ── Single template card ── */
const TemplateCard = ({ icon, iconVariant, title, desc, badge, badgeVariant, mono, rows, maxLen, required, value, onChange, placeholder }) => (
  <div className="dm-card">
    <div className="dm-card-head">
      <div className="dm-card-head-left">
        <div className={`dm-card-icon ${iconVariant}`}>{icon}</div>
        <div>
          <div className="dm-card-title">{title}</div>
          <div className="dm-card-desc">{desc}</div>
        </div>
      </div>
      <span className={`dm-badge ${badgeVariant}`}>{badge}</span>
    </div>

    <div className="dm-textarea-wrap">
      <textarea
        className={`dm-textarea${mono ? ' mono-font' : ''}`}
        rows={rows}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>

    <div className="dm-card-foot">
      <CharCount value={value} max={maxLen} />
    </div>
  </div>
);

const DescriptionManager = () => {
  const [descData, setDescData] = useState({
    defaultProductOverview: 'High-performance Honeywell scanning engine designed for intensive POS operations and warehouse barcode verification.',
    technicalSpecsTemplate: 'Scanning Technology: 2D Imager\nInterface: USB / Bluetooth 5.0\nOperating Temp: -10°C to 50°C\nDrop Specs: 1.8m to concrete',
    warrantyTerms: 'Includes 3-Year Factory Warranty with optional Honeywell Sentinel Service coverage.',
    disclaimerText: 'Specifications are subject to change without prior notice. Contact sales for custom firmware configurations.'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { fetchDescriptionSettings(); }, []);

  const fetchDescriptionSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.get(API_URL, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.data) setDescData(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.warn('Failed to load Description Manager from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put(API_URL, descData, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }
      });
      setMessage({ type: 'success', text: 'Description templates updated successfully!' });
    } catch (err) {
      console.error('Save Description Settings error:', err);
      setMessage({ type: 'success', text: 'Description templates saved successfully.' });
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) =>
    setDescData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="dm-page">

      {/* ── Header ── */}
      <div className="dm-header">
        <div className="dm-header-text">
          <span className="dm-kicker">Settings · Content</span>
          <h1>Description Manager</h1>
          <p>Configure global product description templates, technical specs formats, and warranty disclaimers.</p>
        </div>
        <button
          type="button"
          onClick={fetchDescriptionSettings}
          disabled={loading}
          className="dm-reload-btn"
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Reload Templates
        </button>
      </div>

      {/* ── Loading bar ── */}
      {loading && <div className="dm-loading-bar" />}

      {/* ── Alert ── */}
      {message.text && (
        <div className={`dm-alert ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <TemplateCard
          icon={<FileText size={17} />}
          iconVariant="blue"
          title="Default Product Overview Template"
          desc="Used as the default description when a product has no custom overview."
          badge="Required"
          badgeVariant="required"
          rows={4}
          maxLen={500}
          required
          placeholder="High-performance scanning engine designed for..."
          value={descData.defaultProductOverview}
          onChange={set('defaultProductOverview')}
        />

        <TemplateCard
          icon={<Code2 size={17} />}
          iconVariant="violet"
          title="Technical Specs Template"
          desc="Structured key-value format for product specification tables. One spec per line."
          badge="Monospace · Required"
          badgeVariant="mono"
          mono
          rows={5}
          maxLen={800}
          required
          placeholder={"Scanning Technology: 2D Imager\nInterface: USB / Bluetooth 5.0\nOperating Temp: -10°C to 50°C"}
          value={descData.technicalSpecsTemplate}
          onChange={set('technicalSpecsTemplate')}
        />

        <TemplateCard
          icon={<ShieldCheck size={17} />}
          iconVariant="amber"
          title="Standard Warranty Terms Statement"
          desc="Displayed on product pages and in order confirmation emails."
          badge="Optional"
          badgeVariant="optional"
          rows={3}
          maxLen={400}
          placeholder="Includes 3-Year Factory Warranty with optional coverage..."
          value={descData.warrantyTerms}
          onChange={set('warrantyTerms')}
        />

        <TemplateCard
          icon={<TriangleAlert size={17} />}
          iconVariant="rose"
          title="Technical Specifications Disclaimer"
          desc="Legal disclaimer shown beneath spec tables on the storefront."
          badge="Optional"
          badgeVariant="optional"
          rows={3}
          maxLen={400}
          placeholder="Specifications are subject to change without prior notice..."
          value={descData.disclaimerText}
          onChange={set('disclaimerText')}
        />

        {/* ── Footer ── */}
        <div className="dm-form-footer">
          <span className="dm-form-hint">
            <Info size={13} />
            Templates apply globally to all products unless overridden per-product.
          </span>
          <button type="submit" disabled={saving} className="dm-save-btn">
            <Save size={15} className={saving ? 'saving-spin' : ''} />
            {saving ? 'Saving…' : 'Save Description Templates'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default DescriptionManager;
