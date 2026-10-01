import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Eye, Edit3, Trash2, Plus, X, 
  FileSpreadsheet, Clock, CheckCircle, RefreshCw, Phone, 
  Building, Calendar, MapPin, DollarSign, Filter, RotateCcw,
  Sparkles, CheckCircle2, AlertCircle, ShieldAlert, Mail, Package, Hash
} from 'lucide-react';
import { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote } from '../api/quotes';
import { Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './QuotesScreen.css';

const statusConfig = {
  Pending: { label: 'Pending', class: 'pending', icon: Clock },
  'In Review': { label: 'In Review', class: 'progress', icon: RefreshCw },
  Quoted: { label: 'Quoted', class: 'approved', icon: CheckCircle },
  Rejected: { label: 'Rejected', class: 'rejected', icon: X }
};

const formatPrice = (amt) => `INR ${Number(amt || 0).toLocaleString('en-IN')}`;

const formatDateToDMY = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatDateTimeToDMY = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

const getInitials = (name) => {
  if (!name) return 'BQ';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Modals
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    gstin: '',
    email: '',
    mobile: '',
    product: 'General bulk requirement',
    quantity: 1,
    location: '',
    requirement: '',
    quoteAmount: 0,
    status: 'Pending'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load quotes from live API
  const loadQuotes = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await getQuotes();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load quotes:', err);
      if (!isBackground) {
        setError('Could not connect to live quotes endpoint. Please check network connection.');
        showToast('Failed to load quotes data.', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();

    const handleUpdate = () => loadQuotes(true);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('sat_quotes_updated', handleUpdate);

    const interval = setInterval(() => loadQuotes(true), 8000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('sat_quotes_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Filtered Quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((item) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || (
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.companyName || '').toLowerCase().includes(searchLower) ||
        (item.gstin || '').toLowerCase().includes(searchLower) ||
        (item.email || '').toLowerCase().includes(searchLower) ||
        (item.mobile || '').includes(searchLower) ||
        (item.product || '').toLowerCase().includes(searchLower) ||
        (item.location || '').toLowerCase().includes(searchLower) ||
        (item.requirement || '').toLowerCase().includes(searchLower)
      );

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  // Metric Stats
  const stats = useMemo(() => ({
    total: quotes.length,
    pending: quotes.filter(q => q.status === 'Pending').length,
    inReview: quotes.filter(q => q.status === 'In Review').length,
    quoted: quotes.filter(q => q.status === 'Quoted').length,
    rejected: quotes.filter(q => q.status === 'Rejected').length
  }), [quotes]);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  // Handlers
  const handleView = async (id) => {
    try {
      const single = await getQuoteById(id);
      setSelectedQuote(single || quotes.find(q => q.id === id));
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Error fetching quote details:', err);
      setSelectedQuote(quotes.find(q => q.id === id));
      setIsDetailOpen(true);
    }
  };

  const handleEditOpen = (quote) => {
    setSelectedQuote(quote);
    setFormData({
      name: quote.name || '',
      companyName: quote.companyName || '',
      gstin: quote.gstin || '',
      email: quote.email || '',
      mobile: quote.mobile || '',
      product: quote.product || 'General bulk requirement',
      quantity: quote.quantity || 1,
      location: quote.location || '',
      requirement: quote.requirement || '',
      quoteAmount: quote.quoteAmount || 0,
      status: quote.status || 'Pending'
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedQuote) return;
    setIsSubmitting(true);
    try {
      await updateQuote(selectedQuote.id, formData);
      setIsEditOpen(false);
      showToast('Bulk quote offer updated successfully.', 'success');
      loadQuotes(true);
    } catch (err) {
      showToast(`Failed to update quote: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createQuote(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '', companyName: '', gstin: '', email: '', mobile: '',
        product: 'General bulk requirement', quantity: 1, location: '', requirement: '',
        quoteAmount: 0, status: 'Pending'
      });
      showToast('New bulk quote request created.', 'success');
      loadQuotes(true);
    } catch (err) {
      showToast(`Failed to create quote: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsSubmitting(true);
    try {
      await deleteQuote(deleteTargetId);
      setDeleteTargetId(null);
      showToast('Quote request removed successfully.', 'success');
      loadQuotes(true);
    } catch (err) {
      showToast(`Failed to delete quote: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paginated records
  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredQuotes.slice(startIndex, startIndex + pageSize);
  }, [filteredQuotes, currentPage, pageSize]);

  return (
    <div className="quotes-mgmt-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Card */}
      <div className="quotes-header-card">
        <div className="quotes-title-wrap">
          <div className="quotes-kicker">COMMERCIAL &amp; B2B PRICING</div>
          <h1>Bulk Quotes Management</h1>
          <p>Review, negotiate, and formulate commercial proposals for volume and institutional orders</p>
        </div>
        <div className="quotes-header-actions">
          <button 
            type="button" 
            className="btn-quotes-secondary" 
            onClick={() => loadQuotes(false)} 
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            type="button" 
            className="btn-quotes-primary" 
            onClick={() => {
              setFormData({
                name: '', companyName: '', gstin: '', email: '', mobile: '',
                product: 'General bulk requirement', quantity: 1, location: '', requirement: '',
                quoteAmount: 0, status: 'Pending'
              });
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} />
            <span>New Quote Request</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="quotes-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => loadQuotes(false)} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Interactive Metric Cards */}
      <div className="quotes-stats-grid">
        <div 
          className={`quotes-stat-card ${statusFilter === 'All' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter('All')}
          title="Click to view all quote requests"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Total Requests</span>
              <span className="stat-card-value">{stats.total}</span>
            </div>
            <div className="stat-card-icon icon-total">
              <FileSpreadsheet size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge">All records</span>
          </div>
        </div>

        <div 
          className={`quotes-stat-card ${statusFilter === 'Pending' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
          title="Click to filter pending quotes"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Pending Review</span>
              <span className="stat-card-value">{stats.pending}</span>
            </div>
            <div className="stat-card-icon icon-pending">
              <Clock size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-pending">Action needed</span>
          </div>
        </div>

        <div 
          className={`quotes-stat-card ${statusFilter === 'In Review' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'In Review' ? 'All' : 'In Review')}
          title="Click to filter in-review quotes"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">In Review</span>
              <span className="stat-card-value">{stats.inReview}</span>
            </div>
            <div className="stat-card-icon icon-progress">
              <RefreshCw size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-progress">Under analysis</span>
          </div>
        </div>

        <div 
          className={`quotes-stat-card ${statusFilter === 'Quoted' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Quoted' ? 'All' : 'Quoted')}
          title="Click to filter approved quotes"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Quoted / Approved</span>
              <span className="stat-card-value">{stats.quoted}</span>
            </div>
            <div className="stat-card-icon icon-approved">
              <CheckCircle size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-approved">Offer submitted</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="quotes-toolbar-card">
        <div className="quotes-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by company, customer name, GSTIN, product, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              className="clear-search-btn" 
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="quotes-filter-group">
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="quote-select"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Quoted">Quoted / Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              type="button" 
              className="btn-reset-filters" 
              onClick={handleResetFilters}
              title="Reset all active filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          <div className="quotes-count-tag">
            <span>{filteredQuotes.length} {filteredQuotes.length === 1 ? 'quote' : 'quotes'}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="quotes-table-card">
        {loading && quotes.length === 0 ? (
          <div className="quotes-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading bulk quote requests...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="quotes-empty-state">
            <div className="empty-icon-wrap">
              <FileSpreadsheet size={36} />
            </div>
            <h3>No bulk quotes found</h3>
            <p>
              {hasActiveFilters 
                ? "No commercial quote requests matched your search criteria." 
                : "No B2B quote requests have been submitted yet."}
            </p>
            {hasActiveFilters && (
              <button type="button" className="btn-quotes-secondary" onClick={handleResetFilters}>
                <RotateCcw size={14} /> Clear Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="quotes-table-wrapper">
            <table className="quotes-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>COMPANY &amp; CONTACT</th>
                  <th style={{ width: '20%' }}>PRODUCT &amp; QUANTITY</th>
                  <th style={{ width: '15%' }}>LOCATION</th>
                  <th style={{ width: '15%' }}>OFFER AMOUNT</th>
                  <th style={{ width: '11%' }}>STATUS</th>
                  <th style={{ width: '11%' }}>DATE</th>
                  <th style={{ width: '6%', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuotes.map((item) => {
                  const conf = statusConfig[item.status] || statusConfig.Pending;
                  const StatusIcon = conf.icon;
                  const initials = getInitials(item.companyName || item.name);

                  return (
                    <tr key={item.id} className="quote-table-row">
                      {/* Company & Contact */}
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar" title={item.companyName || item.name}>
                            {initials}
                          </div>
                          <div className="customer-meta">
                            <span className="customer-name">{item.companyName || item.name}</span>
                            <span className="contact-subtext">
                              {item.name} {item.mobile ? `(${item.mobile})` : ''}
                            </span>
                            {item.gstin && (
                              <span className="gstin-badge" title={`GSTIN: ${item.gstin}`}>
                                <Hash size={10} /> {item.gstin}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product & Quantity */}
                      <td>
                        <div className="product-qty-cell">
                          <div className="product-title" title={item.product}>
                            <Package size={13} className="topic-icon" />
                            <span>{item.product}</span>
                          </div>
                          <div className="qty-tag">
                            <strong>{item.quantity || 1}</strong> units requested
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <div className="location-cell">
                          <MapPin size={12} className="location-icon" />
                          <span>{item.location || 'Pan India'}</span>
                        </div>
                      </td>

                      {/* Offer Amount */}
                      <td>
                        {item.quoteAmount > 0 ? (
                          <div className="amount-offered">
                            <DollarSign size={13} className="amount-icon" />
                            <span>{formatPrice(item.quoteAmount)}</span>
                          </div>
                        ) : (
                          <span className="amount-pending">Pending Quote</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill status-${conf.class}`}>
                          <StatusIcon size={12} />
                          <span>{conf.label}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <div className="date-cell">
                          <span className="date-main">{formatDateToDMY(item.createdAt)}</span>
                          <span className="date-sub">
                            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="table-actions-group">
                          <button 
                            type="button" 
                            className="action-icon-btn action-view" 
                            onClick={() => handleView(item.id)} 
                            title="View Quote Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            type="button" 
                            className="action-icon-btn action-edit" 
                            onClick={() => handleEditOpen(item)} 
                            title="Update Quote Offer / Pricing"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            type="button" 
                            className="action-icon-btn action-delete" 
                            onClick={() => setDeleteTargetId(item.id)} 
                            title="Delete Quote Request"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {filteredQuotes.length > 0 && (
          <div className="quotes-pagination-container">
            <Pagination
              page={currentPage}
              count={filteredQuotes.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* ========================================================================
          MODALS — Rendered with createPortal to escape admin layout containers
          ======================================================================== */}

      {/* 1. DETAIL MODAL */}
      {isDetailOpen && selectedQuote && createPortal(
        <div className="quote-modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="quote-modal-card quote-modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="quote-modal-header">
              <div className="modal-header-info">
                <div className="modal-kicker">COMMERCIAL PROPOSAL</div>
                <h2>Quote Request #{selectedQuote.id}</h2>
                <span className="modal-subtitle">Requested on {formatDateTimeToDMY(selectedQuote.createdAt)}</span>
              </div>
              <button 
                type="button" 
                className="quote-modal-close" 
                onClick={() => setIsDetailOpen(false)}
                title="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="quote-modal-body">
              {/* Top Banner with Status & Quoted Amount */}
              <div className="quote-detail-banner">
                <div className="detail-banner-item">
                  <span className="banner-label">Status</span>
                  <span className={`status-pill status-${(selectedQuote.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                    {selectedQuote.status || 'Pending'}
                  </span>
                </div>
                <div className="detail-banner-item">
                  <span className="banner-label">Commercial Offer</span>
                  <span className="quote-amount-highlight">
                    {selectedQuote.quoteAmount > 0 ? formatPrice(selectedQuote.quoteAmount) : 'Pending Offer Calculation'}
                  </span>
                </div>
              </div>

              {/* Company & Client Info Card */}
              <div className="detail-section-card">
                <h4 className="section-title">Client &amp; Enterprise Details</h4>
                <div className="detail-info-grid">
                  <div className="info-item">
                    <span className="info-label">Company Name</span>
                    <span className="info-value"><strong>{selectedQuote.companyName || 'N/A'}</strong></span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">GSTIN / Tax ID</span>
                    <span className="info-value">{selectedQuote.gstin || 'Not Provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contact Person</span>
                    <span className="info-value">{selectedQuote.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mobile Phone</span>
                    <span className="info-value">
                      {selectedQuote.mobile ? (
                        <a href={`tel:${selectedQuote.mobile}`} className="contact-link">
                          <Phone size={13} /> {selectedQuote.mobile}
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">
                      {selectedQuote.email ? (
                        <a href={`mailto:${selectedQuote.email}`} className="contact-link email">
                          <Mail size={13} /> {selectedQuote.email}
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Project Location</span>
                    <span className="info-value">{selectedQuote.location || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Product & Scope Details */}
              <div className="detail-section-card">
                <h4 className="section-title">Required Product &amp; Volume</h4>
                <div className="product-quote-box">
                  <Package size={20} className="text-primary" />
                  <div style={{ flex: '1 1 auto' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{selectedQuote.product}</div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: 2 }}>
                      Target Quantity: <strong>{selectedQuote.quantity} units</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement Notes */}
              <div className="detail-section-card">
                <h4 className="section-title">Specifications &amp; Custom Requirements</h4>
                <div className="message-content-box">
                  {selectedQuote.requirement || 'No custom requirement notes provided.'}
                </div>
              </div>
            </div>

            <div className="quote-modal-footer">
              <button 
                type="button" 
                className="btn-quotes-secondary" 
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn-quotes-primary" 
                onClick={() => {
                  setIsDetailOpen(false);
                  handleEditOpen(selectedQuote);
                }}
              >
                <Edit3 size={15} /> Update Pricing / Status
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. EDIT / UPDATE QUOTE OFFER MODAL */}
      {isEditOpen && selectedQuote && createPortal(
        <div className="quote-modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="quote-modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdate}>
              <div className="quote-modal-header">
                <div className="modal-header-info">
                  <div className="modal-kicker">PROPOSAL OFFER</div>
                  <h2>Update Quote #{selectedQuote.id}</h2>
                </div>
                <button 
                  type="button" 
                  className="quote-modal-close" 
                  onClick={() => setIsEditOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="quote-modal-body">
                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="edit-status">Quote Status *</label>
                    <select
                      id="edit-status"
                      className="quote-form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Review">In Review</option>
                      <option value="Quoted">Quoted / Approved</option>
                      <option value="Rejected">Rejected / Closed</option>
                    </select>
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="edit-amount">Commercial Quote Offer (INR)</label>
                    <input
                      id="edit-amount"
                      type="number"
                      min="0"
                      placeholder="e.g. 150000"
                      className="quote-form-input"
                      value={formData.quoteAmount}
                      onChange={(e) => setFormData({ ...formData, quoteAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="edit-company">Company Name</label>
                    <input
                      id="edit-company"
                      type="text"
                      className="quote-form-input"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="edit-gstin">GSTIN Number</label>
                    <input
                      id="edit-gstin"
                      type="text"
                      maxLength={15}
                      className="quote-form-input"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label htmlFor="edit-requirement">Terms &amp; Specification Notes</label>
                  <textarea
                    id="edit-requirement"
                    rows={4}
                    className="quote-form-textarea"
                    placeholder="Enter quote commercial notes, validity terms, lead time..."
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  />
                </div>
              </div>

              <div className="quote-modal-footer">
                <button 
                  type="button" 
                  className="btn-quotes-secondary" 
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-quotes-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Quote Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 3. CREATE NEW BULK QUOTE MODAL */}
      {isCreateOpen && createPortal(
        <div className="quote-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="quote-modal-card quote-modal-medium" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateSubmit}>
              <div className="quote-modal-header">
                <div className="modal-header-info">
                  <div className="modal-kicker">MANUAL ENTRY</div>
                  <h2>New Bulk Quote Request</h2>
                  <span className="modal-subtitle">Record an enterprise bulk purchasing requirement</span>
                </div>
                <button 
                  type="button" 
                  className="quote-modal-close" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="quote-modal-body">
                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-name">Contact Person *</label>
                    <input
                      id="new-name"
                      type="text"
                      required
                      placeholder="e.g. Anand Varma"
                      className="quote-form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-company">Company Name *</label>
                    <input
                      id="new-company"
                      type="text"
                      required
                      placeholder="e.g. Apex Industrial Solutions"
                      className="quote-form-input"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-mobile">Mobile Number *</label>
                    <input
                      id="new-mobile"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile"
                      className="quote-form-input"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-email">Email Address *</label>
                    <input
                      id="new-email"
                      type="email"
                      required
                      placeholder="anand@company.com"
                      className="quote-form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-product">Target Product *</label>
                    <input
                      id="new-product"
                      type="text"
                      required
                      placeholder="e.g. Honeywell Orbit 7120 Scanner"
                      className="quote-form-input"
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-quantity">Estimated Quantity *</label>
                    <input
                      id="new-quantity"
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 50"
                      className="quote-form-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-location">Project Location *</label>
                    <input
                      id="new-location"
                      type="text"
                      required
                      placeholder="e.g. Bengaluru, Karnataka"
                      className="quote-form-input"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-gstin">GSTIN (Optional)</label>
                    <input
                      id="new-gstin"
                      type="text"
                      maxLength={15}
                      placeholder="15-digit GSTIN"
                      className="quote-form-input"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label htmlFor="new-requirement">Requirement Specifications *</label>
                  <textarea
                    id="new-requirement"
                    rows={3}
                    required
                    placeholder="Enter project details, delivery expectations, technical specifications..."
                    className="quote-form-textarea"
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  />
                </div>
              </div>

              <div className="quote-modal-footer">
                <button 
                  type="button" 
                  className="btn-quotes-secondary" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-quotes-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deleteTargetId && createPortal(
        <div className="quote-modal-overlay" onClick={() => setDeleteTargetId(null)}>
          <div className="quote-modal-card quote-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="quote-modal-header">
              <div className="modal-header-info">
                <div className="modal-kicker text-red">CONFIRM ACTION</div>
                <h2>Delete Quote Request #{deleteTargetId}</h2>
              </div>
              <button 
                type="button" 
                className="quote-modal-close" 
                onClick={() => setDeleteTargetId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="quote-modal-body">
              <div className="delete-warning-box">
                <ShieldAlert size={28} className="delete-warning-icon" />
                <p>Are you sure you want to delete this quote request? This record will be permanently deleted.</p>
              </div>
            </div>

            <div className="quote-modal-footer">
              <button 
                type="button" 
                className="btn-quotes-secondary" 
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-quotes-danger" 
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Request'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
