import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { adminAuthApi } from './api/adminAuthApi';
import { staffLogin, getStaffPermissions } from '../services/staffApi';
import {
  clearUserSession,
  extractPermissionsFromUser,
  getFirstAuthorizedRoute,
  parseJwtPayload
} from '../utils/rbac';
import adminPortalImage from '../assets/images/products-hero.png';
import './AdminLoginPage.css';

const getLoginErrorMessage = (err) => {
  if (err.code === 'ECONNABORTED') {
    return 'Login request timed out. Please check backend connection.';
  }
  if (!err.response) {
    return (
      err.message ||
      'Unable to connect to backend server. Please verify network or ngrok URL.'
    );
  }
  return (
    err.response?.data?.message ||
    err.response?.data?.title ||
    err.response?.data?.error ||
    'Invalid credentials. Please try again.'
  );
};

const AdminLoginPage = () => {
  useDocumentTitle('Admin & Staff Login', 'Honeywell Products Admin Portal');
  const [authMode, setAuthMode] = useState('admin'); // 'admin' | 'staff'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError(
        authMode === 'staff'
          ? 'Please enter both Email/Employee ID and password.'
          : 'Please enter both email address and password.'
      );
      return;
    }

    setIsLoading(true);
    setError('');

    // Clear any previous user's session and permissions to prevent permission leakage
    clearUserSession();

    try {
      // 10. POST /api/Staff/login for Staff mode
      if (authMode === 'staff') {
        const isEmail = identifier.includes('@');
        const staffPayload = {
          email: isEmail ? identifier.trim() : '',
          employeeId: !isEmail ? identifier.trim() : '',
          password: password,
        };

        const response = await staffLogin(staffPayload);

        // Extract token and user data from real backend response
        const token = response?.token || response?.accessToken || response?.Token;
        const staffData = response?.staff || response?.data || response?.user || response;
        const name =
          staffData?.name ||
          `${staffData?.firstName || ''} ${staffData?.lastName || ''}`.trim() ||
          identifier.split('@')[0];
        const role = (staffData?.role || staffData?.Role || 'staff').toLowerCase();
        let permissions = extractPermissionsFromUser(staffData);

        // If login response didn't embed permissions, query GET /api/Staff/{id}/permissions
        const staffId = staffData?.id ?? staffData?.Id ?? staffData?.staffId ?? staffData?.StaffId;
        if (permissions.length === 0 && staffId) {
          try {
            const permRes = await getStaffPermissions(staffId);
            const fetched = extractPermissionsFromUser(permRes);
            if (fetched.length > 0) {
              permissions = fetched;
            }
          } catch (pErr) {
            console.warn('Could not fetch staff permissions from API:', pErr.message);
          }
        }

        localStorage.setItem('isAdmin', 'true');
        if (token) localStorage.setItem('adminToken', token);
        localStorage.setItem('adminEmail', staffData?.email || identifier.trim());
        localStorage.setItem('adminName', name);
        localStorage.setItem('adminRole', role);
        localStorage.setItem('authType', 'staff');
        localStorage.setItem('adminPermissions', JSON.stringify(permissions));

        // Dynamically redirect to the user's first authorized module (e.g. /admin/catalog/categories)
        const landingRoute = getFirstAuthorizedRoute(permissions, role, 'staff');
        if (landingRoute) {
          navigate(landingRoute);
        } else {
          // If no permissions are assigned, navigate to /admin/dashboard where AdminLayout presents Access Denied
          navigate('/admin/dashboard');
        }
        return;
      }

      // Admin login via adminAuthApi (Email + OTP flow)
      console.log('Sending real API login request for admin:', identifier.trim());
      const response = await adminAuthApi.login(identifier, password);

      // Check if token returned directly
      const token = response?.token || response?.accessToken || response?.Token || response?.data?.token;

      if (token) {
        const tokenPayload = parseJwtPayload(token);
        const tokenRole = (
          tokenPayload?.role || 
          tokenPayload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
          tokenPayload?.Role || 
          response?.role || 
          response?.user?.role ||
          ''
        ).toLowerCase().trim();

        let profile = null;
        try {
          localStorage.setItem('adminToken', token);
          const profileData = await adminAuthApi.getProfile();
          profile = profileData?.profile || profileData?.data || profileData?.value || profileData;
        } catch (pErr) {
          console.warn('Admin profile fetch failed:', pErr.message);
        }

        const profileEmail = (profile?.email || '').toLowerCase().trim();
        const loginEmail = identifier.toLowerCase().trim();
        const profileRole = (profile?.role || profile?.Role || '').toLowerCase().trim();

        const isGenuineAdmin = (
          (profileEmail && profileEmail === loginEmail && ['admin', 'superadmin', 'super admin', 'administrator'].includes(profileRole)) ||
          ['admin', 'superadmin', 'super admin', 'administrator'].includes(tokenRole)
        );

        if (!isGenuineAdmin) {
          clearUserSession();
          setError('Access Denied: This account is registered as Staff. Please select the STAFF tab to sign in.');
          return;
        }

        let adminName = profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || identifier.split('@')[0];
        let adminRole = profileRole || tokenRole || 'admin';
        let adminPermissions = extractPermissionsFromUser(profile);
        if (adminPermissions.length === 0) {
          adminPermissions = ['all'];
        }

        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminEmail', loginEmail);
        localStorage.setItem('adminName', adminName);
        localStorage.setItem('adminRole', adminRole);
        localStorage.setItem('authType', 'admin');
        localStorage.setItem('adminPermissions', JSON.stringify(adminPermissions));

        const landingRoute = getFirstAuthorizedRoute(adminPermissions, adminRole, 'admin');
        navigate(landingRoute || '/admin/dashboard');
        return;
      }

      // Backend succeeded and requires OTP verification
      navigate('/admin/verify-otp', {
        state: {
          email: identifier.trim(),
          password,
          fromLogin: true,
          loginData: response,
          authType: 'admin'
        }
      });
    } catch (err) {
      console.error('Real Login Error:', err);
      setError(getLoginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-modal-container">
        {/* Left Side - Image */}
        <div className="admin-login-left">
          <img src={adminPortalImage} alt="Admin Portal" />
        </div>

        {/* Right Side - Form */}
        <div className="admin-login-right">
          <button
            type="button"
            className="admin-auth-close"
            aria-label="Back to site"
            onClick={() => navigate('/')}
          >
            x
          </button>

          <div className="admin-logo-mini">
            <img src="/admin-logo.png" alt="Honeywell Products logo" />
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', width: '100%', maxWidth: '280px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('admin'); setError(''); }}
              style={{
                flex: 1, padding: '7px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                borderRadius: '6px', border: '1px solid',
                borderColor: authMode === 'admin' ? '#1268a5' : '#cbd5e1',
                backgroundColor: authMode === 'admin' ? '#1268a5' : '#f8fafc',
                color: authMode === 'admin' ? '#ffffff' : '#64748b', cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('staff'); setError(''); }}
              style={{
                flex: 1, padding: '7px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                borderRadius: '6px', border: '1px solid',
                borderColor: authMode === 'staff' ? '#1268a5' : '#cbd5e1',
                backgroundColor: authMode === 'staff' ? '#1268a5' : '#f8fafc',
                color: authMode === 'staff' ? '#ffffff' : '#64748b', cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              STAFF
            </button>
          </div>

          <h2>{authMode === 'staff' ? 'SIGN IN TO STAFF.' : 'SIGN IN TO ADMIN.'}</h2>
          <p>
            {authMode === 'staff'
              ? 'Enter your staff email or employee ID to continue.'
              : 'Enter your registered email to continue to your dashboard.'}
          </p>

          {error && (
            <div style={{
              color: '#e53e3e', fontSize: '11px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '12px', maxWidth: '300px', textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="admin-form-container">
            <form onSubmit={handleLogin}>
              <input
                type={authMode === 'staff' ? 'text' : 'email'}
                className="admin-premium-input"
                placeholder={authMode === 'staff' ? 'ENTER EMAIL OR EMPLOYEE ID' : 'ENTER EMAIL ADDRESS'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <input
                type="password"
                className="admin-premium-input"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="admin-premium-btn"
                disabled={isLoading}
              >
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </form>

            <div className="admin-footer-links">
              <span onClick={() => navigate('/admin/forgot-password')}>FORGOT PASSWORD?</span>
              <span>•</span>
              <span onClick={() => navigate('/')}>BACK TO SITE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
