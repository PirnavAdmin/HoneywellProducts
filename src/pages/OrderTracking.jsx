import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Package, Clock, Truck, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { orderService } from '../services/orderService';

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
    if (!orderId.trim()) {
      setError('Please enter your order number.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await orderService.getById(orderId.trim());
      if (data) {
        setOrder(data);
      } else {
        setOrder(null);
        setError('We couldn\'t find an order with that number. Please verify your Order ID.');
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setOrder(null);
      setError('Unable to load tracking information. Please try again.');
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
  const statusClass = (order?.status || 'processing').toLowerCase().replace(/\s+/g, '-');

  return (
    <CustomerAccountLayout
      title="Track Your Order"
      subtitle="Enter your order number to check real-time shipment and delivery status updates."
    >
      <div className="portal-card-header">
        <h2>
          <MapPin size={22} />
          <span>Track Order</span>
        </h2>
      </div>

      {/* Search Input Box */}
      <div className="mb-6 p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <form onSubmit={handleTrack} className="portal-form-grid">
          <div className="portal-form-group">
            <label htmlFor="track-order-id">Order Number / Reference #</label>
            <div className="portal-input-wrap">
              <Search size={16} className="portal-input-icon" />
              <input
                id="track-order-id"
                type="text"
                className="portal-input has-icon"
                required
                placeholder="Enter Order ID (e.g. 10214)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
          </div>

          <div className="portal-form-group">
            <label htmlFor="track-contact">Email or Mobile Number (Optional)</label>
            <input
              id="track-contact"
              type="text"
              className="portal-input"
              placeholder="Associated email or mobile number"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>

          <div className="portal-form-group full-width">
            <button type="submit" className="btn-portal-primary w-full" disabled={loading}>
              {loading ? (
                <span>Checking Status...</span>
              ) : (
                <>
                  <MapPin size={16} />
                  <span>Track Order Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="py-12 text-center" role="status">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent mb-3" />
          <p className="text-slate-600 font-medium text-sm">Querying fulfillment and carrier tracking servers...</p>
        </div>
      ) : error ? (
        <div className="portal-toast error" role="alert">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : order ? (
        /* TRACKING RESULT DISPLAY */
        <div className="tracking-results-card">
          <div className="flex items-center justify-between p-4 bg-slate-100 border border-slate-200 rounded-lg mb-6">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Order #{order.id || order.orderNumber}</h3>
              <p className="text-xs text-slate-500 font-medium">Placed on {order.createdDate ? new Date(order.createdDate).toLocaleDateString() : 'Recent'}</p>
            </div>
            <span className={`badge-status ${statusClass}`}>
              {order.status || 'Processing'}
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="tracking-stepper-container">
            <div className={`tracking-step-item ${activeStep >= 1 ? 'completed' : ''}`}>
              <div className="step-circle-icon">
                <Clock size={18} />
              </div>
              <span className="step-title-text">Order Confirmed</span>
            </div>

            <div className={`tracking-step-item ${activeStep >= 2 ? 'completed' : ''}`}>
              <div className="step-circle-icon">
                <Package size={18} />
              </div>
              <span className="step-title-text">Processing</span>
            </div>

            <div className={`tracking-step-item ${activeStep >= 3 ? 'completed' : ''}`}>
              <div className="step-circle-icon">
                <Truck size={18} />
              </div>
              <span className="step-title-text">Shipped</span>
            </div>

            <div className={`tracking-step-item ${activeStep >= 4 ? 'completed' : ''}`}>
              <div className="step-circle-icon">
                <CheckCircle2 size={18} />
              </div>
              <span className="step-title-text">Delivered</span>
            </div>
          </div>

          {/* Shipment Product List */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm mb-3">Items Included in Shipment</h4>
            <div className="space-y-2">
              {Array.isArray(order.items) && order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <span className="font-semibold text-slate-800">{item.name || item.productName || 'Honeywell Unit'}</span>
                  <span className="text-slate-600 font-medium">Qty: {item.quantity || 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : searched ? null : (
        /* Empty State before searching */
        <div className="portal-empty-state">
          <div className="empty-state-icon">
            <MapPin size={32} />
          </div>
          <h3 className="empty-state-title">Track Your Package Status</h3>
          <p className="empty-state-desc">
            Enter your Order Number in the search box above to view step-by-step fulfillment and shipment updates.
          </p>
        </div>
      )}
    </CustomerAccountLayout>
  );
}
