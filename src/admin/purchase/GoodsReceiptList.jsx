import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Boxes, CheckCircle, Search, RefreshCw, ArrowLeft } from 'lucide-react';
import { fetchPurchaseOrderById } from '../api/purchaseOrderApi';
import { adjustStock } from '../api/stock';

export default function GoodsReceiptList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const poId = searchParams.get('poId');

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(Boolean(poId));
  const [receivedQtys, setReceivedQtys] = useState({});
  const [receiving, setReceiving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadPO() {
      if (!poId) return;
      try {
        setLoading(true);
        const data = await fetchPurchaseOrderById(poId);
        setPo(data);
        if (data && Array.isArray(data.items)) {
          const initialMap = {};
          data.items.forEach((item) => {
            initialMap[item.productId || item.id] = item.quantity || 1;
          });
          setReceivedQtys(initialMap);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPO();
  }, [poId]);

  const handleQtyChange = (prodId, val) => {
    setReceivedQtys((prev) => ({ ...prev, [prodId]: Number(val) }));
  };

  const handleProcessGoodsReceipt = async () => {
    if (!po || !po.items) return;
    setReceiving(true);
    try {
      // Process inventory stock update for each received line item using adjustStock
      for (const item of po.items) {
        const qty = receivedQtys[item.productId || item.id] || item.quantity;
        if (qty > 0 && item.productId) {
          await adjustStock(item.productId, {
            actionType: 'Add',
            quantity: qty,
            reason: `Goods receipt for PO #${po.poNumber || po.id}`,
            note: `Received against PO #${po.poNumber || po.id}`
          });
        }
      }
      setSuccessMsg(`Goods Receipt Note logged successfully for PO #${po.poNumber || po.id}. Warehouse stock updated.`);
      setTimeout(() => navigate('/admin/purchase/orders'), 2500);
    } catch (e) {
      console.error(e);
      alert('Failed to update stock in backend inventory. Please retry.');
    } finally {
      setReceiving(false);
    }
  };

  return (
    <div className="stroyka-admin-page">
      <div className="page-header">
        <button className="button-text" onClick={() => navigate('/admin/purchase/orders')}>&larr; Back to Purchase Orders</button>
        <h1><Boxes size={28} /> Goods Receipt Note (GRN)</h1>
        <p>Receive incoming shipments against issued Purchase Orders to update inventory levels.</p>
      </div>

      {successMsg && (
        <div className="alert alert-success mb-4">
          <CheckCircle size={18} /> <span>{successMsg}</span>
        </div>
      )}

      {poId && loading ? (
        <div className="route-loading"><p>Loading Purchase Order for Receiving...</p></div>
      ) : po ? (
        <div className="admin-form-card">
          <div className="flex-between mb-3">
            <div>
              <h3>PO #{po.poNumber || po.id}</h3>
              <p>Supplier: <strong>{po.supplierName || 'Hardware Supplier'}</strong> • Target: {po.warehouse || 'Central Warehouse'}</p>
            </div>
            <span className="status-badge">{po.status || 'Issued'}</span>
          </div>

          <h4>Receive Items into Inventory</h4>
          <table className="admin-table my-3">
            <thead>
              <tr>
                <th>Product</th>
                <th>Ordered Qty</th>
                <th>Receiving Qty</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(po.items) && po.items.map((item, idx) => {
                const prodId = item.productId || item.id || idx;
                return (
                  <tr key={idx}>
                    <td><strong>{item.productName || item.name || 'Hardware Unit'}</strong></td>
                    <td>{item.quantity || 1}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity || 999}
                        style={{ width: '100px' }}
                        value={receivedQtys[prodId] ?? item.quantity}
                        onChange={(e) => handleQtyChange(prodId, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="form-actions-row mt-4">
            <button className="button button-small" onClick={handleProcessGoodsReceipt} disabled={receiving}>
              {receiving ? 'Processing Stock Entry...' : 'Process GRN & Update Inventory'}
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Boxes size={44} className="empty-icon" />
          <h3>Select a Purchase Order to Receive Goods</h3>
          <p>Please select an issued Purchase Order from the list to process receiving into inventory.</p>
          <button className="button button-small" onClick={() => navigate('/admin/purchase/orders')}>
            View Purchase Orders List
          </button>
        </div>
      )}
    </div>
  );
}
