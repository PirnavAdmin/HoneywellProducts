import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminAuthApi } from './api/adminAuthApi';
import { 
  extractPermissionsFromUser, 
  getFirstAuthorizedRoute, 
  clearUserSession, 
  parseJwtPayload 
} from '../utils/rbac';
import adminPortalImage from '../assets/images/products-hero.png';
import './AdminVerifyOTP.css';

const OTP_TIMEOUT  = 120; // seconds admin has to enter OTP
const RESEND_WAIT  = 120; // seconds before they can resend (synchronized with OTP expiration timer)

const getApiErrorMessage = (err, fallback) => {
  if (err.code === 'ECONNABORTED') {
    return 'Request timed out. Please check that the admin auth API is running and try again.';
  }

  if (!err.response) {
    return 'Unable to connect to the admin auth API. Please check the server or ngrok tunnel.';
  }

  return (
    err.response?.data?.message ||
    err.response?.data?.title ||
    err.response?.data?.error ||
    fallback
  );
};

const getDisplayNameFromEmail = (emailAddress) => {
  if (!emailAddress) return 'Admin';
  return emailAddress
    .split('@')[0]
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getTokenFromAuthPayload = (payload) =>
  payload?.token ||
  payload?.accessToken ||
  payload?.Token ||
  payload?.data?.token ||
  payload?.data?.accessToken ||
  payload?.data?.Token ||
  payload?.user?.token ||
  payload?.admin?.token;

const getNameFromAuthPayload = (payload) =>
  payload?.name ||
  payload?.username ||
  payload?.fullName ||
  payload?.displayName ||
  payload?.data?.name ||
  payload?.data?.username ||
  payload?.data?.fullName ||
  payload?.data?.displayName ||
  payload?.user?.name ||
  payload?.admin?.name;

const AdminVerifyOTP = () => {
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [otpTimer,  setOtpTimer]  = useState(OTP_TIMEOUT);
  const [resendTimer, setResendTimer] = useState(RESEND_WAIT);
  const [canResend,   setCanResend]   = useState(false);
  const [otpExpired,  setOtpExpired]  = useState(false);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const inputRefs = useRef([]);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { newPassword, email, fromLogin, loginWarning } = location.state || {};

  /* ─── OTP-entry countdown ─── */
  useEffect(() => {
    if (otpExpired) return;
    if (otpTimer === 0) { setOtpExpired(true); setError('OTP has expired. Please request a new one.'); return; }
    const id = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [otpTimer, otpExpired]);

  /* ─── Resend cooldown ─── */
  useEffect(() => {
    if (resendTimer === 0) { setCanResend(true); return; }
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  useEffect(() => {
    if (loginWarning) setError(loginWarning);
  }, [loginWarning]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const timerColor = otpTimer <= 30 ? '#e53e3e' : '#6dbd2f';

  /* ─── Box helpers ─── */
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value.slice(-1);
    setOtpDigits(updated);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otpDigits];
    pasted.split('').forEach((char, i) => { updated[i] = char; });
    setOtpDigits(updated);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ─── Resend ─── */
  const handleResend = async () => {
    if (!canResend) return;
    try {
      if (fromLogin) {
        await adminAuthApi.resendOtp(email);
      } else {
        await adminAuthApi.forgotPassword(email);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to resend OTP. Please try again.'));
      return;
    }
    setOtpDigits(Array(6).fill(''));
    setOtpTimer(OTP_TIMEOUT);
    setResendTimer(RESEND_WAIT);
    setCanResend(false);
    setOtpExpired(false);
    setError('');
    inputRefs.current[0]?.focus();
  };

  /* ─── Verify ─── */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpExpired) { setError('OTP has expired. Please resend.'); return; }
    const otp = otpDigits.join('');
    if (otp.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }

    setIsLoading(true);
    setError('');

    try {
      let response;
      if (fromLogin) {
        // Send real API call to POST /api/Auth/verify-otp
        response = await adminAuthApi.verifyOtp(email, otp);
      } else {
        // Send real API call to POST /api/Auth/reset-password
        response = await adminAuthApi.resetPassword({
          email: email?.trim(),
          otp,
          code: otp,
          newPassword,
          confirmPassword: newPassword
        });
      }

      const token = getTokenFromAuthPayload(response);
      const tokenPayload = parseJwtPayload(token);
      const tokenRole = (
        tokenPayload?.role || 
        tokenPayload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
        tokenPayload?.Role || 
        response?.role || 
        response?.user?.role ||
        ''
      ).toLowerCase().trim();

      // Fetch admin profile to verify genuine Administrator account
      let profile = null;
      try {
        if (token) localStorage.setItem('adminToken', token);
        const profileRes = await adminAuthApi.getProfile();
        profile = profileRes?.profile || profileRes?.data || profileRes?.value || profileRes;
      } catch (pErr) {
        console.warn('Profile fetch after OTP verify failed:', pErr.message);
      }

      const profileEmail = (profile?.email || '').toLowerCase().trim();
      const loginEmail = (email || '').toLowerCase().trim();
      const profileRole = (profile?.role || profile?.Role || '').toLowerCase().trim();

      // Validate genuine Admin authorization:
      // A user is only an Admin if their verified email matches the Admin profile with admin role,
      // OR their verified JWT claims explicitly assign an admin role.
      const isGenuineAdmin = (
        (profileEmail && profileEmail === loginEmail && ['admin', 'superadmin', 'super admin', 'administrator'].includes(profileRole)) ||
        ['admin', 'superadmin', 'super admin', 'administrator'].includes(tokenRole)
      );

      if (fromLogin) {
        if (!isGenuineAdmin) {
          clearUserSession();
          setError('Access Denied: This account is registered as Staff. Please return to login and select the STAFF tab to sign in.');
          return;
        }

        let name = profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || getNameFromAuthPayload(response) || getDisplayNameFromEmail(email);
        let role = profileRole || tokenRole || 'admin';
        let permissions = extractPermissionsFromUser(profile);
        if (permissions.length === 0) {
          permissions = ['all'];
        }

        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', loginEmail);
        localStorage.setItem('adminName', name);
        localStorage.setItem('adminRole', role);
        localStorage.setItem('authType', 'admin');
        localStorage.setItem('adminPermissions', JSON.stringify(permissions));

        const landingRoute = getFirstAuthorizedRoute(permissions, role, 'admin');
        navigate(landingRoute || '/admin/dashboard');
      } else {
        navigate('/admin/login', { state: { message: 'Password reset successfully. Please log in.' } });
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setError(getApiErrorMessage(err, 'Invalid OTP verification code. Please check and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-otp-wrapper">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="admin-otp-modal"
      >
        {/* Left Image */}
        <div className="admin-otp-left">
          <img src={adminPortalImage} alt="Admin Portal" />
        </div>

        {/* Right Form */}
        <div className="admin-otp-right">
          <button
            type="button"
            className="admin-auth-close"
            aria-label="Back to login"
            onClick={() => navigate('/admin/login')}
          >
            x
          </button>

          <div className="admin-logo-mini">
            <img src="/admin-logo.png" alt="Honeywell Products logo" />
          </div>

          <h2>VERIFY YOUR OTP.</h2>
          <p>Enter the 6-digit code sent to your registered email address.</p>

          {/* OTP Expiry Countdown */}
          <div className="otp-entry-timer" style={{ color: timerColor }}>
            {otpExpired ? (
              <span className="otp-expired-label">⚠ OTP EXPIRED</span>
            ) : (
              <>
                <span className="otp-timer-label">OTP EXPIRES IN</span>
                <span className="otp-timer-value">{formatTime(otpTimer)}</span>
              </>
            )}
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-otp-error">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleVerify} className="admin-otp-form">
            {/* 6-digit OTP Boxes */}
            <div className="admin-otp-boxes" onPaste={handlePaste}>
              {otpDigits.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`admin-otp-box${otpExpired ? ' otp-box-expired' : ''}`}
                  whileFocus={{ scale: 1.08 }}
                  autoFocus={i === 0}
                  disabled={otpExpired}
                />
              ))}
            </div>

            {/* Resend cooldown */}
            <div className="admin-otp-timer">
              {canResend ? (
                <span className="resend-active" onClick={handleResend}>↺ RESEND OTP</span>
              ) : (
                <span>Resend available in <strong>{formatTime(resendTimer)}</strong></span>
              )}
            </div>

            {/* Verify Button */}
            <motion.button
              type="submit"
              className="admin-premium-btn"
              disabled={isLoading || otpExpired}
              whileHover={!otpExpired ? { scale: 1.02, y: -2 } : {}}
              whileTap={!otpExpired ? { scale: 0.98 } : {}}
            >
              {isLoading ? 'VERIFYING...' : 'VERIFY & LOGIN'}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="admin-footer-links">
            <span onClick={handleResend} className={!canResend ? 'disabled-link' : ''}>RESEND OTP</span>
            <span>•</span>
            <span onClick={() => navigate('/admin/login')}>BACK TO LOGIN</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminVerifyOTP;
