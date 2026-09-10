import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Eye, Calendar, Search } from 'lucide-react';
import CustomerAccountLayout from '../components/layout/CustomerAccountLayout';
import { orderService } from '../services/orderService';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await orderService.getAll();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching customer orders:', err);
        setError('Unable to load order history. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // Filter orders by search query and status pill
  const filteredOrders = orders.filter((order) => {
    const orderIdStr = String(order.id || order.orderNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || orderIdStr.includes(query);

    const statusStr = (order.status || 'PROCESSING').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || statusStr.includes(statusFilter);

    return matchesSearch && matchesStatus;
  });

  return (
    <CustomerAccountLayout
      title="My Orders"
      subtitle="View and track your recent purchases, order details, and fulfillment progress."
    >
      <div className="portal-card-header">
        <h2>
          <Package size={22} />
          <span>My Orders</span>
        </h2>
      </div>

      {loading ? (
        <div className="py-12 text-center" role="status">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading your order history...</p>
        </div>
      ) : error ? (
        <div className="portal-toast error" role="alert">
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State: No Orders Yet */
        <div className="portal-empty-state">
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <h3 className="empty-state-title">No Orders Yet</h3>
          <p className="empty-state-desc">
            When you place an order, your purchases, tracking information, and invoices will appear here.
          </p>
          <Link to="/products" className="btn-portal-primary">
            Explore Products
          </Link>
        </div>
      ) : (
        <>
          {/* Search & Status Filter Controls */}
          <div className="orders-filter-bar">
            <div className="orders-search-input">
              <Search size={16} className="orders-search-icon" />
              <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="orders-status-pills">
              {['ALL', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  className={`status-pill-btn ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All Orders' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="portal-empty-state">
              <p className="empty-state-desc">No orders match your search or filter criteria.</p>
              <button 
                className="btn-portal-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* Orders List Cards */
            <div className="orders-list-cards">
              {filteredOrders.map((order) => {
                const statusClass = (order.status || 'processing').toLowerCase().replace(/\s+/g, '-');
                return (
                  <div key={order.id} className="order-card-item">
                    {/* Top Row: Order ID & Status */}
                    <div className="order-card-top">
                      <div>
                        <div className="order-number">Order #{order.id || order.orderNumber}</div>
                        <div className="order-date-meta">
                          <Calendar size={13} />
                          <span>Placed on {order.createdDate ? new Date(order.createdDate).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>
                      <span className={`badge-status ${statusClass}`}>
                        {order.status || 'Processing'}
                      </span>
                    </div>

                    {/* Products List Preview */}
                    <div className="order-card-products">
                      {Array.isArray(order.items) && order.items.map((item, idx) => (
                        <div key={idx} className="order-product-row">
                          <div className="font-semibold text-slate-800">
                            {item.name || item.productName || 'Honeywell Security Product'}
                          </div>
                          <div className="text-slate-600 font-medium">
                            Qty: {item.quantity || 1} &bull; ${Number(item.price || item.unitPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Row: Total & Actions */}
                    <div className="order-card-bottom">
                      <div className="order-total-amount">
                        <span className="text-xs text-slate-500 font-medium block">Total Amount</span>
                        <span>${Number(order.totalAmount || order.total || 0).toFixed(2)}</span>
                      </div>

                      <div className="order-card-actions">
                        <Link to={`/account/orders/${order.id}`} className="btn-portal-secondary">
                          <Eye size={14} />
                          <span>View Details</span>
                        </Link>
                        <Link to={`/order-tracking?orderId=${order.id}`} className="btn-portal-primary">
                          <MapPin size={14} />
                          <span>Track Order</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </CustomerAccountLayout>
  );
}
