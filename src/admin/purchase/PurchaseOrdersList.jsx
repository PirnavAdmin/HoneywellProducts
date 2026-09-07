import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, ShoppingBag, Eye } from 'lucide-react';
import { fetchPurchaseOrders, updatePOStatus } from '../api/purchaseOrderApi';

export default function PurchaseOrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (search && !item.poNumber?.toLowerCase().includes(search.toLowerCase()) && !item.supplierName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="stroyka-admin-page">
      <div className="page-header flex-between">
        <div>
          <h1>Purchase Orders</h1>
          <p>Official procurement orders issued to hardware suppliers</p>
        </div>
        <div className="btn-group">
          <button className="button button-outline button-small" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
          <Link to="/admin/purchase/orders/create" className="button button-small"><Plus size={14} /> Issue Purchase Order</Link>
        </div>
      </div>

      <div className="admin-table-filters">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search PO # or Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Issued">Issued</option>
          <option value="Partial">Partial Received</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="route-loading"><p>Loading Purchase Orders...</p></div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={44} className="empty-icon" />
          <h3>No Purchase Orders Found</h3>
          <p>No issued purchase orders match your criteria or backend service returned empty data.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Expected Delivery</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po) => (
                <tr key={po.id || po.poNumber}>
                  <td><strong>{po.poNumber || `#PO-${po.id}`}</strong></td>
                  <td>{po.supplierName || 'Honeywell Certified Supplier'}</td>
                  <td>{po.createdDate ? new Date(po.createdDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'Pending'}</td>
                  <td>${Number(po.totalAmount || 0).toFixed(2)}</td>
                  <td><span className={`status-badge status-${(po.status || 'Draft').toLowerCase()}`}>{po.status || 'Issued'}</span></td>
                  <td>
                    <Link to={`/admin/purchase/goods-receipt?poId=${po.id}`} className="button-text text-small" title="Goods Receipt">
                      Receive Goods
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
