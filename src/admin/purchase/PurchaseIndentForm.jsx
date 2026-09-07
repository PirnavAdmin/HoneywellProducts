import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { createPurchaseIndent } from '../api/purchaseIndentApi';
import { fetchProducts } from '../catalog/productsApi';

export default function PurchaseIndentForm() {
  const navigate = useNavigate();
  const [requestedBy, setRequestedBy] = useState('Store Manager');
  const [department, setDepartment] = useState('Warehouse Operations');
  const [warehouse, setWarehouse] = useState('Central Warehouse');
  const [priority, setPriority] = useState('Normal');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, remarks: '' }]);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const prods = await fetchProducts();
        setAvailableProducts(Array.isArray(prods) ? prods : []);
      } catch (e) {
        console.error('Error fetching products for indent form:', e);
      }
    }
    loadCatalog();
  }, []);

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, remarks: '' }]);
  };

  const removeItemRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some((it) => !it.productId)) {
      setError('Please select a product for all item rows.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      indentNumber: `IND-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      requestedBy,
      department,
      warehouse,
      priority,
      reason,
      items: items.map((it) => {
        const p = availableProducts.find((prod) => String(prod.id) === String(it.productId));
        return {
          productId: it.productId,
          productName: p?.name || 'Honeywell Unit',
          sku: p?.sku || '',
          quantity: Number(it.quantity) || 1,
          remarks: it.remarks
        };
      }),
      status: 'Pending'
    };

    try {
      await createPurchaseIndent(payload);
      navigate('/admin/purchase/indents');
    } catch (err) {
      console.error(err);
      setError('Failed to save purchase indent to backend API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stroyka-admin-page">
      <div className="page-header">
        <Link to="/admin/purchase/indents" className="button-text">&larr; Back to Indents List</Link>
        <h1>Create Purchase Indent</h1>
      </div>

      <div className="admin-form-card">
        {error && <div className="error-box mb-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Requested By</label>
              <input type="text" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Warehouse</label>
              <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                <option value="Central Warehouse">Central Warehouse</option>
                <option value="North Hub Warehouse">North Hub Warehouse</option>
                <option value="South Logistics Center">South Logistics Center</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Justification / Reason</label>
            <textarea rows={2} placeholder="Reason for inventory requisition..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <hr className="my-4" />
          <h3>Requisition Line Items</h3>

          {items.map((row, idx) => (
            <div key={idx} className="indent-item-row form-row align-center mb-2">
              <div className="form-group flex-2">
                <label>Product</label>
                <select value={row.productId} onChange={(e) => handleItemChange(idx, 'productId', e.target.value)} required>
                  <option value="">-- Select Product --</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category || 'Product'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Quantity</label>
                <input type="number" min="1" value={row.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} required />
              </div>

              <div className="form-group flex-2">
                <label>Remarks</label>
                <input type="text" placeholder="Optional notes..." value={row.remarks} onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)} />
              </div>

              {items.length > 1 && (
                <button type="button" className="button-text text-danger mt-4" onClick={() => removeItemRow(idx)}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button type="button" className="button button-outline button-small my-3" onClick={addItemRow}>
            <Plus size={14} /> Add Line Item
          </button>

          <div className="form-actions-row mt-4">
            <button type="submit" className="button button-small" disabled={loading}>
              <Save size={14} /> Save Purchase Indent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
