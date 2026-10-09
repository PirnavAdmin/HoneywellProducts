import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { adminAuthApi } from './api/adminAuthApi';
import adminPortalImage from '../assets/images/products-hero.png';
import './AdminLoginPage.css';

const getLoginErrorMessage = (err) => {
  if (err.code === 'ECONNABORTED') {
    return 'Login request timed out. Please check backend connection.';
  }
  if (!err.response) {
    return 'Unable to connect to backend server. Please verify network or ngrok URL.';
  }
  return (
    err.response?.data?.message ||
    err.response?.data?.title ||
    err.response?.data?.error ||
    'Invalid email or password. Please try again.'
  );
};

const AdminLoginPage = () => {
  useDocumentTitle('Admin Login', 'Honeywell Products Admin Portal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Sending real API login request for:', email.trim());
      const response = await adminAuthApi.login(email, password);

      // Check if token returned directly
      const token = response?.token || response?.accessToken || response?.Token || response?.data?.token;

      if (token) {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminEmail', email.trim());

        // Fetch real admin profile
        try {
          const profileData = await adminAuthApi.getProfile();
          const profile = profileData?.data || profileData?.value || profileData;
          const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || email.split('@')[0];
          const role = profile?.role || profile?.Role || 'admin';

          localStorage.setItem('adminName', name);
          localStorage.setItem('adminRole', role.toLowerCase());
        } catch (pErr) {
          console.warn('Admin profile fetch failed:', pErr.message);
          localStorage.setItem('adminName', email.split('@')[0]);
          localStorage.setItem('adminRole', 'admin');
        }

        navigate('/admin/dashboard');
        return;
      }

      // Backend succeeded and requires OTP verification
      navigate('/admin/verify-otp', {
        state: {
          email: email.trim(),
          password,
          fromLogin: true,
          loginData: response
        }
      });
    } catch (err) {
      console.error('Real Admin Login Error:', err);
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

          <h2>SIGN IN TO ADMIN.</h2>
          <p>Enter your registered email to continue to your dashboard.</p>

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
                type="email"
                className="admin-premium-input"
                placeholder="ENTER EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
