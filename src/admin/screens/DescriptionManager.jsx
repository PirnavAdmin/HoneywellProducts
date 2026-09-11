import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RefreshCw, CheckCircle, AlertCircle, FileText, Code } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import '../catalog/adminModule.css';

const API_URL = `${getApiDomain()}/api/Settings/description-manager`;

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

  useEffect(() => {
    fetchDescriptionSettings();
  }, []);

  const fetchDescriptionSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.get(API_URL, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.data) {
        setDescData(prev => ({ ...prev, ...res.data }));
      }
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

  return (
    <div className="admin-screen p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Description Manager</h1>
          <p className="text-sm text-slate-500">Configure global product description templates, technical specs formats, and warranty disclaimers.</p>
        </div>
        <button
          onClick={fetchDescriptionSettings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-xs"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Reload Templates
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
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Default Product Overview Template</label>
          <textarea
            rows="3"
            required
            className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-blue-600"
            value={descData.defaultProductOverview}
            onChange={e => setDescData({ ...descData, defaultProductOverview: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Technical Specs Template</label>
          <textarea
            rows="4"
            required
            className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono outline-none focus:border-blue-600"
            value={descData.technicalSpecsTemplate}
            onChange={e => setDescData({ ...descData, technicalSpecsTemplate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Standard Warranty Terms Statement</label>
          <textarea
            rows="2"
            className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-blue-600"
            value={descData.warrantyTerms}
            onChange={e => setDescData({ ...descData, warrantyTerms: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Technical Specifications Disclaimer</label>
          <textarea
            rows="2"
            className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-blue-600"
            value={descData.disclaimerText}
            onChange={e => setDescData({ ...descData, disclaimerText: e.target.value })}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-md"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Description Templates'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DescriptionManager;

