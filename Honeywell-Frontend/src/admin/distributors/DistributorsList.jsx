import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2, CheckCircle2,
  XCircle, ArrowUpDown, ShieldCheck, MapPin, Phone, Mail, Building2,
  AlertTriangle, X, Check, Building, Layers, RotateCcw
} from 'lucide-react';
import { distributorService } from '../../services/distributorService';
import DistributorFormModal from './DistributorFormModal';
import '../catalog/adminModule.css';

export default function DistributorsList() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Loading States for individual row operations
  const [togglingId, setTogglingId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Details Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailDistributor, setDetailDistributor] = useState(null);

  // Inline order editing
  const [editingOrderMap, setEditingOrderMap] = useState({});

  // Notification / Toast
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Step 8 — Load all distributors (admin endpoint)
  const loadDistributors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (regionFilter !== 'All') params.region = regionFilter;

      const data = await distributorService.getAdminDistributors(params);
      setDistributors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load admin distributors:', err);
      setError(err.message || 'Unable to load distributors from server.');
      setDistributors([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, regionFilter]);

  useEffect(() => {
    loadDistributors();
  }, [loadDistributors]);

  // Unique regions for filter
  const regions = useMemo(() => {
    const set = new Set(distributors.map((d) => d.region).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [distributors]);

  // Filtered List for Table
  const filteredDistributors = useMemo(() => {
    return distributors.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (item.name || item.companyName || '').toLowerCase().includes(q) ||
        (item.contactPerson || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.phone || '').includes(q) ||
        (item.city || item.territory || '').toLowerCase().includes(q) ||
        (item.region || '').toLowerCase().includes(q) ||
        (item.gstin || '').toLowerCase().includes(q);

      const matchesRegion = regionFilter === 'All' || item.region === regionFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && item.isActive) ||
        (statusFilter === 'Inactive' && !item.isActive);

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [distributors, searchTerm, regionFilter, statusFilter]);

  // Step 9 & 10 — Create or Update Distributor
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedDistributor && selectedDistributor.id) {
        // Step 10: Update
        await distributorService.updateDistributor(selectedDistributor.id, formData);
        showNotification(`Distributor "${formData.name}" updated successfully!`);
      } else {
        // Step 9: Create
        await distributorService.createDistributor(formData);
        showNotification(`Distributor "${formData.name}" created successfully!`);
      }
      setIsFormOpen(false);
      setSelectedDistributor(null);
      await loadDistributors();
    } catch (err) {
      console.error('Failed to save distributor:', err);
      alert('Error saving distributor: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 11 — Toggle Active / Inactive Status
  const handleToggleStatus = async (item) => {
    if (togglingId) return;
    setTogglingId(item.id);
    try {
      await distributorService.toggleDistributorStatus(item.id);
      showNotification(`Status updated for "${item.name || item.companyName}"`);
      // Update local state directly
      setDistributors((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, isActive: !d.isActive } : d))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update status: ' + (err.message || 'Server error'));
    } finally {
      setTogglingId(null);
    }
  };

  // Step 12 — Update Display Order
  const handleSaveDisplayOrder = async (item) => {
    const newOrder = editingOrderMap[item.id] !== undefined ? editingOrderMap[item.id] : item.displayOrder;
    if (updatingOrderId) return;
    setUpdatingOrderId(item.id);
    try {
      await distributorService.updateDistributorDisplayOrder(item.id, newOrder);
      showNotification(`Display order updated to ${newOrder} for "${item.name || item.companyName}"`);
      setDistributors((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, displayOrder: Number(newOrder) } : d))
      );
      setEditingOrderMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch (err) {
      console.error('Failed to update display order:', err);
      alert('Failed to update display order: ' + (err.message || 'Server error'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Step 13 — Delete Distributor
  const handleDelete = async (item) => {
    if (deletingId) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete distributor "${item.name || item.companyName}" (ID: ${item.id})? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await distributorService.deleteDistributor(item.id);
      showNotification(`Distributor "${item.name || item.companyName}" deleted successfully.`);
      setDistributors((prev) => prev.filter((d) => d.id !== item.id));
    } catch (err) {
      console.error('Failed to delete distributor:', err);
      alert('Failed to delete distributor: ' + (err.message || 'Server error'));
    } finally {
      setDeletingId(null);
    }
  };

  // Open Details modal
  const handleOpenDetails = (item) => {
    setDetailDistributor(item);
    setIsDetailOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRegionFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="catalog-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999999,
          background: notification.type === 'error' ? '#dc2626' : '#16a34a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} /> {notification.msg}
        </div>
      )}

      {/* ── Professional Header Card ── */}
      <section className="catalog-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '22px 26px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #1268a5',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div className="catalog-title-wrap" style={{ flex: '1 1 300px' }}>
          <span className="catalog-kicker" style={{
            fontSize: '11.5px',
            textTransform: 'uppercase',
            color: '#1268a5',
            fontWeight: 800,
            display: 'block',
            letterSpacing: '0.06em',
            marginBottom: '4px'
          }}>
            CHANNEL ECOSYSTEM MANAGEMENT
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Dealers &amp; Distributors
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            Manage authorized regional distributors, master hubs, dealers, display sequences, and commercial profiles.
          </p>
        </div>

        <div className="catalog-header__actions" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'nowrap',
          marginLeft: 'auto'
        }}>
          <button
            type="button"
            className="catalog-btn"
            onClick={loadDistributors}
            disabled={loading}
            title="Refresh List"
            style={{
              height: '40px',
              padding: '0 16px',
              fontSize: '13.5px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="catalog-btn catalog-btn--primary"
            onClick={() => {
              setSelectedDistributor(null);
              setIsFormOpen(true);
            }}
            style={{
              height: '40px',
              padding: '0 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#1268a5',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(18, 104, 165, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Distributor</span>
          </button>
        </div>
      </section>

      {/* ── Main Content Card ── */}
      <section className="catalog-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
        padding: 0
      }}>
        {/* ── Filter Bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#ffffff',
          flexWrap: 'wrap'
        }}>
          {/* Left: Search Input */}
          <div style={{
            position: 'relative',
            flex: '1 1 280px',
            minWidth: '220px',
            maxWidth: '420px'
          }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }} />
            <input
              type="text"
              placeholder="Search by company, contact person, city, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px 0 36px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
            />
          </div>

          {/* Right: Dropdowns & Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginLeft: 'auto'
          }}>
            {/* Region Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Region:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                {regions.map((r) => (
                  <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Count Pill */}
            <div style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid #e2e8f0'
            }}>
              {loading ? 'Loading...' : `${filteredDistributors.length} dealer${filteredDistributors.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* ── Table Wrap ── */}
        <div className="catalog-table-wrap" style={{ margin: 0, border: 'none' }}>
          <table className="catalog-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: '70px', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ID
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  COMPANY &amp; PARTNER TYPE
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CONTACT DETAILS
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  REGION &amp; TERRITORY
                </th>
                <th style={{ width: '120px', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  DISPLAY ORDER
                </th>
                <th style={{ width: '110px', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  STATUS
                </th>
                <th style={{ width: '140px', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <RefreshCw size={24} className="spin" style={{ display: 'inline-block', marginBottom: '10px', color: '#1268a5' }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Loading dealers &amp; distributors from backend...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: '#dc2626' }}>
                    <div style={{
                      maxWidth: '460px',
                      margin: '0 auto',
                      padding: '20px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '10px',
                      border: '1px solid #fecaca'
                    }}>
                      <AlertTriangle size={28} style={{ color: '#dc2626', marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700 }}>Connection Notice</h4>
                      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#991b1b', lineHeight: 1.4 }}>{error}</p>
                      <button
                        type="button"
                        onClick={loadDistributors}
                        className="catalog-btn"
                        style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, borderColor: '#fca5a5', color: '#dc2626' }}
                      >
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredDistributors.length === 0 ? (
                /* ── Professional Empty State ── */
                <tr>
                  <td colSpan="7" style={{ padding: '56px 20px', textAlign: 'center' }}>
                    <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: '#f0f9ff',
                        color: '#1268a5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        border: '1px solid #d4e8f7'
                      }}>
                        <Building2 size={26} />
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                        No Dealers or Distributors Found
                      </h3>
                      <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                        {searchTerm || regionFilter !== 'All' || statusFilter !== 'All'
                          ? 'No records match your active search or filters. Clear your filters to view all entries.'
                          : 'No distributor accounts have been registered yet. Add your first authorized distributor to start managing channel partners.'}
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {(searchTerm || regionFilter !== 'All' || statusFilter !== 'All') && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: 600,
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <RotateCcw size={14} /> Reset Filters
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDistributor(null);
                            setIsFormOpen(true);
                          }}
                          style={{
                            padding: '8px 18px',
                            fontSize: '13px',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#1268a5',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 3px rgba(18, 104, 165, 0.25)'
                          }}
                        >
                          <Plus size={15} /> Add Distributor
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDistributors.map((item) => {
                  const currentEditOrder = editingOrderMap[item.id] !== undefined ? editingOrderMap[item.id] : item.displayOrder;
                  const isOrderDirty = editingOrderMap[item.id] !== undefined && Number(editingOrderMap[item.id]) !== item.displayOrder;

                  return (
                    <tr key={item.id} style={{
                      opacity: item.isActive ? 1 : 0.7,
                      backgroundColor: item.isActive ? '#ffffff' : '#fafafa',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      {/* ID */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#64748b', fontSize: '12.5px' }}>
                        #{item.id}
                      </td>

                      {/* Company & Partner Type */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.name || item.companyName}
                          {item.isVerified && (
                            <ShieldCheck size={15} style={{ color: '#1268a5' }} title="Verified Distributor" />
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#1268a5', fontWeight: 600, marginTop: '3px' }}>
                          {item.partnerType || item.tier}
                        </div>
                        {item.gstin && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            GSTIN: <strong style={{ color: '#334155' }}>{item.gstin}</strong>
                          </div>
                        )}
                      </td>

                      {/* Contact Details */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                          {item.contactPerson || '—'}
                        </div>
                        {item.phone && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            📞 {item.phone}
                          </div>
                        )}
                        {item.email && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                            ✉️ {item.email}
                          </div>
                        )}
                      </td>

                      {/* Region & Location */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                          {item.region || '—'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {[item.city, item.state].filter(Boolean).join(', ') || item.territory || '—'}
                        </div>
                      </td>

                      {/* Display Order */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            style={{
                              width: '56px',
                              height: '32px',
                              padding: '0 6px',
                              fontSize: '12.5px',
                              textAlign: 'center',
                              borderRadius: '6px',
                              border: isOrderDirty ? '1px solid #1268a5' : '1px solid #cbd5e1',
                              backgroundColor: isOrderDirty ? '#f0f9ff' : '#ffffff'
                            }}
                            value={currentEditOrder}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingOrderMap((prev) => ({
                                ...prev,
                                [item.id]: val === '' ? '' : Number(val)
                              }));
                            }}
                          />
                          {isOrderDirty && (
                            <button
                              type="button"
                              onClick={() => handleSaveDisplayOrder(item)}
                              disabled={updatingOrderId === item.id}
                              title="Save Order"
                              style={{
                                height: '32px',
                                padding: '0 8px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                backgroundColor: '#1268a5',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              {updatingOrderId === item.id ? '...' : 'Save'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id}
                          title={`Click to set ${item.isActive ? 'Inactive' : 'Active'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            border: item.isActive ? '1px solid #bbf7d0' : '1px solid #fecaca',
                            cursor: togglingId === item.id ? 'not-allowed' : 'pointer',
                            color: item.isActive ? '#15803d' : '#b91c1c',
                            backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {togglingId === item.id ? (
                            <RefreshCw size={11} className="spin" />
                          ) : item.isActive ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          <span>{item.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="catalog-btn catalog-btn--sm"
                            onClick={() => handleOpenDetails(item)}
                            title="View Details"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155'
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            className="catalog-btn catalog-btn--sm"
                            onClick={() => {
                              setSelectedDistributor(item);
                              setIsFormOpen(true);
                            }}
                            title="Edit Distributor"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#1268a5'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            className="catalog-btn catalog-btn--sm"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            title="Delete Distributor"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              backgroundColor: '#ffffff',
                              color: '#dc2626'
                            }}
                          >
                            {deletingId === item.id ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Step 9 & 10 Modal */}
      <DistributorFormModal
        isOpen={isFormOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsFormOpen(false);
            setSelectedDistributor(null);
          }
        }}
        onSubmit={handleFormSubmit}
        distributor={selectedDistributor}
        isSubmitting={isSubmitting}
      />

      {/* Details Modal */}
      {isDetailOpen && detailDistributor && createPortal(
        <div
          onClick={() => setIsDetailOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}
          >
            <div className="catalog-modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#1268a5', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>
                  Distributor Profile #{detailDistributor.id}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{detailDistributor.name || detailDistributor.companyName}</h2>
              </div>
              <button
                type="button"
                className="catalog-modal-close"
                onClick={() => setIsDetailOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Partner Type</span>
                  <span style={{ fontSize: '13.5px', color: '#1268a5', fontWeight: 600 }}>{detailDistributor.partnerType || detailDistributor.tier}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Region / Territory</span>
                  <span style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 600 }}>{detailDistributor.region} ({detailDistributor.city || detailDistributor.territory})</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Contact Lead</span>
                  <span style={{ fontSize: '13.5px', color: '#0f172a' }}>{detailDistributor.contactPerson} ({detailDistributor.designation || detailDistributor.contactTitle})</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Contact Channels</span>
                  <span style={{ fontSize: '13px', color: '#0f172a' }}>{detailDistributor.phone} | {detailDistributor.email}</span>
                </div>
                {detailDistributor.gstin && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>GSTIN</span>
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{detailDistributor.gstin}</span>
                  </div>
                )}
                {detailDistributor.address && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Operational Address</span>
                    <span style={{ fontSize: '13px', color: '#334155' }}>{detailDistributor.address}</span>
                  </div>
                )}
              </div>

              {detailDistributor.productCategories && (
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Product Categories</span>
                  <div style={{ fontSize: '13px', color: '#334155' }}>{detailDistributor.productCategories}</div>
                </div>
              )}

              {detailDistributor.description && (
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Description</span>
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#334155', lineHeight: 1.45 }}>
                    {detailDistributor.description}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f0fdf4', padding: '10px 14px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534' }}>
                <div><strong>Dispatch SLA:</strong> {detailDistributor.dispatchSla || '—'}</div>
                <div><strong>Buffer Stock:</strong> {detailDistributor.bufferCapacity || detailDistributor.warehouseCapacity || '—'}</div>
                <div><strong>Terms:</strong> {detailDistributor.commercialTerms || detailDistributor.paymentTerms || '—'}</div>
                <div><strong>Rating:</strong> {detailDistributor.rating || '—'}</div>
              </div>
            </div>

            <div className="catalog-modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="catalog-btn catalog-btn--primary"
                onClick={() => setIsDetailOpen(false)}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#1268a5',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
