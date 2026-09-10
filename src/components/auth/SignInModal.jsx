import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, Eye, EyeOff, ShieldCheck, Sun, 
  ArrowRight, AlertCircle, CheckCircle2, Info, X 
} from 'lucide-react';
import './SignInModal.css';
import brandLogo from '../../../public/honeywell-products-logo.png';

export default function SignInModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const [authMode, setAuthMode] = useState(initialMode);

  // Input states
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputConfirmPassword, setInputConfirmPassword] = useState('');
  const [inputFullName, setInputFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & error states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generalAlert, setGeneralAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Frontend field validation
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
      // Simulate realistic authentication API latency
      await new Promise((resolve) => setTimeout(resolve, 600));

      const cleanEmail = inputEmail.trim();
      const displayName = authMode === 'register' 
        ? inputFullName.trim() 
        : (cleanEmail.split('@')[0] || 'Valued Customer');

      if (rememberMe) {
        localStorage.setItem('rememberedCustomerEmail', cleanEmail);
      } else {
        localStorage.removeItem('rememberedCustomerEmail');
      }

      // Update customer authentication token and user details
      localStorage.setItem('customerToken', 'demo-customer-token-' + Date.now());
      localStorage.setItem('customerEmail', cleanEmail);
      localStorage.setItem('customerName', displayName);

      if (onSuccess) {
        onSuccess({ email: cleanEmail, name: displayName });
      }

      onClose();
      // Refresh page so header and authenticated components immediately sync state
      window.location.reload();
    } catch (err) {
      console.error('Sign In error:', err);
      setGeneralAlert({
        type: 'error',
        message: 'The email or password is incorrect. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!inputEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail.trim())) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address first.' }));
      setTouched((prev) => ({ ...prev, email: true }));
      return;
    }
    setGeneralAlert({
      type: 'info',
      message: `Password reset instructions have been sent to ${inputEmail.trim()}. Please check your email.`
    });
  };

  return (
    <div 
      className="signin-modal-backdrop" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      aria-label="Sign In Modal"
    >
      <div className="signin-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top-Right Close Button (×) */}
        <button 
          className="signin-modal-close" 
          onClick={onClose} 
          aria-label="Close sign in"
          title="Close sign in"
        >
          <X size={18} />
        </button>

        {/* Left Side: Dark Navy Showcase Panel */}
        <div className="signin-left-panel">
          <div className="signin-showcase-top">
            <div className="signin-badge">
              <ShieldCheck size={14} /> HONEYWELL SECURITY &amp; SOLAR
            </div>
            <h1 className="signin-main-title">
              Welcome to Honeywell<br />Products
            </h1>
            <p className="signin-tagline">Secure. Smart. Reliable.</p>
            <p className="signin-desc">
              Discover advanced security cameras, surveillance systems, and high-efficiency solar solutions designed for homes, businesses, and enterprise industries.
            </p>
          </div>

          <div className="signin-features-wrap">
            <div className="signin-feature-item">
              <div className="signin-feature-icon"><ShieldCheck size={15} /></div>
              <div>
                <div className="signin-feature-title">Smart Surveillance &amp; AI Analytics</div>
                <div className="signin-feature-text">Real-time alerts, high-definition optical clarity &amp; cloud access.</div>
              </div>
            </div>

            <div className="signin-feature-item">
              <div className="signin-feature-icon"><Sun size={15} /></div>
              <div>
                <div className="signin-feature-title">Sustainable Solar Energy Solutions</div>
                <div className="signin-feature-text">Tier-1 solar modules with long-term performance warranties.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean White Sign-In Panel */}
        <div className="signin-right-panel">
          <div className="signin-logo-wrap">
            <img src={brandLogo} alt="Honeywell Logo" className="signin-logo" />
          </div>

          <div className="signin-form-header">
            <h2 className="signin-form-title">
              {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="signin-form-subtitle">
              {authMode === 'login' 
                ? 'Sign in to access your account, orders, and customer services.' 
                : 'Register your details to enjoy streamlined orders, tracking & support.'}
            </p>
          </div>

          {generalAlert && (
            <div className={`signin-alert-box ${generalAlert.type}`} role="alert" aria-live="polite">
              {generalAlert.type === 'error' && <AlertCircle size={16} className="flex-shrink-0" />}
              {generalAlert.type === 'info' && <Info size={16} className="flex-shrink-0" />}
              {generalAlert.type === 'success' && <CheckCircle2 size={16} className="flex-shrink-0" />}
              <span>{generalAlert.message}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} noValidate>
            {authMode === 'register' && (
              <div className="signin-input-group">
                <label htmlFor="signin-fullname">Full Name</label>
                <div className="signin-input-wrap">
                  <User size={16} className="signin-input-icon" />
                  <input
                    id="signin-fullname"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={inputFullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    className={errors.fullName ? 'has-error' : ''}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'signin-fullname-error' : undefined}
                  />
                </div>
                {errors.fullName && (
                  <div id="signin-fullname-error" className="signin-field-error" role="alert">
                    <AlertCircle size={13} /> <span>{errors.fullName}</span>
                  </div>
                )}
              </div>
            )}

            <div className="signin-input-group">
              <label htmlFor="signin-email">Email Address or Mobile No</label>
              <div className="signin-input-wrap">
                <Mail size={16} className="signin-input-icon" />
                <input
                  id="signin-email"
                  type="text"
                  autoComplete="username email tel"
                  placeholder="Enter email or 10-digit mobile number"
                  value={inputEmail}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={errors.email ? 'has-error' : ''}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'signin-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <div id="signin-email-error" className="signin-field-error" role="alert">
                  <AlertCircle size={13} /> <span>{errors.email}</span>
                </div>
              )}
            </div>

            <div className="signin-input-group">
              <label htmlFor="signin-password">Password</label>
              <div className="signin-input-wrap">
                <Lock size={16} className="signin-input-icon" />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Enter your password"
                  value={inputPassword}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={errors.password ? 'has-error' : ''}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'signin-password-error' : undefined}
                />
                <button
                  type="button"
                  className="signin-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <div id="signin-password-error" className="signin-field-error" role="alert">
                  <AlertCircle size={13} /> <span>{errors.password}</span>
                </div>
              )}
            </div>

            {authMode === 'register' && (
              <div className="signin-input-group">
                <label htmlFor="signin-confirmpassword">Confirm Password</label>
                <div className="signin-input-wrap">
                  <Lock size={16} className="signin-input-icon" />
                  <input
                    id="signin-confirmpassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={inputConfirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={errors.confirmPassword ? 'has-error' : ''}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'signin-confirmpassword-error' : undefined}
                  />
                  <button
                    type="button"
                    className="signin-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div id="signin-confirmpassword-error" className="signin-field-error" role="alert">
                    <AlertCircle size={13} /> <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>
            )}

            {authMode === 'login' && (
              <div className="signin-options-row">
                <label className="signin-checkbox-label" htmlFor="signin-remember-checkbox">
                  <input
                    id="signin-remember-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="signin-forgot-link"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn-signin-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>{authMode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="signin-divider" />

          <div className="signin-footer-row">
            {authMode === 'login' ? (
              <p>
                Don't have an account?
                <button
                  type="button"
                  className="signin-switch-btn"
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
                  className="signin-switch-btn"
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
  );
}
