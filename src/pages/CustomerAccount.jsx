import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, Sun, 
  ArrowRight, AlertCircle, CheckCircle2, Info, Edit3, X, Save,
  MapPin, Landmark, Camera, Trash2, Building, CreditCard
} from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { useAuth } from '../context/AuthContext';
import { 
  getProfile, updateProfile, 
  getAddresses, saveAddresses, updateAddresses, 
  getBankDetails, saveBankDetails, updateBankDetails,
  changePassword, forgotPassword
} from '../services/customerApi';

export default function CustomerAccount() {
  const location = useLocation();
  const fileInputRef = useRef(null);

  // Auth Mode for Unauthenticated Guests: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Active section tab: 'personal' | 'addresses' | 'bank'
  const [activeTab, setActiveTab] = useState('personal');

  const auth = useAuth();
  const { user, isLoggedIn } = auth;

  // Logged-in Profile State
  const rawCustomerName = localStorage.getItem('customerName') || '';
  const [customerName, setCustomerName] = useState(user?.name || user?.fullName || (rawCustomerName && rawCustomerName.toLowerCase() !== 'admin' ? rawCustomerName : 'Valued Customer'));
  const [customerEmail, setCustomerEmail] = useState(user?.email || localStorage.getItem('customerEmail') || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || localStorage.getItem('customerPhone') || '');
  const [customerGender, setCustomerGender] = useState(user?.gender || localStorage.getItem('customerGender') || 'Male');
  const [customerCompany, setCustomerCompany] = useState(user?.company || localStorage.getItem('customerCompany') || '');
  const [customerAvatar, setCustomerAvatar] = useState(user?.avatarUrl || localStorage.getItem('customerAvatar') || '');

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState(localStorage.getItem('shippingAddress') || '');
  const [shippingCity, setShippingCity] = useState(localStorage.getItem('shippingCity') || '');
  const [shippingState, setShippingState] = useState(localStorage.getItem('shippingState') || '');
  const [shippingPincode, setShippingPincode] = useState(localStorage.getItem('shippingPincode') || '');
  const [shippingCountry, setShippingCountry] = useState(localStorage.getItem('shippingCountry') || 'India');

  // Billing Address State
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState(localStorage.getItem('billingAddress') || '');
  const [billingCity, setBillingCity] = useState(localStorage.getItem('billingCity') || '');
  const [billingState, setBillingState] = useState(localStorage.getItem('billingState') || '');
  const [billingPincode, setBillingPincode] = useState(localStorage.getItem('billingPincode') || '');

  // Bank Details State (Default to empty, populated exclusively by live backend API)
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankUpiId, setBankUpiId] = useState('');

  // Edit Form Fields
  const [editName, setEditName] = useState(customerName);
  const [editEmail, setEditEmail] = useState(customerEmail);
  const [editPhone, setEditPhone] = useState(customerPhone);
  const [editGender, setEditGender] = useState(customerGender);
  const [editCompany, setEditCompany] = useState(customerCompany);

  const [editShippingAddress, setEditShippingAddress] = useState(shippingAddress);
  const [editShippingCity, setEditShippingCity] = useState(shippingCity);
  const [editShippingState, setEditShippingState] = useState(shippingState);
  const [editShippingPincode, setEditShippingPincode] = useState(shippingPincode);
  const [editShippingCountry, setEditShippingCountry] = useState(shippingCountry);

  const [editBillingAddress, setEditBillingAddress] = useState(billingAddress);
  const [editBillingCity, setEditBillingCity] = useState(billingCity);
  const [editBillingState, setEditBillingState] = useState(billingState);
  const [editBillingPincode, setEditBillingPincode] = useState(billingPincode);

  const [editBankAccountHolder, setEditBankAccountHolder] = useState(bankAccountHolder);
  const [editBankName, setEditBankName] = useState(bankName);
  const [editBankAccountNumber, setEditBankAccountNumber] = useState(bankAccountNumber);
  const [editBankIfscCode, setEditBankIfscCode] = useState(bankIfscCode);
  const [editBankUpiId, setEditBankUpiId] = useState(bankUpiId);

  // Unauthenticated form state
  const [inputEmail, setInputEmail] = useState(localStorage.getItem('rememberedCustomerEmail') || '');
  const [inputPassword, setInputPassword] = useState('');
  const [inputConfirmPassword, setInputConfirmPassword] = useState('');
  const [inputFullName, setInputFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(localStorage.getItem('rememberedCustomerEmail')));

  // Validation & Submission States
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [bankErrors, setBankErrors] = useState({});
  const [generalAlert, setGeneralAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Change Password State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordMsg, setChangePasswordMsg] = useState(null);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordMsg(null);
    if (!currentPasswordInput) {
      setChangePasswordMsg({ type: 'error', text: 'Current password is required.' });
      return;
    }
    if (newPasswordInput.length < 6) {
      setChangePasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setChangePasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setChangePasswordLoading(true);
    try {
      await changePassword(currentPasswordInput, newPasswordInput, confirmNewPasswordInput, customerEmail);
      setChangePasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
    } catch (err) {
      setChangePasswordMsg({ type: 'error', text: err.message || 'Failed to change password. Please verify your current password.' });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Sync component state when user context changes
  useEffect(() => {
    if (user) {
      if (user.email) setCustomerEmail(user.email);
      const name = user.name || user.fullName || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');
      if (name) setCustomerName(name);
      if (user.phone || user.mobileNumber) setCustomerPhone(user.phone || user.mobileNumber);
      if (user.gender) setCustomerGender(user.gender);
      if (user.company || user.companyOrganization) setCustomerCompany(user.company || user.companyOrganization);
    }
  }, [user]);

  // Fetch real data on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    const email = user?.email || localStorage.getItem('customerEmail');
    const storedId = user?.customerId || user?.id || localStorage.getItem('customerId');

    async function loadAllData() {
      try {
        // Fetch profile first (by email if available, or storedId)
        const profileData = await getProfile(undefined, email).catch(() => null);
        const resolvedId = profileData?.id || profileData?.customerId || storedId || '3';

        if (profileData) {
          const name = profileData.name || profileData.fullName ||
            (((profileData.firstName || '') + ' ' + (profileData.lastName || '')).trim()) || '';
          if (name) {
            setCustomerName(name);
            localStorage.setItem('customerName', name);
          }
          if (profileData.email || profileData.emailAddress) {
            const pEmail = profileData.email || profileData.emailAddress;
            setCustomerEmail(pEmail);
            localStorage.setItem('customerEmail', pEmail);
          }
          if (profileData.phone || profileData.mobileNumber) {
            setCustomerPhone(profileData.phone || profileData.mobileNumber);
            localStorage.setItem('customerPhone', profileData.phone || profileData.mobileNumber);
          }
          if (profileData.gender) setCustomerGender(profileData.gender);
          if (profileData.companyOrganization || profileData.company || profileData.companyName) {
            setCustomerCompany(profileData.companyOrganization || profileData.company || profileData.companyName);
          }
          if (profileData.id) {
            localStorage.setItem('customerId', String(profileData.id));
          }
        }

        // Fetch addresses and bank details with the resolved customerId
        const [addressData, bankData] = await Promise.all([
          getAddresses(resolvedId).catch(() => null),
          getBankDetails(resolvedId).catch(() => null),
        ]);

        if (addressData) {
          const addr = Array.isArray(addressData) ? addressData[0] : addressData;
          if (addr) {
            const rawShip = String(addr.shippingAddress || addr.address || '').replace(/^["']|["']$/g, '').trim();
            const rawBill = String(addr.billingAddress || rawShip || '').replace(/^["']|["']$/g, '').trim();
            setShippingAddress(rawShip);
            setBillingAddress(rawBill);

            if (rawShip) {
              const parts = rawShip.split(',').map((p) => p.trim());
              if (parts.length >= 2) setShippingCity(parts[1]);
              if (parts.length >= 3) setShippingState(parts[2]);
              const pinMatch = rawShip.match(/\b\d{6}\b/);
              if (pinMatch) setShippingPincode(pinMatch[0]);
            }
          }
        }

        if (bankData) {
          const bank = Array.isArray(bankData) ? bankData[0] : bankData;
          if (bank) {
            const bInfo = bank.bankAccountInfo || bank;
            const uInfo = bank.upiPaymentHandle || bank;

            const holder = bInfo.accountHolderName || bank.accountHolderName || bank.bankAccountHolder || '';
            const bName = bInfo.bankName || bank.bankName || '';
            const accNum = bInfo.accountNumber || bank.accountNumber || bank.bankAccountNumber || '';
            const ifsc = bInfo.ifscCode || bank.ifscCode || bank.bankIfscCode || '';
            const upi = uInfo.upiId || bank.upiId || bank.bankUpiId || '';

            setBankAccountHolder(holder);
            setBankName(bName);
            setBankAccountNumber(accNum);
            setBankIfscCode(ifsc);
            setBankUpiId(upi);
          }
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      }
    }
    loadAllData();
  }, [isLoggedIn, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register') {
      setAuthMode('register');
    }
  }, [location.search]);

  // Sync Edit fields when entering edit mode
  useEffect(() => {
    setEditName(customerName);
    setEditEmail(customerEmail);
    setEditPhone(customerPhone);
    setEditGender(customerGender);
    setEditCompany(customerCompany);

    setEditShippingAddress(shippingAddress);
    setEditShippingCity(shippingCity);
    setEditShippingState(shippingState);
    setEditShippingPincode(shippingPincode);
    setEditShippingCountry(shippingCountry);

    setEditBillingAddress(billingAddress);
    setEditBillingCity(billingCity);
    setEditBillingState(billingState);
    setEditBillingPincode(billingPincode);

    setEditBankAccountHolder(bankAccountHolder);
    setEditBankName(bankName);
    setEditBankAccountNumber(bankAccountNumber);
    setEditBankIfscCode(bankIfscCode);
    setEditBankUpiId(bankUpiId);
  }, [
    isEditing, customerName, customerEmail, customerPhone, customerGender, customerCompany,
    shippingAddress, shippingCity, shippingState, shippingPincode, shippingCountry,
    billingAddress, billingCity, billingState, billingPincode,
    bankAccountHolder, bankName, bankAccountNumber, bankIfscCode, bankUpiId
  ]);

  // Avatar Photo Upload Handler
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSaveSuccessMsg({ type: 'error', text: 'Image file size should be less than 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setCustomerAvatar(base64String);
        localStorage.setItem('customerAvatar', base64String);
        setSaveSuccessMsg({ type: 'success', text: 'Profile photo updated successfully!' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setCustomerAvatar('');
    localStorage.removeItem('customerAvatar');
    setSaveSuccessMsg({ type: 'info', text: 'Profile photo removed.' });
  };

  // Handle Save All Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setSaveSuccessMsg({ type: 'error', text: 'Full name is required.' });
      return;
    }

    const cleanBankHolder = editBankAccountHolder.trim();
    const cleanBankName = editBankName.trim();
    const cleanBankAcc = editBankAccountNumber.trim();
    const cleanBankIfsc = editBankIfscCode.trim().toUpperCase();
    const cleanBankUpi = editBankUpiId.trim();

    // Reset bank errors
    const newBankErrors = {};

    // Validate Bank Details if any bank field is filled
    const hasAnyBankField = Boolean(cleanBankHolder || cleanBankName || cleanBankAcc || cleanBankIfsc);
    if (hasAnyBankField) {
      if (!cleanBankHolder) {
        newBankErrors.holder = 'Account holder name is required.';
      } else if (cleanBankHolder.length < 2) {
        newBankErrors.holder = 'Account holder name must be at least 2 characters.';
      }

      if (!cleanBankName) {
        newBankErrors.bankName = 'Bank name is required.';
      }

      if (!cleanBankAcc) {
        newBankErrors.accountNumber = 'Account number is required.';
      } else if (!/^\d{9,18}$/.test(cleanBankAcc)) {
        newBankErrors.accountNumber = 'Invalid account number (must be 9 to 18 digits).';
      }

      if (!cleanBankIfsc) {
        newBankErrors.ifsc = 'IFSC code is required.';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanBankIfsc)) {
        newBankErrors.ifsc = 'Invalid IFSC code format (e.g. SBIN0001234 or HDFC0001234).';
      }
    }

    // Validate UPI ID format if provided
    if (cleanBankUpi) {
      if (!/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanBankUpi)) {
        newBankErrors.upi = 'Invalid UPI ID format (e.g. username@okhdfcbank or 9876543210@paytm).';
      }
    }

    if (Object.keys(newBankErrors).length > 0) {
      setBankErrors(newBankErrors);
      setSaveSuccessMsg({ type: 'error', text: 'Please correct the invalid bank & payment details before saving.' });
      return;
    }
    setBankErrors({});

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const cleanName = editName.trim();
      const cleanEmail = editEmail.trim();
      const cleanPhone = editPhone.trim();
      const cleanGender = editGender.trim();
      const cleanCompany = editCompany.trim();

      const cleanShipAddr = editShippingAddress.trim();
      const cleanShipCity = editShippingCity.trim();
      const cleanShipState = editShippingState.trim();
      const cleanShipPin = editShippingPincode.trim();
      const cleanShipCountry = editShippingCountry.trim();

      const cleanBillAddr = sameAsShipping ? cleanShipAddr : editBillingAddress.trim();
      const cleanBillCity = sameAsShipping ? cleanShipCity : editBillingCity.trim();
      const cleanBillState = sameAsShipping ? cleanShipState : editBillingState.trim();
      const cleanBillPin = sameAsShipping ? cleanShipPin : editBillingPincode.trim();

      const activeCustomerId = user?.customerId || user?.id || localStorage.getItem('customerId') || '3';

      const fullShipAddr = [cleanShipAddr, cleanShipCity, cleanShipState, cleanShipPin, cleanShipCountry].filter(Boolean).join(', ');
      const fullBillAddr = sameAsShipping 
        ? fullShipAddr 
        : [cleanBillAddr, cleanBillCity, cleanBillState, cleanBillPin].filter(Boolean).join(', ');

      // Persist to real API
      await Promise.all([
        updateProfile(activeCustomerId, {
          firstName: cleanName.split(' ')[0] || cleanName,
          lastName: cleanName.split(' ').slice(1).join(' ') || '',
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          gender: cleanGender,
          company: cleanCompany,
        }).catch((err) => console.warn('Profile update warning:', err)),
        updateAddresses(activeCustomerId, {
          shippingAddress: fullShipAddr || cleanShipAddr,
          billingAddress: fullBillAddr || cleanBillAddr,
        }).catch((err) => console.warn('Address update warning:', err)),
        updateBankDetails(activeCustomerId, {
          accountHolderName: cleanBankHolder,
          bankName: cleanBankName,
          accountNumber: cleanBankAcc,
          ifscCode: cleanBankIfsc,
          upiId: cleanBankUpi,
        }).catch((err) => console.warn('Bank update warning:', err)),
      ]);

      // Update state
      setCustomerName(cleanName);
      setCustomerEmail(cleanEmail);
      setCustomerPhone(cleanPhone);
      setCustomerGender(cleanGender);
      setCustomerCompany(cleanCompany);

      setShippingAddress(cleanShipAddr);
      setShippingCity(cleanShipCity);
      setShippingState(cleanShipState);
      setShippingPincode(cleanShipPin);
      setShippingCountry(cleanShipCountry);

      setBillingAddress(cleanBillAddr);
      setBillingCity(cleanBillCity);
      setBillingState(cleanBillState);
      setBillingPincode(cleanBillPin);

      setBankAccountHolder(cleanBankHolder);
      setBankName(cleanBankName);
      setBankAccountNumber(cleanBankAcc);
      setBankIfscCode(cleanBankIfsc);
      setBankUpiId(cleanBankUpi);

      setIsEditing(false);
      setSaveSuccessMsg({ type: 'success', text: 'All profile details saved successfully.' });
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveSuccessMsg({ type: 'error', text: 'Failed to save changes. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Guest validation helper
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
    let valueToTest = '';
    if (field === 'email') valueToTest = inputEmail;
    if (field === 'password') valueToTest = inputPassword;
    if (field === 'confirmPassword') valueToTest = inputConfirmPassword;
    if (field === 'fullName') valueToTest = inputFullName;

    const fieldErr = validateField(field, valueToTest);
    setErrors((prev) => ({ ...prev, [field]: fieldErr }));
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
      const fieldErr = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: fieldErr }));
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
    } catch (err) {
      console.error('Authentication Error:', err);
      setGeneralAlert({
        type: 'error',
        message: err.message || 'Unable to process authentication request. Please check your credentials.'
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
      await forgotPassword(inputEmail.trim());
      setGeneralAlert({
        type: 'info',
        message: `Password reset instructions have been sent to ${inputEmail.trim()}. Please check your inbox.`
      });
    } catch (err) {
      setGeneralAlert({
        type: 'error',
        message: err.message || 'Failed to send password reset email. Please try again.'
      });
    }
  };

  // Get user initials for fallback avatar
  const getInitials = (name) => {
    if (!name || name === 'Valued Customer') return 'CU';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userInitials = getInitials(customerName);
  const nameParts = (customerName || '').trim().split(' ').filter(Boolean);
  const firstName = nameParts[0] || '';
  const rawLastName = nameParts.slice(1).join(' ');
  const lastName = (rawLastName && rawLastName.toLowerCase() !== firstName.toLowerCase()) ? rawLastName : '';

  return (
    <>
      {isLoggedIn ? (
        <CustomerAccountLayout 
          title="My Profile" 
          subtitle="Manage your personal details, delivery addresses, bank payment information, and profile photo."
        >
          {/* Header Action Row with Integrated Avatar Upload */}
          <div className="portal-card-header profile-card-header-compact">
            <div className="profile-header-avatar-group">
              <div 
                className="avatar-preview-box-compact" 
                onClick={() => fileInputRef.current?.click()} 
                title="Click to upload/change profile photo"
              >
                {customerAvatar ? (
                  <img src={customerAvatar} alt={customerName} className="avatar-preview-img" />
                ) : (
                  userInitials
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <div className="profile-header-meta">
                <div className="profile-header-title-row">
                  <h2 className="profile-header-title">{customerName}</h2>
                </div>
                <div className="profile-header-sub-row">
                  <span className="profile-header-email">{customerEmail || 'Customer Account'}</span>
                  {customerAvatar && (
                    <>
                      <span className="text-slate-300">•</span>
                      <button 
                        type="button" 
                        className="profile-remove-photo-pill"
                        onClick={handleRemoveAvatar}
                        title="Remove profile photo"
                      >
                        <Trash2 size={11} />
                        <span>Remove Photo</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button 
              className={isEditing ? 'btn-portal-secondary' : 'btn-portal-primary'}
              onClick={() => {
                setIsEditing(!isEditing);
                setSaveSuccessMsg(null);
              }}
            >
              {isEditing ? (
                <>
                  <X size={14} />
                  <span>Cancel Editing</span>
                </>
              ) : (
                <>
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          </div>

          {/* Success / Error Toast Notification */}
          {saveSuccessMsg && (
            <div className={`portal-toast ${saveSuccessMsg.type}`} role="alert">
              {saveSuccessMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{saveSuccessMsg.text}</span>
            </div>
          )}

          {/* Compact Profile Section Tabs Switcher */}
          <div className="profile-section-tabs-compact" role="tablist">
            <button 
              className={`profile-tab-pill ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
              role="tab"
              aria-selected={activeTab === 'personal'}
            >
              <User size={14} />
              <span>Personal Details</span>
            </button>

            <button 
              className={`profile-tab-pill ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
              role="tab"
              aria-selected={activeTab === 'addresses'}
            >
              <MapPin size={14} />
              <span>Addresses (Shipping &amp; Billing)</span>
            </button>

            <button 
              className={`profile-tab-pill ${activeTab === 'bank' ? 'active' : ''}`}
              onClick={() => setActiveTab('bank')}
              role="tab"
              aria-selected={activeTab === 'bank'}
            >
              <Landmark size={14} />
              <span>Bank &amp; Payment Details</span>
            </button>

            <button 
              className={`profile-tab-pill ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
              role="tab"
              aria-selected={activeTab === 'security'}
            >
              <Lock size={14} />
              <span>Password &amp; Security</span>
            </button>
          </div>

          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleSaveProfile} noValidate>
                  <div className="portal-form-grid">
                    <div className="portal-form-group full-width">
                      <label htmlFor="edit-fullname">Full Name *</label>
                      <div className="portal-input-wrap">
                        <User size={16} className="portal-input-icon" />
                        <input
                          id="edit-fullname"
                          type="text"
                          className="portal-input has-icon"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-email">Email Address *</label>
                      <div className="portal-input-wrap">
                        <Mail size={16} className="portal-input-icon" />
                        <input
                          id="edit-email"
                          type="email"
                          className="portal-input has-icon"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          required
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-phone">Mobile Number</label>
                      <div className="portal-input-wrap">
                        <Phone size={16} className="portal-input-icon" />
                        <input
                          id="edit-phone"
                          type="tel"
                          className="portal-input has-icon"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-gender">Gender</label>
                      <select 
                        id="edit-gender" 
                        className="portal-input"
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-company">Company / Organization (Optional)</label>
                      <div className="portal-input-wrap">
                        <Building size={16} className="portal-input-icon" />
                        <input
                          id="edit-company"
                          type="text"
                          className="portal-input has-icon"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          placeholder="e.g. Honeywell Solutions Ltd"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="portal-form-actions">
                    <button type="submit" className="btn-portal-primary" disabled={isSaving}>
                      {isSaving ? <span>Saving...</span> : <><Save size={15} /><span>Save Personal Details</span></>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="portal-form-grid">
                  <div className="portal-info-box">
                    <span className="portal-info-label">First Name</span>
                    <div className="portal-info-value">
                      <span>{firstName}</span>
                    </div>
                  </div>

                  <div className="portal-info-box">
                    <span className="portal-info-label">Last Name</span>
                    <div className="portal-info-value">
                      <span>{lastName || <span className="muted">Not provided</span>}</span>
                    </div>
                  </div>

                  <div className="portal-info-box">
                    <span className="portal-info-label">Email Address</span>
                    <div className="portal-info-value">
                      <Mail size={15} />
                      <span>{customerEmail || <span className="muted">Not configured</span>}</span>
                    </div>
                  </div>

                  <div className="portal-info-box">
                    <span className="portal-info-label">Mobile Number</span>
                    <div className="portal-info-value">
                      <Phone size={15} />
                      <span>{customerPhone || <span className="muted">Not provided</span>}</span>
                    </div>
                  </div>

                  <div className="portal-info-box">
                    <span className="portal-info-label">Gender</span>
                    <div className="portal-info-value">
                      <span>{customerGender || 'Male'}</span>
                    </div>
                  </div>

                  <div className="portal-info-box">
                    <span className="portal-info-label">Company / Organization</span>
                    <div className="portal-info-value">
                      <Building size={15} />
                      <span>{customerCompany || 'Individual Account'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES DETAILS */}
          {activeTab === 'addresses' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleSaveProfile} noValidate>
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Shipping Address</h4>
                  <div className="portal-form-grid mb-6">
                    <div className="portal-form-group full-width">
                      <label htmlFor="edit-ship-addr">Street Address / Flat / Area</label>
                      <input
                        id="edit-ship-addr"
                        type="text"
                        className="portal-input"
                        value={editShippingAddress}
                        onChange={(e) => setEditShippingAddress(e.target.value)}
                        placeholder="House/Flat No., Street Name, Area"
                      />
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-ship-city">City</label>
                      <input
                        id="edit-ship-city"
                        type="text"
                        className="portal-input"
                        value={editShippingCity}
                        onChange={(e) => setEditShippingCity(e.target.value)}
                        placeholder="City Name"
                      />
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-ship-state">State / Province</label>
                      <input
                        id="edit-ship-state"
                        type="text"
                        className="portal-input"
                        value={editShippingState}
                        onChange={(e) => setEditShippingState(e.target.value)}
                        placeholder="State Name"
                      />
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-ship-pin">Pincode / Postal Code</label>
                      <input
                        id="edit-ship-pin"
                        type="text"
                        className="portal-input"
                        value={editShippingPincode}
                        onChange={(e) => setEditShippingPincode(e.target.value)}
                        placeholder="Pincode e.g. 500001"
                      />
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-ship-country">Country</label>
                      <input
                        id="edit-ship-country"
                        type="text"
                        className="portal-input"
                        value={editShippingCountry}
                        onChange={(e) => setEditShippingCountry(e.target.value)}
                        placeholder="Country e.g. India"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={sameAsShipping} 
                        onChange={(e) => setSameAsShipping(e.target.checked)} 
                        className="accent-sky-600 w-4 h-4"
                      />
                      <span>Billing address is same as shipping address</span>
                    </label>
                  </div>

                  {!sameAsShipping && (
                    <>
                      <h4 className="font-bold text-slate-800 text-sm mb-3">Billing Address</h4>
                      <div className="portal-form-grid mb-6">
                        <div className="portal-form-group full-width">
                          <label htmlFor="edit-bill-addr">Billing Street Address</label>
                          <input
                            id="edit-bill-addr"
                            type="text"
                            className="portal-input"
                            value={editBillingAddress}
                            onChange={(e) => setEditBillingAddress(e.target.value)}
                            placeholder="House/Flat No., Street Name"
                          />
                        </div>

                        <div className="portal-form-group">
                          <label htmlFor="edit-bill-city">City</label>
                          <input
                            id="edit-bill-city"
                            type="text"
                            className="portal-input"
                            value={editBillingCity}
                            onChange={(e) => setEditBillingCity(e.target.value)}
                            placeholder="City Name"
                          />
                        </div>

                        <div className="portal-form-group">
                          <label htmlFor="edit-bill-state">State</label>
                          <input
                            id="edit-bill-state"
                            type="text"
                            className="portal-input"
                            value={editBillingState}
                            onChange={(e) => setEditBillingState(e.target.value)}
                            placeholder="State Name"
                          />
                        </div>

                        <div className="portal-form-group">
                          <label htmlFor="edit-bill-pin">Pincode</label>
                          <input
                            id="edit-bill-pin"
                            type="text"
                            className="portal-input"
                            value={editBillingPincode}
                            onChange={(e) => setEditBillingPincode(e.target.value)}
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="portal-form-actions">
                    <button type="submit" className="btn-portal-primary" disabled={isSaving}>
                      {isSaving ? <span>Saving...</span> : <><Save size={15} /><span>Save Addresses</span></>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="portal-cards-stack space-y-4">
                  {/* View Shipping Address Card */}
                  <div className="portal-card-box">
                    <div className="portal-card-section-header">
                      <div className="portal-card-section-title">
                        <MapPin size={16} />
                        <span>Shipping Address</span>
                      </div>
                      <span className={`portal-status-badge ${shippingAddress ? 'success' : 'muted'}`}>
                        {shippingAddress ? 'Default Shipping' : 'Not Added'}
                      </span>
                    </div>

                    {shippingAddress ? (
                      <div className="portal-address-content">
                        <p className="portal-address-name">{customerName}</p>
                        <p className="portal-address-street">{shippingAddress}</p>
                        <p className="portal-address-city">
                          {shippingCity}{shippingState ? `, ${shippingState}` : ''} {shippingPincode ? `- ${shippingPincode}` : ''}
                        </p>
                        <p className="portal-address-country">{shippingCountry || 'India'}</p>
                      </div>
                    ) : (
                      <div className="portal-empty-field-box">
                        <Info size={16} />
                        <span>No shipping address saved yet. Click "Edit Profile" to add your shipping address.</span>
                      </div>
                    )}
                  </div>

                  {/* View Billing Address Card */}
                  <div className="portal-card-box">
                    <div className="portal-card-section-header">
                      <div className="portal-card-section-title">
                        <Building size={16} />
                        <span>Billing Address</span>
                      </div>
                      <span className={`portal-status-badge ${billingAddress || shippingAddress ? 'info' : 'muted'}`}>
                        {billingAddress ? 'Billing Address' : shippingAddress ? 'Same as Shipping' : 'Not Added'}
                      </span>
                    </div>

                    {billingAddress || shippingAddress ? (
                      <div className="portal-address-content">
                        <p className="portal-address-name">{customerName}</p>
                        <p className="portal-address-street">{billingAddress || shippingAddress}</p>
                        <p className="portal-address-city">
                          {(billingCity || shippingCity)}{(billingState || shippingState) ? `, ${billingState || shippingState}` : ''} {(billingPincode || shippingPincode) ? `- ${billingPincode || shippingPincode}` : ''}
                        </p>
                      </div>
                    ) : (
                      <div className="portal-empty-field-box">
                        <Info size={16} />
                        <span>No billing address saved yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BANK & PAYMENT DETAILS */}
          {activeTab === 'bank' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleSaveProfile} noValidate>
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Bank Account &amp; UPI Details</h4>
                  <div className="portal-form-grid mb-6">
                    <div className="portal-form-group">
                      <label htmlFor="edit-bank-holder">Account Holder Name</label>
                      <div className="portal-input-wrap">
                        <User size={16} className="portal-input-icon" />
                        <input
                          id="edit-bank-holder"
                          type="text"
                          className={`portal-input has-icon ${bankErrors.holder ? 'has-error' : ''}`}
                          value={editBankAccountHolder}
                          onChange={(e) => {
                            setEditBankAccountHolder(e.target.value);
                            if (bankErrors.holder) setBankErrors(prev => ({ ...prev, holder: null }));
                          }}
                          placeholder="Name as in Bank Account"
                        />
                      </div>
                      {bankErrors.holder && (
                        <span className="portal-field-error">
                          <AlertCircle size={12} /> {bankErrors.holder}
                        </span>
                      )}
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-bank-name">Bank Name</label>
                      <div className="portal-input-wrap">
                        <Landmark size={16} className="portal-input-icon" />
                        <input
                          id="edit-bank-name"
                          type="text"
                          className={`portal-input has-icon ${bankErrors.bankName ? 'has-error' : ''}`}
                          value={editBankName}
                          onChange={(e) => {
                            setEditBankName(e.target.value);
                            if (bankErrors.bankName) setBankErrors(prev => ({ ...prev, bankName: null }));
                          }}
                          placeholder="e.g. HDFC Bank / State Bank of India"
                        />
                      </div>
                      {bankErrors.bankName && (
                        <span className="portal-field-error">
                          <AlertCircle size={12} /> {bankErrors.bankName}
                        </span>
                      )}
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-bank-acc">Account Number</label>
                      <div className="portal-input-wrap">
                        <CreditCard size={16} className="portal-input-icon" />
                        <input
                          id="edit-bank-acc"
                          type="text"
                          className={`portal-input has-icon ${bankErrors.accountNumber ? 'has-error' : ''}`}
                          value={editBankAccountNumber}
                          onChange={(e) => {
                            setEditBankAccountNumber(e.target.value);
                            if (bankErrors.accountNumber) setBankErrors(prev => ({ ...prev, accountNumber: null }));
                          }}
                          placeholder="Enter Account Number (9-18 digits)"
                        />
                      </div>
                      {bankErrors.accountNumber && (
                        <span className="portal-field-error">
                          <AlertCircle size={12} /> {bankErrors.accountNumber}
                        </span>
                      )}
                    </div>

                    <div className="portal-form-group">
                      <label htmlFor="edit-bank-ifsc">IFSC / SWIFT Code</label>
                      <input
                        id="edit-bank-ifsc"
                        type="text"
                        className={`portal-input ${bankErrors.ifsc ? 'has-error' : ''}`}
                        value={editBankIfscCode}
                        onChange={(e) => {
                          setEditBankIfscCode(e.target.value.toUpperCase());
                          if (bankErrors.ifsc) setBankErrors(prev => ({ ...prev, ifsc: null }));
                        }}
                        placeholder="e.g. SBIN0001234 / HDFC0001234"
                      />
                      {bankErrors.ifsc && (
                        <span className="portal-field-error">
                          <AlertCircle size={12} /> {bankErrors.ifsc}
                        </span>
                      )}
                    </div>

                    <div className="portal-form-group full-width">
                      <label htmlFor="edit-bank-upi">UPI ID / Virtual Payment Address (VPA)</label>
                      <input
                        id="edit-bank-upi"
                        type="text"
                        className={`portal-input ${bankErrors.upi ? 'has-error' : ''}`}
                        value={editBankUpiId}
                        onChange={(e) => {
                          setEditBankUpiId(e.target.value);
                          if (bankErrors.upi) setBankErrors(prev => ({ ...prev, upi: null }));
                        }}
                        placeholder="e.g. customer@upi / mobile@okhdfcbank"
                      />
                      {bankErrors.upi && (
                        <span className="portal-field-error">
                          <AlertCircle size={12} /> {bankErrors.upi}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="portal-form-actions flex flex-wrap items-center gap-3">
                    <button type="submit" className="btn-portal-primary" disabled={isSaving}>
                      {isSaving ? <span>Saving...</span> : <><Save size={15} /><span>Save Bank Details</span></>}
                    </button>
                    <button
                      type="button"
                      className="btn-portal-secondary"
                      onClick={() => {
                        setEditBankAccountHolder('');
                        setEditBankName('');
                        setEditBankAccountNumber('');
                        setEditBankIfscCode('');
                        setEditBankUpiId('');
                        setBankErrors({});
                      }}
                      title="Clear all bank form fields"
                    >
                      <Trash2 size={14} />
                      <span>Clear All Fields</span>
                    </button>
                    <button
                      type="button"
                      className="btn-portal-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setBankErrors({});
                      }}
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="portal-cards-stack space-y-4">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      className="btn-portal-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={14} />
                      <span>Edit Bank &amp; UPI Details</span>
                    </button>
                  </div>

                  {/* View Bank Details Card */}
                  <div className="portal-card-box">
                    <div className="portal-card-section-header">
                      <div className="portal-card-section-title">
                        <Landmark size={16} />
                        <span>Bank Account Information</span>
                      </div>
                      <span className={`portal-status-badge ${bankAccountNumber ? 'success' : 'muted'}`}>
                        {bankAccountNumber ? 'Verified Account' : 'Not Configured'}
                      </span>
                    </div>

                    <div className="portal-form-grid">
                      <div className="portal-info-box">
                        <span className="portal-info-label">Account Holder Name</span>
                        <div className="portal-info-value">
                          <span>{bankAccountHolder || <span className="muted">Not configured</span>}</span>
                        </div>
                      </div>

                      <div className="portal-info-box">
                        <span className="portal-info-label">Bank Name</span>
                        <div className="portal-info-value">
                          <span>{bankName || <span className="muted">Not configured</span>}</span>
                        </div>
                      </div>

                      <div className="portal-info-box">
                        <span className="portal-info-label">Account Number</span>
                        <div className="portal-info-value font-mono">
                          <span>{bankAccountNumber ? `•••• •••• ${bankAccountNumber.slice(-4)}` : <span className="muted font-sans">Not configured</span>}</span>
                        </div>
                      </div>

                      <div className="portal-info-box">
                        <span className="portal-info-label">IFSC / SWIFT Code</span>
                        <div className="portal-info-value font-mono">
                          <span>{bankIfscCode || <span className="muted font-sans">Not configured</span>}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* View UPI Payment Card */}
                  <div className="portal-card-box">
                    <div className="portal-card-section-header">
                      <div className="portal-card-section-title">
                        <CreditCard size={16} />
                        <span>UPI Payment Handle</span>
                      </div>
                      <span className={`portal-status-badge ${bankUpiId ? 'info' : 'muted'}`}>
                        {bankUpiId ? 'UPI Active' : 'Not Configured'}
                      </span>
                    </div>

                    <div className="portal-info-box">
                      <span className="portal-info-label">UPI ID / Virtual Payment Address (VPA)</span>
                      <div className="portal-info-value">
                        <CreditCard size={15} />
                        <span>{bankUpiId || <span className="muted">Not configured</span>}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div className="portal-card-box">
              <div className="portal-card-section-header mb-4">
                <div className="portal-card-section-title">
                  <Lock size={16} />
                  <span>Change Password</span>
                </div>
                <span className="portal-status-badge info">
                  Customer Security
                </span>
              </div>

              {changePasswordMsg && (
                <div className={`portal-toast ${changePasswordMsg.type} mb-4`} role="alert">
                  {changePasswordMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{changePasswordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="portal-form-grid" noValidate>
                <div className="portal-form-group full-width">
                  <label htmlFor="current-pwd">Current Password *</label>
                  <div className="portal-input-wrap">
                    <Lock size={16} className="portal-input-icon" />
                    <input
                      id="current-pwd"
                      type="password"
                      className="portal-input has-icon"
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>

                <div className="portal-form-group">
                  <label htmlFor="new-pwd">New Password *</label>
                  <div className="portal-input-wrap">
                    <Lock size={16} className="portal-input-icon" />
                    <input
                      id="new-pwd"
                      type="password"
                      className="portal-input has-icon"
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>

                <div className="portal-form-group">
                  <label htmlFor="confirm-new-pwd">Confirm New Password *</label>
                  <div className="portal-input-wrap">
                    <Lock size={16} className="portal-input-icon" />
                    <input
                      id="confirm-new-pwd"
                      type="password"
                      className="portal-input has-icon"
                      required
                      value={confirmNewPasswordInput}
                      onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                <div className="portal-form-actions full-width mt-2">
                  <button type="submit" className="btn-portal-primary" disabled={changePasswordLoading}>
                    {changePasswordLoading ? (
                      <span>Updating Password...</span>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </CustomerAccountLayout>
      ) : (
        /* GUEST AUTHENTICATION VIEW */
        <section className="auth-page-section py-12">
          <div className="container">
            <div className="auth-card-split">
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
                  <img src="/honeywell-products-logo.png" alt="Honeywell Logo" className="auth-brand-logo" />
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
                      <label htmlFor="customer-fullname">Full Name</label>
                      <div className="input-with-icon-wrap">
                        <User size={18} className="input-icon-left" />
                        <input
                          id="customer-fullname"
                          type="text"
                          autoComplete="name"
                          placeholder="Enter your full name"
                          value={inputFullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          onBlur={() => handleBlur('fullName')}
                          className={errors.fullName ? 'has-error' : ''}
                          aria-invalid={Boolean(errors.fullName)}
                          aria-describedby={errors.fullName ? 'fullname-error' : undefined}
                        />
                      </div>
                      {errors.fullName && (
                        <div id="fullname-error" className="field-error-msg" role="alert">
                          <AlertCircle size={14} /> <span>{errors.fullName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="auth-form-group">
                    <label htmlFor="customer-email">Email Address or Mobile No</label>
                    <div className="input-with-icon-wrap">
                      <Mail size={18} className="input-icon-left" />
                      <input
                        id="customer-email"
                        type="text"
                        autoComplete="username email tel"
                        placeholder="Enter email or 10-digit mobile number"
                        value={inputEmail}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={errors.email ? 'has-error' : ''}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {errors.email && (
                      <div id="email-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} /> <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="auth-form-group">
                    <label htmlFor="customer-password">Password</label>
                    <div className="input-with-icon-wrap">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        id="customer-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        placeholder="Enter your password"
                        value={inputPassword}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        className={errors.password ? 'has-error' : ''}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? 'password-error' : undefined}
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
                      <div id="password-error" className="field-error-msg" role="alert">
                        <AlertCircle size={14} /> <span>{errors.password}</span>
                      </div>
                    )}
                  </div>

                  {authMode === 'register' && (
                    <div className="auth-form-group">
                      <label htmlFor="customer-confirmpassword">Confirm Password</label>
                      <div className="input-with-icon-wrap">
                        <Lock size={18} className="input-icon-left" />
                        <input
                          id="customer-confirmpassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          value={inputConfirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          onBlur={() => handleBlur('confirmPassword')}
                          className={errors.confirmPassword ? 'has-error' : ''}
                          aria-invalid={Boolean(errors.confirmPassword)}
                          aria-describedby={errors.confirmPassword ? 'confirmpassword-error' : undefined}
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
                        <div id="confirmpassword-error" className="field-error-msg" role="alert">
                          <AlertCircle size={14} /> <span>{errors.confirmPassword}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {authMode === 'login' && (
                    <div className="form-options-row">
                      <label className="remember-me-label" htmlFor="remember-checkbox">
                        <input
                          id="remember-checkbox"
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
                      <span>{authMode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
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
        </section>
      )}
    </>
  );
}
