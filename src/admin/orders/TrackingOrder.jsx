import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Save,
  ChevronRight,
  ClipboardList,
  Clock,
  Package,
  Truck,
  Compass,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getOrdersTracking, getOrderTracking, postOrderTracking, updateOrderStatus } from '../api/orders';
import { OrderStatusBadge, formatCurrency, mapStatus } from './OrdersLedger';
import './adminOrders.css';

const STATUS_DESCRIPTIONS = {
  Processing: 'Order is verified. Inventory is being committed and prepared.',
  Packed: 'Order items are packed, labeled, and prepared for carrier pickup.',
  Shipped: 'Package has been handed over to logistics provider and is in transit.',
  Dispatched: 'Package is dispatched to regional logistics hub.',
  Completed: 'Order delivered to the customer successfully and transaction closed.',
  Cancelled: 'Order cancelled. Reverting stock allocation.'
};

const STATUS_THEMES = {
  Processing: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', icon: Clock },
  Packed: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', icon: Package },
  Shipped: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe', icon: Truck },
  Dispatched: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe', icon: Compass },
  Completed: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', icon: CheckCircle },
  Cancelled: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', icon: AlertCircle }
};

const STATUS_ORDER = {
  Pending: 1,
  Processing: 2,
  Packed: 3,
  Shipped: 4,
  Dispatched: 5,
  Completed: 6,
  Delivered: 6,
  Cancelled: -1
};

const TrackingOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ text: '', isError: false });

  // Status updates states
  const [tempStatus, setTempStatus] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getOrdersTracking();
      const list = Array.isArray(data) ? data : (data.orders || data.data || []);
      const mappedList = list.map(o => ({
        ...o,
        status: mapStatus(o.status || o.currentStatus)
      }));
      const deduplicatedMap = new Map();
      mappedList.forEach(item => {
        const key = (item.orderNumber || item.orderId || item.id || '').toUpperCase().trim();
        if (key && !deduplicatedMap.has(key)) {
          deduplicatedMap.set(key, item);
        }
      });
      const uniqueList = Array.from(deduplicatedMap.values());
      setOrders(uniqueList);
      
      if (uniqueList.length > 0 && !selectedOrderId) {
        setSelectedOrderId(uniqueList[0].id || uniqueList[0].orderId);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      setError('');
      setUpdateMsg({ text: '', isError: false });

      const data = await getOrdersTracking();
      const list = Array.isArray(data) ? data : (data.orders || data.data || []);
      const mappedList = list.map(o => ({
        ...o,
        status: mapStatus(o.status || o.currentStatus)
      }));
      const deduplicatedMap = new Map();
      mappedList.forEach(item => {
        const key = (item.orderNumber || item.orderId || item.id || '').toUpperCase().trim();
        if (key && !deduplicatedMap.has(key)) {
          deduplicatedMap.set(key, item);
        }
      });
      const uniqueList = Array.from(deduplicatedMap.values());
      setOrders(uniqueList);

      const currentId = selectedOrderId || (uniqueList.length > 0 ? (uniqueList[0].id || uniqueList[0].orderId) : null);
      if (currentId) {
        setDetailsLoading(true);
        const details = await getOrderTracking(currentId);
        const mappedDetails = {
          ...details,
          id: details.orderId,
          status: mapStatus(details.currentStatus),
          timeline: Array.isArray(details.timelineLogs) ? details.timelineLogs.map(t => ({
            label: t.status,
            date: `${t.date} ${t.time}`,
            completed: true,
            description: t.description
          })) : []
        };
        setActiveOrderDetails(mappedDetails);
        setTempStatus(mappedDetails.status);
      }
      setUpdateMsg({ text: 'Tracking data refreshed successfully!', isError: false });
    } catch (err) {
      setError(err.message || 'Failed to refresh tracking data.');
    } finally {
      setLoading(false);
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch full details when selectedOrderId changes
  useEffect(() => {
    if (!selectedOrderId) {
      setActiveOrderDetails(null);
      return;
    }
    let isMounted = true;
    const loadDetails = async () => {
      try {
        setDetailsLoading(true);
        const details = await getOrderTracking(selectedOrderId);
        if (isMounted) {
          const mappedDetails = {
            ...details,
            id: details.orderId,
            status: mapStatus(details.currentStatus),
            timeline: Array.isArray(details.timelineLogs) ? details.timelineLogs.map(t => ({
              label: t.status,
              date: `${t.date} ${t.time}`,
              completed: true,
              description: t.description
            })) : []
          };
          setActiveOrderDetails(mappedDetails);
          setTempStatus(mappedDetails.status);
          setNotesInput('');
          setUpdateMsg({ text: '', isError: false });
        }
      } catch (err) {
        if (isMounted) {
          setUpdateMsg({ text: `Failed to load tracking details: ${err.message}`, isError: true });
        }
      } finally {
        if (isMounted) setDetailsLoading(false);
      }
    };
    loadDetails();
    return () => { isMounted = false; };
  }, [selectedOrderId]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter(o => 
      String(o.id || o.orderId).toLowerCase().includes(q) ||
      (o.customerName || o.customer || '').toLowerCase().includes(q)
    );
  }, [orders, searchTerm]);

  const handleUpdateStatus = async () => {
    if (!selectedOrderId) return;
    setUpdating(true);
    setUpdateMsg({ text: '', isError: false });
    try {
      // 1. Update order status in core API
      await updateOrderStatus(selectedOrderId, tempStatus);

      // Sync via tracking post API (JSON format)
      await postOrderTracking(selectedOrderId, {
        status: tempStatus,
        notes: notesInput || STATUS_DESCRIPTIONS[tempStatus] || '',
        description: notesInput || STATUS_DESCRIPTIONS[tempStatus] || ''
      });

      setUpdateMsg({ text: 'Order status updated and customer timeline refreshed!', isError: false });
      
      // Reload details
      const details = await getOrderTracking(selectedOrderId);
      const mappedDetails = {
        ...details,
        id: details.orderId,
        status: mapStatus(details.currentStatus),
        timeline: Array.isArray(details.timelineLogs) ? details.timelineLogs.map(t => ({
          label: t.status,
          date: `${t.date} ${t.time}`,
          completed: true,
          description: t.description
        })) : []
      };
      setActiveOrderDetails(mappedDetails);
      setNotesInput('');
      
      // Reload lists
      await loadOrders();
    } catch (err) {
      setUpdateMsg({ text: err.message || 'Status update failed.', isError: true });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="tracking-page-container" style={{ padding: '16px 20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Bar: Green Badge, Page Title & Top-Right Refresh Data Button */}
      <div className="tracking-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div className="tracking-header-title">
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
            ORDERS & LOGISTICS
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>Tracking Order</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Real-time order status updates and customer timeline synchronization.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleRefreshData}
            disabled={loading || detailsLoading}
            style={{
              background: '#278652',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              height: '38px',
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: (loading || detailsLoading) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              opacity: (loading || detailsLoading) ? 0.7 : 1,
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => !(loading || detailsLoading) && (e.currentTarget.style.background = '#1e683f')}
            onMouseOut={(e) => !(loading || detailsLoading) && (e.currentTarget.style.background = '#278652')}
          >
            <RefreshCw size={15} style={(loading || detailsLoading) ? { animation: 'spin 1s linear infinite' } : {}} />
            <span>{(loading || detailsLoading) ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <button
            onClick={handleUpdateStatus}
            disabled={updating || !selectedOrderId}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              height: '38px',
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: (updating || !selectedOrderId) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              opacity: (updating || !selectedOrderId) ? 0.7 : 1,
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => !(updating || !selectedOrderId) && (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => !(updating || !selectedOrderId) && (e.currentTarget.style.background = '#2563eb')}
          >
            <Save size={15} />
            <span>{updating ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>{error}</div>}

      {/* Main Grid: Left Primary Area (~65%) | Right Secondary Area (~35% / 340px) */}
      <div className="tracking-main-grid">
        
        {/* LEFT / PRIMARY COLUMN (~65% width): Active Track & Timeline Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* Active Track Card */}
          {detailsLoading ? (
            <div className="orders-card-table-wrap" style={{ padding: '32px', background: 'white', textAlign: 'center', color: '#64748b', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              Loading tracking details from API...
            </div>
          ) : activeOrderDetails ? (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              
              {/* Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ACTIVE TRACK</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0', color: '#0f172a' }}>Order #{activeOrderDetails.id}</h2>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                    {activeOrderDetails.customerName} ({activeOrderDetails.customerPhone || activeOrderDetails.phone})
                  </span>
                </div>
                <OrderStatusBadge status={activeOrderDetails.status} />
              </div>

              {/* Status Update Form */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClipboardList size={16} style={{ color: '#10b981' }} />
                  Update Order Fulfillment Status
                </h3>
                
                <div>
                  {/* 6 Horizontal Fulfillment Phase Boxes */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>Select Fulfillment Phase</label>
                    <div className="status-select-grid-horizontal">
                      {Object.keys(STATUS_THEMES).map((s) => {
                        const theme = STATUS_THEMES[s];
                        const Icon = theme.icon;
                        const isActive = tempStatus === s;
                        
                        const currentStatusWeight = STATUS_ORDER[activeOrderDetails?.status] || 0;
                        const sWeight = STATUS_ORDER[s] || 0;
                        const isDisabled = s !== 'Cancelled' && sWeight > 0 && sWeight < currentStatusWeight;

                        return (
                          <div
                            key={s}
                            onClick={() => {
                              if (!isDisabled) setTempStatus(s);
                            }}
                            className={`status-select-card ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                            style={{
                              '--theme-bg': theme.bg,
                              '--theme-text': theme.text,
                              '--theme-border': theme.border
                            }}
                          >
                            <Icon size={15} style={{ color: isActive ? theme.text : '#64748b' }} />
                            <span style={{ fontSize: '11px' }}>{s}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Notes Textarea */}
                  <div style={{ width: '100%', marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>
                      Status Notes / Description (Will be displayed to customer)
                    </label>
                    <textarea
                      rows={2}
                      style={{ width: '100%', minHeight: '42px', height: '42px', resize: 'vertical', background: 'white', fontFamily: 'inherit', padding: '8px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', display: 'block', outline: 'none' }}
                      placeholder="e.g. Stock verified. Order package has been dispatched from Nagpur warehouse."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                    />
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                      Leave blank to auto-fill with standard descriptions.
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    style={{
                      width: '100%',
                      height: '34px',
                      padding: '0 16px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: updating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => !updating && (e.target.style.background = '#059669')}
                    onMouseOut={(e) => !updating && (e.target.style.background = '#10b981')}
                  >
                    <Save size={15} />
                    {updating ? 'Updating...' : 'Save & Publish Tracking Update'}
                  </button>

                  {updateMsg.text && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginTop: '10px',
                        background: updateMsg.isError ? '#fef2f2' : '#f0fdf4',
                        color: updateMsg.isError ? '#b91c1c' : '#166534',
                        border: updateMsg.isError ? '1px solid #fecaca' : '1px solid #bbf7d0'
                      }}
                    >
                      {updateMsg.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Stage Info Explanation Box */}
              {tempStatus && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    background: STATUS_THEMES[tempStatus]?.bg || '#f8fafc',
                    color: STATUS_THEMES[tempStatus]?.text || '#475569',
                    border: `1px solid ${STATUS_THEMES[tempStatus]?.border || '#cbd5e1'}`
                  }}
                >
                  <strong>Fulfillment Stage: {tempStatus}</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>{STATUS_DESCRIPTIONS[tempStatus]}</p>
                </div>
              )}

            </div>
          ) : (
            <div style={{ padding: '32px', background: 'white', textAlign: 'center', color: '#64748b', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              Select an order from the Orders Ledger to manage tracking.
            </div>
          )}

          {/* Customer Timeline Logs Card */}
          {activeOrderDetails && (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.04em' }}>
                  CUSTOMER TIMELINE LOGS
                </h3>
              </div>

              <div className="modern-timeline" style={{ paddingLeft: '16px' }}>
                {activeOrderDetails.timeline && activeOrderDetails.timeline.length > 0 ? (
                  activeOrderDetails.timeline.map((event, idx) => (
                    <div key={idx} className="timeline-event completed" style={{ marginBottom: '14px' }}>
                      <span className="timeline-dot" />
                      <div className="timeline-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#0f172a', fontSize: '12.5px', fontWeight: 700 }}>{event.label}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{event.date}</span>
                        </div>
                        {event.description && (
                          <div style={{ fontSize: '11px', color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', marginTop: '2px' }}>
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', fontSize: '12px' }}>No timeline events logged yet.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT / SECONDARY COLUMN (~35% width / 340px): Orders Ledger Card */}
        <div className="tracking-orders-ledger-card">
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 2px 0' }}>Orders ledger</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Select an order to view & update tracking status</span>
          </div>

          <div className="orders-search-wrapper" style={{ marginBottom: '14px', position: 'relative' }}>
            <Search size={15} className="orders-search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="tracking-search-input"
              placeholder="Search ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="tracking-ledger-scroll-list">
            {loading && orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '12px' }}>
                Loading orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '12px' }}>
                No active tracking orders matching search.
              </div>
            ) : (
              filteredOrders.map(o => {
                const isActive = String(o.id || o.orderId) === String(selectedOrderId);
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`tracking-order-item-card ${isActive ? 'active' : ''}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isActive ? '2px solid #10b981' : '1px solid #e2e8f0',
                      background: isActive ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>Order</span>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 800 }}>#{o.id || o.orderId}</strong>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                      {o.customerName || o.customer || 'Customer'}
                    </div>
                    {o.customerPhone && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                        • {o.customerPhone}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(o.finalAmount ?? o.totalAmount ?? o.total ?? 0)}
                      </span>
                      <ChevronRight size={14} style={{ color: isActive ? '#10b981' : '#94a3b8' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default TrackingOrder;

