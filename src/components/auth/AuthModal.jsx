import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, Eye, EyeOff, ShieldCheck, Sun, 
  ArrowRight, AlertCircle, CheckCircle2, Info, X 
} from 'lucide-react';
import brandLogo from '../../../public/honeywell-products-logo.png';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword as forgotPasswordApi } from '../../services/customerApi';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const [authMode, setAuthMode] = useState(initialMode);

  // Form State
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputConfirmPassword, setInputConfirmPassword] = useState('');
  const [inputFullName, setInputFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Error & Status States
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generalAlert, setGeneralAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem('rememberedCustomerEmail') || '';
      setInputEmail(savedEmail);
      setRememberMe(Boolean(savedEmail));
      setErrors({});
      setTouched({});
      setGeneralAlert(null);
      setInputPassword('');
      setInputConfirmPassword('');
      setInputFullName('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Validation helper
  const validateField = (name, value) => {
    let errorMsg = '';
    const trimmedVal = value ? value.trim() : '';

    if (name === 'email') {
      if (!trimmedVal) {
        errorMsg = 'Email address or mobile number is required.';
      } else {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedVal);
        const isMobile = /^\d{10}$/.test(trimmedVal.replace(/[\s\-\(\)]/g, ''));
        if (!isEmail && !isMobile) {
          errorMsg = 'Please enter a valid email address or 10-digit mobile number.';
        } else if (trimmedVal.length > 254) {
          errorMsg = 'Value is too long.';
        }
      }
    }

    if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required.';
      } else if (value.length < 6) {
        errorMsg = 'Password must be at least 6 characters.';
      }
    }

    if (name === 'confirmPassword' && authMode === 'register') {
      if (!value) {
        errorMsg = 'Please confirm your password.';
      } else if (value !== inputPassword) {
        errorMsg = 'Passwords do not match.';
      }
    }

    if (name === 'fullName' && authMode === 'register') {
      if (!trimmedVal) {
        errorMsg = 'Full name is required.';
      } else if (trimmedVal.length < 2) {
        errorMsg = 'Please enter your full name.';
      }
    }

    return errorMsg;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let valToTest = '';
    if (field === 'email') valToTest = inputEmail;
    if (field === 'password') valToTest = inputPassword;
    if (field === 'confirmPassword') valToTest = inputConfirmPassword;
    if (field === 'fullName') valToTest = inputFullName;

    const err = validateField(field, valToTest);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleInputChange = (field, val) => {
    if (field === 'email') setInputEmail(val);
    if (field === 'password') {
      setInputPassword(val);
      if (touched.confirmPassword && authMode === 'register') {
        const confirmErr = val !== inputConfirmPassword ? 'Passwords do not match.' : '';
        setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
      }
    }
    if (field === 'confirmPassword') setInputConfirmPassword(val);
    if (field === 'fullName') setInputFullName(val);

    if (touched[field]) {
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setGeneralAlert(null);

    const emailErr = validateField('email', inputEmail);
    const passErr = validateField('password', inputPassword);
    const confirmErr = authMode === 'register' ? validateField('confirmPassword', inputConfirmPassword) : '';
    const nameErr = authMode === 'register' ? validateField('fullName', inputFullName) : '';

    const newErrors = {
      email: emailErr,
      password: passErr,
      ...(authMode === 'register' ? { confirmPassword: confirmErr, fullName: nameErr } : {})
    };

    setErrors(newErrors);
    setTouched({ email: true, password: true, confirmPassword: true, fullName: true });

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = inputEmail.trim();

      if (rememberMe) {
        localStorage.setItem('rememberedCustomerEmail', cleanEmail);
      } else {
        localStorage.removeItem('rememberedCustomerEmail');
      }

      if (authMode === 'register') {
        await auth.register({
          name: inputFullName.trim(),
          email: cleanEmail,
          password: inputPassword,
        });
      } else {
        await auth.login(cleanEmail, inputPassword);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Sign In error:', err);
      setGeneralAlert({
        type: 'error',
        message: err.message || 'Authentication failed. Please verify your credentials and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!inputEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail.trim())) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address first.' }));
      setTouched((prev) => ({ ...prev, email: true }));
      return;
    }
    try {
      await forgotPasswordApi(inputEmail.trim());
      setGeneralAlert({
        type: 'info',
        message: `Password reset instructions have been sent to ${inputEmail.trim()}. Please check your email.`
      });
    } catch (err) {
      setGeneralAlert({
        type: 'error',
        message: err.message || 'Failed to send reset email. Please try again.'
      });
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="auth-card-split border-0 shadow-none">
          {/* Left Showcase Banner */}
          <div className="auth-left-showcase">
            <div className="auth-showcase-top">
              <div className="auth-badge">
                <ShieldCheck size={14} /> Honeywell Security &amp; Solar
              </div>
              <h1 className="auth-showcase-title">Welcome to Honeywell Products</h1>
              <p className="auth-showcase-tagline">Secure. Smart. Reliable.</p>
              <p className="auth-showcase-desc">
                Discover advanced security cameras, surveillance systems, and high-efficiency solar solutions designed for homes, businesses, and enterprise industries.
              </p>
            </div>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon"><ShieldCheck size={16} /></div>
                <div>
                  <strong>Smart Surveillance &amp; AI Analytics</strong>
                  <br />Real-time alerts, high-definition optical clarity &amp; cloud access.
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon"><Sun size={16} /></div>
                <div>
                  <strong>Sustainable Solar Energy Solutions</strong>
                  <br />Tier-1 solar modules with long-term performance warranties.
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="auth-right-container">
            <div className="auth-brand-logo-wrap">
              <img src={brandLogo} alt="Honeywell Logo" className="auth-brand-logo" />
            </div>

            <div className="auth-form-header">
              <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
              <p>
                {authMode === 'login' 
                  ? 'Sign in to access your account, orders, and customer services.' 
                  : 'Register your details to enjoy streamlined orders, tracking & support.'}
              </p>
            </div>

            {generalAlert && (
              <div className={`auth-alert-banner ${generalAlert.type}`} role="alert" aria-live="polite">
                {generalAlert.type === 'error' && <AlertCircle size={18} className="flex-shrink-0" />}
                {generalAlert.type === 'info' && <Info size={18} className="flex-shrink-0" />}
                {generalAlert.type === 'success' && <CheckCircle2 size={18} className="flex-shrink-0" />}
                <span>{generalAlert.message}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} noValidate className="auth-form-body">
              {authMode === 'register' && (
                <div className="auth-form-group">
                  <label htmlFor="modal-fullname">Full Name</label>
                  <div className="input-with-icon-wrap">
                    <User size={18} className="input-icon-left" />
                    <input
                      id="modal-fullname"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={inputFullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                      className={errors.fullName ? 'has-error' : ''}
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? 'modal-fullname-error' : undefined}
                    />
                  </div>
                  {errors.fullName && (
                    <div id="modal-fullname-error" className="field-error-msg" role="alert">
                      <AlertCircle size={14} /> <span>{errors.fullName}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="auth-form-group">
                <label htmlFor="modal-email">Email Address or Mobile No</label>
                <div className="input-with-icon-wrap">
                  <Mail size={18} className="input-icon-left" />
                  <input
                    id="modal-email"
                    type="text"
                    autoComplete="username email tel"
                    placeholder="Enter email or 10-digit mobile number"
                    value={inputEmail}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={errors.email ? 'has-error' : ''}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'modal-email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <div id="modal-email-error" className="field-error-msg" role="alert">
                    <AlertCircle size={14} /> <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="auth-form-group">
                <label htmlFor="modal-password">Password</label>
                <div className="input-with-icon-wrap">
                  <Lock size={18} className="input-icon-left" />
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="Enter your password"
                    value={inputPassword}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={errors.password ? 'has-error' : ''}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'modal-password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <div id="modal-password-error" className="field-error-msg" role="alert">
                    <AlertCircle size={14} /> <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {authMode === 'register' && (
                <div className="auth-form-group">
                  <label htmlFor="modal-confirmpassword">Confirm Password</label>
                  <div className="input-with-icon-wrap">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      id="modal-confirmpassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      value={inputConfirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={errors.confirmPassword ? 'has-error' : ''}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? 'modal-confirmpassword-error' : undefined}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div id="modal-confirmpassword-error" className="field-error-msg" role="alert">
                      <AlertCircle size={14} /> <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>
              )}

              {authMode === 'login' && (
                <div className="form-options-row">
                  <label className="remember-me-label" htmlFor="modal-remember-checkbox">
                    <input
                      id="modal-remember-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn-auth-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-inline" />
                    <span>{authMode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-mode-switch">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?
                  <button
                    type="button"
                    className="auth-mode-switch-btn"
                    onClick={() => {
                      setAuthMode('register');
                      setErrors({});
                      setGeneralAlert(null);
                    }}
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?
                  <button
                    type="button"
                    className="auth-mode-switch-btn"
                    onClick={() => {
                      setAuthMode('login');
                      setErrors({});
                      setGeneralAlert(null);
                    }}
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
