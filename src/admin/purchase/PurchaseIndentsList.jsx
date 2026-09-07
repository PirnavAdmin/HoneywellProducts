import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, FileText, CheckCircle, XCircle } from 'lucide-react';
import { fetchPurchaseIndents, updatePurchaseIndentStatus } from '../api/purchaseIndentApi';

export default function PurchaseIndentsList() {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseIndents();
      setIndents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setIndents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePurchaseIndentStatus(id, newStatus);
      loadData();
    } catch (e) {
      alert('Failed to update status. Backend service may be offline.');
    }
  };

  const filteredIndents = indents.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (search && !item.indentNumber?.toLowerCase().includes(search.toLowerCase()) && !item.requestedBy?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="stroyka-admin-page">
      <div className="page-header flex-between">
        <div>
          <h1>Purchase Indents</h1>
          <p>Internal requisitions for warehouse inventory procurement</p>
        </div>
        <div className="btn-group">
          <button className="button button-outline button-small" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
          <Link to="/admin/purchase/indents/create" className="button button-small"><Plus size={14} /> Create Purchase Indent</Link>
        </div>
      </div>

      <div className="admin-table-filters">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search Indent # or Requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Converted">Converted to PO</option>
        </select>
      </div>

      {loading ? (
        <div className="route-loading"><p>Loading Purchase Indents...</p></div>
      ) : filteredIndents.length === 0 ? (
        <div className="empty-state">
          <FileText size={44} className="empty-icon" />
          <h3>No Purchase Indents Found</h3>
          <p>No procurement requisitions match your criteria or backend service returned empty data.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Indent #</th>
                <th>Date</th>
                <th>Requested By</th>
                <th>Department</th>
                <th>Warehouse</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndents.map((item) => (
                <tr key={item.id || item.indentNumber}>
                  <td><strong>{item.indentNumber || `#IND-${item.id}`}</strong></td>
                  <td>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                  <td>{item.requestedBy || 'Store Manager'}</td>
                  <td>{item.department || 'Warehouse Operations'}</td>
                  <td>{item.warehouse || 'Central Warehouse'}</td>
                  <td><span className={`badge priority-${(item.priority || 'Normal').toLowerCase()}`}>{item.priority || 'Normal'}</span></td>
                  <td><span className={`status-badge status-${(item.status || 'Pending').toLowerCase()}`}>{item.status || 'Pending'}</span></td>
                  <td>
                    <div className="table-actions-row">
                      {item.status === 'Pending' && (
                        <>
                          <button className="button-text text-success" title="Approve" onClick={() => handleStatusChange(item.id, 'Approved')}>
                            <CheckCircle size={15} />
                          </button>
                          <button className="button-text text-danger" title="Reject" onClick={() => handleStatusChange(item.id, 'Rejected')}>
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {item.status === 'Approved' && (
                        <Link to={`/admin/purchase/orders/create?indentId=${item.id}`} className="button-text text-primary" title="Create PO">
                          Convert to PO
                        </Link>
                      )}
                    </div>
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
