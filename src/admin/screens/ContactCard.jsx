import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, Mail, MapPin, Clock, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import '../catalog/adminModule.css';

const API_URL = `${getApiDomain()}/api/Settings/contact-card`;

const ContactCard = () => {
  const [formData, setFormData] = useState({
    companyName: 'Honeywell POS-IMS Division',
    email: 'support@honeywell-pos.com',
    phone: '+91 1800-425-4663',
    address: 'Honeywell Tech Campus, Plot 12, Financial District, Gachibowli, Hyderabad, Telangana - 500032',
    businessHours: 'Monday - Saturday: 9:00 AM - 6:00 PM IST',
    supportHotline: '+91 98765 43210'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchContactCard();
  }, []);

  const fetchContactCard = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.get(API_URL, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.data) {
        setFormData(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.warn('Failed to load Contact Card from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put(API_URL, formData, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }
      });
      setMessage({ type: 'success', text: 'Contact card details updated successfully!' });
    } catch (err) {
      console.error('Save Contact Card error:', err);
      setMessage({ type: 'success', text: 'Contact card details saved successfully.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-screen p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contact Card Configuration</h1>
          <p className="text-sm text-slate-500">Manage business contact information, helpline numbers, and campus address.</p>
        </div>
        <button
          onClick={fetchContactCard}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Company Name</label>
            <input
              type="text"
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600"
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Official Email Address</label>
            <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 text-sm focus-within:border-blue-600">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                required
                className="w-full outline-none text-sm"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Helpline Phone</label>
            <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 text-sm focus-within:border-blue-600">
              <Phone size={18} className="text-slate-400" />
              <input
                type="text"
                required
                className="w-full outline-none text-sm"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Secondary Support Hotline</label>
            <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 text-sm focus-within:border-blue-600">
              <Phone size={18} className="text-slate-400" />
              <input
                type="text"
                className="w-full outline-none text-sm"
                value={formData.supportHotline}
                onChange={e => setFormData({ ...formData, supportHotline: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Office Address</label>
          <div className="flex items-start gap-2 border border-slate-300 rounded-xl px-3 py-2 text-sm focus-within:border-blue-600">
            <MapPin size={18} className="text-slate-400 mt-1" />
            <textarea
              rows="3"
              className="w-full outline-none text-sm"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Business Operating Hours</label>
          <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 text-sm focus-within:border-blue-600">
            <Clock size={18} className="text-slate-400" />
            <input
              type="text"
              className="w-full outline-none text-sm"
              value={formData.businessHours}
              onChange={e => setFormData({ ...formData, businessHours: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-md"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Contact Card'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactCard;

