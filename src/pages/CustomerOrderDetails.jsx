import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, ShieldAlert } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { orderService } from '../services/orderService';
import heroImage from '../assets/images/capital-park2.jpg';

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

  return (
    <>
      <PageHero
        eyebrow="ORDER DETAILS"
        title={order ? `Order #${order.id || order.orderNumber}` : 'Order Summary'}
        description={order ? `Placed on ${order.createdDate ? new Date(order.createdDate).toLocaleDateString() : 'N/A'}` : 'View order breakdown and fulfillment status.'}
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="mb-4">
            <Link to="/account/orders" className="button-text">&larr; Back to Order History</Link>
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '200px' }}>
              <p>Loading order details...</p>
            </div>
          ) : error || !order ? (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h3>Order Not Found</h3>
              <p>{error || 'The requested order details could not be retrieved.'}</p>
              <Link to="/account/orders" className="button button-small">&larr; Back to Orders List</Link>
            </div>
          ) : (
            <div className="order-details-grid">
              <div className="order-main-info">
                <div className="order-status-card mb-4">
                  <h3>Status: <span className="status-badge">{order.status || 'Confirmed'}</span></h3>
                  <p>Current Fulfillment Phase: <strong>{order.fulfillmentStatus || order.status || 'Processing'}</strong></p>
                </div>

                <div className="order-items-table-box">
                  <h3>Order Items</h3>
                  <table className="order-items-table">
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
                            <strong>{item.name || item.productName || 'Honeywell Product'}</strong>
                            {item.sku && <small className="display-block text-muted">SKU: {item.sku}</small>}
                          </td>
                          <td>{item.quantity || 1}</td>
                          <td>${Number(item.price || item.unitPrice || 0).toFixed(2)}</td>
                          <td>${((item.quantity || 1) * Number(item.price || item.unitPrice || 0)).toFixed(2)}</td>
                          <td>
                            <Link to={`/warranty?orderId=${order.id}&itemId=${item.id || idx}`} className="button-text text-small">
                              <ShieldAlert size={12} /> Claim Warranty
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="order-side-info">
                <div className="order-summary-box mb-4">
                  <h3>Payment &amp; Totals</h3>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${Number(order.subtotal || order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>${Number(order.shippingFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-row summary-total">
                    <span>Grand Total:</span>
                    <strong>${Number(order.totalAmount || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="order-actions-box">
                  <Link to={`/order-tracking?orderId=${order.id}`} className="button button-full">
                    <MapPin size={16} /> Track Shipment
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
