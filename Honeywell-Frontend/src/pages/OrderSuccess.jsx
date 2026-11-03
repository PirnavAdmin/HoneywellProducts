import React, { useEffect, useState, useCallback } from 'react';
import { ArrowRight, Check, Package, Clock, ShieldCheck, AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { orderService } from '../services/orderService';
import { getCashfreeOrderDetails } from '../services/paymentService';

export default function OrderSuccess() {
  useDocumentTitle('Order Confirmation', 'Your purchase order has been recorded live on the server.');
  const { state } = useLocation();
  const [searchParams] = useSearchParams();

  // Extract reference from router state or query parameters (Cashfree redirect return_url)
  const queryOrderId =
    searchParams.get('order_id') ||
    searchParams.get('orderNumber') ||
    searchParams.get('orderNo') ||
    searchParams.get('reference') ||
    searchParams.get('cf_id') ||
    '';

  const orderRef = state?.reference || queryOrderId || '';

  const [orderDetails, setOrderDetails] = useState(state?.order || null);
  const [paymentStatus, setPaymentStatus] = useState(state?.status || 'Pending');
  const [cfTransaction, setCfTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const verifyOrderAndPayment = useCallback(async (isRefresh = false) => {
    if (!orderRef) return;

    if (isRefresh) {
      setRefreshing(true);
      setFeedbackMsg('');
    } else {
      setLoading(true);
    }

    try {
      // 1. Check Cashfree transaction on backend
      let resolvedOrderId = orderRef;
      try {
        const cfRes = await getCashfreeOrderDetails(orderRef);
        if (cfRes && cfRes.success) {
          setCfTransaction(cfRes);
          if (cfRes.status) {
            setPaymentStatus(cfRes.status);
          }
          if (cfRes.orderId || cfRes.orderNumber) {
            resolvedOrderId = cfRes.orderNumber || String(cfRes.orderId);
          }
        }
      } catch {
        // Non-Cashfree or unverified transaction
      }

      // 2. Fetch application order record
      const data = await orderService.getById(resolvedOrderId);
      if (data) {
        setOrderDetails(data);
        if (data.paymentStatus && (!cfTransaction || cfTransaction.status !== 'Success')) {
          setPaymentStatus(data.paymentStatus);
        }
      }

      if (isRefresh) {
        setFeedbackMsg('Payment status refreshed from server.');
      }
    } catch (err) {
      console.warn('Could not verify order details:', err);
      if (isRefresh) {
        setFeedbackMsg('Could not reach payment server. Please retry in a moment.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderRef]);

  useEffect(() => {
    if (orderRef) {
      verifyOrderAndPayment(false);
    }
  }, [orderRef, verifyOrderAndPayment]);

  // Status mapping
  const normalizedStatus = String(paymentStatus || '').trim().toLowerCase();
  const isPaid = ['paid', 'success', 'verified', 'verified paid', 'approved'].includes(normalizedStatus);
  const isFailed = ['failed', 'rejected', 'cancelled', 'canceled', 'declined'].includes(normalizedStatus);
  const isPending = !isPaid && !isFailed;

  const displayStatus = isPaid
    ? 'Verified Paid'
    : isFailed
      ? 'Payment Failed / Cancelled'
      : (paymentStatus || 'Pending Verification');

  const themeColor = isPaid ? '#059669' : isFailed ? '#dc2626' : '#d97706';
  const themeBg = isPaid ? '#ecfdf5' : isFailed ? '#fef2f2' : '#fffbeb';
  const themeBorder = isPaid ? '#a7f3d0' : isFailed ? '#fecaca' : '#fde68a';

  return (
    <section className="order-success" style={{ padding: '36px 16px', minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '14px', padding: '26px', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        
        {/* Status Icon */}
        <span
          className="success-icon"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: themeBg,
            color: themeColor,
            marginBottom: '12px'
          }}
        >
          {isPaid ? (
            <Check size={28} strokeWidth={2.5} />
          ) : isFailed ? (
            <AlertCircle size={28} strokeWidth={2.5} />
          ) : (
            <Clock size={28} strokeWidth={2.5} />
          )}
        </span>

        {/* Title & Eyebrow */}
        <p className="eyebrow dark" style={{ color: themeColor, fontWeight: '800', letterSpacing: '0.06em', fontSize: '11px', marginBottom: '4px' }}>
          {isPaid ? 'PURCHASE ORDER CONFIRMED' : isFailed ? 'PAYMENT UNVERIFIED / FAILED' : 'ORDER SUBMITTED — PAYMENT PENDING'}
        </p>

        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
          {isPaid
            ? 'Thank You for Your Order!'
            : isFailed
              ? 'Payment Not Completed'
              : 'Payment Awaiting Confirmation'}
        </h1>

        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: '0 auto 16px auto', maxWidth: '400px' }}>
          {isPaid
            ? 'Your payment was verified and your order has been recorded live on the server. Our fulfillment team will process your items shortly.'
            : isFailed
              ? 'Your payment could not be authorized or was cancelled by the gateway. You can retry payment or choose another payment method.'
              : 'Your order was recorded and is awaiting payment gateway verification. If you just authorized payment, status updates automatically.'}
        </p>

        {feedbackMsg && (
          <div style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', marginBottom: '14px', fontWeight: 600 }}>
            {feedbackMsg}
          </div>
        )}

        {/* Order Details Card */}
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Order Reference</span>
              <strong style={{ color: '#0f172a', fontSize: '13px', wordBreak: 'break-all' }}>
                {orderDetails?.orderNumber || cfTransaction?.orderNumber || orderRef || 'ORD-LIVE'}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Payment Status</span>
              <span style={{
                color: themeColor,
                background: themeBg,
                border: `1px solid ${themeBorder}`,
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                <ShieldCheck size={12} /> {displayStatus}
              </span>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Payment Method</span>
              <span style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px' }}>
                {orderDetails?.paymentMethod || cfTransaction?.gateway || 'Cashfree Gateway'}
              </span>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Order Amount</span>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                {orderDetails?.finalAmount
                  ? `₹${Number(orderDetails.finalAmount).toLocaleString('en-IN')}`
                  : (cfTransaction?.amount ? `₹${Number(cfTransaction.amount).toLocaleString('en-IN')}` : (orderDetails?.totalAmount ? `₹${Number(orderDetails.totalAmount).toLocaleString('en-IN')}` : 'Settled'))}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isPending && (
            <button
              type="button"
              className="button button-small"
              onClick={() => verifyOrderAndPayment(true)}
              disabled={refreshing || loading}
              style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d97706', borderColor: '#d97706' }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Checking...' : 'Check Payment Status'}
            </button>
          )}

          {isFailed && (
            <Link
              className="button button-small"
              to="/checkout"
              style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dc2626', borderColor: '#dc2626' }}
            >
              <RotateCcw size={14} /> Retry Payment
            </Link>
          )}

          <Link className="button button-small" to="/products" style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px' }}>
            Continue Exploring <ArrowRight size={15} />
          </Link>

          <Link className="button outline button-small" to="/account/orders" style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px' }}>
            My Orders
          </Link>
        </div>
      </div>
    </section>
  );
}
