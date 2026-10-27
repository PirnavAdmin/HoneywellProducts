import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { Package, MapPin, ShieldAlert, ArrowLeft } from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { getOrderDetails } from '../services/customerApi';
import { useSettings } from '../context/SettingsContext';

const formatOrderTitle = (order) => {
  if (!order) return 'Order Details';
  const val = String(order.orderNumber || order.orderNo || (order.id ? `ORD-${order.id}` : '')).trim();
  if (!val) return 'Order Details';
  const clean = val.replace(/^(Order\s*#*|#)+/i, '').trim();
  if (/^\d+$/.test(clean)) {
    return `Order #ORD-${clean}`;
  }
  return `Order #${clean}`;
};

const formatOrderDate = (order) => {
  if (!order) return 'Placed on Recent';
  const rawDate = order.orderDate || order.createdDate;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return `Placed on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } catch (e) {}
  }
  if (order.orderDateFormatted) {
    const clean = String(order.orderDateFormatted).replace(/^Placed\s+on\s+/i, '').trim();
    return `Placed on ${clean}`;
  }
  return 'Placed on Recent';
};

export default function CustomerOrderDetails() {
  const { priceVisibility } = useSettings();
  const { id } = useParams();
  const location = useLocation();
  const passedOrder = location.state?.order || null;
  const [order, setOrder] = useState(passedOrder);
  const [loading, setLoading] = useState(!passedOrder);
  const [error, setError] = useState(null);

  if (!priceVisibility) {
    return <Navigate to="/account" replace />;
  }

  useEffect(() => {
    async function loadOrder() {
      try {
        if (!passedOrder) setLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const verifyParam = location.state?.email || searchParams.get('email') || searchParams.get('phone') || localStorage.getItem('customerEmail') || localStorage.getItem('customerPhone') || '';
        const data = await getOrderDetails(id, verifyParam);
        if (data) {
          setOrder(data);
        } else if (passedOrder) {
          setOrder(passedOrder);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        if (!passedOrder) {
          setError('Order record not found or inaccessible.');
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id, passedOrder, location.search, location.state]);

  const statusClass = (order?.status || 'processing').toLowerCase().replace(/\s+/g, '-');

  const orderTitle = formatOrderTitle(order);
  const orderDateDisplay = formatOrderDate(order);

  return (
    <CustomerAccountLayout
      title={orderTitle}
      subtitle={order ? orderDateDisplay : 'View order breakdown and fulfillment status.'}
    >
      <div className="portal-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/account/orders"
            className="btn-portal-secondary"
            style={{ padding: '8px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            title="Back to Orders"
          >
            <ArrowLeft size={16} />
          </Link>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            <Package size={22} />
            <span>{orderTitle}</span>
          </h2>
        </div>
        {order && (
          <span className={`badge-status ${statusClass}`}>
            {order.status || 'Confirmed'}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center' }} role="status">
          <p style={{ color: '#475569', fontWeight: 600, fontSize: '14px', margin: 0 }}>Loading order details...</p>
        </div>
      ) : error || !order ? (
        <div className="portal-empty-state">
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <h3 className="empty-state-title">Order Not Found</h3>
          <p className="empty-state-desc">
            {error || 'The requested order details could not be retrieved.'}
          </p>
          <Link to="/account/orders" className="btn-portal-primary">
            Back to Orders List
          </Link>
        </div>
      ) : (
        <div className="order-details-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Order Items Table */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
              Itemized Purchased Products
            </h3>
            <div className="order-table-wrapper" style={{ marginBottom: 0 }}>
              <table className="portal-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Product</th>
                    <th style={{ textAlign: 'center', width: '110px' }}>Quantity</th>
                    <th style={{ textAlign: 'right', width: '140px' }}>Price</th>
                    <th style={{ textAlign: 'right', width: '140px' }}>Total</th>
                    <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(order.items) && order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
                          {item.name || item.productName || 'Honeywell Product'}
                        </div>
                        {(item.sku || item.productCode) && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace', marginTop: '3px' }}>
                            SKU: {item.sku || item.productCode}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                        {item.quantity || 1}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        ₹{Number(item.price || item.unitPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        ₹{((item.quantity || 1) * Number(item.price || item.unitPrice || 0)).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/warranty?orderId=${order.id}&itemId=${item.id || idx}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#0284c7',
                            textDecoration: 'none',
                            padding: '5px 10px',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                          }}
                        >
                          <ShieldAlert size={14} />
                          <span>Claim Warranty</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Breakdown & Actions */}
          <div className="order-details-footer-container" style={{ marginTop: 0, paddingTop: '4px', borderTop: 'none' }}>
            <div className="order-summary-card-box">
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                Payment &amp; Totals Breakdown
              </h3>
              {(() => {
                const subtotalVal = Number(order.subtotal || order.items?.reduce((s, i) => s + ((i.quantity || 1) * Number(i.price || i.unitPrice || 0)), 0) || order.totalAmount || 0);
                const discountVal = Number(order.discountAmount || 0);
                const shippingVal = Number(order.shippingFee || 0);
                const taxableVal = Math.max(0, subtotalVal - discountVal);
                const gstVal = Number(
                  order.gstAmount !== undefined && order.gstAmount > 0
                    ? order.gstAmount
                    : (order.taxAmount !== undefined && order.taxAmount > 0 ? order.taxAmount : Math.round(taxableVal * 0.18))
                );
                const rawFinalVal = Number(order.finalAmount || 0);
                let grandTotalVal = rawFinalVal;
                if (grandTotalVal <= 0 || grandTotalVal === subtotalVal) {
                  grandTotalVal = taxableVal + shippingVal + gstVal;
                }

                return (
                  <>
                    <div className="summary-line-item">
                      <span>Item Subtotal</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotalVal.toLocaleString('en-IN')}</span>
                    </div>
                    {discountVal > 0 && (
                      <div className="summary-line-item" style={{ color: '#16a34a' }}>
                        <span>Discount Applied</span>
                        <span style={{ fontWeight: 600 }}>-₹{discountVal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="summary-line-item">
                      <span>Estimated Tax (18% GST)</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{gstVal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="summary-line-item">
                      <span>Estimated Shipping</span>
                      <span style={{ fontWeight: 600, color: shippingVal > 0 ? '#0f172a' : '#16a34a' }}>
                        {shippingVal > 0 ? `₹${shippingVal.toLocaleString('en-IN')}` : 'Free'}
                      </span>
                    </div>
                    <div className="summary-line-item grand-total">
                      <span>Grand Total (Incl. Tax)</span>
                      <span>₹{grandTotalVal.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="order-details-actions-bar" style={{ justifyContent: 'space-between' }}>
              <Link to="/account/orders" className="btn-portal-secondary">
                <ArrowLeft size={16} />
                <span>Back to Order History</span>
              </Link>
              <Link to={`/order-tracking?orderId=${encodeURIComponent(order.orderNumber || order.id)}`} className="btn-portal-primary">
                <MapPin size={16} />
                <span>Track Live Delivery Shipment</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </CustomerAccountLayout>
  );
}
