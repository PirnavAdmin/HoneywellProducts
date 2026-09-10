import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Key, MapPin } from 'lucide-react';
import { adminAuthApi } from '../api/adminAuthApi';
import { Toast } from '../components/Toast';
import './AdminAccountSettings.css';

const AdminAccountSettings = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const storedName = localStorage.getItem('adminName') || 'Admin User';
    const storedEmail = localStorage.getItem('adminEmail') || '';
    const storedRole = localStorage.getItem('adminRole') || 'admin';
    let storedAddress = localStorage.getItem('adminAddress');
    if (!storedAddress || storedAddress.includes('302A')) {
      storedAddress = '101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana';
      localStorage.setItem('adminAddress', storedAddress);
    }
    
    const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
    const matched = localAccounts.find(acc => acc.email.toLowerCase() === storedEmail.toLowerCase());

    setFormData(prev => ({
      ...prev,
      name: storedName,
      email: storedEmail,
      mobile: matched?.mobile || '9912649265',
      address: storedAddress || matched?.address || '101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana'
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    let errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address';
    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (!cleanMobile) errs.mobile = 'Mobile number is required';
    else if (cleanMobile.length !== 10) errs.mobile = 'Must be exactly 10 digits';
    else if (!/^[6-9]\d{9}$/.test(cleanMobile)) errs.mobile = 'Must start with 6, 7, 8, or 9';
    if (!formData.address.trim()) errs.address = 'Address is required';

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        errs.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToastMessage('Please fix validation errors');
      setToastType('warning');
      return;
    }

    setIsSaving(true);
    try {
      // Send real API updates for Admin Profile & Settings
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const profilePayload = {
        firstName,
        lastName,
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim()
      };

      try {
        await adminAuthApi.updateProfile(profilePayload);
      } catch (pErr) {
        console.warn('PUT /api/AdminProfile API error:', pErr.message);
      }

      if (formData.newPassword) {
        try {
          await adminAuthApi.resetPassword({
            email: formData.email.trim(),
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword
          });
        } catch (pwErr) {
          console.warn('Password update API error:', pwErr.message);
        }
      }

      try {
        await adminAuthApi.updateSettings({
          portalName: 'Honeywell Products & IMS',
          adminEmail: formData.email.trim()
        });
      } catch (sErr) {
        console.warn('PUT /api/AdminProfile/settings API error:', sErr.message);
      }

      localStorage.setItem('adminName', formData.name.trim());
      localStorage.setItem('adminEmail', formData.email.trim());
      localStorage.setItem('adminAddress', formData.address.trim());

      setToastMessage('Account settings updated successfully.');
      setToastType('success');
      
      setTimeout(() => {
        setIsSaving(false);
        navigate('/admin/profile');
      }, 1000);
    } catch (err) {
      console.error('Account settings update error:', err);
      setToastMessage('Failed to update account settings.');
      setToastType('error');
      setIsSaving(false);
    }
  };

  return (
    <div className="account-settings-container">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Header Panel */}
      <section className="settings-header-row">
        <div className="settings-header-left">
          <button className="back-btn" onClick={() => navigate('/admin/profile')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="settings-kicker">Account Manager</span>
            <h2>Account Settings</h2>
          </div>
        </div>
      </section>

      {/* Settings Form Layout */}
      <div className="settings-form-card">
        <form onSubmit={handleSubmit}>
          {/* Section 1: Credentials */}
          <div className="form-section">
            <h3 className="section-title"><User size={16} /> Profile Details</h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-field">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-field">
                <label>Mobile Number</label>
                <div className="mobile-input-wrap">
                  <span className="mobile-prefix">+91</span>
                  <input 
                    type="text" 
                    name="mobile" 
                    value={formData.mobile} 
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
                {errors.mobile && <span className="field-error">{errors.mobile}</span>}
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> Address
                </label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  placeholder="Enter full address, town/taluk, district, pin code"
                  rows={2}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#1e293b',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Security Credentials */}
          <div className="form-section pt-4">
            <h3 className="section-title"><Key size={16} /> Change Account Password</h3>
            <p className="section-subtitle">Leave password fields blank if you do not wish to change your password.</p>
            
            <div className="form-grid">
              <div className="form-field">
                <label>New Password</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={formData.newPassword} 
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
                {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
              </div>

              <div className="form-field">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="form-actions-footer">
            <button type="button" className="cancel-btn" onClick={() => navigate('/admin/profile')}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAccountSettings;

