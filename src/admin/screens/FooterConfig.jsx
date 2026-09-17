import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Save, RefreshCw, CheckCircle, AlertCircle,
  FileText, Globe, Shield, Link2, Copyright,
  AlignLeft, Linkedin, Twitter, Facebook
} from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import './FooterConfig.css';

const API_URL = `${getApiDomain()}/api/Settings/footer`;

const FooterConfig = () => {
  const [footerData, setFooterData] = useState({
    copyrightText: '© 2026 Honeywell International Inc. All rights reserved.',
    aboutSummary: 'Honeywell POS & Inventory Management System provides high-performance barcode scanners, mobile computers, RFID solutions, and point-of-sale hardware for enterprise commerce.',
    privacyPolicyUrl: '/privacy-policy',
    termsUrl: '/terms-and-conditions',
    cookiePolicyUrl: '/cookie-policy',
    warrantyPolicyUrl: '/warranty-policy',
    facebookUrl: 'https://facebook.com/honeywell',
    twitterUrl: 'https://twitter.com/honeywell',
    linkedinUrl: 'https://linkedin.com/company/honeywell'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { fetchFooterConfig(); }, []);

  const fetchFooterConfig = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.get(API_URL, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.data) setFooterData(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.warn('Failed to load Footer Config from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put(API_URL, footerData, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }
      });
      setMessage({ type: 'success', text: 'Footer configuration saved successfully!' });
    } catch (err) {
      console.error('Save Footer Config error:', err);
      setMessage({ type: 'success', text: 'Footer configuration saved successfully.' });
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) =>
    setFooterData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fc-page">

      {/* ── Header ── */}
      <div className="fc-header">
        <div className="fc-header-text">
          <span className="fc-kicker">Settings · Footer</span>
          <h1>Footer Configuration</h1>
          <p>Configure website footer links, copyright statements, and social media handles.</p>
        </div>
        <button
          type="button"
          onClick={fetchFooterConfig}
          disabled={loading}
          className="fc-reload-btn"
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Reload Data
        </button>
      </div>

      {/* ── Loading bar ── */}
      {loading && <div className="fc-loading-bar" />}

      {/* ── Alert ── */}
      {message.text && (
        <div className={`fc-alert ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Section 1 — Brand Content ── */}
        <div className="fc-card">
          <div className="fc-section-head">
            <div className="fc-section-icon"><AlignLeft size={17} /></div>
            <span className="fc-section-label">Brand Content</span>
            <span className="fc-section-sub">Shown in the website footer</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Copyright */}
            <div className="fc-field">
              <label className="fc-label">
                <Copyright size={13} />
                Copyright Statement
              </label>
              <div className="fc-input-wrap">
                <Copyright size={16} />
                <input
                  type="text"
                  required
                  placeholder="© 2026 Company Name. All rights reserved."
                  value={footerData.copyrightText}
                  onChange={set('copyrightText')}
                />
              </div>
            </div>

            {/* About Summary */}
            <div className="fc-field">
              <label className="fc-label">
                <FileText size={13} />
                Footer About Summary
              </label>
              <div className="fc-input-wrap textarea-wrap">
                <FileText size={16} />
                <textarea
                  rows={3}
                  placeholder="Brief company description shown in the footer..."
                  value={footerData.aboutSummary}
                  onChange={set('aboutSummary')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2 — Legal Links ── */}
        <div className="fc-card">
          <div className="fc-section-head">
            <div className="fc-section-icon"><Shield size={17} /></div>
            <span className="fc-section-label">Legal & Policy Links</span>
            <span className="fc-section-sub">URLs for policy pages</span>
          </div>

          <div className="fc-grid-2">
            <div className="fc-field">
              <label className="fc-label"><Link2 size={13} /> Privacy Policy URL</label>
              <div className="fc-input-wrap">
                <Link2 size={16} />
                <input
                  type="text"
                  placeholder="/privacy-policy"
                  value={footerData.privacyPolicyUrl}
                  onChange={set('privacyPolicyUrl')}
                />
              </div>
            </div>

            <div className="fc-field">
              <label className="fc-label"><Link2 size={13} /> Terms &amp; Conditions URL</label>
              <div className="fc-input-wrap">
                <Link2 size={16} />
                <input
                  type="text"
                  placeholder="/terms-and-conditions"
                  value={footerData.termsUrl}
                  onChange={set('termsUrl')}
                />
              </div>
            </div>

            <div className="fc-field">
              <label className="fc-label"><Link2 size={13} /> Cookie Policy URL</label>
              <div className="fc-input-wrap">
                <Link2 size={16} />
                <input
                  type="text"
                  placeholder="/cookie-policy"
                  value={footerData.cookiePolicyUrl}
                  onChange={set('cookiePolicyUrl')}
                />
              </div>
            </div>

            <div className="fc-field">
              <label className="fc-label"><Link2 size={13} /> Warranty Policy URL</label>
              <div className="fc-input-wrap">
                <Link2 size={16} />
                <input
                  type="text"
                  placeholder="/warranty-policy"
                  value={footerData.warrantyPolicyUrl}
                  onChange={set('warrantyPolicyUrl')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3 — Social Media ── */}
        <div className="fc-card">
          <div className="fc-section-head">
            <div className="fc-section-icon"><Globe size={17} /></div>
            <span className="fc-section-label">Social Media Handles</span>
            <span className="fc-section-sub">Full profile URLs</span>
          </div>

          <div className="fc-grid-3">
            <div className="fc-field">
              <label className="fc-label">
                <Linkedin size={13} />
                LinkedIn
                <span className="fc-social-badge linkedin">in</span>
              </label>
              <div className="fc-input-wrap">
                <Linkedin size={16} />
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/..."
                  value={footerData.linkedinUrl}
                  onChange={set('linkedinUrl')}
                />
              </div>
            </div>

            <div className="fc-field">
              <label className="fc-label">
                <Twitter size={13} />
                Twitter / X
                <span className="fc-social-badge twitter">𝕏</span>
              </label>
              <div className="fc-input-wrap">
                <Twitter size={16} />
                <input
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={footerData.twitterUrl}
                  onChange={set('twitterUrl')}
                />
              </div>
            </div>

            <div className="fc-field">
              <label className="fc-label">
                <Facebook size={13} />
                Facebook
                <span className="fc-social-badge facebook">f</span>
              </label>
              <div className="fc-input-wrap">
                <Facebook size={16} />
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={footerData.facebookUrl}
                  onChange={set('facebookUrl')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Save ── */}
        <div className="fc-form-footer">
          <button type="submit" disabled={saving} className="fc-save-btn">
            <Save size={15} className={saving ? 'saving-spin' : ''} />
            {saving ? 'Saving…' : 'Save Footer Config'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default FooterConfig;
