import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, ShieldAlert, ArrowLeft } from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { orderService } from '../services/orderService';

export default function CustomerOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const data = await orderService.getById(id);
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

  return (
    <CustomerAccountLayout
      title={order ? `Order #${order.id || order.orderNumber}` : 'Order Summary'}
      subtitle={order ? `Placed on ${order.createdDate ? new Date(order.createdDate).toLocaleDateString() : 'N/A'}` : 'View order breakdown and fulfillment status.'}
    >
      <div className="portal-card-header">
        <div className="flex items-center gap-3">
          <Link to="/account/orders" className="btn-portal-secondary p-2">
            <ArrowLeft size={16} />
          </Link>
          <h2>
            <Package size={22} />
            <span>{order ? `Order #${order.id || order.orderNumber}` : 'Order Details'}</span>
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
                      <td className="font-medium text-slate-700">${Number(item.price || item.unitPrice || 0).toFixed(2)}</td>
                      <td className="font-bold text-slate-800">${((item.quantity || 1) * Number(item.price || item.unitPrice || 0)).toFixed(2)}</td>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="order-summary-card-box">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Payment &amp; Totals Breakdown</h3>
              <div className="summary-line-item">
                <span>Subtotal</span>
                <span>${Number(order.subtotal || order.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="summary-line-item">
                <span>Estimated Shipping</span>
                <span>${Number(order.shippingFee || 0).toFixed(2)}</span>
              </div>
              <div className="summary-line-item grand-total">
                <span>Grand Total</span>
                <span>${Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-direction-column justify-center gap-3">
              <Link to={`/order-tracking?orderId=${order.id}`} className="btn-portal-primary w-full text-center">
                <MapPin size={16} />
                <span>Track Live Delivery Shipment</span>
              </Link>
              <Link to="/account/orders" className="btn-portal-secondary w-full text-center">
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
