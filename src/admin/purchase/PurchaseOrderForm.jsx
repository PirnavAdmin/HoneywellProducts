import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { createPurchaseOrder } from '../api/purchaseOrderApi';
import { fetchPurchaseIndentById } from '../api/purchaseIndentApi';
import { fetchProducts } from '../catalog/productsApi';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const indentId = searchParams.get('indentId');

  const [supplierName, setSupplierName] = useState('');
  const [warehouse, setWarehouse] = useState('Central Warehouse');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initData() {
      try {
        const prods = await fetchProducts();
        setAvailableProducts(Array.isArray(prods) ? prods : []);

        if (indentId) {
          const indent = await fetchPurchaseIndentById(indentId);
          if (indent && Array.isArray(indent.items)) {
            setItems(
              indent.items.map((it) => ({
                productId: it.productId,
                quantity: it.quantity || 1,
                unitPrice: 0,
                taxRate: 18
              }))
            );
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    initData();
  }, [indentId]);

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: 0, taxRate: 18 }]);
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

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setError('Please enter a supplier name.');
      return;
    }

    setLoading(true);
    setError(null);

    const subtotal = calculateSubtotal();
    const payload = {
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplierName: supplierName.trim(),
      warehouse,
      paymentTerms,
      expectedDeliveryDate,
      items: items.map((it) => {
        const p = availableProducts.find((prod) => String(prod.id) === String(it.productId));
        return {
          productId: it.productId,
          productName: p?.name || 'Hardware Unit',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: Number(it.quantity || 1) * Number(it.unitPrice || 0)
        };
      }),
      subtotal,
      totalAmount: subtotal,
      status: 'Issued',
      createdDate: new Date().toISOString()
    };

    try {
      await createPurchaseOrder(payload);
      navigate('/admin/purchase/orders');
    } catch (err) {
      console.error(err);
      setError('Failed to issue purchase order to backend API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stroyka-admin-page">
      <div className="page-header">
        <Link to="/admin/purchase/orders" className="button-text">&larr; Back to Purchase Orders</Link>
        <h1>Issue Purchase Order</h1>
      </div>

      <div className="admin-form-card">
        {error && <div className="error-box mb-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Supplier Name / Company <span className="required">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Global Tech Logistics &amp; Supplies"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label>Target Warehouse</label>
              <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                <option value="Central Warehouse">Central Warehouse</option>
                <option value="North Hub Warehouse">North Hub Warehouse</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>
          </div>

          <hr className="my-4" />
          <h3>Order Line Items</h3>

          {items.map((row, idx) => (
            <div key={idx} className="form-row align-center mb-2">
              <div className="form-group flex-2">
                <label>Product</label>
                <select value={row.productId} onChange={(e) => handleItemChange(idx, 'productId', e.target.value)} required>
                  <option value="">-- Select Product --</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Qty</label>
                <input type="number" min="1" value={row.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} required />
              </div>

              <div className="form-group flex-1">
                <label>Unit Price ($)</label>
                <input type="number" step="0.01" value={row.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} required />
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

          <div className="order-total-preview text-right my-3">
            <h4>Total Calculated Amount: <strong>${calculateSubtotal().toFixed(2)}</strong></h4>
          </div>

          <div className="form-actions-row mt-4">
            <button type="submit" className="button button-small" disabled={loading}>
              <Save size={14} /> Issue Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
