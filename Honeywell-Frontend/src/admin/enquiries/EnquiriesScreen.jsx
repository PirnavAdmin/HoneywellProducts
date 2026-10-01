import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Eye, Edit3, Trash2, Plus, X, 
  HelpCircle, Clock, CheckCircle, RefreshCw, Mail, Phone, 
  Building, Calendar, Package, MessageSquare, Filter, RotateCcw,
  Sparkles, CheckCircle2, AlertCircle, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { getEnquiries, getEnquiryById, createEnquiry, updateEnquiry, deleteEnquiry } from '../api/enquiries';
import { Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './EnquiriesScreen.css';

const statusConfig = {
  Pending: { label: 'Pending', class: 'pending', icon: Clock },
  'In Progress': { label: 'In Progress', class: 'progress', icon: RefreshCw },
  Resolved: { label: 'Resolved', class: 'resolved', icon: CheckCircle },
  Closed: { label: 'Closed', class: 'closed', icon: X }
};

const typeBadgeConfig = {
  'Product Enquiry': { label: 'Product', class: 'type-product' },
  'Sales Enquiry': { label: 'Sales', class: 'type-sales' },
  'Dealer Enquiry': { label: 'Dealer', class: 'type-dealer' },
  'Distributor Enquiry': { label: 'Distributor', class: 'type-distributor' },
  'Support Enquiry': { label: 'Support', class: 'type-support' }
};

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
  if (!name) return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function EnquiriesScreen() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // Modals
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    company: '',
    enquiryType: 'Product Enquiry',
    message: '',
    productName: '',
    status: 'Pending'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load enquiries from live API
  const loadEnquiries = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await getEnquiries();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      if (!isBackground) {
        setError('Could not connect to live enquiries endpoint. Please check network connection.');
        showToast('Failed to load enquiries.', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();

    const handleUpdate = () => loadEnquiries(true);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('sat_enquiries_updated', handleUpdate);

    const interval = setInterval(() => loadEnquiries(true), 8000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('sat_enquiries_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Filtered Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || (
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.email || '').toLowerCase().includes(searchLower) ||
        (item.mobile || '').includes(searchLower) ||
        (item.company || '').toLowerCase().includes(searchLower) ||
        (item.productName || '').toLowerCase().includes(searchLower) ||
        (item.message || '').toLowerCase().includes(searchLower)
      );

      const matchesStatus = statusFilter === 'All' 
        ? true 
        : statusFilter === 'Resolved' 
          ? (item.status === 'Resolved' || item.status === 'Closed')
          : item.status === statusFilter;

      const matchesType = typeFilter === 'All' || item.enquiryType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [enquiries, searchTerm, statusFilter, typeFilter]);

  // Metric Stats
  const stats = useMemo(() => ({
    total: enquiries.length,
    pending: enquiries.filter(e => e.status === 'Pending').length,
    inProgress: enquiries.filter(e => e.status === 'In Progress').length,
    resolved: enquiries.filter(e => e.status === 'Resolved' || e.status === 'Closed').length
  }), [enquiries]);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All' || typeFilter !== 'All';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTypeFilter('All');
    setCurrentPage(1);
  };

  // Handlers
  const handleView = async (id) => {
    try {
      const single = await getEnquiryById(id);
      setSelectedEnquiry(single || enquiries.find(e => e.id === id));
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Error fetching enquiry details:', err);
      setSelectedEnquiry(enquiries.find(e => e.id === id));
      setIsDetailOpen(true);
    }
  };

  const handleEditOpen = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setFormData({
      name: enquiry.name || '',
      email: enquiry.email || '',
      mobile: enquiry.mobile || '',
      company: enquiry.company || '',
      enquiryType: enquiry.enquiryType || 'Product Enquiry',
      message: enquiry.message || '',
      productName: enquiry.productName || '',
      status: enquiry.status || 'Pending'
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setIsSubmitting(true);
    try {
      await updateEnquiry(selectedEnquiry.id, formData);
      setIsEditOpen(false);
      showToast('Enquiry updated successfully.', 'success');
      loadEnquiries(true);
    } catch (err) {
      showToast(`Failed to update enquiry: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createEnquiry(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '', email: '', mobile: '', company: '',
        enquiryType: 'Product Enquiry', message: '', productName: '', status: 'Pending'
      });
      showToast('New enquiry recorded successfully.', 'success');
      loadEnquiries(true);
    } catch (err) {
      showToast(`Failed to create enquiry: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsSubmitting(true);
    try {
      await deleteEnquiry(deleteTargetId);
      setDeleteTargetId(null);
      showToast('Enquiry removed successfully.', 'success');
      loadEnquiries(true);
    } catch (err) {
      showToast(`Failed to delete enquiry: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paginated records
  const paginatedEnquiries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEnquiries.slice(startIndex, startIndex + pageSize);
  }, [filteredEnquiries, currentPage, pageSize]);

  return (
    <div className="enquiries-mgmt-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Card */}
      <div className="enquiries-header-card">
        <div className="enquiries-title-wrap">
          <div className="enquiries-kicker">CUSTOMER COMMUNICATIONS</div>
          <h1>Enquiries Management</h1>
          <p>Review, track, and respond to incoming customer product inquiries and business partnership requests</p>
        </div>
        <div className="enquiries-header-actions">
          <button 
            type="button" 
            className="btn-enquiries-secondary" 
            onClick={() => loadEnquiries(false)} 
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            type="button" 
            className="btn-enquiries-primary" 
            onClick={() => {
              setFormData({
                name: '', email: '', mobile: '', company: '',
                enquiryType: 'Product Enquiry', message: '', productName: '', status: 'Pending'
              });
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} />
            <span>New Enquiry</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="enquiries-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => loadEnquiries(false)} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Interactive Metric Cards */}
      <div className="enquiries-stats-grid">
        <div 
          className={`enquiries-stat-card ${statusFilter === 'All' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter('All')}
          title="Click to view all enquiries"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Total Enquiries</span>
              <span className="stat-card-value">{stats.total}</span>
            </div>
            <div className="stat-card-icon icon-total">
              <Mail size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge">All records</span>
          </div>
        </div>

        <div 
          className={`enquiries-stat-card ${statusFilter === 'Pending' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
          title="Click to filter pending enquiries"
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
            <span className="stat-badge badge-pending">Needs action</span>
          </div>
        </div>

        <div 
          className={`enquiries-stat-card ${statusFilter === 'In Progress' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
          title="Click to filter in-progress enquiries"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">In Progress</span>
              <span className="stat-card-value">{stats.inProgress}</span>
            </div>
            <div className="stat-card-icon icon-progress">
              <RefreshCw size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-progress">Under review</span>
          </div>
        </div>

        <div 
          className={`enquiries-stat-card ${statusFilter === 'Resolved' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'All' : 'Resolved')}
          title="Click to filter resolved & closed enquiries"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Resolved / Closed</span>
              <span className="stat-card-value">{stats.resolved}</span>
            </div>
            <div className="stat-card-icon icon-resolved">
              <CheckCircle size={22} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-badge badge-resolved">Completed</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="enquiries-toolbar-card">
        <div className="enquiries-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer, mobile, email, company, product..."
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

        <div className="enquiries-filter-group">
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="enquiry-select"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved / Closed</option>
            </select>
          </div>

          <div className="select-wrapper">
            <Package size={14} className="select-icon" />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="enquiry-select"
            >
              <option value="All">All Types</option>
              <option value="Product Enquiry">Product Enquiry</option>
              <option value="Sales Enquiry">Sales Enquiry</option>
              <option value="Dealer Enquiry">Dealer Enquiry</option>
              <option value="Distributor Enquiry">Distributor Enquiry</option>
              <option value="Support Enquiry">Support Enquiry</option>
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

          <div className="enquiries-count-tag">
            <span>{filteredEnquiries.length} {filteredEnquiries.length === 1 ? 'enquiry' : 'enquiries'}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="enquiries-table-card">
        {loading && enquiries.length === 0 ? (
          <div className="enquiries-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading customer enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="enquiries-empty-state">
            <div className="empty-icon-wrap">
              <HelpCircle size={36} />
            </div>
            <h3>No enquiries found</h3>
            <p>
              {hasActiveFilters 
                ? "No customer inquiries matched your current search filters." 
                : "No customer enquiries have been submitted yet."}
            </p>
            {hasActiveFilters && (
              <button type="button" className="btn-enquiries-secondary" onClick={handleResetFilters}>
                <RotateCcw size={14} /> Clear Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="enquiries-table-wrapper">
            <table className="enquiries-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>CUSTOMER</th>
                  <th style={{ width: '20%' }}>CONTACT INFO</th>
                  <th style={{ width: '15%' }}>ENQUIRY TYPE</th>
                  <th style={{ width: '18%' }}>PRODUCT / TOPIC</th>
                  <th style={{ width: '11%' }}>STATUS</th>
                  <th style={{ width: '14%' }}>DATE</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnquiries.map((item) => {
                  const conf = statusConfig[item.status] || statusConfig.Pending;
                  const typeMeta = typeBadgeConfig[item.enquiryType] || { label: item.enquiryType || 'General', class: 'type-general' };
                  const StatusIcon = conf.icon;
                  const initials = getInitials(item.name);

                  return (
                    <tr key={item.id} className="enquiry-table-row">
                      {/* Customer */}
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar" title={item.name || 'Customer'}>
                            {initials}
                          </div>
                          <div className="customer-meta">
                            <span className="customer-name">{item.name || 'Customer'}</span>
                            {item.company ? (
                              <span className="customer-company" title={item.company}>
                                <Building size={11} /> {item.company}
                              </span>
                            ) : (
                              <span className="customer-company individual">Individual</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div className="contact-cell">
                          {item.mobile && (
                            <a href={`tel:${item.mobile}`} className="contact-link" title="Call customer">
                              <Phone size={12} className="contact-icon" />
                              <span>{item.mobile}</span>
                            </a>
                          )}
                          {item.email && (
                            <a href={`mailto:${item.email}`} className="contact-link email" title="Email customer">
                              <Mail size={12} className="contact-icon" />
                              <span>{item.email}</span>
                            </a>
                          )}
                          {!item.mobile && !item.email && <span className="text-muted">No contact info</span>}
                        </div>
                      </td>

                      {/* Enquiry Type */}
                      <td>
                        <span className={`type-badge ${typeMeta.class}`}>
                          {item.enquiryType || 'General Enquiry'}
                        </span>
                      </td>

                      {/* Product / Topic */}
                      <td>
                        <div className="topic-cell">
                          {item.productName ? (
                            <div className="product-title" title={item.productName}>
                              <Package size={13} className="topic-icon" />
                              <span>{item.productName}</span>
                            </div>
                          ) : null}
                          {item.message ? (
                            <p className="message-snippet" title={item.message}>
                              {item.message}
                            </p>
                          ) : (
                            <span className="text-muted italic">No message provided</span>
                          )}
                        </div>
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
                            title="View Full Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            type="button" 
                            className="action-icon-btn action-edit" 
                            onClick={() => handleEditOpen(item)} 
                            title="Update Status & Notes"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            type="button" 
                            className="action-icon-btn action-delete" 
                            onClick={() => setDeleteTargetId(item.id)} 
                            title="Delete Enquiry"
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
        {filteredEnquiries.length > 0 && (
          <div className="enquiries-pagination-container">
            <Pagination
              page={currentPage}
              count={filteredEnquiries.length}
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
      {isDetailOpen && selectedEnquiry && createPortal(
        <div className="enquiry-modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="enquiry-modal-card enquiry-modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="enquiry-modal-header">
              <div className="modal-header-info">
                <div className="modal-kicker">ENQUIRY DETAILS</div>
                <h2>Enquiry #{selectedEnquiry.id}</h2>
                <span className="modal-subtitle">Submitted on {formatDateTimeToDMY(selectedEnquiry.createdAt)}</span>
              </div>
              <button 
                type="button" 
                className="enquiry-modal-close" 
                onClick={() => setIsDetailOpen(false)}
                title="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="enquiry-modal-body">
              {/* Top Banner with Status & Type */}
              <div className="enquiry-detail-banner">
                <div className="detail-banner-item">
                  <span className="banner-label">Status</span>
                  <span className={`status-pill status-${(selectedEnquiry.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                    {selectedEnquiry.status || 'Pending'}
                  </span>
                </div>
                <div className="detail-banner-item">
                  <span className="banner-label">Enquiry Type</span>
                  <span className="type-badge type-product">
                    {selectedEnquiry.enquiryType || 'General Enquiry'}
                  </span>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="detail-section-card">
                <h4 className="section-title">Customer Information</h4>
                <div className="detail-info-grid">
                  <div className="info-item">
                    <span className="info-label">Customer Name</span>
                    <span className="info-value"><strong>{selectedEnquiry.name || 'N/A'}</strong></span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mobile Number</span>
                    <span className="info-value">
                      {selectedEnquiry.mobile ? (
                        <a href={`tel:${selectedEnquiry.mobile}`} className="contact-link">
                          <Phone size={13} /> {selectedEnquiry.mobile}
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">
                      {selectedEnquiry.email ? (
                        <a href={`mailto:${selectedEnquiry.email}`} className="contact-link email">
                          <Mail size={13} /> {selectedEnquiry.email}
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Company / Organization</span>
                    <span className="info-value">{selectedEnquiry.company || 'Individual Customer'}</span>
                  </div>
                </div>
              </div>

              {/* Product Association */}
              {selectedEnquiry.productName && (
                <div className="detail-section-card">
                  <h4 className="section-title">Associated Product</h4>
                  <div className="product-attached-box">
                    <Package size={18} className="text-primary" />
                    <div>
                      <strong>{selectedEnquiry.productName}</strong>
                      <span className="text-muted block text-xs">Customer is requesting details for this product</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Details */}
              <div className="detail-section-card">
                <h4 className="section-title">Message / Request Content</h4>
                <div className="message-content-box">
                  {selectedEnquiry.message || 'No additional message was provided by customer.'}
                </div>
              </div>
            </div>

            <div className="enquiry-modal-footer">
              <button 
                type="button" 
                className="btn-enquiries-secondary" 
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn-enquiries-primary" 
                onClick={() => {
                  setIsDetailOpen(false);
                  handleEditOpen(selectedEnquiry);
                }}
              >
                <Edit3 size={15} /> Update Status
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. EDIT / UPDATE STATUS MODAL */}
      {isEditOpen && selectedEnquiry && createPortal(
        <div className="enquiry-modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="enquiry-modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdate}>
              <div className="enquiry-modal-header">
                <div className="modal-header-info">
                  <div className="modal-kicker">UPDATE RECORD</div>
                  <h2>Update Enquiry #{selectedEnquiry.id}</h2>
                </div>
                <button 
                  type="button" 
                  className="enquiry-modal-close" 
                  onClick={() => setIsEditOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="enquiry-modal-body">
                <div className="form-group-field">
                  <label htmlFor="edit-status">Enquiry Status *</label>
                  <select
                    id="edit-status"
                    className="enquiry-form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label htmlFor="edit-name">Customer Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    className="enquiry-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="edit-type">Enquiry Type</label>
                  <select
                    id="edit-type"
                    className="enquiry-form-input"
                    value={formData.enquiryType}
                    onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
                  >
                    <option value="Product Enquiry">Product Enquiry</option>
                    <option value="Sales Enquiry">Sales Enquiry</option>
                    <option value="Dealer Enquiry">Dealer Enquiry</option>
                    <option value="Distributor Enquiry">Distributor Enquiry</option>
                    <option value="Support Enquiry">Support Enquiry</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label htmlFor="edit-message">Notes &amp; Conversation History</label>
                  <textarea
                    id="edit-message"
                    rows={4}
                    className="enquiry-form-textarea"
                    placeholder="Enter internal notes, follow-up comments, or resolution details..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="enquiry-modal-footer">
                <button 
                  type="button" 
                  className="btn-enquiries-secondary" 
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-enquiries-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 3. CREATE NEW ENQUIRY MODAL */}
      {isCreateOpen && createPortal(
        <div className="enquiry-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="enquiry-modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateSubmit}>
              <div className="enquiry-modal-header">
                <div className="modal-header-info">
                  <div className="modal-kicker">MANUAL ENTRY</div>
                  <h2>Create New Enquiry</h2>
                  <span className="modal-subtitle">Log an offline, telephonic, or walk-in customer enquiry</span>
                </div>
                <button 
                  type="button" 
                  className="enquiry-modal-close" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="enquiry-modal-body">
                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-name">Customer Name *</label>
                    <input
                      id="new-name"
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      className="enquiry-form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-mobile">Mobile Number *</label>
                    <input
                      id="new-mobile"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile"
                      className="enquiry-form-input"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-email">Email Address</label>
                    <input
                      id="new-email"
                      type="email"
                      placeholder="customer@example.com"
                      className="enquiry-form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-company">Company Name</label>
                    <input
                      id="new-company"
                      type="text"
                      placeholder="Optional company name"
                      className="enquiry-form-input"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-type">Enquiry Type *</label>
                    <select
                      id="new-type"
                      className="enquiry-form-input"
                      value={formData.enquiryType}
                      onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
                    >
                      <option value="Product Enquiry">Product Enquiry</option>
                      <option value="Sales Enquiry">Sales Enquiry</option>
                      <option value="Dealer Enquiry">Dealer Enquiry</option>
                      <option value="Distributor Enquiry">Distributor Enquiry</option>
                      <option value="Support Enquiry">Support Enquiry</option>
                    </select>
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-product">Product Name (Optional)</label>
                    <input
                      id="new-product"
                      type="text"
                      placeholder="e.g. Honeywell Scanner"
                      className="enquiry-form-input"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label htmlFor="new-message">Enquiry Message / Description</label>
                  <textarea
                    id="new-message"
                    rows={3}
                    placeholder="Enter customer requirement details..."
                    className="enquiry-form-textarea"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="enquiry-modal-footer">
                <button 
                  type="button" 
                  className="btn-enquiries-secondary" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-enquiries-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deleteTargetId && createPortal(
        <div className="enquiry-modal-overlay" onClick={() => setDeleteTargetId(null)}>
          <div className="enquiry-modal-card enquiry-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="enquiry-modal-header">
              <div className="modal-header-info">
                <div className="modal-kicker text-red">CONFIRM ACTION</div>
                <h2>Delete Enquiry #{deleteTargetId}</h2>
              </div>
              <button 
                type="button" 
                className="enquiry-modal-close" 
                onClick={() => setDeleteTargetId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="enquiry-modal-body">
              <div className="delete-warning-box">
                <ShieldAlert size={28} className="delete-warning-icon" />
                <p>Are you sure you want to delete this customer enquiry? This action cannot be undone.</p>
              </div>
            </div>

            <div className="enquiry-modal-footer">
              <button 
                type="button" 
                className="btn-enquiries-secondary" 
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-enquiries-danger" 
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Enquiry'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
