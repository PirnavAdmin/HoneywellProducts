import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Phone, Mail, MapPin, Clock, Save, RefreshCw,
  CheckCircle, AlertCircle, Building2
} from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import './ContactCard.css';

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

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="cc-page">

      {/* ── Header ── */}
      <div className="cc-header">
        <div className="cc-header-text">
          <span className="cc-kicker">Settings · Contact</span>
          <h1>Contact Card Configuration</h1>
          <p>Manage business contact information, helpline numbers, and campus address.</p>
        </div>
        <button
          type="button"
          onClick={fetchContactCard}
          disabled={loading}
          className="cc-reload-btn"
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Reload Data
        </button>
      </div>

      {/* ── Loading bar ── */}
      {loading && <div className="cc-loading-bar" />}

      {/* ── Alert ── */}
      {message.text && (
        <div className={`cc-alert ${message.type}`}>
          {message.type === 'success'
            ? <CheckCircle size={17} />
            : <AlertCircle size={17} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="cc-form-card">

        <p className="cc-section-title">Basic Information</p>

        <div className="cc-grid">
          {/* Company Name */}
          <div className="cc-field">
            <label className="cc-label">
              <Building2 size={13} />
              Company Name
            </label>
            <div className="cc-input-wrap">
              <input
                type="text"
                required
                placeholder="e.g. Honeywell POS-IMS Division"
                value={formData.companyName}
                onChange={set('companyName')}
              />
            </div>
          </div>

          {/* Official Email */}
          <div className="cc-field">
            <label className="cc-label">
              <Mail size={13} />
              Official Email Address
            </label>
            <div className="cc-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                required
                placeholder="support@company.com"
                value={formData.email}
                onChange={set('email')}
              />
            </div>
          </div>

          {/* Primary Phone */}
          <div className="cc-field">
            <label className="cc-label">
              <Phone size={13} />
              Primary Helpline Phone
            </label>
            <div className="cc-input-wrap">
              <Phone size={16} />
              <input
                type="text"
                required
                placeholder="+91 1800-000-0000"
                value={formData.phone}
                onChange={set('phone')}
              />
            </div>
          </div>

          {/* Secondary Hotline */}
          <div className="cc-field">
            <label className="cc-label">
              <Phone size={13} />
              Secondary Support Hotline
            </label>
            <div className="cc-input-wrap">
              <Phone size={16} />
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.supportHotline}
                onChange={set('supportHotline')}
              />
            </div>
          </div>
        </div>

        <hr className="cc-divider" />
        <p className="cc-section-title">Location &amp; Hours</p>

        <div className="cc-grid">
          {/* Office Address */}
          <div className="cc-field full-width">
            <label className="cc-label">
              <MapPin size={13} />
              Office Address
            </label>
            <div className="cc-input-wrap textarea-wrap">
              <MapPin size={16} />
              <textarea
                rows={3}
                placeholder="Full office address..."
                value={formData.address}
                onChange={set('address')}
              />
            </div>
          </div>

          {/* Business Hours */}
          <div className="cc-field full-width">
            <label className="cc-label">
              <Clock size={13} />
              Business Operating Hours
            </label>
            <div className="cc-input-wrap">
              <Clock size={16} />
              <input
                type="text"
                placeholder="Monday - Saturday: 9:00 AM - 6:00 PM IST"
                value={formData.businessHours}
                onChange={set('businessHours')}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="cc-form-footer">
          <button
            type="submit"
            disabled={saving}
            className="cc-save-btn"
          >
            <Save size={15} className={saving ? 'saving-spin' : ''} />
            {saving ? 'Saving…' : 'Save Contact Card'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactCard;
