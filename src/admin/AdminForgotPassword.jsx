import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminAuthApi } from './api/adminAuthApi';
import adminPortalImage from '../assets/images/products-hero.png';
import './AdminForgotPassword.css';

const AdminForgotPassword = () => {
  const [email, setEmail]                     = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your registered admin email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    try {
      // Send real API request to POST /api/Auth/forgot-password
      await adminAuthApi.forgotPassword(email);

      // Pass newPassword in state so OTP screen can call /api/Auth/reset-password
      navigate('/admin/verify-otp', { state: { email: email.trim(), newPassword, confirmPassword } });
    } catch (err) {
      console.error('Forgot Password Error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Failed to request password reset. Please check your email and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-forgot-wrapper">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="admin-forgot-modal-container"
      >
        {/* Left Side - Image */}
        <div className="admin-forgot-left">
          <img src={adminPortalImage} alt="Admin Portal" />
        </div>

        {/* Right Side - Form */}
        <div className="admin-forgot-right">
          <div className="admin-logo-mini">
            <img src="/admin-logo.png" alt="Honeywell Products logo" />
          </div>

          <h2>RESET PASSWORD</h2>
          <p>Enter your registered admin email and set a new password.</p>

          {error && (
            <div style={{
              color: '#e53e3e', fontSize: '11px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
              maxWidth: '300px', textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="admin-form-container">
            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                className="admin-premium-input"
                placeholder="ENTER ADMIN EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="admin-premium-input"
                placeholder="ENTER NEW PASSWORD"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="admin-premium-input"
                placeholder="CONFIRM NEW PASSWORD"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="admin-premium-btn"
                disabled={isLoading}
              >
                {isLoading ? 'PROCESSING...' : 'UPDATE PASSWORD'}
              </motion.button>
            </form>

            <div className="admin-footer-links">
              <span onClick={() => navigate('/admin/login')}>BACK TO LOGIN</span>
              <span>•</span>
              <span onClick={() => navigate('/contact-support')}>CONTACT SUPPORT</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminForgotPassword;
