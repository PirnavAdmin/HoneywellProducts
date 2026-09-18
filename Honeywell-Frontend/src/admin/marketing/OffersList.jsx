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
  RefreshCw
} from 'lucide-react';
import '../catalog/adminModule.css';
import { offersService } from '../../services/offersService';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const formatDateDMY = (dateStr) => {
  if (!dateStr) return '';
  const cleanStr = String(dateStr).trim();
  const isoMatch = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  try {
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {}
  return cleanStr;
};

const OfferStatusBadge = ({ isActive }) => (
  <span
    className={`coupon-status coupon-status--${isActive ? 'active' : 'inactive'}`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '10px',
      padding: '2px 8px',
      borderRadius: '999px',
      fontWeight: 600,
      backgroundColor: isActive ? '#ecfdf5' : '#f1f5f9',
      color: isActive ? '#059669' : '#64748b',
      border: `1px solid ${isActive ? '#a7f3d0' : '#cbd5e1'}`
    }}
  >
    {isActive ? <CheckCircle2 size={10} /> : <EyeOff size={10} />}
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
      const term = searchTerm.toLowerCase();
      const matchesSearch =
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
    return offers.reduce(
      (acc, item) => ({
        total: acc.total + 1,
        active: acc.active + (item.isActive ? 1 : 0),
        inactive: acc.inactive + (!item.isActive ? 1 : 0),
      }),
      { total: 0, active: 0, inactive: 0 }
    );
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

  return (
    <div className="coupons-page" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="coupon-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="coupon-modal" style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Confirm Delete</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Are you sure you want to permanently delete this offer? This will remove it from the public website.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="catalog-btn" type="button" onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}>Cancel</button>
              <button className="catalog-btn catalog-btn--primary" type="button" onClick={handleDeleteOffer} disabled={isDeleting} style={{ backgroundColor: '#ef4444' }}>
                {isDeleting ? 'Deleting...' : 'Delete Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="catalog-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #1268a5 0%, #0d4b78 100%)', color: 'white', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9 }}>MARKETING PROMOTIONS</span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0 0' }}>Offers &amp; Deals Management</h1>
            <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px', maxWidth: '600px' }}>Manage all active and inactive promotional deals, discount percentages, prices, and offer banners for the website.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="catalog-btn" type="button" onClick={loadAdminOffers} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
            </button>
            <Link className="catalog-btn catalog-btn--primary" to="/admin/marketing/offer" style={{ backgroundColor: 'white', color: '#1268a5', fontWeight: 700 }}>
              <Plus size={16} style={{ marginRight: '4px' }} /> Create New Offer
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="catalog-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tag size={20} /></div>
          <div><div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div><div style={{ fontSize: '12px', color: '#64748b' }}>Total Offers</div></div>
        </div>
        <div className="catalog-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={20} /></div>
          <div><div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{stats.active}</div><div style={{ fontSize: '12px', color: '#64748b' }}>Active on Website</div></div>
        </div>
        <div className="catalog-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EyeOff size={20} /></div>
          <div><div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{stats.inactive}</div><div style={{ fontSize: '12px', color: '#64748b' }}>Inactive</div></div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="catalog-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div className="catalog-search" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search offer title, category, badge..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: 'white' }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            style={{ height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: 'white' }}
          >
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>
      </div>

      {/* Offers Table */}
      <div className="catalog-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <p>Loading offers from backend API...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#ef4444' }}>
            <p>{error}</p>
            <button className="catalog-btn" onClick={loadAdminOffers} style={{ marginTop: '12px' }}>Try Again</button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <Tag size={40} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No matching offers found</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search query or filter options.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="catalog-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>Offer Info</th>
                  <th style={{ padding: '12px 16px' }}>Category &amp; Tag</th>
                  <th style={{ padding: '12px 16px' }}>Deal Price</th>
                  <th style={{ padding: '12px 16px' }}>Discount</th>
                  <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {paginatedOffers.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = '/honeywell-products-logo.png'; }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>{item.category}</div>
                      {item.badgeTag && (
                        <span style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, marginTop: '2px', display: 'inline-block' }}>
                          {item.badgeTag}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(item.dealPrice)}</div>
                      {item.originalPrice > 0 && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                          {formatCurrency(item.originalPrice)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '999px', fontSize: '11px' }}>
                        {item.discountPercentage}% OFF
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {item.endDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {formatDateDMY(item.endDate)}
                        </div>
                      ) : 'No Expiry'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.title, item.isActive)}
                        disabled={togglingId === item.id}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        title="Click to toggle active status on website"
                      >
                        <OfferStatusBadge isActive={item.isActive} />
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <AnimatedEditButton to={`/admin/marketing/offer/${item.id}`} />
                        <OutlookDeleteButton onClick={() => setDeleteConfirmId(item.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
