import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Package, Clock, Truck, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { trackOrder } from '../services/customerApi';

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

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [contactInfo, setContactInfo] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e, targetId = null) => {
    if (e) e.preventDefault();
    const queryId = (targetId !== null ? targetId : orderId).trim();
    if (!queryId) {
      setError('Please enter your order number.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await trackOrder(queryId, contactInfo.trim());
      if (data && data.found !== false) {
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
      setOrderId(initialOrderId);
      handleTrack(null, initialOrderId);
    }
  }, [initialOrderId]);

  const getStatusStep = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 4;
    if (s.includes('shipped') || s.includes('dispatch')) return 3;
    if (s.includes('processing') || s.includes('confirmed')) return 2;
    return 1;
  };

  const activeStep = order ? getStatusStep(order.status || order.currentStatus) : 0;
  const statusClass = (order?.status || order?.currentStatus || 'processing').toLowerCase().replace(/\s+/g, '-');

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
          <div className="tracking-order-header">
            <div>
              <h3 className="tracking-order-title">{formatOrderTitle(order)}</h3>
              <p className="tracking-order-date">{formatOrderDate(order)}</p>
            </div>
            <span className={`badge-status ${statusClass}`}>
              {order.status || order.currentStatus || 'Processing'}
            </span>
          </div>

          {/* Stepper Timeline (Dynamic from Live Backend API) */}
          <div 
            className="tracking-stepper-container" 
            style={{ 
              gridTemplateColumns: `repeat(${Array.isArray(order.timeline) && order.timeline.length ? order.timeline.length : 4}, minmax(0, 1fr))` 
            }}
          >
            {Array.isArray(order.timeline) && order.timeline.length > 0 ? (
              order.timeline.map((item, idx) => {
                const isDone = Boolean(item.isCompleted || item.completed);
                const isCurrent = Boolean(item.isCurrent || item.current);
                const stepClass = isDone ? 'completed' : isCurrent ? 'current' : '';
                return (
                  <div key={idx} className={`tracking-step-item ${stepClass}`}>
                    <div className="step-circle-icon">
                      {idx === 0 ? <Clock size={18} /> :
                       idx === 1 ? <Package size={18} /> :
                       idx === 2 ? <Truck size={18} /> :
                       idx === 3 ? <MapPin size={18} /> :
                       <CheckCircle2 size={18} />}
                    </div>
                    <span className="step-title-text">{item.title || `Step ${idx + 1}`}</span>
                    {item.date && item.date !== 'Pending' && (
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{item.date}</span>
                    )}
                  </div>
                );
              })
            ) : (
              [
                { title: 'Order Confirmed', icon: <Clock size={18} />, active: activeStep >= 1 },
                { title: 'Processing', icon: <Package size={18} />, active: activeStep >= 2 },
                { title: 'Shipped', icon: <Truck size={18} />, active: activeStep >= 3 },
                { title: 'Delivered', icon: <CheckCircle2 size={18} />, active: activeStep >= 4 }
              ].map((step, idx) => (
                <div key={idx} className={`tracking-step-item ${step.active ? 'completed' : ''}`}>
                  <div className="step-circle-icon">{step.icon}</div>
                  <span className="step-title-text">{step.title}</span>
                </div>
              ))
            )}
          </div>

          {/* Tracking Meta (Carrier, Tracking No, Estimated Delivery, Address) */}
          {(order.carrierName || order.trackingNumber || order.estimatedDelivery || order.shippingAddress) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 my-5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
              {order.carrierName && (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-0.5">Carrier Partner</span>
                  <span className="font-semibold text-slate-800">{order.carrierName}</span>
                </div>
              )}
              {order.trackingNumber && (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-0.5">Tracking AWB #</span>
                  <span className="font-semibold text-slate-800 font-mono">{order.trackingNumber}</span>
                </div>
              )}
              {order.estimatedDelivery && (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-0.5">Estimated Delivery</span>
                  <span className="font-semibold text-slate-800">{order.estimatedDelivery}</span>
                </div>
              )}
              {order.shippingAddress && (
                <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-0.5">Delivery Address</span>
                  <span className="text-slate-700 font-medium">{order.shippingAddress}</span>
                </div>
              )}
            </div>
          )}

          {/* Shipment Product List */}
          <div className="tracking-products-section">
            <h4 className="tracking-products-title">Items Included in Shipment</h4>
            <div>
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="tracking-product-row">
                    <div>
                      <div className="tracking-product-name">{item.name || item.productName || 'Honeywell Unit'}</div>
                      {item.productCode && <div className="text-xs text-slate-500 font-mono mt-0.5">Code: {item.productCode}</div>}
                    </div>
                    <div className="text-right">
                      <span className="tracking-product-qty block">Qty: {item.quantity || 1}</span>
                      {Number(item.price) > 0 && <span className="text-xs text-slate-600 font-semibold">₹{Number(item.price).toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 py-2">Standard Shipment Package</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Default State (initial or searched with no order) */
        <div className="portal-empty-state">
          <div className="empty-state-icon">
            {searched ? <Package size={32} /> : <MapPin size={32} />}
          </div>
          <h3 className="empty-state-title">{searched ? 'Order Not Found' : 'Track Your Package Status'}</h3>
          <p className="empty-state-desc">
            {searched 
              ? (error || "We couldn't find an order matching that reference number. Please check your order number and try again.")
              : 'Enter your Order Number in the search box above to view step-by-step fulfillment and shipment updates.'}
          </p>
        </div>
      )}
    </CustomerAccountLayout>
  );
}
