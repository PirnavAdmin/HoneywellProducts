import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Eye, Edit3, Trash2, Plus, X, 
  FileSpreadsheet, Clock, CheckCircle, RefreshCw, Phone, Building, Calendar, MapPin, DollarSign
} from 'lucide-react';
import { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote } from '../api/quotes';
import './QuotesScreen.css';

const statusConfig = {
  Pending: { label: 'Pending', class: 'pending', icon: Clock },
  'In Review': { label: 'In Review', class: 'progress', icon: RefreshCw },
  Quoted: { label: 'Quoted / Approved', class: 'approved', icon: CheckCircle },
  Rejected: { label: 'Rejected / Closed', class: 'rejected', icon: X }
};

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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

  // Load quotes from live API
  const loadQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch (err) {
      console.error('Failed to load quotes:', err);
      setError('Could not connect to live quotes endpoint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  // Filtered Quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((item) => {
      const matchesSearch = 
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.gstin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.mobile || '').includes(searchTerm) ||
        (item.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(searchTerm.toLowerCase());

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
    try {
      await updateQuote(selectedQuote.id, formData);
      setIsEditOpen(false);
      loadQuotes();
    } catch (err) {
      alert(`Failed to update quote: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createQuote(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '', companyName: '', gstin: '', email: '', mobile: '',
        product: 'General bulk requirement', quantity: 1, location: '', requirement: '',
        quoteAmount: 0, status: 'Pending'
      });
      loadQuotes();
    } catch (err) {
      alert(`Failed to create quote request: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteQuote(deleteTargetId);
      setDeleteTargetId(null);
      loadQuotes();
    } catch (err) {
      alert(`Failed to delete quote: ${err.message}`);
    }
  };

  const formatPrice = (amt) => `INR ${Number(amt || 0).toLocaleString('en-IN')}`;

  return (
    <div className="quotes-container">
      {/* Header */}
      <div className="quotes-header">
        <div className="quotes-title">
          <h1>Bulk Quotes Console</h1>
          <p>Live REST API integration for B2B bulk quote requests (`/api/quotes`)</p>
        </div>
        <div className="quotes-actions">
          <button className="btn-secondary" onClick={loadQuotes} title="Refresh Data">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => {
            setFormData({
              name: '', companyName: '', gstin: '', email: '', mobile: '',
              product: 'General bulk requirement', quantity: 1, location: '', requirement: '',
              quoteAmount: 0, status: 'Pending'
            });
            setIsCreateOpen(true);
          }}>
            <Plus size={18} /> New Quote Request
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="quote-stats-grid">
        <div className="quote-stat-card">
          <div className="quote-stat-info">
            <div className="stat-label">Total Requests</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="quote-stat-icon total"><FileSpreadsheet size={22} /></div>
        </div>
        <div className="quote-stat-card">
          <div className="quote-stat-info">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="quote-stat-icon pending"><Clock size={22} /></div>
        </div>
        <div className="quote-stat-card">
          <div className="quote-stat-info">
            <div className="stat-label">Quoted / Approved</div>
            <div className="stat-value">{stats.quoted}</div>
          </div>
          <div className="quote-stat-icon approved"><CheckCircle size={22} /></div>
        </div>
        <div className="quote-stat-card">
          <div className="quote-stat-info">
            <div className="stat-label">Rejected / Closed</div>
            <div className="stat-value">{stats.rejected}</div>
          </div>
          <div className="quote-stat-icon rejected"><X size={22} /></div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="quote-filter-bar">
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by company, customer name, GSTIN, product, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-selects">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Quoted">Quoted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="quote-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Connecting to `/api/quotes` live endpoint...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
            <button className="btn-secondary" onClick={loadQuotes} style={{ marginTop: 12 }}>
              Try Again
            </button>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="empty-state">
            <FileSpreadsheet size={36} style={{ marginBottom: 12, color: '#94a3b8' }} />
            <h3>No bulk quotes found</h3>
            <p>There are no quote requests matching your search filters.</p>
          </div>
        ) : (
          <table className="quote-table">
            <thead>
              <tr>
                <th>Company & Contact</th>
                <th>Product & Qty</th>
                <th>Location</th>
                <th>Quoted Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((item) => {
                const conf = statusConfig[item.status] || statusConfig.Pending;
                const StatusIcon = conf.icon;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{item.companyName || item.name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{item.name} ({item.mobile})</span>
                      {item.gstin && <div style={{ fontSize: '11px', color: '#0284c7' }}>GSTIN: {item.gstin}</div>}
                    </td>
                    <td>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{item.product}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Quantity: {item.quantity} units</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{item.location || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="amount-badge">
                        {item.quoteAmount > 0 ? formatPrice(item.quoteAmount) : 'Pending Offer'}
                      </span>
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
                        <button className="btn-icon" onClick={() => handleView(item.id)} title="View Details (GET /api/quotes/{id})">
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleEditOpen(item)} title="Update Quote/Status (PUT /api/quotes/{id})">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-icon delete" onClick={() => setDeleteTargetId(item.id)} title="Delete (DELETE /api/quotes/{id})">
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
      {isDetailOpen && selectedQuote && (
        <div className="modal-backdrop" onClick={() => setIsDetailOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quote Request Details (ID: {selectedQuote.id})</h2>
              <button className="modal-close-btn" onClick={() => setIsDetailOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label><Building size={12} /> Company Name</label>
                  <p>{selectedQuote.companyName || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>GSTIN Number</label>
                  <p>{selectedQuote.gstin || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Contact Person</label>
                  <p>{selectedQuote.name}</p>
                </div>
                <div className="detail-item">
                  <label><Phone size={12} /> Mobile</label>
                  <p>{selectedQuote.mobile}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedQuote.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label><MapPin size={12} /> Project Location</label>
                  <p>{selectedQuote.location || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Target Product</label>
                  <p>{selectedQuote.product}</p>
                </div>
                <div className="detail-item">
                  <label>Required Quantity</label>
                  <p>{selectedQuote.quantity} units</p>
                </div>
                <div className="detail-item">
                  <label><DollarSign size={12} /> Quote Amount</label>
                  <p style={{ color: '#16a34a', fontWeight: 700 }}>
                    {selectedQuote.quoteAmount > 0 ? formatPrice(selectedQuote.quoteAmount) : 'Not Quoted Yet'}
                  </p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{selectedQuote.status}</p>
                </div>
                <div className="detail-item full">
                  <label>Requirement Details</label>
                  <p style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    {selectedQuote.requirement || 'No detailed specifications provided.'}
                  </p>
                </div>
                <div className="detail-item">
                  <label><Calendar size={12} /> Date Requested</label>
                  <p>{new Date(selectedQuote.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDetailOpen(false)}>Close</button>
              <button className="btn-primary" onClick={() => { setIsDetailOpen(false); handleEditOpen(selectedQuote); }}>
                Update Quote / Pricing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (PUT by ID) */}
      {isEditOpen && selectedQuote && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdate}>
              <div className="modal-header">
                <h2>Update Quote & Offer (PUT /api/quotes/{selectedQuote.id})</h2>
                <button type="button" className="modal-close-btn" onClick={() => setIsEditOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Quote Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="Quoted">Quoted / Offer Sent</option>
                    <option value="Rejected">Rejected / Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quoted Commercial Amount (INR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter final quote offer amount in INR"
                    value={formData.quoteAmount}
                    onChange={(e) => setFormData({ ...formData, quoteAmount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Requirement / Notes</label>
                  <textarea
                    rows={3}
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Quote Offer</button>
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
                <h2>New Bulk Quote Request (POST /api/quotes)</h2>
                <button type="button" className="modal-close-btn" onClick={() => setIsCreateOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>GSTIN (Optional)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
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
                  <label>Target Product *</label>
                  <input
                    type="text"
                    required
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Project Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Requirement Details *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Quote Request</button>
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
              <p>Are you sure you want to delete quote request #{deleteTargetId}? This operation calls `DELETE /api/quotes/{deleteTargetId}`.</p>
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
