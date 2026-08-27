import React, { useState, useEffect } from 'react';
import { Phone, Search, Plus, Calendar, AlertCircle, RefreshCw, Star, X, Edit2, Trash2, Clock, UserCheck, MessageSquare, ChevronDown } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import { AnimatedEditButton, OutlookDeleteButton } from '../components/ActionButtons';
import '../catalog/adminModule.css';

export const formatFollowUpDate = (dateVal, isLead = false) => {
  if (!dateVal) {
    if (isLead) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(10, 0, 0, 0);
      return nextDay.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return '—';
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime()) || d.getFullYear() < 2020) {
    if (isLead) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(10, 0, 0, 0);
      return nextDay.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return '—';
  }

  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const CallHistoryScreen = () => {
  const [calls, setCalls] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    todayFollowUps: 0,
    totalFollowUps: 0,
    qualifiedLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');

  // Form Modal state (Log New / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [highPriorityAutoApplied, setHighPriorityAutoApplied] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    calledByRep: 'Admin Rep',
    status: 'Completed',
    priority: 'Low',
    notesSummary: '',
    lastCallTime: '',
    callbackTime: '',
    isQualifiedLead: false
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter !== 'All Statuses') params.append('status', statusFilter);
      if (priorityFilter !== 'All Priorities') params.append('priority', priorityFilter);

      const res = await fetch(`${getApiDomain()}/api/CallHistory?${params.toString()}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const rawCalls = data.calls || data.Calls || [];
      const formattedCalls = rawCalls.map(c => {
        const isLead = Boolean(c.isQualifiedLead || c.status === 'Follow-Up');
        const rawCb = c.callback || c.callbackTime || c.nextFollowUp;
        return {
          ...c,
          isQualifiedLead: isLead,
          callbackFormatted: formatFollowUpDate(rawCb, isLead)
        };
      });

      setCalls(formattedCalls);
      setMetrics({
        totalCalls: data.totalCalls ?? data.TotalCalls ?? 0,
        todayFollowUps: data.todayFollowUps ?? data.TodayFollowUps ?? 0,
        totalFollowUps: data.totalFollowUps ?? data.TotalFollowUps ?? 0,
        qualifiedLeads: data.qualifiedLeads ?? data.QualifiedLeads ?? 0
      });
    } catch (err) {
      console.error("Error fetching call logs:", err);
      setError('Could not fetch call history from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, statusFilter, priorityFilter]);

  // Helper: next business day at 10:00 AM ISO string
  const getNextBusinessDayAt10AM = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    // Skip Saturday (6) and Sunday (0)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newVal };

      // HIGH priority auto-workflow: upgrade status + schedule callback
      if (name === 'priority' && newVal === 'High') {
        const statusNeedsUpgrade = prev.status === 'Completed' || prev.status === 'Pending' || prev.status === 'No Answer' || prev.status === 'Busy';
        if (statusNeedsUpgrade) updated.status = 'Follow-Up';
        if (!prev.callbackTime) {
          const cb = getNextBusinessDayAt10AM();
          updated.callbackTime = cb.toISOString().slice(0, 16);
        }
        setHighPriorityAutoApplied(true);
      } else if (name === 'priority' && newVal !== 'High') {
        setHighPriorityAutoApplied(false);
      }

      return updated;
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      calledByRep: 'Admin Rep',
      status: 'Completed',
      priority: 'Low',
      notesSummary: '',
      lastCallTime: '',
      callbackTime: '',
      isQualifiedLead: false
    });
    setHighPriorityAutoApplied(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingId(c.id);
    setFormData({
      customerName: c.customerName || '',
      customerPhone: c.customerPhone || '',
      customerEmail: c.customerEmail || '',
      calledByRep: c.calledByRep || 'Admin Rep',
      status: c.status || 'Completed',
      priority: c.priority || 'Low',
      notesSummary: c.notesSummary || '',
      lastCallTime: c.lastCall ? new Date(c.lastCall).toISOString().slice(0, 16) : '',
      callbackTime: c.callback ? new Date(c.callback).toISOString().slice(0, 16) : '',
      isQualifiedLead: Boolean(c.isQualifiedLead)
    });
    setHighPriorityAutoApplied(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleLogCallSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      setFormError('Customer Name and Phone are required.');
      return;
    }

    if (formData.callbackTime) {
      const selectedDate = new Date(formData.callbackTime);
      const now = new Date();
      if (selectedDate.getTime() < now.getTime() - 60000) {
        setFormError('Callback time cannot be in the past. Please select a future date and time.');
        return;
      }
    }

    setSubmitting(true);
    setFormError('');

    try {
      let finalCallbackIso = null;
      if (formData.callbackTime) {
        finalCallbackIso = new Date(formData.callbackTime).toISOString();
      } else if (formData.isQualifiedLead || formData.status === 'Follow-Up' || formData.priority === 'High') {
        // HIGH priority always gets a callback scheduled automatically
        finalCallbackIso = getNextBusinessDayAt10AM().toISOString();
      }

      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail?.trim() || '',
        calledByRep: formData.calledByRep?.trim() || 'Admin Rep',
        status: formData.status,
        priority: formData.priority,
        notesSummary: formData.notesSummary?.trim() || '',
        lastCallTime: formData.lastCallTime ? new Date(formData.lastCallTime).toISOString() : new Date().toISOString(),
        callbackTime: finalCallbackIso,
        callbackTimeSpecified: Boolean(finalCallbackIso),
        isQualifiedLead: formData.isQualifiedLead
      };

      const url = editingId 
        ? `${getApiDomain()}/api/CallHistory/${editingId}`
        : `${getApiDomain()}/api/CallHistory`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to ${editingId ? 'update' : 'create'} call log.`);
      }

      setIsModalOpen(false);
      setEditingId(null);
      fetchLogs();
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCall = async (id) => {
    if (!window.confirm('Are you sure you want to delete this CRM call log entry?')) return;
    try {
      const res = await fetch(`${getApiDomain()}/api/CallHistory/${id}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.ok) {
        setCalls(prev => prev.filter(c => String(c.id) !== String(id)));
      } else {
        alert('Failed to delete call log.');
      }
    } catch (err) {
      console.error('Delete call log error:', err);
      alert('Error deleting call log.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CR';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ background: '#f2f8f5', minHeight: '100vh', padding: '24px 32px', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#1e293b' }}>
      
      {/* Top CRM Header Card */}
      <section style={{ 
        background: '#ffffff', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        padding: '24px 32px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '800', 
            color: '#2563eb', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            display: 'block',
            marginBottom: '6px'
          }}>
            CRM & SALES OPERATIONS
          </span>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '800', 
            color: '#0f172a', 
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em'
          }}>
            CRM & Call Logs
          </h1>
          <p style={{ 
            fontSize: '13.5px', 
            color: '#64748b', 
            margin: 0 
          }}>
            Log customer interactions, advisory follow-ups, lead qualifications, and scheduled sales callbacks.
          </p>
        </div>

        <div>
          <button 
            type="button"
            onClick={handleOpenAddModal}
            style={{ 
              backgroundColor: '#2563eb', 
              color: '#ffffff', 
              fontSize: '13px', 
              fontWeight: '600', 
              padding: '9px 18px', 
              borderRadius: '10px', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Plus size={16} /> Log New Call
          </button>
        </div>
      </section>

      {/* KPI Summary Cards (4 Columns in single row) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        {/* Card 1: Total Calls Logged */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '18px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          minWidth: 0
        }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '12px', 
            backgroundColor: '#ecfdf5', 
            color: '#16a34a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Phone size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              TOTAL CALLS LOGGED
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', lineHeight: 1.2 }}>
              {metrics.totalCalls}
            </strong>
          </div>
        </div>

        {/* Card 2: Today's Callbacks */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '18px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          minWidth: 0
        }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '12px', 
            backgroundColor: '#fffbeb', 
            color: '#d97706', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              TODAY'S CALLBACKS
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#d97706', lineHeight: 1.2 }}>
              {metrics.todayFollowUps}
            </strong>
          </div>
        </div>

        {/* Card 3: Total Follow-ups */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '18px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          minWidth: 0
        }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '12px', 
            backgroundColor: '#f3e8ff', 
            color: '#7e22ce', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              TOTAL FOLLOW-UPS
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', lineHeight: 1.2 }}>
              {metrics.totalFollowUps}
            </strong>
          </div>
        </div>

        {/* Card 4: Qualified Leads */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '18px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          minWidth: 0
        }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '12px', 
            backgroundColor: '#e0f2fe', 
            color: '#0284c7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Star size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              QUALIFIED LEADS
            </span>
            <strong style={{ fontSize: '26px', fontWeight: '900', color: '#0284c7', lineHeight: 1.2 }}>
              {metrics.qualifiedLeads}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Call Logs Container */}
      <section style={{ 
        background: '#ffffff', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        {error && <div className="catalog-alert catalog-alert--danger" style={{ margin: '16px' }}>{error}</div>}

        {/* Search & Filter Toolbar */}
        <div style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Customer, Rep, Phone, Notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  fontSize: '12.5px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#1e293b'
                }}
              />
            </div>

            {/* Status Dropdown */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '9px 34px 9px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '135px'
                }}
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Follow-Up">Follow-Up Needed</option>
                <option value="No Answer">No Answer</option>
                <option value="Busy">Line Busy</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#64748b' }} />
            </div>

            {/* Priority Dropdown */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '9px 34px 9px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '135px'
                }}
              >
                <option value="All Priorities">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#64748b' }} />
            </div>
          </div>

          {/* Refresh Button */}
          <button 
            type="button"
            onClick={fetchLogs} 
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '600',
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Logs
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

        {/* Call Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '22%' }}>CUSTOMER</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '14%' }}>REPRESENTATIVE</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '15%' }}>LAST CALL</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '17%' }}>CALLBACK SCHEDULE</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '10%' }}>PRIORITY</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '11%' }}>STATUS</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '18%' }}>NOTES & DETAIL SUMMARY</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', width: '7%', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin inline-block mr-2 text-emerald-600" /> Loading CRM interaction logs...
                  </td>
                </tr>
              ) : calls.length > 0 ? (
                calls.map((c) => {
                  const priorityUpper = (c.priority || 'LOW').toUpperCase();
                  const statusUpper = (c.status || 'COMPLETED').toUpperCase();

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                      
                      {/* Customer Column (3 Lines) */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                            {c.customerName}
                          </span>
                          {c.isQualifiedLead && (
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: '800', 
                              backgroundColor: '#ecfdf5', 
                              color: '#047857', 
                              border: '1px solid #a7f3d0', 
                              padding: '1px 6px', 
                              borderRadius: '9999px',
                              letterSpacing: '0.02em'
                            }}>
                              LEAD
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                          <Phone size={12} style={{ color: '#94a3b8' }} />
                          <span>{c.customerPhone}</span>
                        </div>
                        {c.customerEmail && (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {c.customerEmail}
                          </div>
                        )}
                      </td>

                      {/* Representative Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            backgroundColor: '#059669', 
                            color: '#ffffff', 
                            fontSize: '11px', 
                            fontWeight: '800', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {getInitials(c.calledByRep)}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                            {c.calledByRep || 'Admin Rep'}
                          </span>
                        </div>
                      </td>

                      {/* Last Call Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#1e293b' }}>
                          {c.lastCall || '—'}
                        </span>
                      </td>

                      {/* Callback Schedule Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {c.callbackFormatted && c.callbackFormatted !== '—' ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            backgroundColor: '#f1f5f9', 
                            border: '1px solid #cbd5e1', 
                            borderRadius: '6px', 
                            padding: '3px 8px', 
                            fontSize: '11.5px', 
                            fontWeight: '600', 
                            color: '#334155' 
                          }}>
                            <Clock size={12} style={{ color: '#64748b' }} />
                            {c.callbackFormatted}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            None
                          </span>
                        )}
                      </td>

                      {/* Priority Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 8px', 
                          borderRadius: '9999px', 
                          fontSize: '10.5px', 
                          fontWeight: '800', 
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          backgroundColor: priorityUpper === 'HIGH' ? '#fef2f2' : priorityUpper === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
                          color: priorityUpper === 'HIGH' ? '#dc2626' : priorityUpper === 'MEDIUM' ? '#d97706' : '#16a34a',
                          border: `1px solid ${priorityUpper === 'HIGH' ? '#fecaca' : priorityUpper === 'MEDIUM' ? '#fde68a' : '#bbf7d0'}`
                        }}>
                          {priorityUpper}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '3px 9px', 
                          borderRadius: '6px', 
                          fontSize: '10.5px', 
                          fontWeight: '800', 
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          backgroundColor: statusUpper.includes('FOLLOW') ? '#fffbeb' : statusUpper === 'COMPLETED' ? '#ecfdf5' : '#f1f5f9',
                          color: statusUpper.includes('FOLLOW') ? '#d97706' : statusUpper === 'COMPLETED' ? '#047857' : '#64748b',
                          border: `1px solid ${statusUpper.includes('FOLLOW') ? '#fde68a' : statusUpper === 'COMPLETED' ? '#a7f3d0' : '#cbd5e1'}`
                        }}>
                          {c.status}
                        </span>
                      </td>

                      {/* Notes Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', maxWidth: '280px' }}>
                        {c.notesSummary ? (
                          <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={c.notesSummary}>
                            {c.notesSummary}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>
                            None
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            title="Edit Log"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCall(c.id)}
                            title="Delete Log"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No call history records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Call Log Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                {editingId ? 'Edit CRM Call Log' : 'Log New Customer Interaction'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogCallSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formError && <div className="catalog-alert catalog-alert--danger" style={{ margin: 0 }}>{formError}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Customer Name *</label>
                  <input 
                    type="text" 
                    name="customerName" 
                    value={formData.customerName} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Customer Phone *</label>
                  <input 
                    type="text" 
                    name="customerPhone" 
                    value={formData.customerPhone} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Customer Email</label>
                <input 
                  type="email" 
                  name="customerEmail" 
                  value={formData.customerEmail} 
                  onChange={handleInputChange} 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Sales Representative</label>
                  <input 
                    type="text" 
                    name="calledByRep" 
                    value={formData.calledByRep} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Priority Level</label>
                  <select 
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1px solid ${formData.priority === 'High' ? '#f97316' : '#cbd5e1'}`, borderRadius: '10px', background: '#fff', fontWeight: formData.priority === 'High' ? '700' : '400', color: formData.priority === 'High' ? '#ea580c' : 'inherit' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* High Priority Auto-Workflow Banner */}
              {highPriorityAutoApplied && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '16px', marginTop: '1px' }}>⚡</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', margin: '0 0 2px 0' }}>High Priority Workflow Applied</p>
                    <p style={{ fontSize: '11px', color: '#9a3412', margin: 0, lineHeight: '1.5' }}>
                      Status auto-set to <strong>Follow-Up</strong> and a callback has been scheduled for the next business day at <strong>10:00 AM</strong>. You can adjust the callback time below.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Interaction Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#fff' }}
                  >
                    <option value="Completed">Completed</option>
                    <option value="Follow-Up">Follow-Up Needed</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Busy">Line Busy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Callback Schedule (Optional)</label>
                  <input 
                    type="datetime-local" 
                    name="callbackTime" 
                    value={formData.callbackTime} 
                    onChange={handleInputChange} 
                    min={new Date().toISOString().slice(0, 16)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Last Call Time</label>
                  <input 
                    type="datetime-local" 
                    name="lastCallTime" 
                    value={formData.lastCallTime} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px' }} 
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  name="isQualifiedLead" 
                  id="isQualifiedLead" 
                  checked={formData.isQualifiedLead} 
                  onChange={handleInputChange} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                />
                <label htmlFor="isQualifiedLead" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                  Mark client as a Qualified Lead
                </label>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Notes & Detail Summary</label>
                <textarea 
                  name="notesSummary" 
                  value={formData.notesSummary} 
                  onChange={handleInputChange} 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', minHeight: '80px', resize: 'vertical' }} 
                  placeholder="Enter interaction notes, product inquiries, or follow-up topics..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="catalog-btn" style={{ padding: '8px 16px', borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" className="catalog-btn catalog-btn--primary" style={{ padding: '8px 18px', borderRadius: '10px', fontWeight: '700' }} disabled={submitting}>
                  {submitting ? 'Saving...' : (editingId ? 'Update Log' : 'Save Log')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CallHistoryScreen;

