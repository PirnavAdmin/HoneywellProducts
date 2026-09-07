import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Eye, Calendar } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { orderService } from '../services/orderService';
import heroImage from '../assets/images/capital-park2.jpg';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await orderService.getAll();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching customer orders:', err);
        setError('Failed to load order history.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <>
      <PageHero
        eyebrow="CUSTOMER PORTAL"
        title="My Order History"
        description="View your past orders, fulfillment status, invoices, and shipment tracking."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="orders-top-nav mb-4">
            <Link to="/account" className="button-text">
              &larr; Back to Account Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '200px' }}>
              <p>Loading order history...</p>
            </div>
          ) : error ? (
            <div className="error-box">
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h3>No order records found</h3>
              <p>You have not placed any orders yet.</p>
              <Link to="/products" className="button button-small">
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-summary-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-id">Order #{order.id || order.orderNumber}</span>
                      <span className="order-date">
                        <Calendar size={13} /> {order.createdDate ? new Date(order.createdDate).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <span className={`status-badge status-${(order.status || 'Pending').toLowerCase()}`}>
                      {order.status || 'Processing'}
                    </span>
                  </div>

                  <div className="order-card-body">
                    <div className="order-items-preview">
                      {Array.isArray(order.items) && order.items.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span>{item.name || item.productName || 'Honeywell Product'} x {item.quantity || 1}</span>
                          <span>${Number(item.price || item.unitPrice || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-total-row">
                      <span>Total Amount:</span>
                      <strong>${Number(order.totalAmount || order.total || 0).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <Link to={`/account/orders/${order.id}`} className="button button-outline button-small">
                      <Eye size={14} /> View Details
                    </Link>
                    <Link to={`/order-tracking?orderId=${order.id}`} className="button button-small">
                      <MapPin size={14} /> Track Delivery
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
