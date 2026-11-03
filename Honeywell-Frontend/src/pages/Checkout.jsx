import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, CreditCard, QrCode, ShieldCheck, Check, AlertCircle, Upload, Info, Tag, X, Eye, EyeOff } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  initiatePayment,
  netbankingLogin,
  netbankingVerifyOtp,
  cardVerifyOtp,
  getPaymentStatus,
  completePayment,
  getQrCode,
  getQrByOrderId,
  getQrCodeByOrderId,
  submitManualVerification,
  createCashfreeOrder,
  getCashfreeOrderDetails
} from '../services/paymentService';
import { launchCashfreeCheckout } from '../utils/cashfree';

import { couponService } from '../services/couponService';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { getAddresses } from '../services/customerApi';
import { validateName, validateEmail, validatePhone } from '../utils/validators';

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

export default function Checkout() {
  useDocumentTitle('Checkout', 'Submit contact and payment details for products selected in the cart.');
  const { items, count, total, clearCart } = useCart();
  const { priceVisibility } = useSettings();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const popoverRef = useRef(null);

  // Form State - auto-populated from logged-in customer if available
  const [customerName, setCustomerName] = useState(
    user?.name || user?.fullName || localStorage.getItem('customerName') || ''
  );
  const [mobile, setMobile] = useState(
    user?.phone || user?.mobileNumber || localStorage.getItem('customerPhone') || ''
  );
  const [email, setEmail] = useState(
    user?.email || localStorage.getItem('customerEmail') || ''
  );
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState('');

  // Prepopulate saved addresses from API or profile
  useEffect(() => {
    if (user) {
      if (!customerName && (user.name || user.fullName)) {
        setCustomerName(user.name || user.fullName);
      }
      if (!email && user.email) {
        setEmail(user.email);
      }
      if (!mobile && (user.phone || user.mobileNumber)) {
        setMobile(user.phone || user.mobileNumber);
      }

      const activeCustId = user.customerId || user.id || localStorage.getItem('customerId');
      if (activeCustId) {
        getAddresses(activeCustId).then((addr) => {
          if (addr) {
            const a = Array.isArray(addr) ? addr[0] : addr;
            const fullAddr = a.shippingAddress || a.address || '';
            if (fullAddr && !address) {
              setAddress(fullAddr);
              const parts = fullAddr.split(',').map((p) => p.trim());
              if (parts.length >= 2 && !city) setCity(parts[1]);
              if (parts.length >= 3 && !state) setState(parts[2]);
              const pinMatch = fullAddr.match(/\b\d{6}\b/);
              if (pinMatch && !pinCode) setPinCode(pinMatch[0]);
            }
          }
        }).catch(() => {});
      }
    }
  }, [user]);

  // Payment Selection: Defaults to Cashfree Sandbox Gateway
  const [paymentMethod, setPaymentMethod] = useState('Cashfree Sandbox'); // 'Cashfree Sandbox' | 'UPI' | 'Card' | 'Net Banking' | 'QR' | 'Manual Payment' | 'Cash on Delivery'
  
  // Specific Payment Inputs
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardStep, setCardStep] = useState('details'); // 'details' | 'otp'
  const [cardOtp, setCardOtp] = useState('');
  
  const [bankName, setBankName] = useState('HDFC Bank');
  const [nbUsername, setNbUsername] = useState('');
  const [nbPassword, setNbPassword] = useState('');
  const [showNbPassword, setShowNbPassword] = useState(false);
  const [nbOtp, setNbOtp] = useState('');
  const [nbStep, setNbStep] = useState('login'); // 'login' | 'otp'

  const [utrNumber, setUtrNumber] = useState('');
  const [manualAmount, setManualAmount] = useState(() => Math.max(0, total + Math.round(total * 0.18)));
  const [remarks, setRemarks] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);

  const [qrDisplayMode, setQrDisplayMode] = useState('global'); // 'global' | 'order' | 'orderCode'
  const [qrData, setQrData] = useState(null);

  const [orderSuccessPlaced, setOrderSuccessPlaced] = useState(false);

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMsg, setCouponMsg] = useState({ type: '', text: '' });
  const [paymentMessage, setPaymentMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const taxAmt = Math.round(total * 0.18);
    setManualAmount(Math.max(0, total + taxAmt - discountAmount));
  }, [total, discountAmount]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponApplying(true);
    setCouponMsg({ type: '', text: '' });
    try {
      const res = await couponService.applyCoupon(couponCodeInput, total);
      if (res.valid) {
        setAppliedCoupon(res.coupon || { code: res.code });
        setDiscountAmount(res.discountAmount || 0);
        setCouponMsg({ type: 'success', text: res.message || `Coupon "${res.code}" applied!` });
      }
    } catch (err) {
      setCouponMsg({ type: 'error', text: err.message || 'Invalid or expired coupon code.' });
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput('');
    setCouponMsg({ type: 'info', text: 'Coupon removed.' });
  };

  if (!priceVisibility) return <Navigate to="/cart" replace />;
  if (!items.length && !orderSuccessPlaced) return <Navigate to="/cart" replace />;

  const currentOrderId = `ORD-${Date.now()}`;

  // Fetch QR Code data
  const handleFetchQr = async (mode) => {
    setQrDisplayMode(mode);
    setPaymentMessage({ type: 'info', text: 'Fetching QR payload from server...' });
    let res;
    if (mode === 'global') {
      res = await getQrCode();
    } else if (mode === 'order') {
      res = await getQrByOrderId(currentOrderId);
    } else if (mode === 'orderCode') {
      res = await getQrCodeByOrderId(currentOrderId);
    }
    if (res && res.success !== false) {
      setQrData(res);
      setPaymentMessage({ type: 'success', text: 'QR details loaded from server.' });
    } else {
      setPaymentMessage({ type: 'error', text: res?.message || 'Failed to fetch QR details.' });
    }
  };

  // Submit Main Payment Flow
  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    // Prevent duplicate clicks
    if (submitting) return;

    const nameErr = validateName(customerName, 'Customer name');
    if (nameErr) {
      setPaymentMessage({ type: 'error', text: nameErr });
      return;
    }
    const phoneErr = validatePhone(mobile);
    if (phoneErr) {
      setPaymentMessage({ type: 'error', text: phoneErr });
      return;
    }
    if (email) {
      const emailErr = validateEmail(email);
      if (emailErr) {
        setPaymentMessage({ type: 'error', text: emailErr });
        return;
      }
    }
    if (!address.trim()) {
      setPaymentMessage({ type: 'error', text: 'Delivery address is required.' });
      return;
    }
    if (!city.trim()) {
      setPaymentMessage({ type: 'error', text: 'City is required.' });
      return;
    }
    if (!state.trim()) {
      setPaymentMessage({ type: 'error', text: 'State is required.' });
      return;
    }
    if (!pinCode.trim() || !/^\d{6}$/.test(pinCode.trim())) {
      setPaymentMessage({ type: 'error', text: 'Please enter a valid 6-digit PIN code.' });
      return;
    }

    setSubmitting(true);
    setPaymentMessage({ type: 'info', text: 'Preparing order details...' });

    const activeCustId = user?.customerId || user?.id || localStorage.getItem('customerId');
    const taxAmount = Math.round(total * 0.18);
    const grandTotal = Math.max(0, total + taxAmount - discountAmount);

    try {
      // ----------------------------------------------------------------------
      // 0. CASHFREE SANDBOX CHECKOUT GATEWAY (OFFICIAL HOSTED CHECKOUT)
      // ----------------------------------------------------------------------
      if (paymentMethod === 'Cashfree Sandbox' || paymentMethod === 'Cashfree') {
        let createdOrder = null;
        try {
          createdOrder = await orderService.create({
            orderNumber: currentOrderId,
            customerId: activeCustId ? Number(activeCustId) : undefined,
            customerName: customerName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pinCode: pinCode.trim(),
            totalAmount: total,
            gstAmount: taxAmount,
            discountAmount: discountAmount,
            finalAmount: grandTotal,
            paymentMethod: 'Cashfree',
            paymentStatus: 'Pending',
            status: 'Processing',
            items
          });
        } catch (e) {
          setPaymentMessage({ type: 'error', text: `Failed to record order: ${e.message}. Your cart is preserved.` });
          setSubmitting(false);
          return;
        }

        const orderIdParam = String(createdOrder?.id || createdOrder?.orderNumber || currentOrderId);
        const returnUrl = `${window.location.origin}/order-success?order_id={order_id}`;

        setPaymentMessage({ type: 'info', text: 'Initializing Cashfree Sandbox session...' });

        const cfRes = await createCashfreeOrder({
          orderId: orderIdParam,
          returnUrl,
          customerEmail: email.trim() || undefined,
          customerPhone: mobile.trim() || undefined,
          idempotencyKey: `cf_${orderIdParam}_${Date.now()}`
        });

        if (!cfRes || !cfRes.success || !cfRes.paymentSessionId) {
          setPaymentMessage({
            type: 'error',
            text: cfRes?.message || 'Could not establish Cashfree payment session. Please retry or choose another method.'
          });
          setSubmitting(false);
          return;
        }

        setPaymentMessage({ type: 'info', text: 'Launching Cashfree Sandbox checkout...' });

        const checkoutResult = await launchCashfreeCheckout({
          paymentSessionId: cfRes.paymentSessionId,
          redirectTarget: '_modal',
          returnUrl
        });

        if (checkoutResult.status === 'CANCELLED') {
          setPaymentMessage({
            type: 'error',
            text: 'Cashfree checkout was closed or cancelled. You can retry payment whenever ready.'
          });
          setSubmitting(false);
          return;
        }

        if (checkoutResult.status === 'ERROR') {
          setPaymentMessage({
            type: 'error',
            text: checkoutResult.message || 'Payment error during checkout. Your cart is preserved.'
          });
          setSubmitting(false);
          return;
        }

        if (checkoutResult.status === 'REDIRECTED') {
          // Cashfree has redirected the browser window to bank 3DS
          return;
        }

        // Verify with backend independently
        setPaymentMessage({ type: 'info', text: 'Verifying payment with backend...' });
        const verifyRes = await getCashfreeOrderDetails(orderIdParam);
        const resolvedRef = String(createdOrder?.orderNumber || createdOrder?.id || currentOrderId);

        const isPaid = verifyRes?.success && (verifyRes.status === 'Paid' || verifyRes.status === 'Success');
        setOrderSuccessPlaced(true);
        clearCart();

        if (isPaid) {
          setPaymentMessage({ type: 'success', text: 'Cashfree payment verified! Order placed successfully.' });
          setTimeout(() => {
            navigate('/order-success', {
              state: {
                reference: resolvedRef,
                order: createdOrder,
                status: 'Paid',
                gateway: 'Cashfree'
              }
            });
          }, 600);
        } else {
          setPaymentMessage({ type: 'info', text: 'Order submitted. Payment status is being processed.' });
          setTimeout(() => {
            navigate('/order-success', {
              state: {
                reference: resolvedRef,
                order: createdOrder,
                status: verifyRes?.status || 'Pending Verification',
                gateway: 'Cashfree'
              }
            });
          }, 600);
        }
        return;
      }

      // ----------------------------------------------------------------------
      // 1. MANUAL VERIFICATION FLOW
      // ----------------------------------------------------------------------
      if (paymentMethod === 'Manual Payment') {
        const amt = Number(manualAmount || grandTotal);
        if (!amt || amt <= 0) {
          setPaymentMessage({ type: 'error', text: 'Amount Paid must be greater than zero.' });
          setSubmitting(false);
          return;
        }
        if (!utrNumber.trim()) {
          setPaymentMessage({ type: 'error', text: 'Please enter the 12-digit UTR or Reference Number.' });
          setSubmitting(false);
          return;
        }

        let resolvedOrderRef = currentOrderId;
        let createdOrder = null;
        try {
          createdOrder = await orderService.create({
            orderNumber: currentOrderId,
            customerId: activeCustId ? Number(activeCustId) : undefined,
            customerName: customerName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pinCode: pinCode.trim(),
            totalAmount: total,
            gstAmount: taxAmount,
            discountAmount: discountAmount,
            finalAmount: grandTotal,
            paymentMethod: 'Manual Payment',
            paymentStatus: 'Verification Pending',
            status: 'Processing',
            items
          });
          if (createdOrder && (createdOrder.orderNumber || createdOrder.id)) {
            resolvedOrderRef = String(createdOrder.orderNumber || createdOrder.id);
          }
        } catch (e) {
          setPaymentMessage({ type: 'error', text: `Failed to create order: ${e.message}. Your cart is preserved.` });
          setSubmitting(false);
          return;
        }

        const fd = new FormData();
        fd.append('AmountPaid', amt);
        fd.append('OrderId', resolvedOrderRef);
        fd.append('CustomerName', customerName);
        fd.append('MobileNumber', mobile);
        fd.append('Remarks', `${remarks || 'Manual Bank Transfer Verification'} [GST-INCL]`);
        fd.append('PaymentTime', new Date().toLocaleTimeString());
        fd.append('PaymentDate', new Date().toISOString().slice(0, 10));
        fd.append('UtrNumber', utrNumber.trim());
        if (screenshotFile) {
          fd.append('Screenshot', screenshotFile);
        }

        const res = await submitManualVerification(fd);
        if (res && res.success !== false) {
          setOrderSuccessPlaced(true);
          clearCart();
          setPaymentMessage({ type: 'success', text: res.message || 'Manual payment submitted for verification!' });
          setTimeout(() => {
            navigate('/order-success', { state: { reference: resolvedOrderRef, order: createdOrder, status: 'Verification Pending' } });
          }, 600);
        } else {
          setPaymentMessage({ type: 'error', text: res?.message || 'Manual verification failed.' });
          setSubmitting(false);
        }
        return;
      }

      // ----------------------------------------------------------------------
      // 2. NETBANKING LOGIN & OTP FLOW
      // ----------------------------------------------------------------------
      if (paymentMethod === 'Net Banking') {
        if (nbStep === 'login') {
          const loginRes = await netbankingLogin({
            bankName,
            username: nbUsername,
            password: nbPassword,
            orderId: currentOrderId,
            amount: grandTotal
          });
          if (loginRes && loginRes.success !== false) {
            const txnId = loginRes.transactionId || `TXN-NB-${Date.now()}`;
            setActiveTransactionId(txnId);
            setNbStep('otp');
            setPaymentMessage({ type: 'info', text: 'Netbanking login successful. Please enter the OTP sent to your registered mobile (Test OTP: 123456).' });
            setSubmitting(false);
          } else {
            setPaymentMessage({ type: 'error', text: loginRes?.message || 'Netbanking login failed.' });
            setSubmitting(false);
          }
          return;
        } else if (nbStep === 'otp') {
          if (!nbOtp) {
            setPaymentMessage({ type: 'error', text: 'Please enter the OTP.' });
            setSubmitting(false);
            return;
          }
          const otpRes = await netbankingVerifyOtp({
            transactionId: activeTransactionId,
            otp: nbOtp,
            orderId: currentOrderId
          });
          if (otpRes && otpRes.success !== false) {
            const compRes = await completePayment(activeTransactionId);
            if (compRes && compRes.success !== false) {
              let createdOrder = null;
              try {
                createdOrder = await orderService.create({
                  orderNumber: currentOrderId,
                  customerId: activeCustId ? Number(activeCustId) : undefined,
                  customerName: customerName.trim(),
                  email: email.trim(),
                  mobile: mobile.trim(),
                  address: address.trim(),
                  city: city.trim(),
                  state: state.trim(),
                  pinCode: pinCode.trim(),
                  totalAmount: total,
                  gstAmount: taxAmount,
                  discountAmount: discountAmount,
                  finalAmount: grandTotal,
                  paymentMethod: 'Net Banking',
                  paymentStatus: 'Paid',
                  status: 'Processing',
                  items
                });
              } catch (e) {
                setPaymentMessage({ type: 'error', text: `Payment completed, but order record failed: ${e.message}.` });
                setSubmitting(false);
                return;
              }

              const resolvedOrderRef = String(createdOrder?.orderNumber || createdOrder?.id || currentOrderId);
              setOrderSuccessPlaced(true);
              clearCart();
              setPaymentMessage({ type: 'success', text: 'Netbanking payment completed successfully!' });
              setTimeout(() => {
                navigate('/order-success', { state: { reference: resolvedOrderRef, order: createdOrder, status: 'Paid' } });
              }, 600);
            } else {
              setPaymentMessage({ type: 'error', text: compRes?.message || 'Transaction completion failed.' });
              setSubmitting(false);
            }
          } else {
            setPaymentMessage({ type: 'error', text: otpRes?.message || 'OTP verification failed.' });
            setSubmitting(false);
          }
          return;
        }
      }

      // ----------------------------------------------------------------------
      // 3. CARD PAYMENT WITH OTP VERIFICATION FLOW
      // ----------------------------------------------------------------------
      if (paymentMethod === 'Card') {
        if (cardStep === 'details') {
          if (!cardNumber || cardNumber.replace(/\s+/g, '').length < 16) {
            setPaymentMessage({ type: 'error', text: 'A valid 16-digit Card Number is required.' });
            setSubmitting(false);
            return;
          }
          if (!expiryDate || !expiryDate.includes('/')) {
            setPaymentMessage({ type: 'error', text: 'A valid Expiry Date (MM/YY) is required.' });
            setSubmitting(false);
            return;
          }
          if (!cvv || cvv.length < 3) {
            setPaymentMessage({ type: 'error', text: 'A valid 3-digit CVV is required.' });
            setSubmitting(false);
            return;
          }

          const initPayload = {
            paymentMethod: 'DebitCard',
            amount: grandTotal,
            orderId: currentOrderId,
            cardNumber,
            nameOnCard: nameOnCard || customerName,
            expiryDate,
            cvv,
            bankName: 'HDFC Bank'
          };

          const initRes = await initiatePayment(initPayload);
          if (initRes && initRes.success !== false) {
            const txnId = initRes.transactionId || `TXN-CARD-${Date.now()}`;
            setActiveTransactionId(txnId);
            setCardStep('otp');
            setPaymentMessage({ type: 'info', text: 'Card authorized. Please enter 3DS OTP (Test OTP: 123456 or 000000).' });
            setSubmitting(false);
          } else {
            setPaymentMessage({ type: 'error', text: initRes?.message || 'Card payment authorization failed.' });
            setSubmitting(false);
          }
          return;
        } else if (cardStep === 'otp') {
          if (!cardOtp) {
            setPaymentMessage({ type: 'error', text: 'Please enter the 3DS OTP.' });
            setSubmitting(false);
            return;
          }

          const otpRes = await cardVerifyOtp({
            transactionId: activeTransactionId,
            otp: cardOtp
          });

          if (otpRes && otpRes.success !== false) {
            const compRes = await completePayment(activeTransactionId);
            if (compRes && compRes.success !== false) {
              let createdOrder = null;
              try {
                createdOrder = await orderService.create({
                  orderNumber: currentOrderId,
                  customerId: activeCustId ? Number(activeCustId) : undefined,
                  customerName: customerName.trim(),
                  email: email.trim(),
                  mobile: mobile.trim(),
                  address: address.trim(),
                  city: city.trim(),
                  state: state.trim(),
                  pinCode: pinCode.trim(),
                  totalAmount: total,
                  gstAmount: taxAmount,
                  discountAmount: discountAmount,
                  finalAmount: grandTotal,
                  paymentMethod: 'Card',
                  paymentStatus: 'Paid',
                  status: 'Processing',
                  items
                });
              } catch (e) {
                setPaymentMessage({ type: 'error', text: `Payment authorized, but recording order failed: ${e.message}.` });
                setSubmitting(false);
                return;
              }

              const resolvedOrderRef = String(createdOrder?.orderNumber || createdOrder?.id || currentOrderId);
              setOrderSuccessPlaced(true);
              clearCart();
              setPaymentMessage({ type: 'success', text: 'Card payment verified & order placed!' });
              setTimeout(() => {
                navigate('/order-success', { state: { reference: resolvedOrderRef, order: createdOrder, status: 'Paid' } });
              }, 600);
            } else {
              setPaymentMessage({ type: 'error', text: compRes?.message || 'Payment completion check failed.' });
              setSubmitting(false);
            }
          } else {
            setPaymentMessage({ type: 'error', text: otpRes?.message || 'Card OTP verification failed.' });
            setSubmitting(false);
          }
          return;
        }
      }

      // ----------------------------------------------------------------------
      // 4. CASH ON DELIVERY FLOW (DIRECT PLACEMENT)
      // ----------------------------------------------------------------------
      if (paymentMethod === 'Cash on Delivery') {
        let createdOrder = null;
        try {
          createdOrder = await orderService.create({
            orderNumber: currentOrderId,
            customerId: activeCustId ? Number(activeCustId) : undefined,
            customerName: customerName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pinCode: pinCode.trim(),
            totalAmount: total,
            gstAmount: taxAmount,
            discountAmount: discountAmount,
            finalAmount: grandTotal,
            paymentMethod: 'Cash on Delivery',
            paymentStatus: 'Pending',
            status: 'Processing',
            items
          });
        } catch (orderErr) {
          setPaymentMessage({ type: 'error', text: `Failed to place order: ${orderErr.message}. Your cart is preserved.` });
          setSubmitting(false);
          return;
        }

        const resolvedOrderRef = String(createdOrder?.orderNumber || createdOrder?.id || currentOrderId);
        setOrderSuccessPlaced(true);
        clearCart();
        setPaymentMessage({ type: 'success', text: 'Order placed successfully with Cash on Delivery!' });
        setTimeout(() => {
          navigate('/order-success', { state: { reference: resolvedOrderRef, order: createdOrder, status: 'Success' } });
        }, 600);
        return;
      }

      // ----------------------------------------------------------------------
      // 5. DIRECT UPI / QR CODE FLOW
      // ----------------------------------------------------------------------
      const initPayload = {
        paymentMethod: paymentMethod === 'QR' ? 'QRPayment' : paymentMethod,
        amount: grandTotal,
        orderId: currentOrderId,
        upiId: paymentMethod === 'UPI' ? upiId : undefined,
      };

      const initRes = await initiatePayment(initPayload);
      if (initRes && initRes.success !== false) {
        const txnId = initRes.transactionId || `TXN-${Date.now()}`;
        setActiveTransactionId(txnId);

        // Check payment status
        await getPaymentStatus(txnId);

        // Call Complete Payment with real transaction ID
        const compRes = await completePayment(txnId);
        if (compRes && compRes.success !== false) {
          let createdOrder = null;
          try {
            createdOrder = await orderService.create({
              orderNumber: currentOrderId,
              customerId: activeCustId ? Number(activeCustId) : undefined,
              customerName: customerName.trim(),
              email: email.trim(),
              mobile: mobile.trim(),
              address: address.trim(),
              city: city.trim(),
              state: state.trim(),
              pinCode: pinCode.trim(),
              totalAmount: total,
              gstAmount: taxAmount,
              discountAmount: discountAmount,
              finalAmount: grandTotal,
              paymentMethod,
              paymentStatus: 'Verified',
              status: 'Processing',
              items
            });
          } catch (orderErr) {
            setPaymentMessage({ type: 'error', text: `Payment processed, but order record failed: ${orderErr.message}.` });
            setSubmitting(false);
            return;
          }

          const resolvedOrderRef = String(createdOrder?.orderNumber || createdOrder?.id || currentOrderId);
          setOrderSuccessPlaced(true);
          clearCart();
          setPaymentMessage({ type: 'success', text: compRes.message || 'Payment processed and order submitted successfully!' });
          setTimeout(() => {
            navigate('/order-success', { state: { reference: resolvedOrderRef, order: createdOrder, status: initRes.paymentStatus || 'Success' } });
          }, 600);
        } else {
          setPaymentMessage({ type: 'error', text: compRes?.message || 'Transaction completion check failed.' });
          setSubmitting(false);
        }
      } else {
        setPaymentMessage({ type: 'error', text: initRes?.message || 'Payment initiation failed.' });
        setSubmitting(false);
      }
    } catch (err) {
      setPaymentMessage({ type: 'error', text: err.message || 'Network error processing payment.' });
      setSubmitting(false);
    }
  };

  return (
    <section className="checkout-page">
      <div className="container">
        <div className="checkout-head">
          <Link to="/cart"><ArrowLeft /> Back to cart</Link>
          <span><LockKeyhole /> Secure Payment Checkout</span>
        </div>

        <div className="checkout-layout">
          <div>
            <p className="eyebrow dark">CHECKOUT</p>
            <h1>Contact &amp; Delivery Details</h1>

            {paymentMessage.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '600',
                background: paymentMessage.type === 'error' ? '#fef2f2' : paymentMessage.type === 'success' ? '#ecfdf5' : '#eff6ff',
                color: paymentMessage.type === 'error' ? '#991b1b' : paymentMessage.type === 'success' ? '#065f46' : '#1e40af',
                border: `1px solid ${paymentMessage.type === 'error' ? '#fca5a5' : paymentMessage.type === 'success' ? '#6ee7b7' : '#93c5fd'}`
              }}>
                {paymentMessage.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
                <span>{paymentMessage.text}</span>
              </div>
            )}

            <form id="checkout-form" className="form-grid checkout-form" onSubmit={handlePaymentSubmit}>
              <label className="field full">
                <span>Customer Name *</span>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" />
              </label>

              <label className="field">
                <span>Mobile *</span>
                <input required inputMode="numeric" maxLength="10" pattern="[6-9][0-9]{9}" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
              </label>

              <label className="field">
                <span>Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" />
              </label>

              <label className="field full">
                <span>Delivery / Project Address *</span>
                <textarea required rows="2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Complete shipping address" />
              </label>

              <label className="field">
                <span>City *</span>
                <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </label>

              <label className="field">
                <span>State *</span>
                <input required value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
              </label>

              <label className="field">
                <span>PIN Code *</span>
                <input required inputMode="numeric" pattern="[0-9]{6}" value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="6-digit PIN" />
              </label>

              {/* PAYMENT METHOD SELECTION */}
              <div className="field full" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p className="eyebrow dark" style={{ margin: 0 }}>PAYMENT METHOD</p>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={13} /> 256-Bit SSL Encrypted
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { id: 'Cashfree Sandbox', label: 'Cashfree Sandbox', badge: 'Recommended' },
                    { id: 'UPI', label: 'UPI / VPA' },
                    { id: 'Card', label: 'Credit / Debit Card' },
                    { id: 'Net Banking', label: 'Net Banking' },
                    { id: 'QR', label: 'QR Code' },
                    { id: 'Manual Payment', label: 'Direct Bank Transfer' },
                    { id: 'Cash on Delivery', label: 'Cash on Delivery' }
                  ].map(({ id, label, badge }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(id);
                        setNbStep('login');
                        setCardStep('details');
                        setPaymentMessage({ type: '', text: '' });
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: paymentMethod === id ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: paymentMethod === id ? '#ecfdf5' : '#ffffff',
                        color: paymentMethod === id ? '#047857' : '#334155',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                    >
                      {label}
                      {badge && (
                        <span style={{
                          display: 'block',
                          fontSize: '9px',
                          color: paymentMethod === id ? '#047857' : '#0284c7',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          marginTop: '2px'
                        }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* CASHFREE SANDBOX GATEWAY (PHASE 4) */}
                {paymentMethod === 'Cashfree Sandbox' && (
                  <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', color: '#166534' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <ShieldCheck size={20} color="#16a34a" />
                      <strong style={{ fontSize: '14px', color: '#14532d' }}>Official Cashfree Sandbox Gateway</strong>
                    </div>
                    <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0, color: '#15803d' }}>
                      Pay securely using the official Cashfree Sandbox checkout. Supports UPI (Google Pay, PhonePe, Paytm, BHIM, QR), Credit &amp; Debit Cards (Visa, Mastercard, RuPay), Net Banking (HDFC, SBI, ICICI, Axis), and Wallets with verified test credentials.
                    </p>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: '#166534' }}>
                      <span style={{ background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>Test Cards Supported</span>
                      <span style={{ background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>Test UPI Apps</span>
                      <span style={{ background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>Net Banking Simulator</span>
                      <span style={{ background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>Zero Secret Exposure</span>
                    </div>
                  </div>
                )}

                {/* UPI DIRECT */}
                {paymentMethod === 'UPI' && (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Enter your UPI ID (VPA) *
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === 'UPI'}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. name@upi or phone@ybl"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}

                {/* CARD SIMULATOR */}
                {paymentMethod === 'Card' && (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {cardStep === 'details' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Cardholder Name *</label>
                          <input required type="text" value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)} placeholder="Name on Card" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Card Number *</label>
                          <input required type="text" maxLength="19" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4532 •••• •••• 8901" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Expiry (MM/YY) *</label>
                          <input required type="text" placeholder="12/28" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>CVV *</label>
                          <input required type="password" maxLength="4" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="•••" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#047857', fontWeight: '600', margin: 0 }}>Step 2: Enter 3DS Card OTP (Test OTP: 123456 or 000000)</p>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>OTP Code *</label>
                          <input required type="text" maxLength="6" value={cardOtp} onChange={(e) => setCardOtp(e.target.value)} placeholder="6-digit OTP" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* NET BANKING */}
                {paymentMethod === 'Net Banking' && (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {nbStep === 'login' ? (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Select Bank *</label>
                          <select value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <option value="HDFC Bank">HDFC Bank</option>
                            <option value="State Bank of India">State Bank of India</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Net Banking User ID *</label>
                          <input required type="text" value={nbUsername} onChange={(e) => setNbUsername(e.target.value)} placeholder="User ID / Customer ID" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Password *</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                              required 
                              type={showNbPassword ? 'text' : 'password'} 
                              value={nbPassword} 
                              onChange={(e) => setNbPassword(e.target.value)} 
                              placeholder="Password" 
                              style={{ width: '100%', padding: '8px 38px 8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowNbPassword(!showNbPassword)}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                              }}
                              title={showNbPassword ? 'Hide password' : 'Show password'}
                              aria-label={showNbPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                            >
                              {showNbPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#047857', fontWeight: '600' }}>Step 2: Enter Netbanking OTP (Test OTP: 123456)</p>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>OTP Code *</label>
                          <input required type="text" maxLength="6" value={nbOtp} onChange={(e) => setNbOtp(e.target.value)} placeholder="6-digit OTP" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* QR CODE DISPLAY */}
                {paymentMethod === 'QR' && (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '10px' }}>Scan QR Code with any UPI App</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
                      <button type="button" onClick={() => handleFetchQr('global')} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', background: qrDisplayMode === 'global' ? '#059669' : '#e2e8f0', color: qrDisplayMode === 'global' ? '#fff' : '#334155', border: 'none', cursor: 'pointer' }}>Global QR</button>
                      <button type="button" onClick={() => handleFetchQr('order')} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', background: qrDisplayMode === 'order' ? '#059669' : '#e2e8f0', color: qrDisplayMode === 'order' ? '#fff' : '#334155', border: 'none', cursor: 'pointer' }}>Order QR</button>
                      <button type="button" onClick={() => handleFetchQr('orderCode')} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', background: qrDisplayMode === 'orderCode' ? '#059669' : '#e2e8f0', color: qrDisplayMode === 'orderCode' ? '#fff' : '#334155', border: 'none', cursor: 'pointer' }}>Order QR Code</button>
                    </div>
                    {qrData && (
                      <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'inline-block' }}>
                        {qrData.qrImageUrl ? (
                          <img src={qrData.qrImageUrl} alt="Payment QR" style={{ width: '160px', height: '160px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ padding: '10px', fontSize: '12px', wordBreak: 'break-all', maxWidth: '240px' }}>
                            <strong>QR Payload:</strong>
                            <p style={{ color: '#059669', fontSize: '11px', marginTop: '4px' }}>{qrData.qrPayload || qrData.upiDeepLink || 'UPI Payment QR'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MANUAL DIRECT BANK TRANSFER */}
                {paymentMethod === 'Manual Payment' && (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>UTR / Reference Number *</label>
                      <input required type="text" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} placeholder="12-digit UTR Number" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Amount Paid (₹) *</label>
                      <input required type="number" min="1" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Payment Screenshot</label>
                      <input type="file" accept="image/*" onChange={(e) => setScreenshotFile(e.target.files[0])} style={{ width: '100%', fontSize: '12px' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Remarks</label>
                      <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Bank transfer notes" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                )}

                {/* CASH ON DELIVERY */}
                {paymentMethod === 'Cash on Delivery' && (
                  <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '8px', border: '1px solid #6ee7b7', color: '#047857', fontSize: '13px', fontWeight: '600' }}>
                    <ShieldCheck size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Pay cash upon delivery at your designated address.
                  </div>
                )}
              </div>
            </form>
          </div>

          <aside className="order-summary">
            <p className="eyebrow dark">YOUR SELECTION</p>
            <div className="checkout-products">
              {items.map((item) => (
                <div key={item.id}>
                  <img
                    src={(!item.image || String(item.image).toLowerCase().includes('placeholder')) ? '/honeywell-products-logo.png' : item.image}
                    alt={item.name || ''}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/honeywell-products-logo.png';
                    }}
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>Qty {item.quantity} × {item.priceLabel}</small>
                  </span>
                  <b>{formatPrice((item.price || 0) * item.quantity)}</b>
                </div>
              ))}
            </div>

            <hr style={{ margin: '12px 0 16px' }} />

            {(() => {
              const taxAmount = Math.round(total * 0.18);
              const cgst = total * 0.09;
              const sgst = total * 0.09;
              const grandTotal = Math.max(0, total + taxAmount - discountAmount);

              const cgstDisplay = Number.isInteger(cgst)
                ? `₹${cgst.toLocaleString('en-IN')}`
                : `₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
              const sgstDisplay = Number.isInteger(sgst)
                ? `₹${sgst.toLocaleString('en-IN')}`
                : `₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;

              return (
                <>
                  <div className="summary-row">
                    <span className="row-label">ITEM SUBTOTAL</span>
                    <strong className="row-value">{formatPrice(total)}</strong>
                  </div>

                  <div className="summary-row" style={{ position: 'relative' }} ref={popoverRef}>
                    <span className="row-label">
                      ESTIMATED TAX (18%)
                      <button
                        type="button"
                        className="info-tax-btn"
                        onClick={() => setShowTaxBreakdown((prev) => !prev)}
                        title="Click to view tax breakdown"
                        aria-label="Tax breakdown info"
                      >
                        <Info size={11} />
                      </button>
                    </span>
                    <strong className="row-value">{formatPrice(taxAmount)}</strong>

                    {showTaxBreakdown && (
                      <div className="tax-popover-card">
                        <div className="tax-popover-title">TAX BREAKDOWN</div>
                        <div className="tax-popover-row">
                          <span>TAXABLE AMOUNT</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                        <div className="tax-popover-row">
                          <span>CGST (9%)</span>
                          <span>{cgstDisplay}</span>
                        </div>
                        <div className="tax-popover-row">
                          <span>SGST (9%)</span>
                          <span>{sgstDisplay}</span>
                        </div>
                        <div className="tax-popover-divider" />
                        <div className="tax-popover-total">
                          <span>TOTAL GST</span>
                          <span>{formatPrice(taxAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="summary-row">
                    <span className="row-label">DELIVERY CHARGES</span>
                    <strong className="row-value delivery-free-badge">Free</strong>
                  </div>

                  {/* Coupon Code Section */}
                  {appliedCoupon ? (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginTop: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={16} color="#16a34a" />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {appliedCoupon.code} APPLIED
                          </div>
                          <div style={{ fontSize: '11px', color: '#15803d' }}>
                            Saved {formatPrice(discountAmount)} on this order
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Remove Coupon"
                      >
                        <X size={12} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Promo / Coupon Code</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Enter code (e.g. WELCOME10)"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponApplying || !couponCodeInput.trim()}
                          style={{ padding: '6px 12px', fontSize: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {couponApplying ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                      {couponMsg.text && (
                        <div style={{ fontSize: '11px', marginTop: '4px', color: couponMsg.type === 'error' ? '#ef4444' : (couponMsg.type === 'info' ? '#64748b' : '#16a34a'), fontWeight: 500 }}>
                          {couponMsg.text}
                        </div>
                      )}
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="summary-row" style={{ color: '#16a34a' }}>
                      <span className="row-label" style={{ color: '#16a34a' }}>COUPON DISCOUNT ({appliedCoupon?.code})</span>
                      <strong className="row-value" style={{ color: '#16a34a' }}>- {formatPrice(discountAmount)}</strong>
                    </div>
                  )}

                  <hr />

                  <div className="summary-total">
                    <span>TOTAL AMOUNT</span>
                    <strong>{formatPrice(grandTotal)}</strong>
                  </div>
                </>
              );
            })()}
            <button className="button" form="checkout-form" disabled={submitting}>
              {submitting ? 'Processing Payment…' : <>Complete {paymentMethod === 'Cashfree Sandbox' ? 'Cashfree' : paymentMethod} Order <ArrowRight /></>}
            </button>
            <p>Order and payment details are processed securely with the backend API.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
