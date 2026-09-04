import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, CreditCard, QrCode, ShieldCheck, Check, AlertCircle, Upload } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  initiatePayment,
  netbankingLogin,
  netbankingVerifyOtp,
  getPaymentStatus,
  completePayment,
  getQrCode,
  getQrByOrderId,
  getQrCodeByOrderId,
  submitManualVerification
} from '../services/paymentService';

import { couponService } from '../services/couponService';
import { orderService } from '../services/orderService';

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

export default function Checkout() {
  useDocumentTitle('Checkout', 'Submit contact and payment details for products selected in the cart.');
  const { items, count, total, clearCart } = useCart();
  const navigate = useNavigate();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'Card' | 'Net Banking' | 'QR' | 'Manual Payment' | 'Cash on Delivery'
  
  // Specific Payment Inputs
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [bankName, setBankName] = useState('HDFC Bank');
  const [nbUsername, setNbUsername] = useState('');
  const [nbPassword, setNbPassword] = useState('');
  const [nbOtp, setNbOtp] = useState('');
  const [nbStep, setNbStep] = useState('login'); // 'login' | 'otp'

  const [utrNumber, setUtrNumber] = useState('');
  const [manualAmount, setManualAmount] = useState(total);
  const [remarks, setRemarks] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);

  const [qrDisplayMode, setQrDisplayMode] = useState('global'); // 'global' | 'order' | 'orderCode'
  const [qrData, setQrData] = useState(null);

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMsg, setCouponMsg] = useState({ type: '', text: '' });
  const [paymentMessage, setPaymentMessage] = useState({ type: '', text: '' });

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

  if (!items.length) return <Navigate to="/cart" replace />;

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
    setSubmitting(true);
    setPaymentMessage({ type: 'info', text: 'Processing payment request...' });

    try {
      // 1. MANUAL VERIFICATION FLOW
      if (paymentMethod === 'Manual Payment') {
        const amt = Number(manualAmount || total);
        if (!amt || amt <= 0) {
          setPaymentMessage({ type: 'error', text: 'Amount Paid must be greater than zero.' });
          setSubmitting(false);
          return;
        }

        const fd = new FormData();
        fd.append('AmountPaid', amt);
        fd.append('OrderId', currentOrderId);
        fd.append('CustomerName', customerName);
        fd.append('MobileNumber', mobile);
        fd.append('Remarks', remarks || 'Manual Payment Verification');
        fd.append('PaymentTime', new Date().toLocaleTimeString());
        fd.append('PaymentDate', new Date().toISOString().slice(0, 10));
        fd.append('UtrNumber', utrNumber);
        if (screenshotFile) {
          fd.append('Screenshot', screenshotFile);
        }

        const res = await submitManualVerification(fd);
        if (res && res.success !== false) {
          setPaymentMessage({ type: 'success', text: res.message || 'Manual payment submitted for verification!' });
          setTimeout(() => {
            clearCart();
            navigate('/order-success', { state: { reference: currentOrderId, status: 'Verification Pending' } });
          }, 1200);
        } else {
          setPaymentMessage({ type: 'error', text: res?.message || 'Manual verification failed.' });
          setSubmitting(false);
        }
        return;
      }

      // 2. NETBANKING LOGIN & OTP FLOW
      if (paymentMethod === 'Net Banking') {
        if (nbStep === 'login') {
          const loginRes = await netbankingLogin({
            bankName,
            username: nbUsername,
            password: nbPassword,
            orderId: currentOrderId,
            amount: total
          });
          if (loginRes && loginRes.success !== false) {
            const txnId = loginRes.transactionId || `TXN-NB-${Date.now()}`;
            setActiveTransactionId(txnId);
            setNbStep('otp');
            setPaymentMessage({ type: 'info', text: 'Netbanking login successful. Please enter the OTP sent to your registered mobile.' });
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
            // Complete transaction
            const compRes = await completePayment(activeTransactionId);
            if (compRes && compRes.success !== false) {
              setPaymentMessage({ type: 'success', text: 'Netbanking payment completed successfully!' });
              setTimeout(() => {
                clearCart();
                navigate('/order-success', { state: { reference: currentOrderId, status: 'Paid' } });
              }, 1200);
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

      // 3. INITIATE PAYMENT (UPI, Card, QR, COD)
      const initPayload = {
        paymentMethod,
        amount: total,
        orderId: currentOrderId,
        upiId: paymentMethod === 'UPI' ? upiId : undefined,
        cardNumber: paymentMethod === 'Card' ? cardNumber : undefined,
        nameOnCard: paymentMethod === 'Card' ? nameOnCard : undefined,
        expiryDate: paymentMethod === 'Card' ? expiryDate : undefined,
        cvv: paymentMethod === 'Card' ? cvv : undefined,
        bankName: paymentMethod === 'Card' ? bankName : undefined
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
          // Post order live to POST /api/orders
          try {
            await orderService.create({
              orderNumber: currentOrderId,
              customerName,
              email,
              mobile,
              address,
              city,
              state,
              pinCode,
              totalAmount: Math.max(0, total - discountAmount),
              paymentMethod,
              paymentStatus: 'Verified',
              status: 'Processing',
              items
            });
          } catch (orderErr) {
            console.warn('Order creation note:', orderErr.message);
          }

          setPaymentMessage({ type: 'success', text: compRes.message || 'Payment processed and order submitted successfully!' });
          setTimeout(() => {
            clearCart();
            navigate('/order-success', { state: { reference: currentOrderId, status: initRes.paymentStatus || 'Success' } });
          }, 1200);
        } else {
          setPaymentMessage({ type: 'error', text: compRes?.message || 'Transaction completion check returned error.' });
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
            <h1>Contact & Delivery Details</h1>

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
                <p className="eyebrow dark" style={{ marginBottom: '8px' }}>PAYMENT METHOD</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {['UPI', 'Card', 'Net Banking', 'QR', 'Manual Payment', 'Cash on Delivery'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => { setPaymentMethod(method); setNbStep('login'); setPaymentMessage({ type: '', text: '' }); }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: paymentMethod === method ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: paymentMethod === method ? '#ecfdf5' : '#ffffff',
                        color: paymentMethod === method ? '#047857' : '#334155',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* METHOD SPECIFIC FIELDS */}
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

                {paymentMethod === 'Card' && (
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                )}

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
                          <input required type="password" value={nbPassword} onChange={(e) => setNbPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <p style={{ fontSize: '13px', color: '#047857', fontWeight: '600' }}>Step 2: Enter Netbanking OTP</p>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>OTP Code *</label>
                          <input required type="text" maxLength="6" value={nbOtp} onChange={(e) => setNbOtp(e.target.value)} placeholder="6-digit OTP" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                {paymentMethod === 'Cash on Delivery' && (
                  <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '8px', border: '1px solid #6ee7b7', color: '#047857', fontSize: '13px', fontWeight: '600' }}>
                    <ShieldCheck size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Pay cash upon delivery at your address.
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
            <hr />
            <div><span>Total units</span><strong>{count}</strong></div>
            <div><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>

            {/* Coupon Code Section */}
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
                <div style={{ fontSize: '11px', marginTop: '4px', color: couponMsg.type === 'error' ? '#ef4444' : '#16a34a', fontWeight: 500 }}>
                  {couponMsg.text}
                </div>
              )}
            </div>

            {discountAmount > 0 && (
              <div style={{ color: '#16a34a', fontWeight: 600 }}>
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <strong>- {formatPrice(discountAmount)}</strong>
              </div>
            )}

            <div className="summary-total">
              <span>Estimated total</span>
              <strong>{formatPrice(Math.max(0, total - discountAmount))}</strong>
            </div>
            <button className="button" form="checkout-form" disabled={submitting}>
              {submitting ? 'Processing Payment…' : <>Complete {paymentMethod} Order <ArrowRight /></>}
            </button>
            <p>Order and payment details are processed securely with the backend API.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

