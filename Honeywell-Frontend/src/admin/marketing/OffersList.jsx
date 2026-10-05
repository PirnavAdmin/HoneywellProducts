import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  Tag,
  X,
  Clock,
  Eye,
  EyeOff,
  Percent,
  RefreshCw,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import './coupons.css';
import { offersService } from '../../services/offersService';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const num = Number(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

export const formatDateDMY = (dateStr) => {
  if (!dateStr) return 'No Expiry';
  const cleanStr = String(dateStr).trim();
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

const OfferStatusBadge = ({ isActive }) => (
  <span
    className={`coupon-status-pill ${isActive ? 'status-active' : 'status-inactive'}`}
    style={{
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    }}
  >
    <span className="status-dot"></span>
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

export default function OffersList() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadAdminOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await offersService.getAdminAll();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load admin offers:', err);
      setError('Failed to fetch offers list from backend.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOffers();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    offers.forEach(o => { if (o.category) set.add(o.category); });
    return ['All', ...Array.from(set)];
  }, [offers]);

  const filteredOffers = useMemo(() => {
    return offers.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.badgeTag?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && item.isActive) ||
        (statusFilter === 'Inactive' && !item.isActive);

      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [offers, searchTerm, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const maxDiscount = offers.reduce((max, o) => Math.max(max, Number(o.discountPercentage) || 0), 0);
    return {
      total: offers.length,
      active: offers.filter(o => o.isActive).length,
      inactive: offers.filter(o => !o.isActive).length,
      maxDiscount: maxDiscount > 0 ? `${maxDiscount}%` : '0%'
    };
  }, [offers]);

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOffers.slice(start, start + itemsPerPage);
  }, [filteredOffers, currentPage, itemsPerPage]);

  const handleToggleStatus = async (id, title, currentStatus) => {
    try {
      setTogglingId(id);
      await offersService.toggleStatus(id);
      setToastMessage(`Offer "${title}" status toggled successfully.`);
      setToastType('success');
      await loadAdminOffers();
    } catch (err) {
      console.error('Failed to toggle offer status:', err);
      setToastMessage(`Failed to update offer status.`);
      setToastType('error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteOffer = async () => {
    if (!deleteConfirmId) return;
    try {
      setIsDeleting(true);
      await offersService.delete(deleteConfirmId);
      setToastMessage('Offer deleted successfully from database.');
      setToastType('success');
      setDeleteConfirmId(null);
      await loadAdminOffers();
    } catch (err) {
      console.error('Failed to delete offer:', err);
      setToastMessage('Failed to delete offer.');
      setToastType('error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setCurrentPage(1);
  };

  const isFiltered = searchTerm !== '' || statusFilter !== 'All' || categoryFilter !== 'All';

  return (
    <div className="coupons-mgmt-container">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="coupon-modal-backdrop" role="dialog" aria-modal="true">
          <div className="coupon-modal" style={{ maxWidth: '420px', padding: '24px' }}>
            <div className="coupon-modal-header" style={{ padding: 0, marginBottom: '14px', border: 'none' }}>
              <div className="coupon-modal-title">
                <span style={{ color: '#ef4444' }}>DANGER ZONE</span>
                <h2 style={{ fontSize: '18px' }}>Delete Offer</h2>
              </div>
              <button className="coupon-modal-close" type="button" onClick={() => setDeleteConfirmId(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete this offer? This will immediately remove it from the customer storefront and active promotions.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-coupons-secondary" type="button" onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button 
                className="btn-coupons-primary" 
                type="button" 
                onClick={handleDeleteOffer} 
                disabled={isDeleting} 
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header Banner Card ── */}
      <section className="coupons-header-card">
        <div className="coupons-title-wrap">
          <div className="coupons-kicker">
            <Sparkles size={14} />
            <span>MARKETING &amp; PROMOTIONS</span>
          </div>
          <h1>Offers &amp; Deals Management</h1>
          <p>
            Manage website deal promotions, limited-time discounts, percentage cuts, and deal badges for Honeywell products.
          </p>
        </div>
        <div className="coupons-header-actions">
          <button className="btn-coupons-secondary" type="button" onClick={loadAdminOffers} title="Reload offers from database">
            <RefreshCw size={14} className={loading ? 'loading-spinner' : ''} />
            <span>Refresh</span>
          </button>
          <Link className="btn-coupons-primary" to="/admin/marketing/offer">
            <Plus size={15} />
            <span>Create New Offer</span>
          </Link>
        </div>
      </section>

      {/* ── KPI Summary Cards Grid (4 Interactive Cards) ── */}
      <section className="coupons-kpi-grid">
        <div 
          className={`coupons-kpi-card ${statusFilter === 'All' && !searchTerm ? 'active' : ''}`}
          onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}
          title="Click to view all offers"
        >
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">TOTAL OFFERS</span>
            <strong className="coupons-kpi-val">{stats.total}</strong>
            <span className="coupons-kpi-sub">Campaign items in system</span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-blue">
            <Tag size={20} />
          </div>
        </div>

        <div 
          className={`coupons-kpi-card ${statusFilter === 'Active' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Active'); setCurrentPage(1); }}
          title="Click to filter active deals"
        >
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">ACTIVE ON STORE</span>
            <strong className="coupons-kpi-val" style={{ color: '#059669' }}>{stats.active}</strong>
            <span className="coupons-kpi-sub">Live customer discounts</span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-emerald">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div 
          className={`coupons-kpi-card ${statusFilter === 'Inactive' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('Inactive'); setCurrentPage(1); }}
          title="Click to filter inactive deals"
        >
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">INACTIVE / PAUSED</span>
            <strong className="coupons-kpi-val" style={{ color: '#d97706' }}>{stats.inactive}</strong>
            <span className="coupons-kpi-sub">Drafts or paused deals</span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-amber">
            <EyeOff size={20} />
          </div>
        </div>

        <div className="coupons-kpi-card">
          <div className="coupons-kpi-info">
            <span className="coupons-kpi-label">MAX DISCOUNT</span>
            <strong className="coupons-kpi-val" style={{ color: '#7c3aed' }}>{stats.maxDiscount}</strong>
            <span className="coupons-kpi-sub">Highest promotion rate</span>
          </div>
          <div className="coupons-kpi-icon-wrap icon-purple">
            <Percent size={20} />
          </div>
        </div>
      </section>

      {/* ── Toolbar: Search, Filter Dropdowns, Counter, Reset ── */}
      <section className="coupons-toolbar-card">
        <div className="coupons-toolbar-left">
          {/* Search Box */}
          <div className="coupons-search-box">
            <Search size={15} className="coupons-search-icon" />
            <input
              type="text"
              className="coupons-search-input"
              placeholder="Search title, category, badge..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="coupons-search-clear" 
                onClick={() => setSearchTerm('')}
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="coupons-filter-select-wrap">
            <select
              className="coupons-filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
            <ChevronDown size={14} className="coupons-select-caret" />
          </div>

          {/* Category Filter */}
          <div className="coupons-filter-select-wrap">
            <select
              className="coupons-filter-select"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="coupons-select-caret" />
          </div>
        </div>

        <div className="coupons-toolbar-right">
          <span className="coupons-count-tag">
            Showing <strong>{filteredOffers.length}</strong> of <strong>{offers.length}</strong> offers
          </span>

          {isFiltered && (
            <button 
              type="button" 
              className="btn-coupons-reset" 
              onClick={handleResetFilters}
              title="Reset all search filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Offers Data Table Card ── */}
      <section className="coupons-table-card">
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={26} className="loading-spinner" style={{ margin: '0 auto 12px auto', color: '#1268a5' }} />
            <p style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>Loading Offers &amp; Deals from Server...</p>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Please wait while promotional campaigns are loaded.</span>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Unable to Load Offers</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{error}</p>
            <button className="btn-coupons-secondary" onClick={loadAdminOffers} style={{ marginTop: '16px' }}>
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', color: '#94a3b8' }}>
              <Tag size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>No matching offers found</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0 auto' }}>
              {isFiltered 
                ? 'No promotional offers match your current search query or status filter.' 
                : 'No promotional deals have been published yet. Click "Create New Offer" to start.'}
            </p>
            {isFiltered ? (
              <button className="btn-coupons-secondary" onClick={handleResetFilters} style={{ marginTop: '16px' }}>
                <RotateCcw size={13} /> Clear Filters
              </button>
            ) : (
              <Link className="btn-coupons-primary" to="/admin/marketing/offer" style={{ marginTop: '16px', display: 'inline-flex' }}>
                <Plus size={15} /> Create First Offer
              </Link>
            )}
          </div>
        ) : (
          <div className="coupons-table-wrapper">
            <table className="coupons-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Offer Details</th>
                  <th style={{ width: '18%' }}>Category &amp; Tag</th>
                  <th style={{ width: '14%' }}>Deal Price</th>
                  <th style={{ width: '12%' }}>Discount</th>
                  <th style={{ width: '12%' }}>Validity / Expiry</th>
                  <th style={{ width: '12%' }}>Live Status</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOffers.map((item) => {
                  const dealAmt = Number(item.dealPrice) || 0;
                  const origAmt = Number(item.originalPrice) || 0;
                  const discountPct = Number(item.discountPercentage) || 0;

                  return (
                    <tr key={item.id}>
                      {/* 1. Offer Details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={item.imageUrl || '/honeywell-products-logo.png'}
                            alt={item.title}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/honeywell-products-logo.png';
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                              {item.description || 'No offer description provided.'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category & Tag */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, color: '#334155', fontSize: '12px' }}>
                            {item.category || 'General'}
                          </span>
                          {item.badgeTag && (
                            <span style={{
                              fontSize: '10px',
                              backgroundColor: '#eff6ff',
                              color: '#1e40af',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              border: '1px solid #bfdbfe',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              {item.badgeTag}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Deal Price */}
                      <td>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                            {formatCurrency(dealAmt)}
                          </div>
                          {origAmt > 0 && origAmt > dealAmt && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', marginTop: '1px' }}>
                              MRP {formatCurrency(origAmt)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Discount */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 800,
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '11.5px'
                        }}>
                          {discountPct > 0 ? `${discountPct}% OFF` : 'SPECIAL'}
                        </span>
                      </td>

                      {/* 5. Expiry Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                          <Calendar size={13} style={{ color: '#94a3b8' }} />
                          <span>{formatDateDMY(item.endDate)}</span>
                        </div>
                      </td>

                      {/* 6. Live Status Toggle */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.id, item.title, item.isActive)}
                          disabled={togglingId === item.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                          title="Click to toggle live publication status"
                        >
                          <OfferStatusBadge isActive={item.isActive} />
                        </button>
                      </td>

                      {/* 7. Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <AnimatedEditButton to={`/admin/marketing/offer/${item.id}`} />
                          <OutlookDeleteButton onClick={() => setDeleteConfirmId(item.id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Table Footer / Pagination ── */}
        {!loading && !error && filteredOffers.length > 0 && totalPages > 1 && (
          <div style={{
            padding: '14px 20px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (Total <strong>{filteredOffers.length}</strong> items)
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </section>
    </div>
  );
}
