import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, ShieldAlert, ArrowLeft } from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { getOrderDetails } from '../services/customerApi';

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
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const data = await getOrderDetails(id);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Order record not found or inaccessible.');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id]);

  const statusClass = (order?.status || 'processing').toLowerCase().replace(/\s+/g, '-');

  const orderTitle = formatOrderTitle(order);
  const orderDateDisplay = formatOrderDate(order);

  return (
    <CustomerAccountLayout
      title={orderTitle}
      subtitle={order ? orderDateDisplay : 'View order breakdown and fulfillment status.'}
    >
      <div className="portal-card-header">
        <div className="flex items-center gap-3">
          <Link to="/account/orders" className="btn-portal-secondary p-2">
            <ArrowLeft size={16} />
          </Link>
          <h2>
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
        <div className="py-12 text-center" role="status">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading order details...</p>
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
        <div className="order-details-content">
          {/* Order Items Table */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-3">Itemized Purchased Products</h3>
            <div className="order-table-wrapper">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(order.items) && order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="font-bold text-slate-800">{item.name || item.productName || 'Honeywell Product'}</div>
                        {item.sku && <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.sku}</div>}
                      </td>
                      <td className="font-semibold text-slate-700">{item.quantity || 1}</td>
                      <td className="font-medium text-slate-700">₹{Number(item.price || item.unitPrice || 0).toLocaleString('en-IN')}</td>
                      <td className="font-bold text-slate-800">₹{((item.quantity || 1) * Number(item.price || item.unitPrice || 0)).toLocaleString('en-IN')}</td>
                      <td>
                        <Link 
                          to={`/warranty?orderId=${order.id}&itemId=${item.id || idx}`} 
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900"
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
          <div className="order-details-footer-container">
            <div className="order-summary-card-box">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Payment &amp; Totals Breakdown</h3>
              <div className="summary-line-item">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal || order.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-line-item">
                <span>Estimated Shipping</span>
                <span>₹{Number(order.shippingFee || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-line-item grand-total">
                <span>Grand Total</span>
                <span>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="order-details-actions-bar">
              <Link to={`/order-tracking?orderId=${encodeURIComponent(order.orderNumber || order.id)}`} className="btn-portal-primary">
                <MapPin size={16} />
                <span>Track Live Delivery Shipment</span>
              </Link>
              <Link to="/account/orders" className="btn-portal-secondary">
                <ArrowLeft size={16} />
                <span>Back to Order History</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </CustomerAccountLayout>
  );
}
