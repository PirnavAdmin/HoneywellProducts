import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Eye, Edit3, Trash2, Plus, X, 
  HelpCircle, Clock, CheckCircle, RefreshCw, Mail, Phone, Building, Calendar, Package
} from 'lucide-react';
import { getEnquiries, getEnquiryById, createEnquiry, updateEnquiry, deleteEnquiry } from '../api/enquiries';
import './EnquiriesScreen.css';

const statusConfig = {
  Pending: { label: 'Pending', class: 'pending', icon: Clock },
  'In Progress': { label: 'In Progress', class: 'progress', icon: RefreshCw },
  Resolved: { label: 'Resolved', class: 'resolved', icon: CheckCircle },
  Closed: { label: 'Closed', class: 'closed', icon: X }
};

export default function EnquiriesScreen() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
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
    enquiryType: 'Product Enquiry',
    message: '',
    productName: '',
    status: 'Pending'
  });

  // Load enquiries from live API
  const loadEnquiries = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await getEnquiries();
      setEnquiries(data);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      if (!isBackground) setError('Could not connect to live enquiries endpoint. Please try again.');
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

    const interval = setInterval(() => loadEnquiries(true), 5000);

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
      const matchesSearch = 
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.mobile || '').includes(searchTerm) ||
        (item.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.message || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
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

  // Handlers
  const handleView = async (id) => {
    try {
      const single = await getEnquiryById(id);
      setSelectedEnquiry(single || enquiries.find(e => e.id === id));
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Error fetching inquiry details:', err);
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
    try {
      await updateEnquiry(selectedEnquiry.id, formData);
      setIsEditOpen(false);
      loadEnquiries();
    } catch (err) {
      alert(`Failed to update inquiry: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEnquiry(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '', email: '', mobile: '', company: '',
        enquiryType: 'Product Enquiry', message: '', productName: '', status: 'Pending'
      });
      loadEnquiries();
    } catch (err) {
      alert(`Failed to create inquiry: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteEnquiry(deleteTargetId);
      setDeleteTargetId(null);
      loadEnquiries();
    } catch (err) {
      alert(`Failed to delete inquiry: ${err.message}`);
    }
  };

  return (
    <div className="enquiries-container">
      {/* Header */}
      <div className="enquiries-header">
        <div className="enquiries-title">
          <h1>Enquiries Console</h1>
          <p>Live REST API integration for user product, solution, and business enquiries (`/api/enquiries`)</p>
        </div>
        <div className="enquiries-header-actions">
          <button className="btn-secondary" onClick={loadEnquiries} title="Refresh Data">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => {
            setFormData({
              name: '', email: '', mobile: '', company: '',
              enquiryType: 'Product Enquiry', message: '', productName: '', status: 'Pending'
            });
            setIsCreateOpen(true);
          }}>
            <Plus size={18} /> New Enquiry
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="enquiries-stats-grid">
        <div className="enquiry-stat-card">
          <div className="enquiry-stat-info">
            <div className="stat-label">Total Enquiries</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="enquiry-stat-icon total"><HelpCircle size={22} /></div>
        </div>
        <div className="enquiry-stat-card">
          <div className="enquiry-stat-info">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="enquiry-stat-icon pending"><Clock size={22} /></div>
        </div>
        <div className="enquiry-stat-card">
          <div className="enquiry-stat-info">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{stats.inProgress}</div>
          </div>
          <div className="enquiry-stat-icon progress"><RefreshCw size={22} /></div>
        </div>
        <div className="enquiry-stat-card">
          <div className="enquiry-stat-info">
            <div className="stat-label">Resolved / Closed</div>
            <div className="stat-value">{stats.resolved}</div>
          </div>
          <div className="enquiry-stat-icon resolved"><CheckCircle size={22} /></div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="enquiries-filter-bar">
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by customer name, mobile, email, product..."
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
            <option value="Product Enquiry">Product Enquiry</option>
            <option value="Sales Enquiry">Sales Enquiry</option>
            <option value="Dealer Enquiry">Dealer Enquiry</option>
            <option value="Distributor Enquiry">Distributor Enquiry</option>
            <option value="Support Enquiry">Support Enquiry</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="enquiries-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Connecting to `/api/enquiries` live endpoint...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
            <button className="btn-secondary" onClick={loadEnquiries} style={{ marginTop: 12 }}>
              Try Again
            </button>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="empty-state">
            <HelpCircle size={36} style={{ marginBottom: 12, color: '#94a3b8' }} />
            <h3>No enquiries found</h3>
            <p>There are no user enquiries matching your search filters.</p>
          </div>
        ) : (
          <table className="enquiries-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Enquiry Type</th>
                <th>Product / Topic</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((item) => {
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
                      <span>{item.productName || item.message.slice(0, 35) + (item.message.length > 35 ? '...' : '')}</span>
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
                        <button className="btn-icon" onClick={() => handleView(item.id)} title="View Details (GET /api/enquiries/{id})">
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleEditOpen(item)} title="Update Status (PUT /api/enquiries/{id})">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-icon delete" onClick={() => setDeleteTargetId(item.id)} title="Delete (DELETE /api/enquiries/{id})">
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
      {isDetailOpen && selectedEnquiry && (
        <div className="modal-backdrop" onClick={() => setIsDetailOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enquiry Details (ID: {selectedEnquiry.id})</h2>
              <button className="modal-close-btn" onClick={() => setIsDetailOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label><Mail size={12} /> Name</label>
                  <p>{selectedEnquiry.name}</p>
                </div>
                <div className="detail-item">
                  <label><Phone size={12} /> Mobile</label>
                  <p>{selectedEnquiry.mobile}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedEnquiry.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label><Building size={12} /> Company</label>
                  <p>{selectedEnquiry.company || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <p>{selectedEnquiry.enquiryType}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{selectedEnquiry.status}</p>
                </div>
                {selectedEnquiry.productName && (
                  <div className="detail-item full">
                    <label><Package size={12} /> Associated Product</label>
                    <p>{selectedEnquiry.productName}</p>
                  </div>
                )}
                <div className="detail-item full">
                  <label>Message / Details</label>
                  <p style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    {selectedEnquiry.message || 'No additional message provided.'}
                  </p>
                </div>
                <div className="detail-item">
                  <label><Calendar size={12} /> Date Submitted</label>
                  <p>{new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDetailOpen(false)}>Close</button>
              <button className="btn-primary" onClick={() => { setIsDetailOpen(false); handleEditOpen(selectedEnquiry); }}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (PUT by ID) */}
      {isEditOpen && selectedEnquiry && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdate}>
              <div className="modal-header">
                <h2>Update Inquiry (PUT /api/enquiries/{selectedEnquiry.id})</h2>
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
                    <option value="Product Enquiry">Product Enquiry</option>
                    <option value="Sales Enquiry">Sales Enquiry</option>
                    <option value="Dealer Enquiry">Dealer Enquiry</option>
                    <option value="Distributor Enquiry">Distributor Enquiry</option>
                    <option value="Support Enquiry">Support Enquiry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes / Message</label>
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
                <h2>New Enquiry (POST /api/enquiries)</h2>
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
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Enquiry Type</label>
                  <select
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
                <div className="form-group">
                  <label>Product Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Message / Details</label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Enquiry</button>
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
              <p>Are you sure you want to delete inquiry #{deleteTargetId}? This operation calls `DELETE /api/enquiries/{deleteTargetId}`.</p>
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
