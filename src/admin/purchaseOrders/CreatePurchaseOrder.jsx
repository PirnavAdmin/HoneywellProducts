import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, RefreshCw, FileCheck } from 'lucide-react';
import { fetchSuppliers } from '../suppliers/suppliersApi';
import { fetchProducts } from '../catalog/productsApi';
import { fetchPurchaseIndents, createPurchaseOrder } from '../api/purchase';

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const indentIdParam = searchParams.get('indentId');

  const [suppliersList, setSuppliersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [indentsList, setIndentsList] = useState([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    indentId: indentIdParam || '',
    supplierId: '',
    supplierName: '',
    warehouse: 'Main Warehouse (WH-01)',
    paymentTerms: 'Net 30',
    expectedDeliveryDate: '',
    remarks: '',
  });

  const [selectedItems, setSelectedItems] = useState([
    { productId: '', sku: '', name: '', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    const loadMasterData = async () => {
      setLoadingData(true);
      try {
        const [suppliers, products, indents] = await Promise.all([
          fetchSuppliers().catch(() => []),
          fetchProducts().catch(() => []),
          fetchPurchaseIndents().catch(() => [])
        ]);

        setSuppliersList(suppliers || []);
        setProductsList(products || []);
        setIndentsList(indents || []);

        if (indentIdParam) {
          const matchedIndent = indents.find(i => String(i.id) === String(indentIdParam));
          if (matchedIndent && matchedIndent.items?.length > 0) {
            setFormData(prev => ({
              ...prev,
              indentId: matchedIndent.id,
              warehouse: matchedIndent.warehouse || prev.warehouse
            }));
            setSelectedItems(matchedIndent.items.map(item => ({
              productId: item.productId || '',
              sku: item.sku || `PROD-${item.productId}`,
              name: item.name || 'Product',
              quantity: Number(item.quantity || 1),
              unitPrice: Number(item.estimatedCost || item.unitPrice || 0)
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load master data for Purchase Order:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadMasterData();
  }, [indentIdParam]);

  const handleIndentSelect = (e) => {
    const selectedId = e.target.value;
    setFormData(prev => ({ ...prev, indentId: selectedId }));
    
    if (selectedId) {
      const matched = indentsList.find(i => String(i.id) === String(selectedId));
      if (matched && matched.items?.length > 0) {
        setSelectedItems(matched.items.map(item => ({
          productId: item.productId || '',
          sku: item.sku || `PROD-${item.productId}`,
          name: item.name || 'Product',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.estimatedCost || item.unitPrice || 0)
        })));
      }
    }
  };

  const handleSupplierSelect = (e) => {
    const suppId = e.target.value;
    const matched = suppliersList.find(s => String(s.id) === String(suppId));
    setFormData(prev => ({
      ...prev,
      supplierId: suppId,
      supplierName: matched ? (matched.name || matched.businessName) : ''
    }));
  };

  const handleProductSelect = (index, productId) => {
    const matched = productsList.find(p => String(p.id) === String(productId));
    const updated = [...selectedItems];
    if (matched) {
      updated[index] = {
        ...updated[index],
        productId: matched.id,
        sku: matched.sku || `PROD-${matched.id}`,
        name: matched.name || matched.title || 'Product',
        unitPrice: Number(matched.price || matched.sellingPrice || 0)
      };
    } else {
      updated[index].productId = productId;
    }
    setSelectedItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  const addItemRow = () => {
    setSelectedItems([...selectedItems, { productId: '', sku: '', name: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + (Number(item.unitPrice || 0) * Number(item.quantity || 1)), 
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierId && !formData.supplierName) {
      alert("Please select a Supplier for the Purchase Order.");
      return;
    }
    if (selectedItems.some(item => !item.name)) {
      alert("Please select valid products for all item rows.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createPurchaseOrder({
        ...formData,
        items: selectedItems
      });
      alert("Purchase Order created successfully!");
      navigate('/admin/purchase-orders');
    } catch (err) {
      console.error("Error creating Purchase Order:", err);
      alert("Failed to create Purchase Order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      background: '#f8fafc', 
      minHeight: '100vh', 
      padding: '24px 32px', 
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", 
      color: '#0f172a',
      maxWidth: '1440px',
      margin: '0 auto'
    }}>
      {/* Top Banner Card */}
      <section style={{ 
        background: '#ffffff', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
        padding: '24px 32px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <Link to="/admin/purchase-orders" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '12px', 
            color: '#2563eb', 
            fontWeight: '700', 
            textDecoration: 'none', 
            marginBottom: '10px',
            background: '#eff6ff',
            padding: '6px 14px',
            borderRadius: '20px'
          }}>
            <ArrowLeft size={14} /> Back to Purchase Orders
          </Link>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            PROCUREMENT & SUPPLIER ORDERS
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            New Purchase Order (PO)
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Issue an official purchase order to vendor suppliers with item pricing & payment terms.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            onClick={() => navigate('/admin/purchase-orders')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              border: '1px solid #cbd5e1', 
              backgroundColor: '#ffffff', 
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              color: '#ffffff', 
              padding: '10px 24px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              fontWeight: '700', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              opacity: isSubmitting ? 0.6 : 1 
            }}
          >
            <FileCheck size={16} /> {isSubmitting ? 'Issuing PO...' : 'Issue Purchase Order'}
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Order Details */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', 
          padding: '28px' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            borderBottom: '1px solid #f1f5f9', 
            paddingBottom: '16px', 
            marginBottom: '20px' 
          }}>
            <div style={{ width: '4px', height: '18px', background: '#2563eb', borderRadius: '4px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Purchase Order Information
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px' 
          }}>
            {/* Field 1: Supplier */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Select Supplier / Vendor <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {loadingData ? (
                <div style={{ fontSize: '12.5px', color: '#94a3b8', padding: '10px 0' }}>Loading suppliers...</div>
              ) : (
                <select 
                  value={formData.supplierId}
                  onChange={handleSupplierSelect}
                  style={{ 
                    width: '100%', 
                    height: '42px', 
                    padding: '0 14px', 
                    fontSize: '13.5px', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '10px', 
                    outline: 'none', 
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: '500'
                  }}
                  required
                >
                  <option value="">Choose Supplier...</option>
                  {suppliersList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.businessName} ({s.category || 'General'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Field 2: Link Indent */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Link Purchase Indent (Optional)
              </label>
              <select 
                value={formData.indentId}
                onChange={handleIndentSelect}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 14px', 
                  fontSize: '13.5px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  outline: 'none', 
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '500'
                }}
              >
                <option value="">Direct PO (No Linked Indent)</option>
                {indentsList.map(indent => (
                  <option key={indent.id} value={indent.id}>
                    {indent.indentNumber || `IND-${indent.id}`} - {indent.requestedBy} ({indent.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Warehouse */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Delivery Warehouse
              </label>
              <select 
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 14px', 
                  fontSize: '13.5px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  outline: 'none', 
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '500'
                }}
              >
                <option value="Main Warehouse (WH-01)">Main Warehouse (WH-01)</option>
                <option value="North Regional Hub (WH-02)">North Regional Hub (WH-02)</option>
                <option value="Retail Outlet Stock (WH-03)">Retail Outlet Stock (WH-03)</option>
              </select>
            </div>

            {/* Field 4: Payment Terms */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Payment Terms
              </label>
              <select 
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 14px', 
                  fontSize: '13.5px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  outline: 'none', 
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '500'
                }}
              >
                <option value="Immediate / Advance">Immediate / Advance</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>

            {/* Field 5: Expected Date */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Expected Delivery Date
              </label>
              <input 
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 14px', 
                  fontSize: '13.5px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  outline: 'none', 
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Field 6: Remarks */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Special Instructions / Remarks
              </label>
              <input 
                type="text"
                placeholder="Shipping guidelines, tax notes or contract references..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 14px', 
                  fontSize: '13.5px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  outline: 'none', 
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Order Line Items Table */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', 
          padding: '28px' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid #f1f5f9', 
            paddingBottom: '16px', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '18px', background: '#2563eb', borderRadius: '4px' }}></div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Order Line Items
              </h2>
            </div>
            <button 
              type="button"
              onClick={addItemRow}
              style={{ 
                background: '#eff6ff', 
                border: '1px dashed #93c5fd', 
                color: '#1d4ed8', 
                fontSize: '12.5px', 
                fontWeight: '700', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}
            >
              <Plus size={14} /> Add Product Line
            </button>
          </div>

          {loadingData ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw className="animate-spin" size={16} /> Loading catalog products...
            </div>
          ) : (
            <div>
              {/* Table Column Headers */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '4fr 1.5fr 2fr 2fr 48px', 
                gap: '14px', 
                padding: '10px 16px', 
                background: '#f8fafc', 
                borderRadius: '10px', 
                marginBottom: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PRODUCT ITEM / CATALOG SPEC
                </div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ORDER QTY
                </div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  UNIT PRICE (₹)
                </div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  LINE TOTAL (₹)
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                  DEL
                </div>
              </div>

              {/* Dynamic Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedItems.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '4fr 1.5fr 2fr 2fr 48px', 
                    gap: '14px', 
                    alignItems: 'center', 
                    background: '#ffffff', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                    {/* Item Select */}
                    <div>
                      <select 
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        style={{ 
                          width: '100%', 
                          height: '38px', 
                          padding: '0 10px', 
                          fontSize: '13px', 
                          border: '1px solid #cbd5e1', 
                          borderRadius: '8px', 
                          backgroundColor: '#ffffff', 
                          outline: 'none',
                          color: '#0f172a'
                        }}
                        required
                      >
                        <option value="">Select Product from Catalog...</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.title} (Price: ₹{p.price || p.sellingPrice || 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ 
                          width: '100%', 
                          height: '38px', 
                          padding: '0 10px', 
                          fontSize: '13px', 
                          border: '1px solid #cbd5e1', 
                          borderRadius: '8px', 
                          backgroundColor: '#ffffff', 
                          outline: 'none',
                          color: '#0f172a',
                          fontWeight: '600'
                        }}
                        required
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <input 
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        style={{ 
                          width: '100%', 
                          height: '38px', 
                          padding: '0 10px', 
                          fontSize: '13px', 
                          border: '1px solid #cbd5e1', 
                          borderRadius: '8px', 
                          backgroundColor: '#ffffff', 
                          outline: 'none',
                          color: '#0f172a',
                          fontWeight: '600'
                        }}
                        required
                      />
                    </div>

                    {/* Line Total */}
                    <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      ₹{(Number(item.unitPrice || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                    </div>

                    {/* Remove Action */}
                    <div style={{ textAlign: 'center' }}>
                      {selectedItems.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeItemRow(index)}
                          style={{ 
                            background: '#fef2f2', 
                            border: 'none', 
                            color: '#ef4444', 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '8px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer' 
                          }}
                          title="Remove Item Row"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Financial Summary Banner */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          borderRadius: '16px', 
          padding: '24px 32px', 
          color: '#ffffff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.15)'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              PURCHASE ORDER VALUE SUMMARY
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              Total ordered items: <strong style={{ color: '#ffffff' }}>{selectedItems.length} line(s)</strong> | Status: <strong style={{ color: '#38bdf8' }}>Issued to Vendor</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
              Grand Total PO Value
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#60a5fa', letterSpacing: '-0.02em' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '8px' }}>
          <button 
            type="button"
            onClick={() => navigate('/admin/purchase-orders')}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '10px', 
              fontSize: '13.5px', 
              fontWeight: '600', 
              color: '#475569', 
              border: '1px solid #cbd5e1', 
              backgroundColor: '#ffffff', 
              cursor: 'pointer' 
            }}
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              color: '#ffffff', 
              padding: '12px 28px', 
              borderRadius: '10px', 
              fontSize: '13.5px', 
              fontWeight: '700', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              opacity: isSubmitting ? 0.6 : 1 
            }}
          >
            <FileCheck size={16} /> {isSubmitting ? 'Issuing PO...' : 'Issue Purchase Order'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreatePurchaseOrder;
