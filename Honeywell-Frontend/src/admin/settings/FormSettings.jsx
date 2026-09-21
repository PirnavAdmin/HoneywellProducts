import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Settings, CheckCircle, RefreshCw, CreditCard, Phone, RotateCcw } from 'lucide-react';
import { 
  getBankDetails, updateBankDetails,
  getUpiDetails, updateUpiDetails,
  getSupportConfig, updateSupportConfig,
  getReturnsConfig
} from '../../services/settingsApi';

const FormSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  // Bank & UPI State
  const [bankData, setBankData] = useState({
    accountHolderName: 'Honeywell Products & Solutions Pvt Ltd',
    bankName: 'HDFC Bank',
    accountNumber: '50200088991122',
    ifscCode: 'HDFC0000123',
    branch: 'Cyber City Branch'
  });

  const [upiData, setUpiData] = useState({
    merchantName: 'Honeywell Products India',
    merchantUpiId: 'honeywell@hdfcbank',
    bankDisplayName: 'HDFC Bank - Corporate',
    currency: 'INR'
  });

  // Support State
  const [supportData, setSupportData] = useState({
    supportPhoneNumber: '+1 (800) 323-0194',
    workTimings: 'Mon-Sat: 9:00 AM - 6:00 PM',
    supportEmail: 'support@honeywell.com'
  });

  // Returns Policy Window
  const [returnsWindow, setReturnsWindow] = useState(7);

  const isLegacyOrAgro = (str) => {
    if (!str || typeof str !== 'string') return false;
    const lower = str.toLowerCase();
    return lower.includes('agro') || lower.includes('shyam') || lower.includes('9398649798') || lower.includes('123456789012');
  };

  const sanitizeBankDetails = (data) => {
    if (!data) return {};
    const rawHolder = data.accountHolderName ?? data.AccountHolderName ?? '';
    const rawBank = data.bankName ?? data.BankName ?? '';
    const rawAcc = data.accountNumber ?? data.AccountNumber ?? '';
    const rawIfsc = data.ifscCode ?? data.IfscCode ?? '';
    const rawBranch = data.branch ?? data.Branch ?? '';

    return {
      accountHolderName: isLegacyOrAgro(rawHolder) || !rawHolder ? 'Honeywell Products & Solutions Pvt Ltd' : rawHolder,
      bankName: isLegacyOrAgro(rawBank) || !rawBank ? 'HDFC Bank' : rawBank,
      accountNumber: isLegacyOrAgro(rawAcc) || rawAcc === '123456789012' || !rawAcc ? '50200088991122' : rawAcc,
      ifscCode: isLegacyOrAgro(rawIfsc) || rawIfsc === 'HDFC0001234' || !rawIfsc ? 'HDFC0000123' : rawIfsc,
      branch: isLegacyOrAgro(rawBranch) || !rawBranch ? 'Cyber City Branch' : rawBranch
    };
  };

  const sanitizeUpiDetails = (data) => {
    if (!data) return {};
    const rawMerchant = data.merchantName ?? data.MerchantName ?? '';
    const rawUpi = data.merchantUpiId ?? data.MerchantUpiId ?? '';
    const rawBankDisplay = data.bankDisplayName ?? data.BankDisplayName ?? '';
    const rawCurrency = data.currency ?? data.Currency ?? 'INR';

    return {
      merchantName: isLegacyOrAgro(rawMerchant) || !rawMerchant ? 'Honeywell Products India' : rawMerchant,
      merchantUpiId: isLegacyOrAgro(rawUpi) || !rawUpi ? 'honeywell@hdfcbank' : rawUpi,
      bankDisplayName: isLegacyOrAgro(rawBankDisplay) || !rawBankDisplay ? 'HDFC Bank - Corporate' : rawBankDisplay,
      currency: rawCurrency || 'INR'
    };
  };

  const sanitizeSupportDetails = (data) => {
    if (!data) return {};
    const rawPhone = data.supportPhoneNumber ?? data.SupportPhoneNumber ?? data.phone ?? data.Phone ?? '';
    const rawEmail = data.supportEmail ?? data.SupportEmail ?? data.email ?? data.Email ?? '';
    const rawTimings = data.workTimings ?? data.WorkTimings ?? data.timings ?? data.Timings ?? '';

    return {
      supportPhoneNumber: isLegacyOrAgro(rawPhone) || !rawPhone ? '+1 (800) 323-0194' : rawPhone,
      supportEmail: isLegacyOrAgro(rawEmail) || !rawEmail ? 'support@honeywell.com' : rawEmail,
      workTimings: isLegacyOrAgro(rawTimings) || !rawTimings ? 'Mon-Sat: 9:00 AM - 6:00 PM' : rawTimings
    };
  };

  // Load configuration from APIs on mount
  useEffect(() => {
    async function loadAllSettings() {
      setLoading(true);
      setError('');
      try {
        const [bankRes, upiRes, supportRes, returnsRes] = await Promise.allSettled([
          getBankDetails(),
          getUpiDetails(),
          getSupportConfig(),
          getReturnsConfig()
        ]);

        if (bankRes.status === 'fulfilled' && bankRes.value) {
          setBankData(prev => ({ ...prev, ...sanitizeBankDetails(bankRes.value) }));
        }
        if (upiRes.status === 'fulfilled' && upiRes.value) {
          setUpiData(prev => ({ ...prev, ...sanitizeUpiDetails(upiRes.value) }));
        }
        if (supportRes.status === 'fulfilled' && supportRes.value) {
          setSupportData(prev => ({ ...prev, ...sanitizeSupportDetails(supportRes.value) }));
        }
        if (returnsRes.status === 'fulfilled' && returnsRes.value) {
          setReturnsWindow(returnsRes.value.returnWindowDays ?? 7);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Some settings failed to load from API.');
      } finally {
        setLoading(false);
      }
    }
    loadAllSettings();
  }, []);

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpiChange = (e) => {
    const { name, value } = e.target;
    setUpiData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupportChange = (e) => {
    const { name, value } = e.target;
    setSupportData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const bankPayload = {
        AccountHolderName: bankData.accountHolderName,
        BankName: bankData.bankName,
        AccountNumber: bankData.accountNumber,
        IfscCode: bankData.ifscCode,
        Branch: bankData.branch
      };

      const upiPayload = {
        MerchantName: upiData.merchantName,
        MerchantUpiId: upiData.merchantUpiId,
        BankDisplayName: upiData.bankDisplayName,
        Currency: upiData.currency || 'INR'
      };

      const supportPayload = {
        SupportPhoneNumber: supportData.supportPhoneNumber,
        Phone: supportData.supportPhoneNumber,
        SupportPhone: supportData.supportPhoneNumber,
        SupportEmail: supportData.supportEmail,
        Email: supportData.supportEmail,
        WorkTimings: supportData.workTimings,
        Timings: supportData.workTimings
      };

      const [bankRes, upiRes, supportRes] = await Promise.all([
        updateBankDetails(bankPayload),
        updateUpiDetails(upiPayload),
        updateSupportConfig(supportPayload)
      ]);

      if (bankRes?.data || bankRes?.Data) {
        setBankData(prev => ({ ...prev, ...(bankRes.data || bankRes.Data) }));
      }
      if (upiRes?.data || upiRes?.Data) {
        setUpiData(prev => ({ ...prev, ...(upiRes.data || upiRes.Data) }));
      }
      if (supportRes?.data || supportRes?.Data) {
        setSupportData(prev => ({ ...prev, ...(supportRes.data || supportRes.Data) }));
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px 20px', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '24px 28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          maxWidth: '900px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              aria-label="Go back"
              type="button"
              onClick={() => navigate(-1)}
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                System Preferences & Payment Settings
              </h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Configure bank payment accounts, UPI merchant keys, support contacts, and return policies.
              </p>
            </div>
          </div>

          <div>
            {isSaved ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eaf4fb', border: '1px solid #bde0fe', color: '#1268a5', fontWeight: 700, fontSize: '12.5px', padding: '0 16px', height: '38px', borderRadius: '8px' }}>
                <CheckCircle size={16} /> Settings Updated
              </span>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={saving || loading}
                style={{
                  background: '#1268a5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  height: '38px',
                  padding: '0 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(18,104,165,0.2)',
                  transition: 'background 0.15s ease'
                }}
                onMouseOver={(e) => { if (!saving && !loading) e.currentTarget.style.background = '#0a4d7c'; }}
                onMouseOut={(e) => { if (!saving && !loading) e.currentTarget.style.background = '#1268a5'; }}
              >
                {saving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
                <span>{saving ? 'Updating...' : 'Update Settings'}</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <RefreshCw size={20} className="spin" style={{ display: 'block', margin: '0 auto 8px', color: '#1268a5' }} />
            Loading live settings from API...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section 1: BANK ACCOUNT PAYMENT SETTINGS */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>
                <CreditCard size={16} style={{ color: '#1268a5' }} />
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  BANK ACCOUNT PAYMENT SETTINGS
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={bankData.accountHolderName}
                    onChange={handleBankChange}
                    placeholder="Enter account holder name"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={bankData.bankName}
                    onChange={handleBankChange}
                    placeholder="Enter bank name"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankData.accountNumber}
                    onChange={handleBankChange}
                    placeholder="Enter account number"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={bankData.ifscCode}
                    onChange={handleBankChange}
                    placeholder="Enter IFSC code"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: UPI MERCHANT CONFIGURATION */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>
                <Settings size={16} style={{ color: '#1268a5' }} />
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  UPI MERCHANT CONFIGURATION
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    name="merchantName"
                    value={upiData.merchantName}
                    onChange={handleUpiChange}
                    placeholder="Enter merchant name"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Merchant UPI VPA ID
                  </label>
                  <input
                    type="text"
                    name="merchantUpiId"
                    value={upiData.merchantUpiId}
                    onChange={handleUpiChange}
                    placeholder="e.g. merchant@ybl"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: CUSTOMER SUPPORT & RETURNS POLICY */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>
                <Phone size={16} style={{ color: '#1268a5' }} />
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#1268a5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  CUSTOMER SUPPORT & RETURNS WINDOW
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    name="supportPhoneNumber"
                    value={supportData.supportPhoneNumber}
                    onChange={handleSupportChange}
                    placeholder="e.g. 040 4855 5758"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Support Email
                  </label>
                  <input
                    type="email"
                    name="supportEmail"
                    value={supportData.supportEmail}
                    onChange={handleSupportChange}
                    placeholder="e.g. support@yourcompany.com"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Work Timings
                  </label>
                  <input
                    type="text"
                    name="workTimings"
                    value={supportData.workTimings}
                    onChange={handleSupportChange}
                    placeholder="e.g. Mon-Sat 9:00 AM - 6:00 PM"
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                    onFocus={(e) => { e.target.style.borderColor = '#1268a5'; e.target.style.boxShadow = '0 0 0 3px rgba(18, 104, 165, 0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Returns Window (Days)
                  </label>
                  <input
                    type="number"
                    value={returnsWindow}
                    readOnly
                    style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#475569', background: '#e2e8f0', cursor: 'default' }}
                  />
                </div>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default FormSettings;
