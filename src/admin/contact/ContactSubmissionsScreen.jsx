import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Eye, Edit3, Trash2, Plus, X, 
  Mail, Clock, CheckCircle, RefreshCw, Phone, Building, Calendar, MessageSquare
} from 'lucide-react';
import { 
  getContactSubmissions, 
  getContactSubmissionById, 
  createContactSubmission, 
  updateContactSubmissionStatus, 
  deleteContactSubmission 
} from '../api/contact';
import './ContactSubmissionsScreen.css';

const statusConfig = {
  Pending: { label: 'Pending', class: 'pending', icon: Clock },
  'In Progress': { label: 'In Progress', class: 'progress', icon: RefreshCw },
  Resolved: { label: 'Resolved', class: 'resolved', icon: CheckCircle },
  Closed: { label: 'Closed', class: 'closed', icon: X }
};

export default function ContactSubmissionsScreen() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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

  // Load submissions from live API
  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContactSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load contact submissions:', err);
      setError('Could not connect to live contact submissions endpoint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesSearch = 
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.mobile || '').includes(searchTerm) ||
        (item.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.message || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
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
    try {
      await updateContactSubmissionStatus(selectedSubmission.id, formData);
      setIsEditOpen(false);
      loadSubmissions();
    } catch (err) {
      alert(`Failed to update contact submission: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createContactSubmission(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '', email: '', mobile: '', company: '',
        enquiryType: 'General Enquiry', message: '', status: 'Pending'
      });
      loadSubmissions();
    } catch (err) {
      alert(`Failed to create contact submission: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteContactSubmission(deleteTargetId);
      setDeleteTargetId(null);
      loadSubmissions();
    } catch (err) {
      alert(`Failed to delete contact submission: ${err.message}`);
    }
  };

  return (
    <div className="contact-submissions-container">
      {/* Header */}
      <div className="contact-submissions-header">
        <div className="contact-submissions-title">
          <h1>Contact Submissions Console</h1>
          <p>Live REST API integration for Contact Us form entries (`/api/contact`)</p>
        </div>
        <div className="contact-submissions-actions">
          <button className="btn-secondary" onClick={loadSubmissions} title="Refresh Data">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => {
            setFormData({
              name: '', email: '', mobile: '', company: '',
              enquiryType: 'General Enquiry', message: '', status: 'Pending'
            });
            setIsCreateOpen(true);
          }}>
            <Plus size={18} /> New Submission
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="contact-stats-grid">
        <div className="contact-stat-card">
          <div className="contact-stat-info">
            <div className="stat-label">Total Submissions</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="contact-stat-icon total"><Mail size={22} /></div>
        </div>
        <div className="contact-stat-card">
          <div className="contact-stat-info">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="contact-stat-icon pending"><Clock size={22} /></div>
        </div>
        <div className="contact-stat-card">
          <div className="contact-stat-info">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{stats.inProgress}</div>
          </div>
          <div className="contact-stat-icon progress"><RefreshCw size={22} /></div>
        </div>
        <div className="contact-stat-card">
          <div className="contact-stat-info">
            <div className="stat-label">Resolved / Closed</div>
            <div className="stat-value">{stats.resolved}</div>
          </div>
          <div className="contact-stat-icon resolved"><CheckCircle size={22} /></div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="contact-filter-bar">
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by customer name, mobile, email, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            <option value="General Enquiry">General Enquiry</option>
            <option value="Product Enquiry">Product Enquiry</option>
            <option value="Sales Enquiry">Sales Enquiry</option>
            <option value="Dealer Enquiry">Dealer Enquiry</option>
            <option value="Distributor Enquiry">Distributor Enquiry</option>
            <option value="Support Enquiry">Support Enquiry</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="contact-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Connecting to `/api/contact` live endpoint...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
            <button className="btn-secondary" onClick={loadSubmissions} style={{ marginTop: 12 }}>
              Try Again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={36} style={{ marginBottom: 12, color: '#94a3b8' }} />
            <h3>No contact submissions found</h3>
            <p>There are no contact form entries matching your search filters.</p>
          </div>
        ) : (
          <table className="contact-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Enquiry Type</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((item) => {
                const conf = statusConfig[item.status] || statusConfig.Pending;
                const StatusIcon = conf.icon;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{item.name || 'Customer'}</strong>
                      {item.company && <span style={{ fontSize: '12px', color: '#64748b' }}>{item.company}</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{item.mobile}</div>
                      {item.email && <div style={{ fontSize: '12px', color: '#64748b' }}>{item.email}</div>}
                    </td>
                    <td>
                      <span className="type-pill">{item.enquiryType}</span>
                    </td>
                    <td>
                      <span>{item.message.slice(0, 45) + (item.message.length > 45 ? '...' : '')}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${conf.class}`}>
                        <StatusIcon size={12} /> {conf.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-icon" onClick={() => handleView(item.id)} title="View Details (GET /api/contact/{id})">
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleEditOpen(item)} title="Update Status (PUT /api/contact/{id})">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-icon delete" onClick={() => setDeleteTargetId(item.id)} title="Delete (DELETE /api/contact/{id})">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAIL MODAL (GET by ID) */}
      {isDetailOpen && selectedSubmission && (
        <div className="modal-backdrop" onClick={() => setIsDetailOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact Submission Details (ID: {selectedSubmission.id})</h2>
              <button className="modal-close-btn" onClick={() => setIsDetailOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label><Mail size={12} /> Name</label>
                  <p>{selectedSubmission.name}</p>
                </div>
                <div className="detail-item">
                  <label><Phone size={12} /> Mobile</label>
                  <p>{selectedSubmission.mobile}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedSubmission.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label><Building size={12} /> Company</label>
                  <p>{selectedSubmission.company || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <p>{selectedSubmission.enquiryType}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{selectedSubmission.status}</p>
                </div>
                <div className="detail-item full">
                  <label>Message Content</label>
                  <p style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    {selectedSubmission.message || 'No additional message provided.'}
                  </p>
                </div>
                <div className="detail-item">
                  <label><Calendar size={12} /> Date Submitted</label>
                  <p>{new Date(selectedSubmission.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDetailOpen(false)}>Close</button>
              <button className="btn-primary" onClick={() => { setIsDetailOpen(false); handleEditOpen(selectedSubmission); }}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (PUT by ID) */}
      {isEditOpen && selectedSubmission && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdate}>
              <div className="modal-header">
                <h2>Update Submission (PUT /api/contact/{selectedSubmission.id})</h2>
                <button type="button" className="modal-close-btn" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Enquiry Type</label>
                  <select
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
                <div className="form-group">
                  <label>Message Content</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL (POST) */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-header">
                <h2>New Contact Entry (POST /api/contact)</h2>
                <button type="button" className="modal-close-btn" onClick={() => setIsCreateOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company (Optional)</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Enquiry Type</label>
                  <select
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
                <div className="form-group">
                  <label>Message Content *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (DELETE by ID) */}
      {deleteTargetId && (
        <div className="modal-backdrop" onClick={() => setDeleteTargetId(null)}>
          <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="modal-close-btn" onClick={() => setDeleteTargetId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete submission #{deleteTargetId}? This operation calls `DELETE /api/contact/{deleteTargetId}`.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteTargetId(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#dc2626' }} onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
