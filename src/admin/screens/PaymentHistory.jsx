import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, CreditCard, Check, X, Upload, Copy, Info, 
  RefreshCw, CheckCircle, AlertCircle, ArrowUpRight, Activity, Eye,
  Bell, BellOff, Clock, Calendar, Lock, ChevronDown, Trash2
} from 'lucide-react';
import { getOrders, updateOrderStatus, updateOrderPaymentStatus } from '../api/orders';
import { Toast } from '../components/Toast';
import { getApiDomain } from '../../utils/apiConfig';
import {
  getManualVerifications as fetchManualVerifications,
  getBankDetails as fetchBankDetails,
  getUpiDetails as fetchUpiDetails,
  getQrConfig as fetchQrConfig,
  updateQrConfig,
  updateBankDetails,
  updateUpiDetails,
  updateManualVerificationStatus,
  deleteManualVerification,
  reconcileSms as reconcileSmsOnServer
} from '../../services/paymentService';
import './PaymentHistory.css';

const formatDateDisplay = (dateStr) => {
  if (!dateStr || dateStr === 'TBD') return 'TBD';
  const cleanStr = String(dateStr).trim();

  // If YYYY-MM-DD format (or ISO timestamp)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    const parts = cleanStr.slice(0, 10).split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  // If DD/MM/YYYY or DD-MM-YYYY format
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(cleanStr)) {
    const parts = cleanStr.slice(0, 10).split(/[\/\-]/);
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }

  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  return cleanStr.slice(0, 10);
};

const PaymentHistory = () => {
  const [activeTab, setActiveTab] = useState('payments-list');
  const [orders, setOrders] = useState([]);
  const [manualVerifications, setManualVerifications] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Settings States
  const [qrPreview, setQrPreview] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrImgError, setQrImgError] = useState(false);

  useEffect(() => {
    setQrImgError(false);
  }, [qrPreview]);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    bankBranch: ''
  });
  const [upiId, setUpiId] = useState('');
  const [originalUpiDetails, setOriginalUpiDetails] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => (localStorage.getItem('honeywell_payment_notifications') || localStorage.getItem('shyam_agro_payment_notifications')) !== 'false');
  
  // Feedback Messages
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [ifscStatus, setIfscStatus] = useState({ type: '', message: '' });
  const [fetchedBankInfo, setFetchedBankInfo] = useState({ bankName: '', branch: '' });
  
  // Simulator & Reconciliation States
  const [smsText, setSmsText] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  const handleReconcileSmsSubmit = async (e) => {
    e.preventDefault();
    if (!smsText || !smsText.trim() || smsText.trim() === 'string') {
      showBannerStatus('error', 'Please enter a valid bank credit SMS payload.');
      return;
    }
    
    setIsReconciling(true);
    setReconcileResult(null);

    try {
      const res = await reconcileSmsOnServer(smsText.trim());
      setIsReconciling(false);

      if (res && res.success !== false) {
        const utr = res.utrNumber || res.UtrNumber || res.utr || res.data?.utrNumber || '';
        const amount = res.amount || res.Amount || res.data?.amount || '';
        setReconcileResult({
          success: true,
          message: res.message || `Successfully parsed bank credit SMS!${utr ? ` UTR: ${utr}.` : ''}${amount ? ` Amount: INR ${amount}.` : ''}`,
          data: { utrNumber: utr, amount: amount, matchedOrderId: res.orderId || res.OrderId || res.data?.orderId }
        });
        showBannerStatus('success', 'SMS parsed and reconciled successfully.');
        loadOrdersList();
      } else {
        const errMsg = res?.message || 'Could not parse UTR or Amount from the SMS payload.';
        setReconcileResult({
          success: false,
          message: errMsg
        });
        showBannerStatus('error', errMsg);
      }
    } catch (err) {
      setIsReconciling(false);
      const errMsg = err.message || 'Could not parse UTR or Amount from the SMS payload.';
      setReconcileResult({
        success: false,
        message: errMsg
      });
      showBannerStatus('error', errMsg);
    }
  };

  // Scrollbar synchronization
  const topScrollRef = React.useRef(null);
  const tableScrollRef = React.useRef(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  // Load configured settings on component mount
  // Load configured settings on component mount directly from backend APIs
  useEffect(() => {
    const loadServerSettings = async () => {
      try {
        const serverQr = await fetchQrConfig();
        if (serverQr && (serverQr.qrImageUrl || serverQr.url)) {
          const rawUrl = serverQr.qrImageUrl || serverQr.url;
          const fullQrUrl = rawUrl.startsWith('/') 
            ? `${getApiDomain()}${rawUrl}` 
            : rawUrl;
          setQrPreview(fullQrUrl);
        }
      } catch (e) {
        console.warn("Failed to load live QR config from server:", e);
      }

      try {
        const serverBank = await fetchBankDetails();
        if (serverBank && (serverBank.bankName || serverBank.ifscCode)) {
          setBankDetails({
            bankName: serverBank.bankName || '',
            accountNumber: serverBank.accountNumber || '',
            accountHolderName: serverBank.accountHolderName || '',
            ifscCode: serverBank.ifscCode || '',
            bankBranch: serverBank.branch || serverBank.bankBranch || ''
          });
        }
      } catch (e) {
        console.warn("Failed to load live bank details from server:", e);
      }

      try {
        const serverUpi = await fetchUpiDetails();
        if (serverUpi) {
          setOriginalUpiDetails(serverUpi);
          if (serverUpi.merchantUpiId) {
            setUpiId(serverUpi.merchantUpiId);
          }
        }
      } catch (e) {
        console.warn("Failed to load live UPI details from server:", e);
      }
    };
    
    loadServerSettings();
    loadOrdersList();
  }, []);

  const loadOrdersList = async (search = '') => {
    setLoadingOrders(true);
    try {
      const ordersData = await getOrders();
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || ordersData?.data || ordersData?.value || []);
      setOrders(ordersList);
      
      try {
        const verificationsData = await fetchManualVerifications(search);
        const verificationsList = Array.isArray(verificationsData) ? verificationsData : (verificationsData?.verifications || verificationsData?.data || verificationsData?.value || []);
        setManualVerifications(verificationsList);
      } catch (e) {
        console.warn("Failed to load manual verifications from server:", e);
      }
    } catch (e) {
      console.error("Failed to load orders for payments list:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleToggleNotifications = async (e) => {
    const enabled = e.target.checked;
    setNotificationsEnabled(enabled);
    localStorage.setItem('honeywell_payment_notifications', enabled ? 'true' : 'false');
    
    showBannerStatus('success', `Payment alerts turned ${enabled ? 'ON' : 'OFF'}.`);
    
    if (enabled && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Alerts Enabled', {
          body: 'You will receive desktop alerts when farmers submit payments for manual verification.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Polling for notification alerts
  useEffect(() => {
    if (!notificationsEnabled) return;
    
    let knownVerificationIds = new Set();
    
    fetchManualVerifications().then(data => {
      const verificationsList = Array.isArray(data) ? data : (data?.verifications || data?.data || data?.value || []);
      verificationsList.forEach(item => knownVerificationIds.add(item.id));
    }).catch(console.error);

    const interval = setInterval(async () => {
      try {
        const data = await fetchManualVerifications();
        const verificationsList = Array.isArray(data) ? data : (data?.verifications || data?.data || data?.value || []);
        const pending = verificationsList.filter(item => item.verificationStatus === 'Pending');
        for (const item of pending) {
          if (!knownVerificationIds.has(item.id)) {
            knownVerificationIds.add(item.id);
            
            if (Notification.permission === 'granted') {
              new Notification('New Payment Submitted', {
                body: `Order #${item.orderId || ''} from ${item.customerName || 'Customer'} (₹${Number(item.amountPaid || 0).toLocaleString('en-IN')}) requires manual verification.`,
                icon: '/favicon.ico'
              });
            }
            showBannerStatus('success', `New Payment Submitted! Order #${item.orderId || ''} (₹${Number(item.amountPaid || 0).toLocaleString('en-IN')}) requires verification.`);
          }
        }
      } catch (err) {
        console.warn("Failed to poll manual verifications for notifications:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // IFSC Auto-fetch branch details from Razorpay API
  useEffect(() => {
    const fetchBranchDetails = async () => {
      const formattedIfsc = (bankDetails?.ifscCode || '').toUpperCase().trim();
      if (formattedIfsc.length !== 11) {
        setIfscStatus({ type: '', message: '' });
        setFetchedBankInfo({ bankName: '', branch: '' });
        return;
      }
      
      setIfscStatus({ type: 'loading', message: 'Fetching branch info...' });
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${formattedIfsc}`);
        if (!response.ok) {
          throw new Error('Invalid IFSC code. No matching branch found.');
        }
        const data = await response.json();
        
        const verifiedBank = data.BANK || '';
        const verifiedBranch = data.BRANCH || '';

        setFetchedBankInfo({ bankName: verifiedBank, branch: verifiedBranch });
        setBankDetails(prev => ({
          ...prev,
          bankName: verifiedBank || prev.bankName,
          bankBranch: verifiedBranch || prev.bankBranch
        }));
        setIfscStatus({ type: 'success', message: `Verified: ${verifiedBank} — ${verifiedBranch}` });
      } catch (err) {
        setFetchedBankInfo({ bankName: '', branch: '' });
        setIfscStatus({ type: 'error', message: err.message || 'Failed to auto-fetch branch. Enter bank details manually.' });
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchBranchDetails();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [bankDetails.ifscCode]);

  const handleVerifyPayment = async (orderId, totalAmount, realOrderId, verificationRecordId) => {
    if (!window.confirm(`Verify payment of INR ${Number(totalAmount || 0).toLocaleString('en-IN')} for Order #${orderId || ''}?\n\nThis will mark the order as Verified.`)) return;
    
    try {
      // 1. Approve manual verification record if present
      if (verificationRecordId) {
        const res = await updateManualVerificationStatus(verificationRecordId, 'Approved');

        if (res && res.success === false) {
          if (res.status === 422) {
            const utr = res.data?.utrNumber || res.data?.UtrNumber || '';
            showBannerStatus('error',
              `⚠️ Cannot approve — UTR not matched against bank records.` +
              (utr ? ` Expected UTR: ${utr}.` : '') +
              ` Paste the bank credit SMS in the "Auto-Verification Sandbox" tab first.`
            );
          } else {
            showBannerStatus('error', res.message || `Server error (${res.status || 'unknown'}).`);
          }
          return;
        }

        // Dynamically update local manualVerifications state
        setManualVerifications(prev => (Array.isArray(prev) ? prev : []).map(mv => mv.id === verificationRecordId ? { ...mv, verificationStatus: 'Approved', smsVerified: true } : mv));
      }

      // 2. Update order payment status and order status on server (supports string & numeric IDs)
      if (realOrderId) {
        try {
          await updateOrderPaymentStatus(realOrderId, 'Verified', totalAmount);
          await updateOrderStatus(realOrderId, 'Processing');
        } catch (err) {
          console.warn("Order endpoint update warning:", err);
        }

        // Dynamically update local orders state
        setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => String(o.id || o.orderId) === String(realOrderId) ? { ...o, paymentStatus: 'Verified', status: 'Processing' } : o));
      }
      
      showBannerStatus('success', `Payment for Order #${orderId} verified successfully.`);
      loadOrdersList();
    } catch (e) {
      showBannerStatus('error', `Failed to verify payment: ${e.message}`);
    }
  };

  // Handle manual verification rejection
  const handleRejectPayment = async (orderId, realOrderId, verificationRecordId) => {
    if (!window.confirm(`Reject payment details for Order #${orderId}?`)) return;
    
    try {
      if (verificationRecordId) {
        await updateManualVerificationStatus(verificationRecordId, 'Rejected');
        setManualVerifications(prev => (Array.isArray(prev) ? prev : []).map(mv => mv.id === verificationRecordId ? { ...mv, verificationStatus: 'Rejected' } : mv));
      }

      if (realOrderId) {
        try {
          await updateOrderPaymentStatus(realOrderId, 'Rejected', 0);
          await updateOrderStatus(realOrderId, 'Cancelled');
        } catch (err) {
          console.warn("Order endpoint update warning:", err);
        }
        setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => String(o.id || o.orderId) === String(realOrderId) ? { ...o, paymentStatus: 'Rejected', status: 'Cancelled' } : o));
      }
      
      showBannerStatus('success', `Payment for Order #${orderId} rejected.`);
      loadOrdersList();
    } catch (e) {
      showBannerStatus('error', `Failed to reject payment: ${e.message}`);
    }
  };

  const handleDeleteVerification = async (verificationId, orderId) => {
    if (!window.confirm(`Are you sure you want to delete manual verification record for Order #${orderId}?`)) return;
    try {
      const res = await deleteManualVerification(verificationId);
      if (res && res.success !== false) {
        setManualVerifications(prev => (Array.isArray(prev) ? prev : []).filter(mv => mv.id !== verificationId));
        showBannerStatus('success', `Manual verification record deleted successfully.`);
        loadOrdersList();
      } else {
        showBannerStatus('error', res?.message || 'Failed to delete manual verification record.');
      }
    } catch (e) {
      showBannerStatus('error', `Failed to delete manual verification: ${e.message}`);
    }
  };

  const showBannerStatus = (type, message) => {
    setSaveStatus({ type, message });
    setTimeout(() => {
      setSaveStatus({ type: '', message: '' });
    }, 4000);
  };

  // Handle QR code upload
  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setQrFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result);
      showBannerStatus('success', 'Image preview loaded. Click "Update QR Code" to save.');
    };
    reader.readAsDataURL(file);
  };

  // Save QR Code settings
  const saveQrSettings = async (e) => {
    e.preventDefault();
    if (!qrPreview) {
      showBannerStatus('error', 'Please upload or preview a QR Code before saving.');
      return;
    }
    
    try {
      const fd = new FormData();
      if (qrFile) {
        fd.append('file', qrFile);
      } else {
        fd.append('qrImageUrl', qrPreview);
      }
      const response = await updateQrConfig(fd);
      if (response && response.success !== false) {
        showBannerStatus('success', 'QR Code configurations saved to server successfully.');
        setQrFile(null);
        if (response.qrImageUrl || response.url) {
          setQrPreview(response.qrImageUrl || response.url);
        }
      } else {
        showBannerStatus('error', response?.message || 'Failed to update QR Code configuration on server.');
      }
    } catch (err) {
      showBannerStatus('error', `Failed to update QR Code configuration: ${err.message}`);
    }
  };

  const isBankFormValid = (details) => {
    if (!details) return false;
    const ifsc = (details.ifscCode || '').trim().toUpperCase();
    const bankName = (details.bankName || '').trim();
    const bankBranch = (details.bankBranch || '').trim();
    const accNum = (details.accountNumber || '').trim();
    const holderName = (details.accountHolderName || '').trim();

    if (!ifsc || !bankName || !bankBranch || !accNum || !holderName) return false;
    if (ifsc.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return false;
    if (!/^\d{9,18}$/.test(accNum)) return false;
    if (bankName.length < 2 || bankBranch.length < 2 || holderName.length < 2) return false;
    // Block save if Bank Name doesn't match the IFSC-verified bank
    if (fetchedBankInfo.bankName && bankName.toLowerCase() !== fetchedBankInfo.bankName.toLowerCase()) return false;
    // Block save if Bank Branch doesn't match the IFSC-verified branch
    if (fetchedBankInfo.branch && bankBranch.toLowerCase() !== fetchedBankInfo.branch.toLowerCase()) return false;

    return true;
  };

  // Save Bank Details settings
  const saveBankSettings = async (e) => {
    e.preventDefault();
    if (!isBankFormValid(bankDetails)) {
      showBannerStatus('error', 'Please fill in all mandatory bank details with valid input before saving.');
      return;
    }
    
    try {
      const response = await updateBankDetails({
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountHolderName: bankDetails.accountHolderName,
        ifscCode: bankDetails.ifscCode,
        branch: bankDetails.bankBranch
      });

      if (response && response.success !== false) {
        showBannerStatus('success', 'Bank Account details saved to server successfully.');
        if (response.bankName || response.accountNumber) {
          setBankDetails({
            bankName: response.bankName || bankDetails.bankName,
            accountNumber: response.accountNumber || bankDetails.accountNumber,
            accountHolderName: response.accountHolderName || bankDetails.accountHolderName,
            ifscCode: response.ifscCode || bankDetails.ifscCode,
            bankBranch: response.branch || response.bankBranch || bankDetails.bankBranch
          });
        }
      } else {
        showBannerStatus('error', response?.message || 'Failed to update Bank Account details on server.');
      }
    } catch (err) {
      showBannerStatus('error', `Failed to update Bank Account details: ${err.message}`);
    }
  };

  // UPI VPA validation: localPart@providerHandle (handle >= 3 alpha chars)
  // Recognized Indian UPI PSP handles (NPCI-registered)
  const KNOWN_UPI_HANDLES = new Set([
    'ybl','oksbi','okaxis','okicici','okhdfcbank','paytm','upi','apl','ibl',
    'icici','hdfcbank','sbi','axisbank','boi','cnrb','pnb','unionbank','idbi',
    'kotak','indus','fbl','airtel','jio','nsdl','aubank','mahb','bandhan',
    'dlb','esaf','fincare','rbl','ubi','utbi','vijb','corp','synd','uco',
    'allbank','andb','obc','federal','tmb','cub','kvb','dcb','sib','idfc',
    'barodampay','sc','hsbc','citi','dbs','equitas','abfspay','slice',
    'gpay','phonepe','amazonpay','mobikwik','axl','waave','ptyes','ptsbi',
    'pthdfc','ptaxis','ptkotak','icicib','yesbank','idfcfirst','shriramhf',
    'pingpay','rajgovt','centralbank','indianbank','abhyudaya','saraswat',
    'cosmos','jkbank','kbk','nkgsb','tjsb','zoho','razorpay','cashfree'
  ]);

  // UPI VPA validation: localPart@recognizedPSPHandle
  const isUpiValid = (id) => {
    if (!id || !id.trim()) return false;
    const trimmed = id.trim().toLowerCase();
    const atIdx = trimmed.indexOf('@');
    if (atIdx < 3) return false;                          // local part must be ≥3 chars
    const localPart = trimmed.slice(0, atIdx);
    const handle = trimmed.slice(atIdx + 1);
    if (!handle || handle.length < 3) return false;
    if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) return false; // local part charset
    return KNOWN_UPI_HANDLES.has(handle);                 // handle must be recognized PSP
  };

  // Returns true if format is structurally OK but handle is unrecognized
  const isUpiFormatOkButUnknownHandle = (id) => {
    if (!id || !id.trim()) return false;
    const trimmed = id.trim().toLowerCase();
    const atIdx = trimmed.indexOf('@');
    if (atIdx < 3) return false;
    const localPart = trimmed.slice(0, atIdx);
    const handle = trimmed.slice(atIdx + 1);
    if (!handle || handle.length < 3) return false;
    if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) return false;
    return !KNOWN_UPI_HANDLES.has(handle); // format ok but handle not in whitelist
  };

  // Save UPI ID settings
  const saveUpiSettings = async (e) => {
    e.preventDefault();
    if (!isUpiValid(upiId)) {
      showBannerStatus('error', 'Invalid UPI ID. Format must be: yourname@bankhandle (e.g. honeywell@ybl).');
      return;
    }
    
    try {
      const response = await updateUpiDetails({
        merchantName: originalUpiDetails.merchantName || 'Honeywell',
        merchantUpiId: upiId,
        bankDisplayName: originalUpiDetails.bankDisplayName || 'Bank Account',
        currency: originalUpiDetails.currency || 'INR'
      });

      if (response && response.success !== false) {
        showBannerStatus('success', 'UPI ID details saved to server successfully.');
        if (response.merchantUpiId) {
          setUpiId(response.merchantUpiId);
        }
      } else {
        showBannerStatus('error', response?.message || 'Failed to update UPI ID details on server.');
      }
    } catch (err) {
      showBannerStatus('error', `Failed to update UPI ID details: ${err.message}`);
    }
  };

  // Copy to clipboard helper
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    showBannerStatus('success', `Copied transaction reference UTR "${text}" to clipboard.`);
  };


  // Combined UPI/Bank Transfer Payments list merging manual verifications and orders
  const combinedPayments = useMemo(() => {
    const list = [];
    const matchedOrderIds = new Set();
    const safeVerifications = Array.isArray(manualVerifications) ? manualVerifications : [];
    const safeOrders = Array.isArray(orders) ? orders : [];
    
    // First, process manual verification submissions from server
    safeVerifications.forEach(mv => {
      if (!mv) return;
      const mvDigits = String(mv.orderId || '').replace(/\D/g, '');
      const o = safeOrders.find(ord => {
        if (!ord) return false;
        const ordIdDigits = String(ord.id || ord.orderId || '').replace(/\D/g, '');
        const ordNumDigits = String(ord.orderNumber || '').replace(/\D/g, '');
        return (mvDigits && (mvDigits === ordIdDigits || mvDigits === ordNumDigits)) ||
               String(ord.id || ord.orderId) === String(mv.orderId) ||
               String(ord.orderNumber) === String(mv.orderId);
      });
      
      if (o) {
        matchedOrderIds.add(String(o.id || o.orderId));
      }
      
      list.push({
        id: mv.orderId || mv.id || 'N/A',
        verificationRecordId: mv.id,
        orderId: mv.orderId || mv.id || 'N/A',
        customerName: mv.customerName || (o ? (o.customerName || o.customer) : 'Unknown'),
        phone: mv.mobileNumber || (o ? o.phone : ''),
        utr: mv.utrNumber || '',
        paymentDate: mv.paymentDate || (o ? o.orderDate : 'TBD'),
        totalAmount: o ? (o.totalAmount || o.total || o.finalAmount) : mv.amountPaid,
        amountPaid: mv.amountPaid,
        paymentStatus: o ? (o.paymentStatus || o.status) : (mv.verificationStatus === 'Pending' ? 'Pending Verification' : mv.verificationStatus),
        screenshotUrl: mv.screenshotUrl || null,
        remarks: mv.remarks || null,
        isVerificationRecord: true,
        smsVerified: mv.smsVerified === true,
        verifiedUtr: mv.verifiedUtr || null,
        realOrderId: o ? (o.id || o.orderId) : mv.orderId
      });
    });
    
    // Add remaining manual payment orders that don't have server verification details
    safeOrders.forEach(o => {
      if (o && o.paymentMethod === 'UPI / Bank Transfer' && !matchedOrderIds.has(String(o.id || o.orderId))) {
        list.push({
          id: o.id || o.orderId || 'N/A',
          orderId: o.id || o.orderId || 'N/A',
          customerName: o.customerName || o.customer || 'Unknown',
          phone: o.phone || '',
          utr: o.utr || '',
          paymentDate: o.orderDate ? String(o.orderDate).slice(0, 10) : 'TBD',
          totalAmount: o.totalAmount || o.total || 0,
          amountPaid: o.paidAmount || 0,
          paymentStatus: o.paymentStatus || o.status || 'Pending',
          screenshotUrl: null,
          remarks: null,
          isVerificationRecord: false,
          realOrderId: o.id || o.orderId
        });
      }
    });
    
    return list;
  }, [manualVerifications, orders]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return (combinedPayments || []).filter(p => {
      if (!p) return false;
      const search = (searchTerm || '').toLowerCase().trim();
      const matchesSearch = 
        String(p.orderId || '').toLowerCase().includes(search) || 
        String(p.customerName || '').toLowerCase().includes(search) ||
        String(p.utr || '').toLowerCase().includes(search);
      
      let matchesFilter = true;
      const status = p.paymentStatus;
      if (statusFilter === 'Pending') {
        matchesFilter = status === 'Pending Verification' || status === 'Pending' || status === 'PendingVerification' || status === 'Processing';
      } else if (statusFilter === 'Verified') {
        matchesFilter = status === 'Paid' || status === 'Verified' || status === 'Approved';
      } else if (statusFilter === 'Rejected') {
        matchesFilter = status === 'Rejected' || status === 'Cancelled';
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [combinedPayments, searchTerm, statusFilter]);

  return (
    <div className="payment-history-container">
      {/* Top Settings Area */}
      <div className="payment-header">
        <div className="payment-header-left">
          <h1 className="payment-title">Payments & Verification Settings</h1>
          <p className="payment-subtitle">
            Configure manual checkout credentials, track customer UTR submissions, and manage transaction matching.
          </p>
          
          <div className="alerts-status-row">
            <button 
              type="button" 
              onClick={() => handleToggleNotifications({ target: { checked: !notificationsEnabled } })}
              title={notificationsEnabled ? "Disable Payment Notifications" : "Enable Payment Notifications"}
              className={`alerts-pill ${notificationsEnabled ? 'active' : ''}`}
            >
              <span className="alerts-dot" />
              <span className="alerts-text">Alerts: {notificationsEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <span className="alerts-description">
              {notificationsEnabled ? 'Will notify on incoming farmer payments.' : 'Notifications muted.'}
            </span>
          </div>
        </div>
        
        <div className="payment-header-right">
          <label className="module-label">Module:</label>
          <div className="module-select-wrap">
            <select 
              className="module-select"
              value={activeTab} 
              onChange={(e) => {
                setActiveTab(e.target.value);
                setSaveStatus({ type: '', message: '' });
              }}
            >
              <option value="payments-list">Payments Ledger & Verification</option>
              <option value="qr-code">QR Code Configurations</option>
              <option value="bank-details">Bank Transfer Details</option>
              <option value="upi-id">UPI ID Configuration</option>
            </select>
            <ChevronDown size={14} className="module-select-arrow" />
          </div>
        </div>
      </div>

      <div className="payment-divider" />

      {saveStatus.message && (
        <Toast 
          message={saveStatus.message} 
          type={saveStatus.type === 'success' ? 'success' : saveStatus.type === 'error' ? 'error' : 'warning'} 
          onClose={() => setSaveStatus({ type: '', message: '' })} 
        />
      )}

      <div className="mt-4">
        {/* Module 1: Payments List */}
        {activeTab === 'payments-list' && (
          <div>
            <div className="ledger-header">
              <h2 className="ledger-title">Transaction Ledger</h2>
              <p className="ledger-subtitle">Verify submitted customer reference details against bank credits to process orders.</p>
            </div>

            <div className="search-filter-row">
              <div className="search-box">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Search by Order ID, Customer, or UTR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-segmented-control">
                {['All', 'Pending', 'Verified', 'Rejected'].map(filter => (
                  <button 
                    key={filter}
                    type="button"
                    className={`segmented-filter-btn ${statusFilter === filter ? 'active' : ''}`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter === 'Pending' ? 'Processing / Pending' : filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="accent-progress-line">
              <div className="accent-progress-active" />
            </div>

            {loadingOrders ? (
              <div className="empty-payments-state">
                <RefreshCw className="animate-spin" size={24} />
                <p>Loading transactions ledger...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="empty-payments-state">
                <CreditCard size={40} />
                <h3>No Manual Payments Found</h3>
                <p>No orders matched your search or selected filter options.</p>
              </div>
            ) : (
              <div className="ledger-table-card">
                <div 
                  ref={topScrollRef} 
                  className="top-scrollbar-bar" 
                  onScroll={handleTopScroll}
                >
                  <div className="top-scrollbar-dummy" />
                </div>
                <div 
                  ref={tableScrollRef} 
                  className="bottom-table-scroll" 
                  onScroll={handleTableScroll}
                >
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>CUSTOMER DETAILS</th>
                        <th>UTR / REF ID</th>
                        <th>ORDER DATE</th>
                        <th>AMOUNT DUE</th>
                        <th>VERIFICATION</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map(payment => {
                        const status = (payment.paymentStatus || '').toLowerCase();
                        const isPending = status.includes('pending') || status === 'unverified' || status === 'processing';
                        const isVerified = !isPending && (status.includes('paid') || status.includes('verif') || status.includes('success') || status.includes('approved'));
                        const isRejected = status.includes('reject') || status.includes('cancel') || status.includes('fail');
                        const isUnknown = !isPending && !isVerified && !isRejected;
                        
                        return (
                          <tr key={payment.verificationRecordId ? `mv-${payment.verificationRecordId}` : `ord-${payment.orderId}-${payment.utr}`}>
                            <td>
                              <Link to={`/admin/orders/details/${payment.realOrderId}`} className="order-id-link">
                                #{payment.orderId}
                              </Link>
                            </td>
                            <td>
                              <div className="customer-details-cell">
                                <span className="customer-name">{payment.customerName}</span>
                                <span className="customer-phone">{payment.phone || 'No phone'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="utr-cell">
                                <div className="utr-badge-container">
                                  <span className="utr-text">{payment.utr || 'NOT PROVIDED'}</span>
                                  {payment.utr && (
                                    <button
                                      type="button"
                                      className="utr-copy-btn"
                                      onClick={() => handleCopyText(payment.utr)}
                                      title="Copy UTR Reference"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  )}
                                </div>
                                {payment.screenshotUrl ? (
                                  <a 
                                    href={`${getApiDomain()}${payment.screenshotUrl}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="view-slip-link"
                                  >
                                    <Eye size={12} /> View Payment Slip
                                  </a>
                                ) : (
                                  <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); handleCopyText(payment.utr); }}
                                    className="view-slip-link"
                                  >
                                    <Eye size={12} /> View Payment Slip
                                  </a>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="order-date-cell">
                                <Calendar size={13} className="date-icon" />
                                <span>{formatDateDisplay(payment.paymentDate)}</span>
                              </div>
                            </td>
                            <td>
                              <div className="amount-cell">
                                <span className="amount-main">₹{(payment.totalAmount || 0).toLocaleString('en-IN')}</span>
                                {payment.amountPaid !== undefined && payment.amountPaid !== null && payment.amountPaid !== payment.totalAmount && (
                                  <span className="amount-paid-sub">
                                    Paid: ₹{Number(payment.amountPaid || 0).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {isPending && (
                                <span className="status-badge pending">
                                  <Clock size={11} /> Pending Match
                                </span>
                              )}
                              {isVerified && (
                                <span className="status-badge verified">
                                  <CheckCircle size={11} /> Verified
                                </span>
                              )}
                              {isRejected && (
                                <span className="status-badge rejected">
                                  <X size={11} /> Rejected
                                </span>
                              )}
                              {isUnknown && (
                                <span className="status-badge unknown">
                                  <Clock size={11} /> {payment.paymentStatus || 'None'}
                                </span>
                              )}
                            </td>
                            <td>
                                <div className="actions-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {isPending ? (
                                    <div className="action-buttons-group">
                                      <button 
                                        className="action-btn verify-btn"
                                        title="Approve this payment"
                                        onClick={() => {
                                          handleVerifyPayment(payment.orderId, payment.totalAmount || payment.amountPaid || 0, payment.realOrderId, payment.verificationRecordId);
                                        }}
                                      >
                                        <Check size={12} /> Verify Success
                                      </button>
                                    </div>
                                  ) : isRejected ? (
                                    <span className="action-text-rejected">Rejected</span>
                                  ) : isVerified ? (
                                    <span className="action-text-completed">Completed</span>
                                  ) : (
                                    <span className="action-text-muted">-</span>
                                  )}
                                  {payment.verificationRecordId && (
                                    <button
                                      type="button"
                                      className="action-btn delete-btn"
                                      title="Delete manual verification record"
                                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                      onClick={() => handleDeleteVerification(payment.verificationRecordId, payment.orderId)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module 2: QR Code Settings */}
        {activeTab === 'qr-code' && (
          <div className="qr-config-section">
            <div className="qr-config-header">
              <h3 className="qr-config-title">QR Code Configurations</h3>
              <p className="qr-config-subtitle">Upload a QR code for user phase checkout payments. Customers scan this QR to pay during checkout.</p>
            </div>

            <form onSubmit={saveQrSettings} className="qr-config-grid">
              <div className="qr-preview-card">
                <div className="qr-preview-box">
                  {qrPreview && !qrImgError ? (
                    <img 
                      src={qrPreview} 
                      alt="Payment QR Code Preview" 
                      className="qr-preview-img" 
                      onError={() => setQrImgError(true)} 
                    />
                  ) : (
                    <div className="qr-dashed-placeholder">
                      <div className="qr-placeholder-inner">
                        <Upload size={22} className="qr-broken-icon" />
                        <span className="qr-placeholder-text">Payment QR Code Preview</span>
                      </div>
                    </div>
                  )}
                </div>
                <span className="qr-preview-label">User Phase QR Preview</span>
              </div>

              <div className="qr-upload-form">
                <div>
                  <label className="qr-form-label">Select QR Image File</label>
                  <label className="qr-dropzone">
                    <Upload size={22} className="qr-upload-icon" />
                    <p className="qr-dropzone-text">Click to upload image</p>
                    <p className="qr-dropzone-sub">PNG, JPG, JPEG, SVG up to 2MB</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={handleQrUpload} 
                    />
                  </label>
                </div>
                
                <div>
                  <label className="qr-form-label">Or Paste QR Image URL</label>
                  <input 
                    type="url"
                    className="qr-url-input"
                    placeholder="https://example.com/payment-qr.png"
                    value={qrPreview && qrPreview.startsWith('http') ? qrPreview : ''}
                    onChange={(e) => setQrPreview(e.target.value)}
                  />
                </div>

                <div>
                  <button type="submit" className="qr-submit-btn">
                    <Check size={16} /> Update QR Code
                  </button>
                  <p className="qr-form-note">
                    Note: QR Code settings will be stored in your browser session for client-side override.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Module 3: Bank Details Settings */}
        {activeTab === 'bank-details' && (
          <div className="bank-config-section">
            <div className="bank-config-header">
              <h3 className="bank-config-title">Bank Transfer Credentials</h3>
              <p className="bank-config-subtitle">Edit bank account details displayed to farmers/dealers who choose direct bank wire transfers.</p>
            </div>

            <form onSubmit={saveBankSettings} className="bank-config-form">
              <div className="bank-form-group">
                <label className="bank-form-label">IFSC Code *</label>
                {(() => {
                  const ifscVal = (bankDetails.ifscCode || '').trim();
                  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                  const isFormatInvalid = ifscVal.length > 0 && ifscVal.length < 11;
                  const isPatternInvalid = ifscVal.length === 11 && !ifscRegex.test(ifscVal);
                  const showRedBorder = isFormatInvalid || isPatternInvalid || ifscStatus.type === 'error';
                  const isVerified = ifscStatus.type === 'success' || (fetchedBankInfo.bankName && ifscVal.length === 11);
                  
                  return (
                    <>
                      <input 
                        type="text" 
                        className={`bank-input ${
                          showRedBorder
                            ? 'border-rose-400 focus:border-rose-500'
                            : isVerified
                            ? 'ifsc-verified'
                            : ''
                        }`}
                        placeholder="e.g. HDFC0000001"
                        required
                        maxLength={11}
                        value={bankDetails.ifscCode}
                        onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                      />
                      {/* Inline format hint while typing */}
                      {isFormatInvalid && !ifscStatus.message && (
                        <div className="bank-error-msg">
                          <AlertCircle size={12} />
                          <span>IFSC must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0000001).</span>
                        </div>
                      )}
                      {/* API response feedback (loading / success / error) */}
                      {ifscStatus.message ? (
                        <div className={ifscStatus.type === 'error' ? 'bank-error-msg' : 'bank-verified-msg'}>
                          {ifscStatus.type === 'loading' && <RefreshCw size={12} className="animate-spin" />}
                          {ifscStatus.type === 'success' && <CheckCircle size={14} />}
                          {ifscStatus.type === 'error' && <AlertCircle size={12} />}
                          <span>{ifscStatus.message}</span>
                        </div>
                      ) : isVerified && fetchedBankInfo.bankName ? (
                        <div className="bank-verified-msg">
                          <CheckCircle size={14} />
                          <span>Verified: {fetchedBankInfo.bankName} — {fetchedBankInfo.branch}</span>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>

              <div className="bank-form-group">
                <div className="bank-form-label-row">
                  <span className="bank-form-label">Bank Name *</span>
                  <span className="bank-lock-tag">
                    <Lock size={12} /> Auto-verified from IFSC
                  </span>
                </div>
                <input 
                  type="text" 
                  className="bank-input read-only"
                  placeholder="e.g. HDFC Bank"
                  required
                  readOnly
                  value={bankDetails.bankName || fetchedBankInfo.bankName || ''}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                />
              </div>

              <div className="bank-form-group">
                <div className="bank-form-label-row">
                  <span className="bank-form-label">Bank Branch *</span>
                  <span className="bank-lock-tag">
                    <Lock size={12} /> Auto-filled from IFSC
                  </span>
                </div>
                <input 
                  type="text" 
                  className="bank-input read-only"
                  placeholder="e.g. TULSIANI CHMBRS - NARIMAN PT"
                  required
                  readOnly
                  value={bankDetails.bankBranch || fetchedBankInfo.branch || ''}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankBranch: e.target.value })}
                />
              </div>

              <div className="bank-form-group">
                <label className="bank-form-label">Account Number *</label>
                <input 
                  type="text" 
                  className="bank-input"
                  placeholder="50100012345678"
                  required
                  maxLength={18}
                  value={bankDetails.accountNumber}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 18);
                    setBankDetails({ ...bankDetails, accountNumber: onlyNums });
                  }}
                />
                {bankDetails.accountNumber && (bankDetails.accountNumber.length < 9 || bankDetails.accountNumber.length > 18) && (
                  <div className="bank-error-msg">
                    <AlertCircle size={12} />
                    <span>Account Number must be between 9 and 18 numeric digits.</span>
                  </div>
                )}
              </div>

              <div className="bank-form-group">
                <label className="bank-form-label">Account Holder Name *</label>
                <input 
                  type="text" 
                  className="bank-input"
                  placeholder="Honeywell"
                  required
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                />
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={!isBankFormValid(bankDetails)}
                  className="bank-submit-btn"
                >
                  <Check size={16} /> Save Bank details
                </button>
                <p className="bank-form-note">
                  Note: Bank details are initialized from the server on load, and saved to your browser session for client-side override.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Module 4: UPI ID Settings */}
        {activeTab === 'upi-id' && (
          <div className="upi-config-section">
            <div className="upi-config-header">
              <h3 className="upi-config-title">UPI ID Settings</h3>
              <p className="upi-config-subtitle">Configure the merchant UPI handle shown to customers on the checkout payments screen.</p>
            </div>

            <form onSubmit={saveUpiSettings} className="upi-config-form">
              <div className="upi-form-group">
                <label className="upi-form-label">Business UPI ID / VPA *</label>
                <input 
                  type="text" 
                  className={`upi-input ${upiId && !isUpiValid(upiId) ? 'error' : ''}`}
                  placeholder="e.g. honeywell@ybl"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.trim())}
                />
                {upiId && !isUpiValid(upiId) ? (
                  <div className="upi-error-msg">
                    <AlertCircle size={12} />
                    {isUpiFormatOkButUnknownHandle(upiId) ? (
                      <span>
                        Unrecognized PSP handle <strong>@{upiId.trim().split('@')[1]}</strong>. Use a valid bank handle (e.g. @ybl, @oksbi, @paytm, @upi, @axisbank).
                      </span>
                    ) : (
                      <span>Invalid format. Use <strong>localpart@bankhandle</strong> (e.g. honeywell@ybl, business@oksbi).</span>
                    )}
                  </div>
                ) : (
                  <div className="upi-hint-text">
                    <Info size={13} />
                    <span>Format: yourname@bankhandle — handle must be a recognized UPI PSP (e.g. @ybl, @paytm, @oksbi).</span>
                  </div>
                )}
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={!isUpiValid(upiId)}
                  className="upi-submit-btn"
                >
                  <Check size={16} /> Update UPI ID
                </button>
                <p className="upi-form-note">
                  Note: Merchant UPI VPA is initialized from the server on load, and saved to your browser session for client-side override.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;

