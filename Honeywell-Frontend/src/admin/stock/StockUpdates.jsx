import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateStandardizedSku } from '../../utils/skuGenerator';
import { fetchProducts } from '../catalog/productsApi';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit3,
  X,
  Save,
  ChevronUp,
  ChevronDown,
  Boxes,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import '../catalog/adminModule.css';
import './StockUpdates.css';
import { Pagination } from '../components/ActionButtons';
import { fetchCategories } from '../catalog/catalogApi';
import {
  getStockLedger,
  adjustStock,
  addStockEntry,
} from '../api/stock';

const STATUSES = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

const statusMeta = {
  'In Stock':    { className: 'stock-badge--in',  icon: CheckCircle2 },
  'Low Stock':   { className: 'stock-badge--low', icon: AlertTriangle },
  'Out of Stock':{ className: 'stock-badge--out', icon: X },
};

const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN');
const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ─── Stock Badge ─────────────────────────────────────── */
const StockBadge = ({ status }) => {
  const meta = statusMeta[status] || statusMeta['In Stock'];
  const Icon = meta.icon;
  return (
    <span className={`stock-badge ${meta.className}`}>
      <Icon size={12} />
      {status}
    </span>
  );
};

/* ─── Trend Indicator ────────────────────────────────── */
const TrendIndicator = ({ trend, change }) => {
  if (trend === 'up') return (
    <span className="stock-trend stock-trend--up">
      <ChevronUp size={13} /> +{change}%
    </span>
  );
  if (trend === 'down') return (
    <span className="stock-trend stock-trend--down">
      <ChevronDown size={13} /> {change}%
    </span>
  );
  return <span className="stock-trend stock-trend--stable">— Stable</span>;
};

/* ─── Adjust Modal ───────────────────────────────────── */
const AdjustModal = ({ item: initialItem, products = [], onClose, onSave }) => {
  const [selectedItem, setSelectedItem] = useState(initialItem);
  const [adjustType, setAdjustType] = useState('add');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [reorderLevel, setReorderLevel] = useState(initialItem?.reorderLevel ?? 10);
  const [costPrice, setCostPrice] = useState(initialItem?.costPrice ?? '');
  const [sellingPrice, setSellingPrice] = useState(initialItem?.sellingPrice ?? '');

  const reasons = adjustType === 'add'
    ? ['Stock Received from Supplier', 'Customer Return', 'Warehouse Transfer In', 'Physical Count Surplus', 'Production Output', 'Other Addition']
    : ['Customer Sale / Dispatch', 'Damaged / Spoiled Goods', 'Warehouse Transfer Out', 'Physical Count Deficit', 'Expired Stock Write-off', 'Other Deduction'];

  const currentStock = selectedItem ? Number(selectedItem.currentStock || 0) : 0;
  const unit = selectedItem ? selectedItem.unit || 'Pcs' : 'Pcs';
  const qtyNum = Number(qty || 0);

  const newQty = adjustType === 'add'
    ? currentStock + qtyNum
    : Math.max(0, currentStock - qtyNum);

  const isChanged = (
    qtyNum > 0 ||
    String(reorderLevel) !== String(selectedItem?.reorderLevel ?? '') ||
    String(costPrice) !== String(selectedItem?.costPrice ?? '') ||
    String(sellingPrice) !== String(selectedItem?.sellingPrice ?? '')
  );

  const handleSave = () => {
    if (!selectedItem || !isChanged) return;
    onSave(selectedItem, {
      actionType: adjustType === 'add' ? 'Add' : 'Remove',
      quantity: qtyNum,
      reason: reason || (qtyNum > 0 ? (adjustType === 'add' ? 'Stock Received from Supplier' : 'Customer Sale / Dispatch') : 'Ledger Update'),
      note: note || '',
      newQty: qtyNum > 0 ? newQty : currentStock,
      reorderLevel: reorderLevel !== '' ? Number(reorderLevel) : undefined,
      costPrice: costPrice !== '' ? Number(costPrice) : undefined,
      sellingPrice: sellingPrice !== '' ? Number(sellingPrice) : undefined,
    });
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        animation: 'overlayFadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '490px',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 25px 60px -10px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          animation: 'modalSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '14px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#0284c7',
                  background: '#e0f2fe',
                  padding: '2px 7px',
                  borderRadius: '4px',
                }}
              >
                Stock Ledger
              </span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Adjust Stock Level
              </span>
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                marginTop: '3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '400px',
              }}
              title={selectedItem?.name}
            >
              {selectedItem?.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          
          {/* Target Product Summary Bar */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#334155',
                  background: '#e2e8f0',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                SKU: {selectedItem?.sku || '—'}
              </span>
              {selectedItem?.category && (
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                  {selectedItem.category}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Current:</span>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: currentStock <= 0 ? '#dc2626' : currentStock <= (selectedItem?.reorderLevel || 5) ? '#d97706' : '#15803d',
                  background: currentStock <= 0 ? '#fee2e2' : currentStock <= (selectedItem?.reorderLevel || 5) ? '#fef3c7' : '#dcfce7',
                  border: `1px solid ${currentStock <= 0 ? '#fecaca' : currentStock <= (selectedItem?.reorderLevel || 5) ? '#fde68a' : '#bbf7d0'}`,
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {currentStock} {unit}
              </span>
            </div>
          </div>

          {/* Segmented Adjustment Mode Control */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setAdjustType('add')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: adjustType === 'add' ? '1px solid #10b981' : '1px solid transparent',
                background: adjustType === 'add' ? '#ffffff' : 'transparent',
                color: adjustType === 'add' ? '#047857' : '#64748b',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: adjustType === 'add' ? '0 1px 4px rgba(16, 185, 129, 0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowUpCircle size={15} />
              <span>Add Stock (Inflow)</span>
            </button>

            <button
              type="button"
              onClick={() => setAdjustType('remove')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: adjustType === 'remove' ? '1px solid #ef4444' : '1px solid transparent',
                background: adjustType === 'remove' ? '#ffffff' : 'transparent',
                color: adjustType === 'remove' ? '#b91c1c' : '#64748b',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: adjustType === 'remove' ? '0 1px 4px rgba(239, 68, 68, 0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowDownCircle size={15} />
              <span>Deduct Stock (Outflow)</span>
            </button>
          </div>

          {/* Before & After Live Visualizer */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '10px 14px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Current
              </span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                {currentStock} <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{unit}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: qtyNum > 0 ? (adjustType === 'add' ? '#dcfce7' : '#fee2e2') : '#f1f5f9',
                  color: qtyNum > 0 ? (adjustType === 'add' ? '#15803d' : '#b91c1c') : '#64748b',
                  border: `1px solid ${qtyNum > 0 ? (adjustType === 'add' ? '#bbf7d0' : '#fecaca') : '#e2e8f0'}`,
                }}
              >
                {adjustType === 'add' ? `+${qtyNum}` : `-${qtyNum}`} {unit}
              </span>
              <TrendingUp
                size={14}
                style={{
                  color: adjustType === 'add' ? '#10b981' : '#ef4444',
                  transform: adjustType === 'remove' ? 'rotate(90deg)' : 'none',
                }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Resulting
              </span>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: adjustType === 'add' ? '#047857' : newQty <= 0 ? '#b91c1c' : '#b45309',
                  marginTop: '1px',
                }}
              >
                {newQty} <span style={{ fontSize: '11px', fontWeight: 600 }}>{unit}</span>
              </div>
            </div>
          </div>

          {/* Form Fields: Quantity & Reason */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#475569',
                  letterSpacing: '0.04em',
                  marginBottom: '5px',
                }}
              >
                Adjust Quantity ({unit}) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '7px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#475569',
                  letterSpacing: '0.04em',
                  marginBottom: '5px',
                }}
              >
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 10px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: '#0f172a',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '7px',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              >
                <option value="">Select reason...</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Remarks Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#475569',
                letterSpacing: '0.04em',
                marginBottom: '5px',
              }}
            >
              Notes / Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Stock audit reference or invoice #..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '6px 10px',
                fontSize: '12.5px',
                color: '#0f172a',
                border: '1.5px solid #cbd5e1',
                borderRadius: '7px',
                background: '#ffffff',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Ledger Thresholds & Pricing Section */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '12px 14px',
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.04em' }}>
                Ledger Thresholds & Pricing
              </span>
              <a
                href={`/admin/catalog/products-form?id=${selectedItem?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textDecoration: 'none' }}
              >
                Full Product Edit ↗
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  placeholder="10"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '6px 8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '6px',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Cost Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '6px 8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '6px',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '6px 8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '6px',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#475569',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedItem || !isChanged}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#ffffff',
              background: !selectedItem || !isChanged
                ? '#94a3b8'
                : adjustType === 'add'
                  ? '#10b981'
                  : '#dc2626',
              border: 'none',
              borderRadius: '7px',
              cursor: !selectedItem || !isChanged ? 'not-allowed' : 'pointer',
              boxShadow: !selectedItem || !isChanged
                ? 'none'
                : adjustType === 'add'
                  ? '0 2px 6px rgba(16, 185, 129, 0.25)'
                  : '0 2px 6px rgba(220, 38, 38, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Save size={14} />
            <span>{qtyNum > 0 ? (adjustType === 'add' ? 'Confirm Addition' : 'Confirm Deduction') : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─── Add Entry Modal ─────────────────────────────────── */
const AddEntryModal = ({ categories = [], onClose, onSave }) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  const handleSave = () => {
    if (!sku || !name || !category || !currentStock || !reorderLevel || !costPrice || !sellingPrice) {
      alert("Please fill in all required fields.");
      return;
    }
    
    const catObj = categories.find(c => (c.name || c) === category);
    const categoryId = catObj ? Number(catObj.id) : null;

    onSave({
      sku: sku.toUpperCase().trim(),
      productName: name.trim(),
      categoryId: categoryId,
      categoryName: category,
      subcategoryName: subcategory.trim() || 'General',
      supplierName: supplier.trim() || 'Unknown',
      initialStockQty: Number(currentStock),
      reorderLevel: Number(reorderLevel),
      stockUnit: unit,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice)
    });
  };

  const handleGenerateSku = async () => {
    let existingProducts = [];
    try {
      existingProducts = await fetchProducts();
    } catch (e) {
      console.warn('Could not fetch products for sequence:', e);
    }

    const result = generateStandardizedSku({
      brand: supplier || 'Honeywell',
      categoryName: category,
      subcategoryName: subcategory,
      specification: name,
      productName: name,
      existingProducts,
    });

    if (!result.success) {
      alert(result.error);
      return;
    }

    setSku(result.sku);
  };

  return createPortal(
    <div className="stock-modal-overlay" style={{ zIndex: 999999 }} onClick={onClose}>
      <div className="stock-modal stock-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="stock-modal__header">
          <div>
            <p className="stock-modal__kicker">Inventory Management</p>
            <h2 className="stock-modal__title">Add New Stock Entry</h2>
            <p className="stock-modal__sku">Register a new product SKU into the ledger system</p>
          </div>
          <button className="stock-modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="stock-modal__body">
          <div className="stock-modal__form-grid">
            
            {/* Left Column: Product Information */}
            <div className="stock-form-section">
              <h3 className="stock-form-section__title"><Boxes size={15} /> Product Information</h3>
              
              <div className="catalog-field">
                <label>Product Name <span className="field-required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Submersible Motor 2HP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="catalog-field">
                <label>SKU Code <span className="field-required">*</span></label>
                <div className="sku-input-wrap">
                  <input
                    type="text"
                    placeholder="e.g. SAT-MOT-054"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                  <button className="sku-gen-btn" onClick={handleGenerateSku} type="button" title="Generate Standardized SKU Code">
                    Generate
                  </button>
                </div>
              </div>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Category <span className="field-required">*</span></label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">Select Category...</option>
                    {categories.map(c => {
                      const name = c.name || c;
                      return <option key={name} value={name}>{name}</option>;
                    })}
                  </select>
                </div>

                <div className="catalog-field">
                  <label>Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Pumps & Motors"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="catalog-field">
                <label>Supplier / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Kirloskar Ltd."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column: Inventory & Pricing */}
            <div className="stock-form-section">
              <h3 className="stock-form-section__title"><BarChart3 size={15} /> Inventory & Pricing</h3>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Initial Stock Qty <span className="field-required">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    required
                  />
                </div>

                <div className="catalog-field">
                  <label>Reorder Level <span className="field-required">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Stock Unit <span className="field-required">*</span></label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} required>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Sets">Sets</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Units">Units</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Litres">Litres</option>
                  </select>
                </div>

                <div className="catalog-field" style={{ opacity: 0, pointerEvents: 'none' }}>
                  <label>Placeholder</label>
                  <input type="text" disabled />
                </div>
              </div>

              <div className="stock-field-row">
                <div className="catalog-field">
                  <label>Cost Price (INR) <span className="field-required">*</span></label>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="catalog-field">
                  <label>Selling Price (INR) <span className="field-required">*</span></label>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        <div className="stock-modal__footer">
          <button className="catalog-btn" onClick={onClose}>Cancel</button>
          <button
            className="catalog-btn catalog-btn--primary"
            onClick={handleSave}
          >
            <Plus size={15} />
            Add Entry
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─── Main Screen ────────────────────────────────────── */
const StockUpdates = () => {
  const [items, setItems] = useState([]);
  const [apiMetrics, setApiMetrics] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadLedger = async () => {
    setLoading(true);
    try {
      const response = await getStockLedger({ _t: Date.now() });
      if (response && response.items) {
        setItems(response.items);
        setApiMetrics(response.apiMetrics);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn("Failed to fetch stock ledger from API:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setApiCategories(cats);
    } catch (err) {
      console.warn("Failed to fetch dynamic categories:", err);
    }
  };

  useEffect(() => {
    loadLedger();
    loadCategories();
  }, []);

  /* ── Metrics ── */
  const metrics = useMemo(() => {
    if (apiMetrics && apiMetrics.inventoryValue) {
      return {
        total: apiMetrics.totalSkus ?? items.length,
        inStock: apiMetrics.inStock ?? items.filter(i => i.status === 'In Stock').length,
        lowStock: apiMetrics.lowStock ?? items.filter(i => i.status === 'Low Stock').length,
        outOfStock: apiMetrics.outOfStock ?? items.filter(i => i.status === 'Out of Stock').length,
        totalValueStr: apiMetrics.inventoryValue
      };
    }
    return {
      total: items.length,
      inStock: items.filter(i => i.status === 'In Stock').length,
      lowStock: items.filter(i => i.status === 'Low Stock').length,
      outOfStock: items.filter(i => i.status === 'Out of Stock').length,
      totalValueNum: items.reduce((s, i) => s + i.currentStock * i.costPrice, 0)
    };
  }, [items, apiMetrics]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i => {
      const matchSearch = !q || [i.sku, i.name, i.category, i.supplier].join(' ').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'All' || i.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || i.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  // Extract unique categories from actual items dynamically for the filter dropdown
  const filterCategories = useMemo(() => {
    const list = new Set(items.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [items]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  const handleSaveAdjust = async (item, adjustmentData) => {
    setLoading(true);
    try {
      await adjustStock(item.id, adjustmentData);
      showNotification('Stock adjusted successfully!', 'success');
      await loadLedger();
    } catch (err) {
      console.error("Failed to adjust stock on API:", err);
      showNotification(err?.response?.data?.message || err?.message || 'Failed to adjust stock. API error.', 'error');
    } finally {
      setLoading(false);
      setAdjustingItem(null);
    }
  };

  const handleSaveAdd = async (newEntry) => {
    setLoading(true);
    try {
      await addStockEntry(newEntry);
      showNotification('New stock entry added successfully!', 'success');
      await loadLedger();
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add stock entry on API:", err);
      showNotification(err?.response?.data?.message || err?.message || 'Failed to add stock entry. API error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLastRefreshed(new Date());
    await loadLedger();
  };

  const handleExport = () => {
    try {
      const headers = ['SKU / Product ID', 'Product Name', 'Category', 'Quantity', 'Status', 'Last Updated', 'Location'];
      const csvRows = [headers.join(',')];
      
      filtered.forEach(item => {
        const row = [
          `"${item.id || item.product_id || ''}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.category || '').replace(/"/g, '""')}"`,
          item.quantity || 0,
          `"${item.status || ''}"`,
          `"${item.lastUpdated || ''}"`,
          `"${(item.location || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Export successful!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showNotification('Failed to export stock ledger', 'error');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="stock-page" style={{ position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)', 
          backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', 
            color: '#166534', fontWeight: 600, background: 'white', 
            padding: '12px 24px', borderRadius: '8px', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
          }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Refreshing Stock Ledger...
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {notification && (
        <div className={`stock-notification ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}
      {/* ── Header ── */}
      <section className="catalog-header stock-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Inventory</span>
          <h1>Stock Ledger</h1>
          <p className="catalog-card__subtitle" style={{ margin: 0, fontSize: '12px' }}>
            {metrics.total} SKUs tracked &nbsp;·&nbsp;
            Last refreshed: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="stock-header-actions">
          <button className="catalog-btn stock-refresh-btn" onClick={handleRefresh} title="Refresh" disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1.5s linear infinite' } : {}} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="catalog-btn" onClick={handleExport} title="Export stock report">
            <Download size={14} />
            <span>Export</span>
          </button>
          <button className="catalog-btn" onClick={() => setAdjustingItem(items[0] || null)} title="Adjust Stock Ledger">
            <TrendingUp size={14} />
            <span>Adjust Stock</span>
          </button>
          <button className="catalog-btn catalog-btn--primary" onClick={() => setShowAddModal(true)} title="Add new stock entry">
            <Plus size={14} />
            <span>Add Entry</span>
          </button>
        </div>
      </section>

      {/* ── KPI Cards (Smaller) ── */}
      <div className="stock-metrics-grid" style={{ gap: '10px' }}>
        <div className="stock-metric-card stock-metric-card--blue" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <Boxes size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Total SKUs</span>
            <strong style={{ fontSize: '18px' }}>{metrics.total}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--green" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <CheckCircle2 size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>In Stock</span>
            <strong style={{ fontSize: '18px' }}>{metrics.inStock}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--amber" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <AlertTriangle size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Low Stock</span>
            <strong style={{ fontSize: '18px' }}>{metrics.lowStock}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--red" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <Package size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Out of Stock</span>
            <strong style={{ fontSize: '18px' }}>{metrics.outOfStock}</strong>
          </div>
        </div>
        <div className="stock-metric-card stock-metric-card--indigo" style={{ padding: '12px 14px' }}>
          <div className="stock-metric-card__icon" style={{ width: '36px', height: '36px' }}>
            <BarChart3 size={18} />
          </div>
          <div className="stock-metric-card__body">
            <span style={{ fontSize: '10px' }}>Inventory Value</span>
            <strong style={{ fontSize: '18px' }}>{metrics.totalValueStr ? metrics.totalValueStr : `₹${formatNumber(metrics.totalValueNum)}`}</strong>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <section
        className="catalog-card"
        style={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          padding: 0,
        }}
      >
        <div
          className="catalog-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Ledger Entries</h2>
            <p className="catalog-card__subtitle" style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
              {filtered.length} products match filters
            </p>
          </div>
        </div>

        {/* Filters */}
        <div
          className="catalog-filterbar"
          style={{
            padding: '12px 20px',
            margin: 0,
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div className="catalog-search" style={{ maxWidth: '360px', flex: '1 1 260px' }}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search by SKU, product name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minHeight: '38px', padding: '7px 12px 7px 36px', fontSize: '13px' }}
            />
          </div>
          <div className="stock-filters-right">
            <label className="catalog-filter" style={{ minHeight: '38px' }}>
              <Filter size={14} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ minHeight: '36px', padding: '6px 10px', fontSize: '13px' }}
              >
                {filterCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
            </label>
            <label className="catalog-filter" style={{ minHeight: '38px' }}>
              <ClipboardList size={14} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ minHeight: '36px', padding: '6px 10px', fontSize: '13px' }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="catalog-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="catalog-table stock-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '220px' }}>Product / SKU</th>
                <th style={{ textAlign: 'left', minWidth: '140px' }}>Category</th>
                <th style={{ textAlign: 'left', minWidth: '130px' }}>Supplier</th>
                <th style={{ textAlign: 'center', minWidth: '115px' }}>Current Stock</th>
                <th style={{ textAlign: 'center', minWidth: '110px' }}>Reorder Level</th>
                <th style={{ textAlign: 'right', minWidth: '125px' }}>Cost Price (₹)</th>
                <th style={{ textAlign: 'right', minWidth: '130px' }}>Selling Price (₹)</th>
                <th style={{ textAlign: 'center', minWidth: '120px' }}>Last Updated</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => {
                const isOutOfStock = Number(item.currentStock) === 0;
                const isLowStock = !isOutOfStock && Number(item.currentStock) <= Number(item.reorderLevel);
                const costVal = Number(item.costPrice || 0);
                const sellVal = Number(item.sellingPrice || 0);

                return (
                  <tr
                    key={item.id}
                    className={
                      isOutOfStock
                        ? 'stock-row--alert'
                        : isLowStock
                          ? 'stock-row--warning'
                          : 'stock-row--success'
                    }
                  >
                    <td style={{ textAlign: 'left' }}>
                      <div className="stock-product-name">{item.name}</div>
                      <div className="stock-product-meta">
                        <span className="stock-sku-pill">{item.sku}</span>
                        <span className="stock-unit-tag">{item.unit}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="stock-category-name">{item.category || '—'}</div>
                      {item.subcategory && (
                        <div className="stock-subcategory-name">{item.subcategory}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <span className="stock-supplier-name">{item.supplier || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`stock-qty ${isOutOfStock ? 'stock-qty--zero' : isLowStock ? 'stock-qty--low' : 'stock-qty--ok'}`}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="stock-reorder-val">{item.reorderLevel}</span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span className="stock-price-cost">
                        ₹{Number(costVal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span className="stock-price-sell">
                        ₹{Number(sellVal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span className="stock-date-text">{item.lastUpdated || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        className="catalog-btn catalog-btn--icon stock-adjust-btn"
                        title="Adjust stock level & ledger parameters"
                        onClick={() => setAdjustingItem(item)}
                        style={{ marginRight: '4px' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <a
                        href={`/admin/catalog/products-form?id=${item.id}`}
                        className="catalog-btn catalog-btn--icon"
                        title="Open full Product form in Catalog"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Boxes size={14} />
                      </a>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    No products match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#ffffff' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </section>

      {/* ── Adjust Modal ── */}
      {adjustingItem && (
        <AdjustModal
          item={adjustingItem}
          products={items}
          onClose={() => setAdjustingItem(null)}
          onSave={handleSaveAdjust}
        />
      )}

      {/* ── Add Entry Modal ── */}
      {showAddModal && (
        <AddEntryModal
          categories={apiCategories.length > 0 ? apiCategories : filterCategories.filter(c => c !== 'All').map(c => ({ name: c }))}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveAdd}
        />
      )}
    </div>
  );
};

export default StockUpdates;

