import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Package, Clock, ShieldCheck, Download } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { orderService } from '../services/orderService';

export default function OrderSuccess() {
  useDocumentTitle('Order Confirmation', 'Your purchase order has been placed successfully.');
  const { state } = useLocation();
  const orderRef = state?.reference || '';
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderRef) {
      setLoading(true);
      orderService.getById(orderRef)
        .then(data => {
          if (data) setOrderDetails(data);
        })
        .catch(err => {
          console.warn('Could not fetch order details on success page:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [orderRef]);

  return (
    <section className="order-success" style={{ padding: '36px 16px', minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '460px', width: '100%', background: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <span className="success-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', marginBottom: '12px' }}>
          <Check size={26} strokeWidth={2.5} />
        </span>
        <p className="eyebrow dark" style={{ color: '#059669', fontWeight: '800', letterSpacing: '0.06em', fontSize: '11px', marginBottom: '4px' }}>PURCHASE ORDER CONFIRMED</p>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Thank You for Your Order!</h1>
        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: '0 auto 16px auto', maxWidth: '380px' }}>
          Your purchase order has been recorded live on the server. Our operations team will process and dispatch your items shortly.
        </p>

        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Order Reference</span>
              <strong style={{ color: '#0f172a', fontSize: '13px', wordBreak: 'break-all' }}>{orderDetails?.orderNumber || orderRef || 'ORD-LIVE'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Payment Status</span>
              <span style={{ color: '#059669', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} /> {state?.status || orderDetails?.paymentStatus || 'Verified Paid'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Fulfillment Status</span>
              <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Package size={13} /> {orderDetails?.status || 'Processing'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Order Amount</span>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                {orderDetails?.totalAmount ? `₹${orderDetails.totalAmount.toLocaleString('en-IN')}` : 'Settled'}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button button-small" to="/products" style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px' }}>
            Continue Exploring <ArrowRight size={15} />
          </Link>
          <Link className="button outline button-small" to="/contact" style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px' }}>
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}
