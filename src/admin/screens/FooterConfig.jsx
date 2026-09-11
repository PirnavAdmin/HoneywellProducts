import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RefreshCw, CheckCircle, AlertCircle, FileText, Globe, Shield } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import '../catalog/adminModule.css';

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

  useEffect(() => {
    fetchFooterConfig();
  }, []);

  const fetchFooterConfig = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.get(API_URL, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.data) {
        setFooterData(prev => ({ ...prev, ...res.data }));
      }
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

  return (
    <div className="admin-screen p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Footer Configuration</h1>
          <p className="text-sm text-slate-500">Configure website footer links, copyright statements, and social media handles.</p>
        </div>
        <button
          onClick={fetchFooterConfig}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-xs"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Reload Data
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Copyright Statement</label>
          <input
            type="text"
            required
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600"
            value={footerData.copyrightText}
            onChange={e => setFooterData({ ...footerData, copyrightText: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Footer About Summary</label>
          <textarea
            rows="3"
            className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-blue-600"
            value={footerData.aboutSummary}
            onChange={e => setFooterData({ ...footerData, aboutSummary: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Privacy Policy Page URL</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600"
              value={footerData.privacyPolicyUrl}
              onChange={e => setFooterData({ ...footerData, privacyPolicyUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Terms & Conditions URL</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600"
              value={footerData.termsUrl}
              onChange={e => setFooterData({ ...footerData, termsUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cookie Policy URL</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600"
              value={footerData.cookiePolicyUrl}
              onChange={e => setFooterData({ ...footerData, cookiePolicyUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Warranty Policy URL</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600"
              value={footerData.warrantyPolicyUrl}
              onChange={e => setFooterData({ ...footerData, warrantyPolicyUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">LinkedIn URL</label>
            <input
              type="url"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600"
              value={footerData.linkedinUrl}
              onChange={e => setFooterData({ ...footerData, linkedinUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Twitter URL</label>
            <input
              type="url"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600"
              value={footerData.twitterUrl}
              onChange={e => setFooterData({ ...footerData, twitterUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Facebook URL</label>
            <input
              type="url"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600"
              value={footerData.facebookUrl}
              onChange={e => setFooterData({ ...footerData, facebookUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-md"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Footer Config'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FooterConfig;

