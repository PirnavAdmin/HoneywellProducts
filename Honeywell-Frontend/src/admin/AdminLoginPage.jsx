import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { adminAuthApi } from './api/adminAuthApi';
import { staffLogin, getStaffPermissions } from '../services/staffApi';
import {
  clearUserSession,
  extractPermissionsFromUser,
  getFirstAuthorizedRoute,
  parseJwtPayload
} from '../utils/rbac';
import { validateEmail, validatePassword as validateStrictPassword, validateEmployeeId } from '../utils/validators';
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Field-specific validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const navigate = useNavigate();

  // Completely lock page scrollbar and scrolling behaviour while on login screen
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  // Validate email / identifier format strictly
  const validateIdentifier = (val) => {
    const trimmed = (val ?? '').trim();
    if (!trimmed) {
      return authMode === 'staff'
        ? 'Email or Employee ID is required.'
        : 'Email address is required.';
    }

    if (authMode === 'admin') {
      return validateEmail(trimmed, 'Email address');
    } else {
      // Staff mode: can be corporate email or employee ID
      if (trimmed.includes('@')) {
        return validateEmail(trimmed, 'Staff email');
      } else {
        return validateEmployeeId(trimmed, 'Employee ID');
      }
    }
  };

  // Validate password format strictly
  const validatePassword = (val) => {
    return validateStrictPassword(val, 'Password');
  };

  // Handle identifier change
  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    if (error) setError('');
    if (emailTouched) {
      setEmailError(validateIdentifier(val));
    }
  };

  // Handle identifier blur
  const handleIdentifierBlur = () => {
    setEmailTouched(true);
    setEmailError(validateIdentifier(identifier));
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (error) setError('');
    if (passwordTouched) {
      setPasswordError(validatePassword(val));
    }
  };

  // Handle password blur
  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  // Switch between Admin & Staff tabs
  const handleModeChange = (mode) => {
    if (mode === authMode) return;
    setAuthMode(mode);
    setError('');
    setEmailError('');
    setPasswordError('');
    setEmailTouched(false);
    setPasswordTouched(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Trigger full validation on submit
    setEmailTouched(true);
    setPasswordTouched(true);
    const idErr = validateIdentifier(identifier);
    const passErr = validatePassword(password);

    setEmailError(idErr);
    setPasswordError(passErr);

    if (idErr || passErr) {
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
            title="Back to site"
          >
            <X size={18} />
          </button>

          <div className="admin-logo-mini">
            <img src="/admin-logo.png" alt="Honeywell Products logo" />
          </div>

          {/* Mode Switcher */}
          <div className="admin-mode-switcher" role="tablist" aria-label="Login Mode">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'admin'}
              onClick={() => handleModeChange('admin')}
              className={`admin-mode-btn ${authMode === 'admin' ? 'active' : ''}`}
            >
              ADMIN
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'staff'}
              onClick={() => handleModeChange('staff')}
              className={`admin-mode-btn ${authMode === 'staff' ? 'active' : ''}`}
            >
              STAFF
            </button>
          </div>

          <h2 className="admin-login-heading">
            {authMode === 'staff' ? 'SIGN IN TO STAFF' : 'SIGN IN TO ADMIN'}
          </h2>
          <p className="admin-login-subtitle">
            {authMode === 'staff'
              ? 'Enter your staff email or employee ID to continue.'
              : 'Enter your registered email to continue to your dashboard.'}
          </p>

          {error && (
            <div className="admin-login-alert" role="alert">
              <AlertCircle size={15} className="admin-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <div className="admin-form-container">
            <form onSubmit={handleLogin} noValidate>
              {/* Email / Identifier Field */}
              <div className="admin-field-group">
                <label htmlFor="admin-identifier" className="admin-field-label">
                  {authMode === 'staff' ? 'Email or Employee ID' : 'Email Address'}
                  <span className="admin-required-star" aria-hidden="true">*</span>
                </label>
                <div className={`admin-input-box ${emailError ? 'has-error' : ''}`}>
                  <Mail className="admin-input-icon" size={17} aria-hidden="true" />
                  <input
                    id="admin-identifier"
                    type={authMode === 'staff' ? 'text' : 'email'}
                    className="admin-field-input"
                    placeholder={
                      authMode === 'staff'
                        ? 'staff@company.com or EMP-101'
                        : 'admin@honeywell.com'
                    }
                    value={identifier}
                    onChange={handleIdentifierChange}
                    onBlur={handleIdentifierBlur}
                    autoComplete="username"
                    spellCheck="false"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'admin-email-error' : undefined}
                  />
                </div>
                {emailError && (
                  <div className="admin-field-error" id="admin-email-error" role="alert">
                    <AlertCircle size={12} className="admin-field-error-icon" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="admin-field-group">
                <div className="admin-label-row">
                  <label htmlFor="admin-password" className="admin-field-label">
                    Password
                    <span className="admin-required-star" aria-hidden="true">*</span>
                  </label>
                </div>
                <div className={`admin-input-box ${passwordError ? 'has-error' : ''}`}>
                  <Lock className="admin-input-icon" size={17} aria-hidden="true" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="admin-field-input admin-password-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    autoComplete="current-password"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'admin-password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="admin-password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {passwordError && (
                  <div className="admin-field-error" id="admin-password-error" role="alert">
                    <AlertCircle size={12} className="admin-field-error-icon" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="admin-premium-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="admin-btn-content">
                    <span className="admin-btn-spinner" aria-hidden="true"></span>
                    LOGGING IN...
                  </span>
                ) : (
                  'LOGIN'
                )}
              </button>
            </form>

            <div className="admin-footer-links">
              <span onClick={() => navigate('/admin/forgot-password')} role="button" tabIndex={0}>
                FORGOT PASSWORD?
              </span>
              <span className="admin-divider">•</span>
              <span onClick={() => navigate('/')} role="button" tabIndex={0}>
                BACK TO SITE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

