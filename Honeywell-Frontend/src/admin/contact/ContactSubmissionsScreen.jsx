import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Eye, Edit3, Trash2, Plus, X, 
  Mail, Clock, CheckCircle, RefreshCw, Phone, 
  Building, Calendar, MessageSquare, Filter, RotateCcw,
  Sparkles, CheckCircle2, AlertCircle, ShieldAlert, FileText, Send
} from 'lucide-react';
import { 
  getContactSubmissions, 
  getContactSubmissionById, 
  createContactSubmission, 
  updateContactSubmissionStatus, 
  deleteContactSubmission 
} from '../api/contact';
import { Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './ContactSubmissionsScreen.css';

const statusConfig = {
  Pending: { label: 'Pending', class: 'pending', icon: Clock },
  'In Progress': { label: 'In Progress', class: 'progress', icon: RefreshCw },
  Resolved: { label: 'Resolved', class: 'resolved', icon: CheckCircle },
  Closed: { label: 'Closed', class: 'closed', icon: X }
};

const typeBadgeConfig = {
  'General Enquiry': { label: 'General', class: 'type-general' },
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

export default function ContactSubmissionsScreen() {
  const [submissions, setSubmissions] = useState([]);
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
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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
    enquiryType: 'General Enquiry',
    message: '',
    status: 'Pending'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load submissions from live API
  const loadSubmissions = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await getContactSubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load contact submissions:', err);
      if (!isBackground) {
        setError('Could not connect to live contact submissions endpoint. Please check network connection.');
        showToast('Failed to load contact submissions.', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();

    const handleUpdate = () => loadSubmissions(true);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('sat_contacts_updated', handleUpdate);

    const interval = setInterval(() => loadSubmissions(true), 8000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('sat_contacts_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || (
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.email || '').toLowerCase().includes(searchLower) ||
        (item.mobile || '').includes(searchLower) ||
        (item.company || '').toLowerCase().includes(searchLower) ||
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
  }, [submissions, searchTerm, statusFilter, typeFilter]);

  // Metric Stats
  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'Pending').length,
    inProgress: submissions.filter(s => s.status === 'In Progress').length,
    resolved: submissions.filter(s => s.status === 'Resolved' || s.status === 'Closed').length
  }), [submissions]);

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
      const single = await getContactSubmissionById(id);
      setSelectedSubmission(single || submissions.find(s => s.id === id));
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Error fetching submission details:', err);
      setSelectedSubmission(submissions.find(s => s.id === id));
      setIsDetailOpen(true);
    }
  };

  const handleEditOpen = (submission) => {
    setSelectedSubmission(submission);
    setFormData({
      name: submission.name || '',
      email: submission.email || '',
      mobile: submission.mobile || '',
      company: submission.company || '',
      enquiryType: submission.enquiryType || 'General Enquiry',
      message: submission.message || '',
      status: submission.status || 'Pending'
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setIsSubmitting(true);
    try {
      await updateContactSubmissionStatus(selectedSubmission.id, formData);
      setIsEditOpen(false);
      showToast('Contact submission updated successfully.', 'success');
      loadSubmissions(true);
    } catch (err) {
      showToast(`Failed to update submission: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createContactSubmission(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '', email: '', mobile: '', company: '',
        enquiryType: 'General Enquiry', message: '', status: 'Pending'
      });
      showToast('New contact submission recorded successfully.', 'success');
      loadSubmissions(true);
    } catch (err) {
      showToast(`Failed to record submission: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsSubmitting(true);
    try {
      await deleteContactSubmission(deleteTargetId);
      setDeleteTargetId(null);
      showToast('Contact submission deleted successfully.', 'success');
      loadSubmissions(true);
    } catch (err) {
      showToast(`Failed to delete submission: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paginated records
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSubmissions.slice(startIndex, startIndex + pageSize);
  }, [filteredSubmissions, currentPage, pageSize]);

  return (
    <div className="contact-mgmt-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Card */}
      <div className="contact-header-card">
        <div className="contact-title-wrap">
          <div className="contact-kicker">COMMUNICATIONS &amp; FEEDBACK</div>
          <h1>Contact Form Submissions</h1>
          <p>Review, manage, and respond to incoming user messages received via the Contact Us portal</p>
        </div>
        <div className="contact-header-actions">
          <button 
            type="button" 
            className="btn-contact-secondary" 
            onClick={() => loadSubmissions(false)} 
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            type="button" 
            className="btn-contact-primary" 
            onClick={() => {
              setFormData({
                name: '', email: '', mobile: '', company: '',
                enquiryType: 'General Enquiry', message: '', status: 'Pending'
              });
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} />
            <span>New Submission</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="contact-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => loadSubmissions(false)} className="btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Interactive Metric Cards */}
      <div className="contact-stats-grid">
        <div 
          className={`contact-stat-card ${statusFilter === 'All' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter('All')}
          title="Click to view all submissions"
        >
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="stat-card-label">Total Submissions</span>
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
          className={`contact-stat-card ${statusFilter === 'Pending' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
          title="Click to filter pending submissions"
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
          className={`contact-stat-card ${statusFilter === 'In Progress' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
          title="Click to filter in-progress submissions"
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
          className={`contact-stat-card ${statusFilter === 'Resolved' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'All' : 'Resolved')}
          title="Click to filter resolved & closed submissions"
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
      <div className="contact-toolbar-card">
        <div className="contact-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, email, company, message..."
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

        <div className="contact-filter-group">
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="contact-select"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved / Closed</option>
            </select>
          </div>

          <div className="select-wrapper">
            <FileText size={14} className="select-icon" />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="contact-select"
            >
              <option value="All">All Types</option>
              <option value="General Enquiry">General Enquiry</option>
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

          <div className="contact-count-tag">
            <span>{filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'submission' : 'submissions'}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="contact-table-card">
        {loading && submissions.length === 0 ? (
          <div className="contact-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading contact form entries...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="contact-empty-state">
            <div className="empty-icon-wrap">
              <MessageSquare size={36} />
            </div>
            <h3>No submissions found</h3>
            <p>
              {hasActiveFilters 
                ? "No contact submissions matched your current search filters." 
                : "No contact messages have been received yet."}
            </p>
            {hasActiveFilters && (
              <button type="button" className="btn-contact-secondary" onClick={handleResetFilters}>
                <RotateCcw size={14} /> Clear Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="contact-table-wrapper">
            <table className="contact-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>CUSTOMER / SENDER</th>
                  <th style={{ width: '20%' }}>CONTACT DETAILS</th>
                  <th style={{ width: '15%' }}>ENQUIRY TYPE</th>
                  <th style={{ width: '20%' }}>MESSAGE PREVIEW</th>
                  <th style={{ width: '11%' }}>STATUS</th>
                  <th style={{ width: '13%' }}>DATE</th>
                  <th style={{ width: '9%', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.map((item) => {
                  const conf = statusConfig[item.status] || statusConfig.Pending;
                  const typeMeta = typeBadgeConfig[item.enquiryType] || { label: item.enquiryType || 'General', class: 'type-general' };
                  const StatusIcon = conf.icon;
                  const initials = getInitials(item.name);

                  return (
                    <tr key={item.id} className="contact-table-row">
                      {/* Customer / Sender */}
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar" title={item.name || 'Sender'}>
                            {initials}
                          </div>
                          <div className="customer-meta">
                            <span className="customer-name">{item.name || 'Sender'}</span>
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

                      {/* Contact Details */}
                      <td>
                        <div className="contact-cell">
                          {item.mobile && (
                            <a href={`tel:${item.mobile}`} className="contact-link" title="Call sender">
                              <Phone size={12} className="contact-icon" />
                              <span>{item.mobile}</span>
                            </a>
                          )}
                          {item.email && (
                            <a href={`mailto:${item.email}`} className="contact-link email" title="Email sender">
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

                      {/* Message Preview */}
                      <td>
                        <div className="topic-cell">
                          {item.message ? (
                            <p className="message-snippet" title={item.message}>
                              {item.message}
                            </p>
                          ) : (
                            <span className="text-muted italic">No message text</span>
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
                            title="View Message Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            type="button" 
                            className="action-icon-btn action-edit" 
                            onClick={() => handleEditOpen(item)} 
                            title="Update Status"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            type="button" 
                            className="action-icon-btn action-delete" 
                            onClick={() => setDeleteTargetId(item.id)} 
                            title="Delete Submission"
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
        {filteredSubmissions.length > 0 && (
          <div className="contact-pagination-container">
            <Pagination
              page={currentPage}
              count={filteredSubmissions.length}
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
      {isDetailOpen && selectedSubmission && createPortal(
        <div className="contact-modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="contact-modal-card contact-modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <div className="modal-header-info">
                <div className="modal-kicker">CONTACT SUBMISSION</div>
                <h2>Submission #{selectedSubmission.id}</h2>
                <span className="modal-subtitle">Received on {formatDateTimeToDMY(selectedSubmission.createdAt)}</span>
              </div>
              <button 
                type="button" 
                className="contact-modal-close" 
                onClick={() => setIsDetailOpen(false)}
                title="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="contact-modal-body">
              {/* Top Banner with Status & Type */}
              <div className="contact-detail-banner">
                <div className="detail-banner-item">
                  <span className="banner-label">Current Status</span>
                  <span className={`status-pill status-${(selectedSubmission.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                    {selectedSubmission.status || 'Pending'}
                  </span>
                </div>
                <div className="detail-banner-item">
                  <span className="banner-label">Enquiry Category</span>
                  <span className="type-badge type-general">
                    {selectedSubmission.enquiryType || 'General Enquiry'}
                  </span>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="detail-section-card">
                <h4 className="section-title">Sender Information</h4>
                <div className="detail-info-grid">
                  <div className="info-item">
                    <span className="info-label">Sender Name</span>
                    <span className="info-value"><strong>{selectedSubmission.name || 'N/A'}</strong></span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mobile Number</span>
                    <span className="info-value">
                      {selectedSubmission.mobile ? (
                        <a href={`tel:${selectedSubmission.mobile}`} className="contact-link">
                          <Phone size={13} /> {selectedSubmission.mobile}
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">
                      {selectedSubmission.email ? (
                        <a href={`mailto:${selectedSubmission.email}`} className="contact-link email">
                          <Mail size={13} /> {selectedSubmission.email}
                        </a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Company / Business</span>
                    <span className="info-value">{selectedSubmission.company || 'Individual User'}</span>
                  </div>
                </div>
              </div>

              {/* Message Details */}
              <div className="detail-section-card">
                <h4 className="section-title">Full Message Content</h4>
                <div className="message-content-box">
                  {selectedSubmission.message || 'No message content provided.'}
                </div>
              </div>
            </div>

            <div className="contact-modal-footer">
              <button 
                type="button" 
                className="btn-contact-secondary" 
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn-contact-primary" 
                onClick={() => {
                  setIsDetailOpen(false);
                  handleEditOpen(selectedSubmission);
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
      {isEditOpen && selectedSubmission && createPortal(
        <div className="contact-modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="contact-modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdate}>
              <div className="contact-modal-header">
                <div className="modal-header-info">
                  <div className="modal-kicker">UPDATE STATUS</div>
                  <h2>Update Submission #{selectedSubmission.id}</h2>
                </div>
                <button 
                  type="button" 
                  className="contact-modal-close" 
                  onClick={() => setIsEditOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="contact-modal-body">
                <div className="form-group-field">
                  <label htmlFor="edit-status">Submission Status *</label>
                  <select
                    id="edit-status"
                    className="contact-form-input"
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
                  <label htmlFor="edit-name">Sender Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    className="contact-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="edit-type">Enquiry Category</label>
                  <select
                    id="edit-type"
                    className="contact-form-input"
                    value={formData.enquiryType}
                    onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
                  >
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Product Enquiry">Product Enquiry</option>
                    <option value="Sales Enquiry">Sales Enquiry</option>
                    <option value="Dealer Enquiry">Dealer Enquiry</option>
                    <option value="Distributor Enquiry">Distributor Enquiry</option>
                    <option value="Support Enquiry">Support Enquiry</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label htmlFor="edit-message">Notes &amp; Response History</label>
                  <textarea
                    id="edit-message"
                    rows={4}
                    className="contact-form-textarea"
                    placeholder="Enter internal resolution notes, customer follow-up actions..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="contact-modal-footer">
                <button 
                  type="button" 
                  className="btn-contact-secondary" 
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-contact-primary" 
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

      {/* 3. CREATE NEW CONTACT SUBMISSION MODAL */}
      {isCreateOpen && createPortal(
        <div className="contact-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="contact-modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateSubmit}>
              <div className="contact-modal-header">
                <div className="modal-header-info">
                  <div className="modal-kicker">MANUAL ENTRY</div>
                  <h2>New Contact Submission</h2>
                  <span className="modal-subtitle">Record a customer message or offline inquiry</span>
                </div>
                <button 
                  type="button" 
                  className="contact-modal-close" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="contact-modal-body">
                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-name">Sender Name *</label>
                    <input
                      id="new-name"
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      className="contact-form-input"
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
                      className="contact-form-input"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-field">
                    <label htmlFor="new-email">Email Address *</label>
                    <input
                      id="new-email"
                      type="email"
                      required
                      placeholder="customer@example.com"
                      className="contact-form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-field">
                    <label htmlFor="new-company">Company (Optional)</label>
                    <input
                      id="new-company"
                      type="text"
                      placeholder="Optional company name"
                      className="contact-form-input"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label htmlFor="new-type">Enquiry Category *</label>
                  <select
                    id="new-type"
                    className="contact-form-input"
                    value={formData.enquiryType}
                    onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
                  >
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Product Enquiry">Product Enquiry</option>
                    <option value="Sales Enquiry">Sales Enquiry</option>
                    <option value="Dealer Enquiry">Dealer Enquiry</option>
                    <option value="Distributor Enquiry">Distributor Enquiry</option>
                    <option value="Support Enquiry">Support Enquiry</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label htmlFor="new-message">Message Content *</label>
                  <textarea
                    id="new-message"
                    rows={3}
                    required
                    placeholder="Enter customer message / feedback..."
                    className="contact-form-textarea"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="contact-modal-footer">
                <button 
                  type="button" 
                  className="btn-contact-secondary" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-contact-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deleteTargetId && createPortal(
        <div className="contact-modal-overlay" onClick={() => setDeleteTargetId(null)}>
          <div className="contact-modal-card contact-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <div className="modal-header-info">
                <div className="modal-kicker text-red">CONFIRM ACTION</div>
                <h2>Delete Submission #{deleteTargetId}</h2>
              </div>
              <button 
                type="button" 
                className="contact-modal-close" 
                onClick={() => setDeleteTargetId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="contact-modal-body">
              <div className="delete-warning-box">
                <ShieldAlert size={28} className="delete-warning-icon" />
                <p>Are you sure you want to delete this contact submission? This action cannot be undone.</p>
              </div>
            </div>

            <div className="contact-modal-footer">
              <button 
                type="button" 
                className="btn-contact-secondary" 
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-contact-danger" 
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Submission'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
