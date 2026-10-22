import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Eye,
  X,
  AlertCircle,
  Clock3,
  CheckCircle2,
  Ticket,
  Mail,
  Phone,
  Calendar,
  User,
  ShoppingBag,
  HelpCircle,
  RefreshCw,
  Filter,
  RotateCcw,
  MessageSquare,
  FileText,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getTickets, updateTicket } from '../api/tickets';
import { getOrders } from '../api/orders';
import { Pagination, AnimatedViewButton } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './TicketsScreen.css';

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const formatPhoneNumber = (phone) => {
  if (!phone) return '—';
  const clean = String(phone).replace(/^\+?91\s*/, '').replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return String(phone);
};

const truncateWords = (text, maxWords = 4) => {
  if (!text) return '';
  const words = String(text).trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
};

const formatDateToDMY = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTimeToDMY = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  return `${day}-${month}-${year} ${timeStr}`;
};

const formatOrderId = (rawId) => {
  if (!rawId) return 'ORD-000000';
  let str = String(rawId).trim().replace(/^#+/, '');
  while (str.startsWith('ORD-ORD-')) {
    str = str.substring(4);
  }
  if (!str.startsWith('ORD-')) {
    str = `ORD-${str}`;
  }
  return str;
};

const priorityMeta = {
  Critical: { className: 'priority-badge critical' },
  High: { className: 'priority-badge high' },
  Medium: { className: 'priority-badge medium' },
  Low: { className: 'priority-badge low' }
};

const statusMeta = {
  Open: { icon: AlertCircle, className: 'status-pill open' },
  'In Progress': { icon: Clock3, className: 'status-pill progress' },
  Resolved: { icon: CheckCircle2, className: 'status-pill resolved' },
  Closed: { icon: X, className: 'status-pill closed' }
};

const TicketsScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // All, order_related, chatbot, general
  const [statusFilter, setStatusFilter] = useState('All'); // All, Open, In Progress, Resolved, Closed
  const [priorityFilter, setPriorityFilter] = useState('All'); // All, Critical, High, Medium, Low
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, priorityFilter]);
  
  // Selected ticket for details modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Modal Edit states
  const [editStatus, setEditStatus] = useState('Open');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [ticketsList, ordersList] = await Promise.all([getTickets(), getOrders()]);
      const processedTickets = (ticketsList || []).map(ticket => {
        let updated = { ...ticket };
        if ((updated.status === 'Open' || updated.status === 'In Progress') && (!updated.assignedTo || updated.assignedTo === 'Unassigned')) {
          updated.assignedTo = 'Support Team';
        }
        if ((updated.status === 'Resolved' || updated.status === 'Closed') && updated.priority !== 'Low') {
          updated.priority = 'Low';
        }
        return updated;
      });
      setTickets(processedTickets);
      setOrders(ordersList || []);
    } catch (err) {
      console.error("Failed to load support console data:", err);
      setError("Could not retrieve tickets data from server.");
      showToast("Failed to load tickets data from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stat totals
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      closed: tickets.filter(t => t.status === 'Closed').length
    };
  }, [tickets]);

  const hasActiveFilters = searchTerm || typeFilter !== 'All' || statusFilter !== 'All' || priorityFilter !== 'All';

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All');
    setPriorityFilter('All');
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter(ticket => {
        const matchesSearch = 
          (ticket.ticketNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.orderId && ticket.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (ticket.issue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'All' || ticket.type === typeFilter;
        const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;

        return matchesSearch && matchesType && matchesStatus && matchesPriority;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tickets, searchTerm, typeFilter, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;

  // List of all tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTickets.slice(startIndex, startIndex + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Open Details Modal
  const handleOpenDetails = (ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status || 'Open');
    setEditPriority(ticket.priority || 'Medium');
    setEditAssignedTo(ticket.assignedTo || 'Support Team');
    setEditNotes(ticket.notes || '');
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTicket && !saving) {
        setSelectedTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket, saving]);

  // Save changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    // Check if status changed and require a note
    const statusChanged = editStatus !== selectedTicket.status;
    if (statusChanged && !editNotes.trim()) {
      showToast(`Please write an internal audit note to explain why you are changing the status to "${editStatus}".`, 'error');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateTicket(selectedTicket.id, {
        status: editStatus,
        priority: (editStatus === 'Closed' || editStatus === 'Resolved') ? 'Low' : editPriority,
        assignedTo: editAssignedTo,
        notes: editNotes
      });
      // Refresh tickets list
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTicket(updated);
      showToast(`Ticket ${updated.ticketNo} updated successfully!`);
    } catch (err) {
      console.error(err);
      showToast("Failed to save changes. Please check server logs.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Find linked order details
  const linkedOrder = useMemo(() => {
    if (!selectedTicket || selectedTicket.type !== 'order_related' || selectedTicket.orderId === 'N/A') return null;
    return orders.find(o => String(o.id || o.orderId).toUpperCase() === String(selectedTicket.orderId).toUpperCase());
  }, [selectedTicket, orders]);

  return (
    <div className="tickets-mgmt-container">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Top Header Card (Single clean horizontal bar with title & actions) */}
      <section className="tickets-header-card">
        <div className="tickets-title-wrap">
          <span className="tickets-kicker">CUSTOMER SUPPORT &amp; DISPUTES</span>
          <h1>Support Tickets Management</h1>
          <p>Review customer inquiries, order disputes, chatbot escalations, and track SLA resolution statuses in real-time.</p>
        </div>

        <div className="tickets-header-actions">
          {hasActiveFilters && (
            <button 
              type="button" 
              className="btn-tickets-secondary" 
              onClick={handleResetFilters}
              title="Reset all active filters"
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}

          <button 
            type="button" 
            className="btn-tickets-secondary" 
            onClick={loadData} 
            disabled={loading} 
            title="Refresh Tickets Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="tickets-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Stats Cards Grid (Clickable status quick-filters) */}
      <div className="tickets-stats-grid">
        {/* Total Tickets */}
        <div 
          className={`tickets-stat-card ${statusFilter === 'All' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter('All')}
          title="Click to show all tickets"
        >
          <div className="stat-card-icon total">
            <Ticket size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Total Tickets</span>
            <strong className="stat-val">{stats.total}</strong>
          </div>
          {statusFilter === 'All' && <span className="stat-active-badge">Active View</span>}
        </div>

        {/* Open Tickets */}
        <div 
          className={`tickets-stat-card ${statusFilter === 'Open' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Open' ? 'All' : 'Open')}
          title="Click to filter by Open tickets"
        >
          <div className="stat-card-icon open">
            <AlertCircle size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Open Tickets</span>
            <strong className="stat-val">{stats.open}</strong>
          </div>
          {statusFilter === 'Open' && <span className="stat-active-badge">Filtered</span>}
        </div>

        {/* In Progress */}
        <div 
          className={`tickets-stat-card ${statusFilter === 'In Progress' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
          title="Click to filter by In Progress tickets"
        >
          <div className="stat-card-icon progress">
            <Clock3 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">In Progress</span>
            <strong className="stat-val">{stats.inProgress}</strong>
          </div>
          {statusFilter === 'In Progress' && <span className="stat-active-badge">Filtered</span>}
        </div>

        {/* Resolved */}
        <div 
          className={`tickets-stat-card ${statusFilter === 'Resolved' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'All' : 'Resolved')}
          title="Click to filter by Resolved tickets"
        >
          <div className="stat-card-icon resolved">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Resolved</span>
            <strong className="stat-val">{stats.resolved}</strong>
          </div>
          {statusFilter === 'Resolved' && <span className="stat-active-badge">Filtered</span>}
        </div>

        {/* Closed Tickets */}
        <div 
          className={`tickets-stat-card ${statusFilter === 'Closed' ? 'stat-card-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Closed' ? 'All' : 'Closed')}
          title="Click to filter by Closed tickets"
        >
          <div className="stat-card-icon closed">
            <X size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Closed</span>
            <strong className="stat-val">{stats.closed}</strong>
          </div>
          {statusFilter === 'Closed' && <span className="stat-active-badge">Filtered</span>}
        </div>
      </div>

      {/* Main Table Card */}
      <section className="tickets-card">
        {/* Toolbar Filter Bar (Above Table) */}
        <div className="tickets-filterbar">
          <div className="tickets-search-wrap">
            <Search size={16} className="tickets-search-icon" />
            <input
              type="text"
              className="tickets-search-input"
              placeholder="Search by ticket #, customer name, email, order ID, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="tickets-search-clear"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="tickets-selects-wrap">
            {/* Type Filter */}
            <div className="tickets-select-group">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option value="order_related">Order Related</option>
                <option value="chatbot">Chatbot Handover</option>
                <option value="general">General Enquiry</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="tickets-select-group">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="tickets-select-group">
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

          </div>
        </div>

        {/* Table Wrapper with Clean Fixed Proportions (No Horizontal Scroll) */}
        <div className="tickets-table-wrap">
          <table className="tickets-table">
            <thead>
              <tr>
                <th className="th-ticket">Ticket ID &amp; Date</th>
                <th className="th-type">Type &amp; Channel</th>
                <th className="th-customer">Customer Contact</th>
                <th className="th-issue">Issue &amp; Audit Note</th>
                <th className="th-priority">Priority</th>
                <th className="th-status">Status</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '56px 20px', color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle', color: '#1268a5' }} />
                    <span>Loading customer support tickets from database...</span>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '56px 20px', color: '#64748b' }}>
                    <div className="tickets-empty-content">
                      <Ticket size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>No tickets found</h3>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        {hasActiveFilters 
                          ? 'No tickets match the active search query or filter criteria.' 
                          : 'There are currently no customer support tickets recorded in the system.'}
                      </p>
                      {hasActiveFilters && (
                        <button 
                          type="button" 
                          className="btn-tickets-secondary" 
                          onClick={handleResetFilters}
                          style={{ marginTop: '14px' }}
                        >
                          <RotateCcw size={13} />
                          <span>Clear All Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  const StatusIcon = statusMeta[ticket.status]?.icon || AlertCircle;
                  return (
                    <tr 
                      key={ticket.id || ticket.ticketNo}
                      onClick={() => handleOpenDetails(ticket)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Ticket Details */}
                      <td>
                        <div className="ticket-primary-info">
                          <span className="ticket-no-badge">{ticket.ticketNo}</span>
                          <span className="ticket-date">
                            <Calendar size={12} />
                            <span>{formatDateToDMY(ticket.createdAt)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Type & Channel */}
                      <td>
                        <div className="ticket-type-wrap">
                          {ticket.type === 'order_related' ? (
                            <span className="ticket-type-pill order">
                              <ShoppingBag size={12} />
                              <span>Order Related</span>
                            </span>
                          ) : ticket.type === 'chatbot' ? (
                            <span className="ticket-type-pill bot">
                              <MessageSquare size={12} />
                              <span>Chatbot</span>
                            </span>
                          ) : (
                            <span className="ticket-type-pill general">
                              <FileText size={12} />
                              <span>General</span>
                            </span>
                          )}

                          {ticket.type === 'order_related' && ticket.orderId && ticket.orderId !== 'N/A' && (
                            <span className="ticket-order-ref" title={`Linked Order: ${formatOrderId(ticket.orderId)}`}>
                              {formatOrderId(ticket.orderId)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Contact */}
                      <td>
                        <div className="ticket-cust-cell">
                          <strong className="ticket-cust-name">{ticket.customer || 'Unknown Customer'}</strong>
                          {ticket.email && (
                            <span className="ticket-cust-sub" title={ticket.email}>
                              <Mail size={11} />
                              <span>{ticket.email}</span>
                            </span>
                          )}
                          {ticket.phone && (
                            <span className="ticket-cust-sub">
                              <Phone size={11} />
                              <span>{formatPhoneNumber(ticket.phone)}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Issue & Audit Note (Truncated to 3-4 words for compactness) */}
                      <td>
                        <div className="ticket-issue-cell">
                          <div className="ticket-issue-title" title={ticket.issue}>
                            {truncateWords(ticket.issue, 4) || 'No description provided'}
                          </div>
                          {ticket.notes && (
                            <div className="ticket-note-preview" title={`Audit Note: ${ticket.notes}`}>
                              <span className="note-dot" />
                              <span className="note-text">{truncateWords(ticket.notes, 4)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td style={{ textAlign: 'center' }}>
                        {ticket.status === 'Closed' ? (
                          <span className="priority-badge closed">Closed</span>
                        ) : (
                          <span className={priorityMeta[ticket.priority]?.className || 'priority-badge medium'}>
                            {ticket.priority || 'Medium'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={statusMeta[ticket.status]?.className || 'status-pill open'}>
                          <StatusIcon size={12} />
                          <span>{ticket.status}</span>
                        </span>
                        {ticket.assignedTo && ticket.assignedTo !== 'Unassigned' && (
                          <span className="ticket-assigned-sub" title={`Assigned to: ${ticket.assignedTo}`}>
                            <User size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                            <span>{ticket.assignedTo}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="catalog-center-cell" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div className="catalog-inline-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <AnimatedViewButton
                            onClick={() => handleOpenDetails(ticket)}
                            title="View ticket details & audit logs"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredTickets.length > pageSize && (
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '6px 18px', background: '#ffffff' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredTickets.length}
              itemsPerPage={pageSize}
            />
          </div>
        )}
      </section>

      {/* Details Side-Drawer/Modal (Mounted to document.body to prevent sidebar/topbar overlap) */}
      {selectedTicket && createPortal(
        <div className="ticket-modal-backdrop" onClick={() => !saving && setSelectedTicket(null)}>
          <div className="ticket-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-area">
                <div className="modal-header-icon-wrap">
                  <Ticket size={20} color="#1268a5" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      Ticket {selectedTicket.ticketNo} Details
                    </h2>
                    <span className={statusMeta[selectedTicket.status]?.className || 'status-pill open'}>
                      {selectedTicket.status}
                    </span>
                    <span className={priorityMeta[selectedTicket.priority]?.className || 'priority-badge medium'}>
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <span className="modal-subtitle">
                    Created on {formatDateTimeToDMY(selectedTicket.createdAt)}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                className="modal-close-btn" 
                onClick={() => setSelectedTicket(null)}
                disabled={saving}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-columns-grid">
                {/* Left Column: Customer Info & Issue Details */}
                <div className="modal-col-details">
                  {/* Customer Profile & Channel Metadata */}
                  <div className="detail-section-card">
                    <div className="detail-section-header">
                      <User size={15} className="section-header-icon" />
                      <h3>Customer Profile</h3>
                    </div>
                    <div className="customer-info-grid">
                      <div className="info-item">
                        <span className="info-label">Customer Name</span>
                        <strong className="info-value">{selectedTicket.customer || 'Unknown'}</strong>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email Address</span>
                        <strong className="info-value" title={selectedTicket.email}>{selectedTicket.email || 'N/A'}</strong>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone Number</span>
                        <strong className="info-value">
                          {formatPhoneNumber(selectedTicket.phone)}
                          {selectedTicket.phone && !/^[6-9]\d{9}$/.test(selectedTicket.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '')) && (
                            <span className="phone-warning-tag">⚠️ Invalid Format</span>
                          )}
                        </strong>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Channel Source</span>
                        <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={`ticket-tag ${selectedTicket.type}`}>
                            {selectedTicket.type === 'order_related' ? '📦 Order Support' : selectedTicket.type === 'chatbot' ? '💬 Chatbot Assistant' : '📋 General Enquiry'}
                          </span>
                          {selectedTicket.type === 'order_related' && selectedTicket.orderId && selectedTicket.orderId !== 'N/A' && (
                            <span className="ticket-tag order-link">
                              Ref: {formatOrderId(selectedTicket.orderId)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Issue Description Card */}
                  <div className="detail-section-card">
                    <div className="detail-section-header">
                      <FileText size={15} className="section-header-icon" />
                      <h3>Issue Description</h3>
                    </div>
                    <div className="issue-desc-box">
                      <p>{selectedTicket.issue || 'No detailed issue description recorded.'}</p>
                    </div>
                    {(selectedTicket.issue === 'No Description' || selectedTicket.issue === 'Order Dispute' || selectedTicket.issue === 'Chatbot Handover Request' || (selectedTicket.issue && selectedTicket.issue.length < 20)) && (
                      <div className="issue-alert-hint">
                        <span>⚠️</span>
                        <span>
                          <strong>Notice:</strong> The issue description is brief. 
                          {selectedTicket.type === 'chatbot' && selectedTicket.chatHistory?.length > 0
                            ? ' Review the Chatbot Transcript Logs below for full context.'
                            : selectedTicket.type === 'order_related' && selectedTicket.orderId !== 'N/A'
                              ? ` Check the Linked Order ${formatOrderId(selectedTicket.orderId)} details below.`
                              : ' Consider contacting the customer directly.'
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Linked Order (if Order Related) */}
                  {selectedTicket.type === 'order_related' && (
                    <div className="detail-section-card">
                      <div className="detail-section-header">
                        <ShoppingBag size={15} className="section-header-icon" />
                        <h3>Linked Order Information</h3>
                      </div>
                      {linkedOrder ? (
                        <div className="linked-order-box">
                          <div className="order-summary-row">
                            <div>
                              <span>Order Reference</span>
                              <strong>{formatOrderId(linkedOrder.id || linkedOrder.orderId)}</strong>
                            </div>
                            <div>
                              <span>Order Status</span>
                              <strong className={`status-badge-inline ${String(linkedOrder.status || '').toLowerCase()}`}>
                                {linkedOrder.status}
                              </strong>
                            </div>
                            <div>
                              <span>Total Amount</span>
                              <strong>{formatCurrency(linkedOrder.totalAmount || linkedOrder.total)}</strong>
                            </div>
                          </div>

                          <div className="order-items-mini-list">
                            <span>Products Ordered:</span>
                            <ul>
                              {Array.isArray(linkedOrder.items) && linkedOrder.items.map((item, idx) => (
                                <li key={idx} className="item-row">
                                  <ShoppingBag size={13} style={{ marginRight: '6px', flexShrink: 0, color: '#1268a5' }} />
                                  <span>{item.name || item.productName} (x{item.quantity || item.qty})</span>
                                  <strong>{formatCurrency(item.unitPrice || item.price)}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="linked-order-notfound">
                          <ShoppingBag size={18} className="warning-icon" />
                          <div>
                            <strong>Order {formatOrderId(selectedTicket.orderId)} not found in Admin Ledger</strong>
                            <span>Please verify if this is a custom order or legacy transaction.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chatbot Transcript Logs (if Chatbot) */}
                  {selectedTicket.type === 'chatbot' && (
                    <div className="detail-section-card">
                      <div className="detail-section-header">
                        <MessageSquare size={15} className="section-header-icon" />
                        <h3>Chatbot Transcript Logs</h3>
                      </div>
                      {selectedTicket.chatHistory && selectedTicket.chatHistory.length > 0 ? (
                        <div className="chatbot-transcript-container">
                          {selectedTicket.chatHistory.map((chat, idx) => (
                            <div key={idx} className={`transcript-bubble-wrapper ${chat.sender}`}>
                              <span className="bubble-sender-label">
                                {chat.sender === 'bot' ? 'Honeywell Bot' : 'Customer'}
                              </span>
                              <div className="transcript-bubble">
                                {chat.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="linked-order-notfound">
                          <HelpCircle size={18} className="warning-icon" />
                          <div>
                            <strong>No chat logs recorded</strong>
                            <span>Ticket was raised via quick prompt.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Ticket Management & Internal Audit Form */}
                <div className="modal-col-actions">
                  <form onSubmit={handleSaveChanges} className="admin-actions-card">
                    <div className="detail-section-header">
                      <Sparkles size={15} className="section-header-icon" />
                      <h3>Ticket Management &amp; Audit</h3>
                    </div>

                    <div className="form-row-2col">
                      <div className="form-group">
                        <label>Ticket Status</label>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Priority</label>
                        {editStatus === 'Closed' ? (
                          <div className="priority-locked-notice">
                            <span>🔒</span> Closed (N/A)
                          </div>
                        ) : (
                          <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Assigned Support Agent / Team</label>
                      <input
                        type="text"
                        value={editAssignedTo}
                        onChange={(e) => setEditAssignedTo(e.target.value)}
                        placeholder="e.g. Support Team, Senior Agent"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Internal Audit Notes</span>
                        {editStatus !== selectedTicket.status && (
                          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>* Required</span>
                        )}
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Provide details or reasons for status change..."
                        rows={2}
                        style={{
                          height: '52px',
                          resize: 'none',
                          border: (editStatus !== selectedTicket.status && !editNotes.trim()) ? '1px solid #ef4444' : '1px solid #cbd5e1'
                        }}
                      />
                      {editStatus !== selectedTicket.status && !editNotes.trim() && (
                        <span style={{ color: '#b91c1c', fontSize: '11px', marginTop: '2px', fontWeight: '500' }}>
                          ⚠️ Please write an audit note explaining the status change.
                        </span>
                      )}
                    </div>

                    <div className="modal-actions-footer">
                      <button
                        type="button"
                        className="modal-cancel-btn"
                        onClick={() => setSelectedTicket(null)}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="save-action-btn" disabled={saving}>
                        {saving ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Updates</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TicketsScreen;

