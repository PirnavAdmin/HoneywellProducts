import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Search, Plus, Calendar, AlertCircle, RefreshCw, Star, X, Edit2, Trash2, Clock, UserCheck, MessageSquare, ChevronDown } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import { getAdminToken } from '../../utils/rbac';
import { AnimatedEditButton, OutlookDeleteButton } from '../components/ActionButtons';
import '../catalog/adminModule.css';

const getAuthHeaders = (extra = {}) => {
  const token = getAdminToken();
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...extra
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const TIME_SLOTS = [
  { value: '08:00', label: '08:00 AM' },
  { value: '08:30', label: '08:30 AM' },
  { value: '09:00', label: '09:00 AM' },
  { value: '09:30', label: '09:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '15:30', label: '03:30 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '16:30', label: '04:30 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '17:30', label: '05:30 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '19:30', label: '07:30 PM' },
  { value: '20:00', label: '08:00 PM' },
];

export const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '10:00 AM';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return timeStr;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  const mm = parts[1] ? parts[1].padStart(2, '0') : '00';
  return `${String(hour12).padStart(2, '0')}:${mm} ${ampm}`;
};

export const parseDateTimeStringToParts = (str) => {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed || trimmed === '—' || trimmed.toLowerCase() === 'none') return null;

  // 1. Local or ISO string: "2026-11-19T10:00:00"
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [dPart, tPart] = trimmed.split('T');
    let time = '10:00';
    if (tPart) time = tPart.slice(0, 5);
    return { date: dPart, time };
  }

  // 2. Human format: "19 Nov 2026, 10:00 AM" or "19 Nov 2026 10:00 am"
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const year = match[3];
    let hour = parseInt(match[4], 10);
    const minute = match[5].padStart(2, '0');
    const ampm = (match[6] || '').toUpperCase();
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const month = months[monthName] || '01';
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const time = `${String(hour).padStart(2, '0')}:${minute}`;
    return { date: `${year}-${month}-${day}`, time };
  }

  // 3. Fallback via Date object
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return {
      date: formatLocalDate(d),
      time: formatLocalTime(d)
    };
  }
  return null;
};

export const formatLocalDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatLocalTime = (date) => {
  if (!date) return '10:00';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '10:00';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const combineLocalDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const time = timeStr && timeStr.trim() ? timeStr.trim() : '10:00';
  const parts = time.split(':');
  const hh = (parts[0] || '10').padStart(2, '0');
  const mm = (parts[1] || '00').padStart(2, '0');
  return `${dateStr.trim()}T${hh}:${mm}:00`;
};

export const formatFollowUpDate = (dateVal) => {
  if (!dateVal) return '—';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed || trimmed === '—' || trimmed.toLowerCase() === 'none') return '—';
    // If it is already in human format (e.g. "18 Nov 2026, 03:00 PM"), preserve it cleanly
    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4},\s+\d{1,2}:\d{2}\s+(AM|PM|am|pm)$/i.test(trimmed)) {
      return trimmed;
    }
    const parts = parseDateTimeStringToParts(trimmed);
    if (parts) {
      const [y, m, d] = parts.date.split('-').map(Number);
      const [hh, mm] = parts.time.split(':').map(Number);
      const localDate = new Date(y, m - 1, d, hh, mm);
      return localDate.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime()) || d.getFullYear() < 2020) {
    return typeof dateVal === 'string' && dateVal.trim() ? dateVal.trim() : '—';
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

  // Custom Delete Confirmation Popup state
  const [callToDelete, setCallToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    calledByRep: 'Admin Rep',
    status: 'Completed',
    priority: 'Low',
    notesSummary: '',
    lastCallDate: '',
    lastCallTime: '',
    callbackDate: '',
    callbackTime: '10:00',
    isQualifiedLead: false
  });

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (statusFilter !== 'All Statuses') params.append('status', statusFilter);
      if (priorityFilter !== 'All Priorities') params.append('priority', priorityFilter);
      params.append('_t', String(Date.now())); // Bypass browser HTTP caching

      const res = await fetch(`${getApiDomain()}/api/CallHistory?${params.toString()}`, {
        cache: 'no-store',
        headers: getAuthHeaders({ 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const rawCalls = data.calls || data.Calls || [];
      const formattedCalls = rawCalls.map((c, idx) => {
        const actualId = c.id ?? c.Id ?? c._id ?? `call-${idx}`;
        const isLead = Boolean(c.isQualifiedLead ?? c.IsQualifiedLead);
        const rawCb = c.callbackIso || c.CallbackIso || c.callback || c.Callback || c.callbackTime || c.CallbackTime || c.nextFollowUp;
        const rawLastCall = c.lastCallIso || c.LastCallIso || c.lastCall || c.LastCall || c.lastCallTime || c.LastCallTime;
        
        const formattedLastCall = typeof rawLastCall === 'string' && /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4},\s+\d{1,2}:\d{2}\s+(AM|PM|am|pm)$/i.test(rawLastCall.trim()) 
          ? rawLastCall.trim() 
          : formatFollowUpDate(rawLastCall);

        const formattedCallback = typeof rawCb === 'string' && /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4},\s+\d{1,2}:\d{2}\s+(AM|PM|am|pm)$/i.test(rawCb.trim())
          ? rawCb.trim()
          : formatFollowUpDate(rawCb);

        return {
          ...c,
          id: actualId,
          Id: actualId,
          customerName: c.customerName || c.CustomerName || '',
          customerPhone: c.customerPhone || c.CustomerPhone || '',
          customerEmail: c.customerEmail || c.CustomerEmail || '',
          calledByRep: c.calledByRep || c.CalledByRep || 'Admin Rep',
          status: c.status || c.Status || 'Completed',
          priority: (c.priority || c.Priority || 'LOW').toUpperCase(),
          notesSummary: c.notesSummary || c.NotesSummary || '',
          lastCall: formattedLastCall,
          isQualifiedLead: isLead,
          callback: rawCb,
          callbackFormatted: formattedCallback
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
      if (!silent) setError('Could not fetch call history from server.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);
  }, [searchTerm, statusFilter, priorityFilter]);

  // Dynamic client-side filtering for 0-ms responsiveness and instant sync
  const displayedCalls = React.useMemo(() => {
    return calls.filter(c => {
      // Search keyword filter
      if (searchTerm && searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = (c.customerName || c.CustomerName || '').toLowerCase().includes(q);
        const matchPhone = (c.customerPhone || c.CustomerPhone || '').includes(q);
        const matchEmail = (c.customerEmail || c.CustomerEmail || '').toLowerCase().includes(q);
        const matchRep = (c.calledByRep || c.CalledByRep || '').toLowerCase().includes(q);
        const matchNotes = (c.notesSummary || c.NotesSummary || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchRep && !matchNotes) return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'All Statuses') {
        const s = (c.status || c.Status || '').toLowerCase();
        const f = statusFilter.toLowerCase();
        if (f.includes('follow')) {
          if (!s.includes('follow')) return false;
        } else if (f.includes('complete')) {
          if (!s.includes('complete')) return false;
        } else if (f.includes('answer')) {
          if (!s.includes('answer')) return false;
        } else if (f.includes('busy')) {
          if (!s.includes('busy')) return false;
        } else if (s !== f) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter && priorityFilter !== 'All Priorities') {
        const p = (c.priority || c.Priority || '').toLowerCase();
        const f = priorityFilter.toLowerCase();
        if (p !== f) return false;
      }

      return true;
    });
  }, [calls, searchTerm, statusFilter, priorityFilter]);

  // Helper: next business day at 10:00 AM in local time
  const getNextBusinessDayAt10AM = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  };

  const setQuickCallback = (daysFromNow, timeStr = '10:00') => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setFormData(prev => ({
      ...prev,
      callbackDate: formatLocalDate(d),
      callbackTime: timeStr,
      status: prev.status === 'Completed' ? 'Follow-Up' : prev.status
    }));
  };

  const clearCallbackSchedule = () => {
    setFormData(prev => ({
      ...prev,
      callbackDate: '',
      callbackTime: '10:00'
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newVal };

      // Ensure valid time when a date is selected
      if (name === 'callbackDate' && newVal && !prev.callbackTime) {
        updated.callbackTime = '10:00';
      }

      // HIGH priority auto-workflow: upgrade status + schedule callback
      if (name === 'priority' && newVal === 'High') {
        const statusNeedsUpgrade = prev.status === 'Completed' || prev.status === 'Pending' || prev.status === 'No Answer' || prev.status === 'Busy';
        if (statusNeedsUpgrade) updated.status = 'Follow-Up';
        if (!prev.callbackDate) {
          const cb = getNextBusinessDayAt10AM();
          updated.callbackDate = formatLocalDate(cb);
          updated.callbackTime = '10:00';
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
    const now = new Date();
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      calledByRep: 'Admin Rep',
      status: 'Completed',
      priority: 'Low',
      notesSummary: '',
      lastCallDate: formatLocalDate(now),
      lastCallTime: formatLocalTime(now),
      callbackDate: '',
      callbackTime: '10:00',
      isQualifiedLead: false
    });
    setHighPriorityAutoApplied(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    const actualId = c.id ?? c.Id ?? c._id;
    setEditingId(actualId);
    let cbDate = '';
    let cbTime = '10:00';
    const rawCb = c.callbackIso || c.CallbackIso || c.callback || c.Callback || c.callbackTime || c.CallbackTime;
    if (rawCb && rawCb !== '—') {
      const parts = parseDateTimeStringToParts(rawCb);
      if (parts) {
        cbDate = parts.date;
        cbTime = parts.time;
      }
    }
    let lcDate = '';
    let lcTime = '';
    const rawLc = c.lastCallIso || c.LastCallIso || c.lastCall || c.LastCall || c.lastCallTime || c.LastCallTime;
    if (rawLc && rawLc !== '—') {
      const parts = parseDateTimeStringToParts(rawLc);
      if (parts) {
        lcDate = parts.date;
        lcTime = parts.time;
      }
    }

    setFormData({
      customerName: c.customerName || c.CustomerName || '',
      customerPhone: c.customerPhone || c.CustomerPhone || '',
      customerEmail: c.customerEmail || c.CustomerEmail || '',
      calledByRep: c.calledByRep || c.CalledByRep || 'Admin Rep',
      status: c.status || c.Status || 'Completed',
      priority: c.priority || c.Priority || 'Low',
      notesSummary: c.notesSummary || c.NotesSummary || '',
      lastCallDate: lcDate,
      lastCallTime: lcTime,
      callbackDate: cbDate,
      callbackTime: cbTime,
      isQualifiedLead: Boolean(c.isQualifiedLead ?? c.IsQualifiedLead)
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

    let finalCallbackIso = null;
    if (formData.callbackDate) {
      finalCallbackIso = combineLocalDateTime(formData.callbackDate, formData.callbackTime);
      if (finalCallbackIso) {
        const [dPart, tPart] = finalCallbackIso.split('T');
        const [y, m, d] = dPart.split('-').map(Number);
        const [hh, mm] = tPart.split(':').map(Number);
        const selectedDate = new Date(y, m - 1, d, hh, mm);
        const now = new Date();
        // Allow up to 10 minutes in past to accommodate clock-skew
        if (selectedDate.getTime() < now.getTime() - 600000) {
          setFormError('Callback schedule cannot be in the past. Please select a future date and time.');
          return;
        }
      }
    }

    let lastCallIso = null;
    if (formData.lastCallDate) {
      lastCallIso = combineLocalDateTime(formData.lastCallDate, formData.lastCallTime || '10:00');
    } else {
      const now = new Date();
      lastCallIso = combineLocalDateTime(formatLocalDate(now), formatLocalTime(now));
    }

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail?.trim() || '',
        calledByRep: formData.calledByRep?.trim() || 'Admin Rep',
        status: formData.status,
        priority: formData.priority,
        notesSummary: formData.notesSummary?.trim() || '',
        lastCallTime: lastCallIso,
        callbackTime: finalCallbackIso,
        callbackTimeSpecified: true,
        isQualifiedLead: formData.isQualifiedLead
      };

      const url = editingId 
        ? `${getApiDomain()}/api/CallHistory/${editingId}`
        : `${getApiDomain()}/api/CallHistory`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to ${editingId ? 'update' : 'create'} call log.`);
      }

      const resData = await res.json().catch(() => ({}));

      // Immediate modal dismissal and optimistic UI update
      setIsModalOpen(false);
      const currentEditingId = editingId;
      setEditingId(null);
      setSubmitting(false);

      const rawLog = resData.log || resData.Log || resData;
      const actualId = rawLog.id ?? rawLog.Id ?? resData.id ?? resData.Id ?? currentEditingId ?? Date.now();
      const isLead = Boolean(rawLog.isQualifiedLead ?? rawLog.IsQualifiedLead ?? formData.isQualifiedLead);
      const formattedLastCall = formatFollowUpDate(lastCallIso);
      const formattedCallback = formatFollowUpDate(finalCallbackIso);

      const newLog = {
        ...rawLog,
        id: actualId,
        Id: actualId,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail?.trim() || '',
        calledByRep: formData.calledByRep?.trim() || 'Admin Rep',
        status: formData.status,
        priority: (formData.priority || 'LOW').toUpperCase(),
        notesSummary: formData.notesSummary?.trim() || '',
        lastCall: formattedLastCall,
        lastCallIso: lastCallIso,
        isQualifiedLead: isLead,
        callback: finalCallbackIso,
        callbackIso: finalCallbackIso,
        callbackFormatted: formattedCallback
      };

      setCalls(prev => {
        if (currentEditingId) {
          return prev.map(c => String(c.id ?? c.Id) === String(currentEditingId) ? newLog : c);
        } else {
          return [newLog, ...prev];
        }
      });
      setMetrics(prev => ({
        ...prev,
        totalCalls: currentEditingId ? prev.totalCalls : prev.totalCalls + 1,
        qualifiedLeads: (isLead && !currentEditingId) ? prev.qualifiedLeads + 1 : prev.qualifiedLeads
      }));

      // Background silent synchronization with short delay so DB commits cleanly
      setTimeout(() => {
        fetchLogs(true);
      }, 300);
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving log.');
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (call) => {
    setCallToDelete(call);
    setDeleteError('');
  };

  const confirmDeleteCall = async () => {
    if (!callToDelete) return;
    const targetId = callToDelete.id ?? callToDelete.Id ?? callToDelete._id;
    const isLead = Boolean(callToDelete.isQualifiedLead ?? callToDelete.IsQualifiedLead);
    const isFollowUp = (callToDelete.status || callToDelete.Status || '').toLowerCase().includes('follow');
    setDeleting(true);
    setDeleteError('');

    try {
      let isSuccess = false;

      // Only attempt remote delete if targetId is a valid server ID
      if (targetId && !String(targetId).startsWith('local-') && !String(targetId).startsWith('call-')) {
        const res = await fetch(`${getApiDomain()}/api/CallHistory/${targetId}`, {
          method: 'DELETE',
          headers: getAuthHeaders({ 'Accept': 'application/json' })
        });

        if (res.ok || res.status === 404) {
          isSuccess = true;
        } else {
          let errMsg = 'Failed to delete call log.';
          try {
            const errData = await res.json();
            errMsg = errData.message || errData.Message || errData.title || errMsg;
          } catch (_) {}
          setDeleteError(errMsg);
          setDeleting(false);
          return;
        }
      } else {
        isSuccess = true;
      }

      if (isSuccess) {
        // Dynamic, real-time optimistic UI update
        setCalls(prev => prev.filter(c => {
          const cId = c.id ?? c.Id ?? c._id;
          if (targetId && cId) {
            return String(cId) !== String(targetId);
          }
          return (c.customerName || c.CustomerName) !== (callToDelete.customerName || callToDelete.CustomerName) ||
                 (c.customerPhone || c.CustomerPhone) !== (callToDelete.customerPhone || callToDelete.CustomerPhone);
        }));

        setMetrics(prev => ({
          ...prev,
          totalCalls: Math.max(0, prev.totalCalls - 1),
          qualifiedLeads: isLead ? Math.max(0, prev.qualifiedLeads - 1) : prev.qualifiedLeads,
          totalFollowUps: isFollowUp ? Math.max(0, prev.totalFollowUps - 1) : prev.totalFollowUps
        }));

        setCallToDelete(null);
        setDeleteError('');
        
        // Background silent synchronization without full-screen table loading flash
        fetchLogs(true);
      }
    } catch (err) {
      console.error('Delete call log error:', err);
      setDeleteError(err.message || 'Network error while attempting to delete.');
    } finally {
      setDeleting(false);
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

      {/* KPI Summary Cards (4 Columns) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        {/* Card 1: Total Calls Logged */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#ecfdf5', 
            color: '#16a34a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Phone size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
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
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#fffbeb', 
            color: '#d97706', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
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
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#f3e8ff', 
            color: '#7e22ce', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
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
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            backgroundColor: '#e0f2fe', 
            color: '#0284c7', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Star size={22} />
          </div>
          <div>
            <span style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '2px'
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
            onClick={() => fetchLogs(false)} 
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
              ) : displayedCalls.length > 0 ? (
                displayedCalls.map((c) => {
                  const priorityUpper = (c.priority || 'LOW').toUpperCase();
                  const statusUpper = (c.status || 'COMPLETED').toUpperCase();

                  return (
                    <tr key={c.id || c.Id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                      
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
                            onClick={() => handleOpenDeleteModal(c)}
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
      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 999999 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)', maxWidth: '580px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 'auto' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#064e3b', margin: 0, letterSpacing: '-0.01em' }}>
                {editingId ? 'Edit CRM Call Log' : 'Log New Customer Interaction'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleLogCallSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', padding: '24px', gap: '16px' }}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                  {formError}
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Customer Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    name="customerName" 
                    value={formData.customerName} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff' }} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Customer Phone <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    name="customerPhone" 
                    value={formData.customerPhone} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff' }} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Customer Email</label>
                <input 
                  type="email" 
                  name="customerEmail" 
                  value={formData.customerEmail} 
                  onChange={handleInputChange} 
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Sales Representative</label>
                  <input 
                    type="text" 
                    name="calledByRep" 
                    value={formData.calledByRep} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Priority Level</label>
                  <select 
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', border: `1px solid ${formData.priority === 'High' ? '#ea580c' : '#cbd5e1'}`, borderRadius: '10px', backgroundColor: '#ffffff', fontWeight: formData.priority === 'High' ? '700' : '400', color: formData.priority === 'High' ? '#ea580c' : '#0f172a', outline: 'none' }}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Interaction Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', border: '1px solid #cbd5e1', borderRadius: '10px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                  >
                    <option value="Completed">Completed</option>
                    <option value="Follow-Up">Follow-Up Needed</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Busy">Line Busy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Callback Schedule (Optional)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                    <input 
                      type="date" 
                      name="callbackDate" 
                      value={formData.callbackDate || ''} 
                      onChange={handleInputChange} 
                      min={formatLocalDate(new Date())}
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a' }} 
                      title="Select callback date"
                    />
                    <select 
                      name="callbackTime" 
                      value={formData.callbackTime || '10:00'} 
                      onChange={handleInputChange} 
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a', cursor: 'pointer' }} 
                      title="Select callback time"
                    >
                      {formData.callbackTime && !TIME_SLOTS.some(s => s.value === formData.callbackTime) && (
                        <option value={formData.callbackTime}>
                          {formatTimeDisplay(formData.callbackTime)}
                        </option>
                      )}
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Quick-schedule chips */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => setQuickCallback(1, '10:00')} 
                      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Tomorrow 10 AM
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setQuickCallback(2, '10:00')} 
                      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      In 2 Days
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setQuickCallback(7, '10:00')} 
                      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Next Week
                    </button>
                    {(formData.callbackDate || (formData.callbackTime && formData.callbackTime !== '10:00')) && (
                      <button 
                        type="button" 
                        onClick={clearCallbackSchedule} 
                        style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {editingId && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Last Call Time</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                    <input 
                      type="date" 
                      name="lastCallDate" 
                      value={formData.lastCallDate || ''} 
                      onChange={handleInputChange} 
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a' }} 
                    />
                    <select 
                      name="lastCallTime" 
                      value={formData.lastCallTime || '10:00'} 
                      onChange={handleInputChange} 
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a', cursor: 'pointer' }} 
                    >
                      {formData.lastCallTime && !TIME_SLOTS.some(s => s.value === formData.lastCallTime) && (
                        <option value={formData.lastCallTime}>
                          {formatTimeDisplay(formData.lastCallTime)}
                        </option>
                      )}
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  name="isQualifiedLead" 
                  id="isQualifiedLead" 
                  checked={formData.isQualifiedLead} 
                  onChange={handleInputChange} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }} 
                />
                <label htmlFor="isQualifiedLead" style={{ fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                  Mark client as a Qualified Lead
                </label>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Notes & Detail Summary</label>
                <textarea 
                  name="notesSummary" 
                  value={formData.notesSummary} 
                  onChange={handleInputChange} 
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px', border: '1px solid #cbd5e1', borderRadius: '10px', minHeight: '84px', resize: 'vertical', outline: 'none', backgroundColor: '#ffffff' }} 
                  placeholder="Enter interaction notes, product inquiries, or follow-up topics..."
                />
              </div>

              {/* FOOTER ACTION BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '12px', backgroundColor: '#ffffff' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: '#059669', color: '#ffffff', borderRadius: '10px', padding: '10px 26px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.25)' }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingId ? 'Update Log' : 'Save Log')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Custom In-App Delete Confirmation Modal (Small Popup) */}
      {callToDelete && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 9999999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            maxWidth: '430px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <Trash2 size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Delete {callToDelete.isQualifiedLead ? 'Lead' : 'Call Log'}
                </h3>
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Confirm Deletion
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCallToDelete(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.55 }}>
              Are you sure you want to delete the record for <strong style={{ color: '#0f172a' }}>"{callToDelete.customerName || callToDelete.CustomerName}"</strong>? This will permanently remove this entry from your CRM.
            </p>

            {deleteError && (
              <div style={{
                padding: '9px 12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#b91c1c',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, color: '#dc2626' }} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setCallToDelete(null)}
                disabled={deleting}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCall}
                disabled={deleting}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
                }}
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default CallHistoryScreen;

