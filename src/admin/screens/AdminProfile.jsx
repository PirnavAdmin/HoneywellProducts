import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Mail, Phone, BadgeCheck, MapPin, Calendar, IdCard, Cpu, RefreshCw } from 'lucide-react';
import { getAdminProfile } from '../api/adminProfileApi';
import './AdminProfile.css';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState({
    username: 'shyam',
    fullName: 'Shyam Sundhar Reddy',
    email: 'shyam@shyamagrotools.com',
    mobileNumber: '+91 98765 43210',
    employeeId: 'AD001',
    role: 'Admin',
    roleLabel: 'ADMINISTRATOR',
    isActive: true,
    systemAccess: 'Standard System Access (Limited Screens)',
    createdDate: '',
    address: 'Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401',
    permissions: []
  });

  const fetchProfileData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getAdminProfile();
      const prof = res?.profile || res?.data || res;
      if (prof) {
        const storedAddress = localStorage.getItem('adminAddress') || 'Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401';
        const storedPerms = localStorage.getItem('adminPermissions');

        const updatedUser = {
          username: prof.username || 'shyam',
          fullName: prof.fullName || prof.name || 'Shyam Sundhar Reddy',
          email: prof.email || 'shyam@shyamagrotools.com',
          mobileNumber: prof.mobileNumber || prof.mobile || '+91 98765 43210',
          employeeId: prof.employeeId || 'AD001',
          role: prof.role || 'Admin',
          roleLabel: prof.roleLabel || 'ADMINISTRATOR',
          isActive: prof.isActive !== undefined ? prof.isActive : true,
          systemAccess: prof.systemAccess || 'Standard System Access (Limited Screens)',
          createdDate: prof.createdDate || '',
          address: storedAddress,
          permissions: storedPerms ? JSON.parse(storedPerms) : []
        };

        setUser(updatedUser);

        // Sync with local storage so navbar/topbar reflects real data
        if (updatedUser.fullName) localStorage.setItem('adminName', updatedUser.fullName);
        if (updatedUser.email) localStorage.setItem('adminEmail', updatedUser.email);
        if (updatedUser.role) localStorage.setItem('adminRole', updatedUser.role.toLowerCase());
      }
    } catch (err) {
      console.warn('Could not load profile from API, fallback to stored local info:', err);
      setErrorMsg('Using cached profile details (API connection warning)');
      const storedName = localStorage.getItem('adminName') || 'Shyam Sundhar Reddy';
      const storedEmail = localStorage.getItem('adminEmail') || 'shyam@shyamagrotools.com';
      const storedRole = localStorage.getItem('adminRole') || 'admin';
      const storedPerms = localStorage.getItem('adminPermissions');
      const storedAddress = localStorage.getItem('adminAddress') || 'Opposite New Bustand, Nandikotkur (TQ), Nandyal (DT) - 518401';
      
      setUser(prev => ({
        ...prev,
        fullName: storedName,
        email: storedEmail,
        role: storedRole,
        address: storedAddress,
        permissions: storedPerms ? JSON.parse(storedPerms) : []
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'super admin':
      case 'superadmin':
        return 'Super Administrator';
      case 'admin':
      case 'administrator':
        return 'Admin';
      case 'manager': return 'Operations Manager';
      case 'staff': return 'Staff Member';
      default: return role || 'Admin';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-profile-container">
      {/* Top Header Card */}
      <section className="profile-header-card">
        <div className="profile-header-left">
          <div className="profile-avatar">
            {(user.fullName || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="profile-title-details">
            <span className="profile-kicker" style={{ color: '#cbd5e1' }}>Account Profile</span>
            <h2 style={{ color: '#ffffff', margin: 0, fontWeight: 800 }}>{user.fullName}</h2>
            <div className="profile-badge-row">
              <span className={`role-badge ${user.role.toLowerCase().replace(/\s+/g, '-')}`}>
                <Shield size={12} /> {getRoleLabel(user.role)} ({user.roleLabel})
              </span>
              <span className={user.isActive ? "status-badge-active" : "status-badge-inactive"}>
                <BadgeCheck size={12} /> {user.isActive ? "Active Account" : "Inactive Account"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="edit-profile-btn"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={fetchProfileData}
            title="Refresh profile from API"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Fetching...' : 'Refresh'}
          </button>
          <button 
            className="edit-profile-btn"
            onClick={() => navigate('/admin/account-settings')}
          >
            Account Settings
          </button>
        </div>
      </section>

      {errorMsg && (
        <div style={{
          padding: '10px 16px',
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '8px',
          color: '#b45309',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="profile-details-grid">
        {/* Left Column: Account Details */}
        <div className="profile-card">
          <h3>Personal & Account Details</h3>
          <div className="detail-item">
            <span className="detail-label"><User size={16} /> Full Name</span>
            <span className="detail-value">{user.fullName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><User size={16} /> Username</span>
            <span className="detail-value">{user.username}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><Mail size={16} /> Email Address</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><Phone size={16} /> Mobile Number</span>
            <span className="detail-value">{user.mobileNumber || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><IdCard size={16} /> Employee ID</span>
            <span className="detail-value" style={{ fontWeight: 700, color: '#166534' }}>{user.employeeId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><Calendar size={16} /> Account Created</span>
            <span className="detail-value">{formatDate(user.createdDate)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><MapPin size={16} /> Address</span>
            <span className="detail-value">{user.address}</span>
          </div>
        </div>

        {/* Right Column: RBAC Info */}
        <div className="profile-card">
          <h3>System Access & Security</h3>
          <div className="detail-item" style={{ marginBottom: '16px' }}>
            <span className="detail-label"><Cpu size={16} /> Access Level</span>
            <span className="detail-value" style={{ fontWeight: 600 }}>{user.systemAccess}</span>
          </div>

          <p className="perms-intro-text">
            Below are the administrative modules active for your user account:
          </p>
          <div className="permission-tags-container">
            {user.role.toLowerCase() === 'super admin' || user.role.toLowerCase() === 'superadmin' ? (
              <div className="all-access-tag">
                <Shield size={16} /> Full System Access Granted (All Modules)
              </div>
            ) : user.permissions.length > 0 ? (
              user.permissions.map(perm => (
                <span key={perm} className="permission-tag">
                  {perm.replace('-', ' ')}
                </span>
              ))
            ) : (
              <span className="no-perms-text">Default role access permissions apply to this administrator account.</span>
            )}
          </div>
          
          <div className="profile-warning-box">
            <strong>Security Notice:</strong> Profile updates are synced directly to the system backend service at <code>/api/AdminProfile</code>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;


