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
    <section className="order-success" style={{ padding: '60px 20px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '640px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <span className="success-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', marginBottom: '16px' }}>
          <Check size={36} />
        </span>
        <p className="eyebrow dark" style={{ color: '#059669', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px' }}>PURCHASE ORDER CONFIRMED</p>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>Thank You for Your Order!</h1>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Your purchase order has been recorded live on the server. Our operations team will process and dispatch your items shortly.
        </p>

        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Order Reference</span>
              <strong style={{ color: '#0f172a', fontSize: '15px' }}>{orderDetails?.orderNumber || orderRef || 'ORD-LIVE'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Payment Status</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={14} /> {state?.status || orderDetails?.paymentStatus || 'Verified Paid'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Fulfillment Status</span>
              <span style={{ color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Package size={14} /> {orderDetails?.status || 'Processing'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Order Amount</span>
              <strong style={{ color: '#0f172a', fontSize: '15px' }}>
                {orderDetails?.totalAmount ? `₹${orderDetails.totalAmount.toLocaleString('en-IN')}` : 'Settled'}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button" to="/products">
            Continue Exploring <ArrowRight size={18} />
          </Link>
          <Link className="button outline" to="/contact">
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}
