import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { getReturnsConfig } from '../api/returns';

export default function WarrantyReturnsList() {
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const conf = await getReturnsConfig();
        setConfig(conf);
        // Load warranty claims if any exist in API
        setReturnsList([]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="stroyka-admin-page">
      <div className="page-header flex-between">
        <div>
          <h1>Warranty &amp; Sales Returns</h1>
          <p>Process hardware warranty claims, technical inspections, replacements &amp; credit notes</p>
        </div>
      </div>

      <div className="admin-table-filters">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search RMA #, Order # or Serial #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="route-loading"><p>Loading Warranty Return records...</p></div>
      ) : returnsList.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck size={44} className="empty-icon" />
          <h3>No Pending Warranty Returns</h3>
          <p>There are currently no active warranty return requests or RMA inspections pending in the system.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>RMA #</th>
                <th>Order #</th>
                <th>Product</th>
                <th>Reason</th>
                <th>Warranty Status</th>
                <th>Resolution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returnsList.map((item) => (
                <tr key={item.id}>
                  <td><strong>#{item.rmaNumber || item.id}</strong></td>
                  <td>#{item.orderId}</td>
                  <td>{item.productName}</td>
                  <td>{item.reason}</td>
                  <td><span className="status-badge">{item.warrantyStatus || 'Valid Warranty'}</span></td>
                  <td>{item.resolution || 'Inspection Pending'}</td>
                  <td>
                    <button className="button-text text-primary">Inspect &amp; Approve</button>
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
