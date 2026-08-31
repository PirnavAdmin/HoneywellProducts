import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Key, MapPin, IdCard, CheckCircle } from 'lucide-react';
import { Toast } from '../components/Toast';
import { 
  getAdminProfile, 
  updateAdminProfile, 
  postAdminProfile, 
  updateAdminProfileSettings, 
  postAdminProfileSettings 
} from '../api/adminProfileApi';
import './AdminAccountSettings.css';

const AdminAccountSettings = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    mobile: '',
    address: '',
    employeeId: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const res = await getAdminProfile();
        const prof = res?.profile || res?.data || res;
        if (prof) {
          const storedAddress = localStorage.getItem('adminAddress') || 'Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401';
          const mob = prof.mobileNumber || prof.mobile || '9912649265';
          const cleanMob = mob.replace(/^\+?91\s*/, '');

          setFormData({
            username: prof.username || 'shyam',
            name: prof.fullName || prof.name || 'Shyam Sundhar Reddy',
            email: prof.email || 'shyam@shyamagrotools.com',
            mobile: cleanMob,
            address: storedAddress,
            employeeId: prof.employeeId || 'AD001',
            password: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      } catch (err) {
        console.warn('Using local storage fallback for settings:', err);
        const storedName = localStorage.getItem('adminName') || 'Shyam Sundhar Reddy';
        const storedEmail = localStorage.getItem('adminEmail') || 'shyam@shyamagrotools.com';
        const storedAddress = localStorage.getItem('adminAddress') || 'Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401';

        setFormData(prev => ({
          ...prev,
          username: 'shyam',
          name: storedName,
          email: storedEmail,
          mobile: '9876543210',
          address: storedAddress,
          employeeId: 'AD001'
        }));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
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

    const role = localStorage.getItem('adminRole') || 'Admin';

    setIsSaving(true);

    const formattedMobile = formData.mobile.startsWith('+91') 
      ? formData.mobile.trim() 
      : `+91 ${formData.mobile.trim().replace(/^(\d{5})(\d{5})$/, '$1 $2')}`;

    const profilePayload = {
      username: formData.username || formData.email.split('@')[0],
      fullName: formData.name.trim(),
      email: formData.email.trim(),
      mobileNumber: formattedMobile,
      employeeId: formData.employeeId || 'AD001',
      role: role,
      roleLabel: role.toUpperCase(),
      isActive: true,
      systemAccess: 'Standard System Access (Limited Screens)'
    };

    const settingsPayload = {
      notifications: true,
      emailAlerts: true,
      theme: 'light',
      address: formData.address.trim(),
      ...profilePayload
    };

    try {
      // 1. Call API Endpoints for Profile and Settings
      let apiSuccess = false;
      try {
        await updateAdminProfile(profilePayload);
        await updateAdminProfileSettings(settingsPayload);
        apiSuccess = true;
      } catch (err1) {
        console.warn('PUT endpoint error, trying POST fallback:', err1);
        try {
          await postAdminProfile(profilePayload);
          await postAdminProfileSettings(settingsPayload);
          apiSuccess = true;
        } catch (err2) {
          console.error('API call error:', err2);
        }
      }

      // 2. Local storage persistence for offline capability & navbar sync
      localStorage.setItem('adminName', formData.name.trim());
      localStorage.setItem('adminEmail', formData.email.trim());
      localStorage.setItem('adminAddress', formData.address.trim());
      
      const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
      const index = localAccounts.findIndex(acc => acc.email.toLowerCase() === formData.email.toLowerCase());
      
      if (index > -1) {
        const updatedUser = {
          ...localAccounts[index],
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          mobile: formData.mobile.trim(),
          address: formData.address.trim()
        };
        if (formData.newPassword) {
          updatedUser.password = formData.newPassword;
        }
        localAccounts[index] = updatedUser;
        localStorage.setItem('added_staff_accounts', JSON.stringify(localAccounts));
      }

      setToastMessage(apiSuccess ? 'Profile and settings updated on server successfully!' : 'Account settings saved locally.');
      setToastType('success');
      
      setTimeout(() => {
        setIsSaving(false);
        navigate('/admin/profile');
      }, 1000);
    } catch (err) {
      console.error(err);
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
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading account details from API...
          </div>
        ) : (
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
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange}
                    placeholder="Enter username"
                  />
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

                <div className="form-field">
                  <label>Employee ID</label>
                  <input 
                    type="text" 
                    name="employeeId" 
                    value={formData.employeeId} 
                    onChange={handleChange}
                    placeholder="e.g. AD001"
                  />
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
                {isSaving ? 'Updating API...' : 'Update Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminAccountSettings;


