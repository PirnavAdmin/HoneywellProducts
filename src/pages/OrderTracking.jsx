import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Package, Clock, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { orderService } from '../services/orderService';
import heroImage from '../assets/images/smart-security-sustainable-future.png';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [contactInfo, setContactInfo] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await orderService.getById(orderId.trim());
      if (data) {
        setOrder(data);
      } else {
        setOrder(null);
        setError('No order found matching the entered Order ID.');
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setOrder(null);
      setError('Unable to fetch order tracking details. Please check the Order ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      handleTrack();
    }
  }, [initialOrderId]);

  const getStatusStep = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 4;
    if (s.includes('shipped') || s.includes('dispatch')) return 3;
    if (s.includes('processing') || s.includes('confirmed')) return 2;
    return 1;
  };

  const activeStep = order ? getStatusStep(order.status) : 0;

  return (
    <>
      <PageHero
        eyebrow="ORDER TRACKING"
        title="Track Your Order Status"
        description="Track the real-time fulfillment and shipment status of your Honeywell order."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="tracking-search-box">
            <form onSubmit={handleTrack} className="tracking-form">
              <div className="form-group">
                <label htmlFor="track-order-id">Order ID / Reference #</label>
                <input
                  id="track-order-id"
                  type="text"
                  required
                  placeholder="e.g. 10214"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="track-contact">Mobile Number or Email (Optional)</label>
                <input
                  id="track-contact"
                  type="text"
                  placeholder="Associated phone or email"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="route-loading" style={{ minHeight: '200px' }}>
              <p>Checking order status with carrier &amp; warehouse APIs...</p>
            </div>
          ) : error ? (
            <div className="error-box text-center max-w-md mx-auto">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          ) : order ? (
            <div className="tracking-results-card">
              <div className="tracking-card-header">
                <div>
                  <h2>Order #{order.id || order.orderNumber}</h2>
                  <span className="order-date">Placed: {order.createdDate ? new Date(order.createdDate).toLocaleDateString() : 'Recent'}</span>
                </div>
                <div className="status-pill">
                  Status: <strong>{order.status || 'Processing'}</strong>
                </div>
              </div>

              <div className="tracking-timeline">
                <div className={`timeline-step ${activeStep >= 1 ? 'completed' : ''}`}>
                  <div className="step-icon"><Clock size={18} /></div>
                  <span className="step-label">Order Placed</span>
                </div>
                <div className={`timeline-step ${activeStep >= 2 ? 'completed' : ''}`}>
                  <div className="step-icon"><Package size={18} /></div>
                  <span className="step-label">Processing</span>
                </div>
                <div className={`timeline-step ${activeStep >= 3 ? 'completed' : ''}`}>
                  <div className="step-icon"><Truck size={18} /></div>
                  <span className="step-label">Shipped</span>
                </div>
                <div className={`timeline-step ${activeStep >= 4 ? 'completed' : ''}`}>
                  <div className="step-icon"><CheckCircle2 size={18} /></div>
                  <span className="step-label">Delivered</span>
                </div>
              </div>

              <div className="tracking-details-summary">
                <h3>Items in Shipment</h3>
                <ul className="tracking-items-list">
                  {Array.isArray(order.items) && order.items.map((item, idx) => (
                    <li key={idx}>
                      <span>{item.name || item.productName || 'Honeywell Unit'}</span>
                      <span>Qty: {item.quantity || 1}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : searched ? null : (
            <div className="empty-state text-center">
              <Package size={44} className="empty-icon" />
              <h3>Enter your Order Number above to track progress</h3>
              <p>You can find your order number in your order confirmation email or account dashboard.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
