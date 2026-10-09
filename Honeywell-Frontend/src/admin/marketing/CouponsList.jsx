import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Filter,
  Percent,
  Plus,
  Search,
  Tag,
  X,
  RefreshCw,
  RotateCcw,
  Copy,
  Check,
  TrendingUp,
  Clock,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Layers,
  Edit2,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { fetchCoupons as getCoupons, updateCoupon, deleteCoupon as apiDeleteCoupon } from './api';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './coupons.css';

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const num = Number(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

export const formatDateDMY = (dateStr) => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).trim();

  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanStr)) {
    return cleanStr;
  }

  const isoMatch = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) {
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthStr = d.toLocaleString('en-IN', { month: 'short' });
      return `${dayNum} ${monthStr} ${year}`;
    }
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  try {
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const monthStr = d.toLocaleString('en-IN', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${monthStr} ${year}`;
    }
  } catch {}

  return cleanStr;
};

const formatDiscountDisplay = (coupon) => {
  if (!coupon) return '-';
  if (coupon.type === 'Percentage' || coupon.discountType === 'Percentage') {
    return `${coupon.discount || coupon.discountValue || 0}% OFF`;
  }
  if (coupon.type === 'Shipping' || coupon.discountType === 'Shipping') {
    return 'Free Shipping';
  }
  return `${formatCurrency(coupon.discount || coupon.discountValue || 0)} FLAT`;
};

const CouponStatusBadge = ({ status }) => {
  const normStatus = (status || 'Active').toLowerCase();
  let statusClass = 'status-active';
  if (normStatus === 'inactive') statusClass = 'status-inactive';
  if (normStatus === 'expired') statusClass = 'status-expired';

  return (
    <span className={`coupon-status-pill ${statusClass}`}>
      <span className="status-dot"></span>
      {status || 'Active'}
    </span>
  );
};

const CouponEditModal = ({ coupon, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: coupon.id,
    code: coupon.code || '',
    description: coupon.description || '',
    type: coupon.type || 'Percentage',
    discount: coupon.discount || 0,
    maxDiscount: coupon.maxDiscount || '',
    minSpend: coupon.minSpend || 0,
    usageLimit: coupon.usageLimit || 0,
    perCustomerLimit: coupon.perCustomerLimit || 1,
    startDate: coupon.startDate || '',
    endDate: coupon.endDate || '',
    status: coupon.status || 'Active',
    isActive: coupon.isActive !== undefined ? coupon.isActive : true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'code' ? value.toUpperCase() : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="coupon-modal-backdrop" role="dialog" aria-modal="true">
      <div className="coupon-modal">
        <div className="coupon-modal-header">
          <div className="coupon-modal-title">
            <span>PROMOTIONAL CAMPAIGN</span>
            <h2>Edit Coupon: {coupon.code}</h2>
          </div>
          <button className="coupon-modal-close" type="button" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        <div className="coupon-modal-summary">
          <div className="coupon-modal-summary-item">
            <span>DISCOUNT</span>
            <strong>{formatDiscountDisplay(formData)}</strong>
          </div>
          <div className="coupon-modal-summary-item">
            <span>MIN SPEND</span>
            <strong>{formatCurrency(formData.minSpend)}</strong>
          </div>
          <div className="coupon-modal-summary-item">
            <span>EXPIRY</span>
            <strong>{formatDateDMY(formData.endDate)}</strong>
          </div>
          <div className="coupon-modal-summary-item">
            <span>STATUS</span>
            <CouponStatusBadge status={formData.status} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="coupon-modal-body">
            {/* General Info */}
            <div>
              <div className="coupon-form-section-title">
                <Tag size={13} color="#1268a5" /> Campaign Details
              </div>
              <div className="coupon-form-grid-2">
                <div className="coupon-input-group">
                  <label htmlFor="edit-code">Coupon Code *</label>
                  <input
                    id="edit-code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="e.g. SUMMER25"
                  />
                </div>
                <div className="coupon-input-group">
                  <label htmlFor="edit-type">Discount Type</label>
                  <select id="edit-type" name="type" value={formData.type} onChange={handleChange}>
                    <option value="Percentage">Percentage (% Discount)</option>
                    <option value="Flat Amount">Flat Amount (Fixed ₹)</option>
                    <option value="Shipping">Free Delivery</option>
                  </select>
                </div>
              </div>
              <div className="coupon-input-group" style={{ marginTop: '10px' }}>
                <label htmlFor="edit-description">Description / Campaign Offer *</label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe the promo terms..."
                />
              </div>
            </div>

            {/* Discount Rules */}
            <div>
              <div className="coupon-form-section-title">
                <Percent size={13} color="#1268a5" /> Discount Rules &amp; Limits
              </div>
              <div className="coupon-form-grid-2">
                <div className="coupon-input-group">
                  <label htmlFor="edit-discount">
                    {formData.type === 'Percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    id="edit-discount"
                    name="discount"
                    type="number"
                    value={formData.discount}
                    onChange={handleChange}
                    disabled={formData.type === 'Shipping'}
                    required={formData.type !== 'Shipping'}
                    min="0"
                  />
                </div>
                <div className="coupon-input-group">
                  <label htmlFor="edit-maxDiscount">Max Discount Cap (₹)</label>
                  <input
                    id="edit-maxDiscount"
                    name="maxDiscount"
                    type="number"
                    value={formData.maxDiscount || ''}
                    onChange={handleChange}
                    placeholder="Optional cap"
                    min="0"
                  />
                </div>
              </div>
              <div className="coupon-form-grid-2" style={{ marginTop: '10px' }}>
                <div className="coupon-input-group">
                  <label htmlFor="edit-minSpend">Min Cart Value (₹)</label>
                  <input
                    id="edit-minSpend"
                    name="minSpend"
                    type="number"
                    value={formData.minSpend}
                    onChange={handleChange}
                    placeholder="0 for no minimum"
                    min="0"
                  />
                </div>
                <div className="coupon-input-group">
                  <label htmlFor="edit-usageLimit">Total Usage Limit</label>
                  <input
                    id="edit-usageLimit"
                    name="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    placeholder="0 for unlimited"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Schedule & Status */}
            <div>
              <div className="coupon-form-section-title">
                <Calendar size={13} color="#1268a5" /> Schedule &amp; Lifecycle
              </div>
              <div className="coupon-form-grid-3">
                <div className="coupon-input-group">
                  <label htmlFor="edit-startDate">Start Date</label>
                  <input
                    id="edit-startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="coupon-input-group">
                  <label htmlFor="edit-endDate">Expiry Date</label>
                  <input
                    id="edit-endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="coupon-input-group">
                  <label htmlFor="edit-status">Status</label>
                  <select id="edit-status" name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="coupon-modal-footer">
            <button className="btn-coupons-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn-coupons-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CouponsList = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Interactive Modal & Actions
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await getCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load coupons.');
      showToast('Error loading coupon campaigns.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  // Filter and Search Logic
  const filteredCoupons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return coupons
      .filter((coupon) => {
        const matchesSearch =
          !normalizedSearch ||
          [coupon.code, coupon.description, coupon.type, coupon.discountType]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus = statusFilter === 'All' || coupon.status === statusFilter;
        const matchesType = typeFilter === 'All' || coupon.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [coupons, searchTerm, statusFilter, typeFilter]);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // KPI Metrics calculation
  const metrics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.status === 'Active' || c.isActive).length;
    const inactive = coupons.filter((c) => c.status === 'Inactive' || (!c.isActive && c.status !== 'Expired')).length;
    const expired = coupons.filter((c) => c.status === 'Expired').length;
    const totalUses = coupons.reduce((sum, c) => sum + (Number(c.usedCount) || 0), 0);

    return { total, active, inactive, expired, totalUses };
  }, [coupons]);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code "${code}" copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleToggleStatus = async (coupon) => {
    const isCurrentlyActive = coupon.status === 'Active' || coupon.isActive;
    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    const newIsActive = !isCurrentlyActive;

    try {
      await updateCoupon(coupon.id, {
        ...coupon,
        status: newStatus,
        isActive: newIsActive
      });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, status: newStatus, isActive: newIsActive } : c))
      );
      showToast(`Coupon "${coupon.code}" set to ${newStatus}.`, 'success');
    } catch (err) {
      showToast(`Failed to update status for ${coupon.code}: ${err.message}`, 'error');
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;
    try {
      await apiDeleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showToast(`Coupon "${code}" deleted successfully.`, 'success');
    } catch (err) {
      showToast(`Failed to delete coupon ${code}: ${err.message}`, 'error');
    }
  };

  const handleSaveCoupon = async (updatedCoupon) => {
    try {
      await updateCoupon(updatedCoupon.id, updatedCoupon);
      setCoupons((prev) =>
        prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c))
      );
      setEditingCoupon(null);
      showToast(`Coupon "${updatedCoupon.code}" saved successfully.`, 'success');
    } catch (err) {
      showToast(`Failed to save coupon: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTypeFilter('All');
  };

  // Pagination slice
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const pagedCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="coupons-mgmt-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Top Header Card ── */}
      <section className="coupons-header-card">
        <div className="coupons-title-wrap">
          <span className="coupons-kicker">
            <Sparkles size={13} /> Promotions &amp; Discounts
          </span>
          <h1>Coupons &amp; Vouchers Ledger</h1>
          <p>
            Configure promotional discount codes, cart criteria, usage limits, and campaign validity periods.
          </p>
        </div>

        <div className="coupons-header-actions">
          <button
            className="btn-coupons-secondary"
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            title="Refresh coupons"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link className="btn-coupons-primary" to="/admin/marketing/coupon">
            <Plus size={16} />
            Create Coupon
          </Link>
        </div>
      </section>

      {/* ── KPI Metric Cards ── */}
      <div className="coupons-kpi-grid">
        <div
          className={`coupons-kpi-card ${statusFilter === 'All' ? 'active' : ''}`}
          onClick={() => setStatusFilter('All')}
        >
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">Total Campaigns</span>
            <span className="coupons-kpi-val">{metrics.total}</span>
            <span className="coupons-kpi-sub">All created coupons</span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-blue">
            <Tag size={20} />
          </div>
        </div>

        <div
          className={`coupons-kpi-card ${statusFilter === 'Active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Active')}
        >
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">Active Coupons</span>
            <span className="coupons-kpi-val" style={{ color: '#059669' }}>
              {metrics.active}
            </span>
            <span className="coupons-kpi-sub">Ready to apply at checkout</span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-emerald">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="coupons-kpi-card">
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">Total Redemptions</span>
            <span className="coupons-kpi-val" style={{ color: '#7c3aed' }}>
              {metrics.totalUses}
            </span>
            <span className="coupons-kpi-sub">Customer checkout uses</span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-purple">
            <TrendingUp size={20} />
          </div>
        </div>

        <div
          className={`coupons-kpi-card ${statusFilter === 'Inactive' || statusFilter === 'Expired' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Inactive' ? 'Expired' : 'Inactive')}
        >
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">Inactive / Expired</span>
            <span className="coupons-kpi-val" style={{ color: '#d97706' }}>
              {metrics.inactive + metrics.expired}
            </span>
            <span className="coupons-kpi-sub">
              {metrics.inactive} Inactive · {metrics.expired} Expired
            </span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-amber">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="coupons-toolbar-card">
        <div className="coupons-toolbar-left">
          <div className="coupons-search-box">
            <Search size={16} className="coupons-search-icon" />
            <input
              type="text"
              className="coupons-search-input"
              placeholder="Search coupon code, campaign, rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="coupons-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="coupons-filter-select-wrap">
            <select
              className="coupons-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
              <option value="Expired">Expired Only</option>
            </select>
            <ChevronDown size={14} className="coupons-select-caret" />
          </div>

          <div className="coupons-filter-select-wrap">
            <select
              className="coupons-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Discount Types</option>
              <option value="Percentage">Percentage (%)</option>
              <option value="Flat Amount">Flat Amount (₹)</option>
              <option value="Shipping">Free Delivery</option>
            </select>
            <ChevronDown size={14} className="coupons-select-caret" />
          </div>
        </div>

        <div className="coupons-toolbar-right">
          {(searchTerm || statusFilter !== 'All' || typeFilter !== 'All') && (
            <button
              type="button"
              className="btn-coupons-reset"
              onClick={handleResetFilters}
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}

          <span className="coupons-count-tag">
            Showing <strong>{filteredCoupons.length}</strong> of {coupons.length}
          </span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="coupons-table-card">
        {loading ? (
          <div className="coupons-empty-state">
            <div className="coupons-empty-icon">
              <RefreshCw size={24} className="animate-spin" />
            </div>
            <h3>Loading Coupons...</h3>
            <p>Fetching active marketing campaigns and discount rules.</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="coupons-empty-state">
            <div className="coupons-empty-icon">
              <Tag size={24} />
            </div>
            <h3>No Coupons Found</h3>
            <p>No promotional vouchers match the applied search and filter criteria.</p>
            <button className="btn-coupons-secondary" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="coupons-table-wrapper">
            <table className="coupons-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Coupon Code &amp; Campaign</th>
                  <th style={{ width: '15%' }}>Discount Offer</th>
                  <th style={{ width: '16%' }}>Cart Rules &amp; Caps</th>
                  <th style={{ width: '14%' }}>Usage &amp; Limits</th>
                  <th style={{ width: '15%' }}>Validity Schedule</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedCoupons.map((coupon) => {
                  const isActive = coupon.status === 'Active' || coupon.isActive;
                  const isExpired = coupon.status === 'Expired';

                  return (
                    <tr key={coupon.id || coupon.code}>
                      {/* Coupon Code & Campaign */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="coupon-code-badge" title="Click to copy code">
                            {coupon.code}
                            <button
                              type="button"
                              className="coupon-copy-btn"
                              onClick={(e) => handleCopyCode(coupon.code, e)}
                              title="Copy code"
                            >
                              {copiedCode === coupon.code ? (
                                <Check size={13} color="#15803d" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </span>
                        </div>
                        <div className="coupon-desc-text">
                          {coupon.description || 'Promotional discount voucher'}
                        </div>
                      </td>

                      {/* Discount Offer */}
                      <td>
                        <div className="coupon-discount-val">
                          {formatDiscountDisplay(coupon)}
                        </div>
                        <span className="coupon-type-tag">
                          {coupon.type || coupon.discountType || 'Percentage'}
                        </span>
                      </td>

                      {/* Cart Rules & Caps */}
                      <td>
                        <div className="coupon-rule-item">
                          <span className="coupon-rule-label">Min Cart:</span>
                          <strong>{coupon.minSpend > 0 ? formatCurrency(coupon.minSpend) : 'None'}</strong>
                        </div>
                        <div className="coupon-rule-item" style={{ marginTop: '2px' }}>
                          <span className="coupon-rule-label">Max Cap:</span>
                          <span>{coupon.maxDiscount ? formatCurrency(coupon.maxDiscount) : 'No Cap'}</span>
                        </div>
                      </td>

                      {/* Usage & Limits */}
                      <td>
                        <div className="coupon-usage-bar-wrap">
                          <div className="coupon-usage-text">
                            {coupon.usageLimit > 0 ? (
                              <span>
                                <strong>{coupon.usedCount || 0}</strong> / {coupon.usageLimit} uses
                              </span>
                            ) : (
                              <span>
                                <strong>{coupon.usedCount || 0}</strong> uses
                              </span>
                            )}
                          </div>
                          <span className="coupon-usage-limit">
                            {coupon.perCustomerLimit ? `${coupon.perCustomerLimit} per user` : 'Unlimited per user'}
                          </span>
                        </div>
                      </td>

                      {/* Validity Schedule */}
                      <td>
                        <div className="coupon-date-range">
                          <div className="coupon-date-item">
                            <Calendar size={12} color="#64748b" />
                            <span>
                              {coupon.startDate ? formatDateDMY(coupon.startDate) : 'Immediate'} →{' '}
                              {coupon.endDate ? formatDateDMY(coupon.endDate) : 'Indefinite'}
                            </span>
                          </div>
                          {coupon.endDate && new Date(coupon.endDate) < new Date() && (
                            <span style={{ fontSize: '10.5px', color: '#e11d48', fontWeight: 600 }}>
                              Expired
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <CouponStatusBadge status={coupon.status} />
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="coupon-actions-cell">
                          <button
                            type="button"
                            className={`btn-toggle-switch ${isActive ? 'is-active' : 'is-inactive'}`}
                            onClick={() => handleToggleStatus(coupon)}
                            disabled={isExpired}
                            title={isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <AnimatedEditButton
                            onClick={() => setEditingCoupon(coupon)}
                            title="Edit Coupon Details"
                          />
                          <OutlookDeleteButton
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                            title="Delete Coupon"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredCoupons.length > 0 && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCoupons.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingCoupon && (
        <CouponEditModal
          coupon={editingCoupon}
          onClose={() => setEditingCoupon(null)}
          onSave={handleSaveCoupon}
        />
      )}
    </div>
  );
};

export default CouponsList;
