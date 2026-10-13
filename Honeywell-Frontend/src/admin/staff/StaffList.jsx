import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  Users, Plus, Mail, Phone, AlertTriangle, Trash2, Edit2, X, 
  Search, RefreshCw, UserCheck, UserX, Shield
} from 'lucide-react';
import { 
  getStaffList, 
  updateStaffStatus, 
  deleteStaff, 
  getStaffStats, 
  getStaffRoles 
} from '../../services/staffApi';
import { Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './StaffList.css';

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return String(phone);
  if (digits.length >= 10) {
    const main10 = digits.slice(-10);
    return `+91 ${main10}`;
  }
  return `+91 ${digits}`;
};

const getInitials = (name) => {
  if (!name || name === 'N/A') return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Dynamic Metadata State
  const [availableRoles, setAvailableRoles] = useState([]);
  const [statsData, setStatsData] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // AbortController ref for canceling stale in-flight requests
  const abortControllerRef = useRef(null);

  // Debounce search input (350ms) to prevent excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load backend roles dynamically (GET /api/Staff/roles)
  const loadRoles = useCallback(async () => {
    try {
      const roles = await getStaffRoles();
      if (Array.isArray(roles) && roles.length > 0) {
        setAvailableRoles(roles);
      }
    } catch (err) {
      console.warn('Roles fetch error:', err.message);
    }
  }, []);

  // Load backend stats dynamically (GET /api/Staff/stats)
  const loadStats = useCallback(async () => {
    try {
      const stats = await getStaffStats();
      if (stats && typeof stats === 'object') {
        setStatsData(stats);
      }
    } catch (err) {
      console.warn('Staff stats fetch error:', err.message);
      // Keep null so KPI cards fall back to calculated live array values
      setStatsData(null);
    }
  }, []);

  // Fetch staff list from real backend (GET /api/Staff) with filter parameters
  const fetchStaffData = useCallback(async () => {
    // Cancel previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setFetchError('');

    try {
      const queryParams = {
        search: debouncedSearch,
        role: selectedRole,
        status: selectedStatus,
      };

      const apiList = await getStaffList(queryParams, { signal: controller.signal });

      // Transform raw staff entities into clean UI model
      const mappedList = apiList.map((staff) => {
        const actualId = staff.id ?? staff.Id ?? staff.employeeId;
        const nameVal = staff.name || staff.Name || `${staff.firstName || staff.FirstName || ''} ${staff.lastName || staff.LastName || ''}`.trim() || 'N/A';
        const empIdVal = staff.employeeId || staff.EmployeeId || (actualId ? `EMP-${String(actualId).padStart(4, '0')}` : 'N/A');
        const phoneVal = staff.phone || staff.Phone || staff.mobileNumber || staff.MobileNumber || staff.mobile || staff.Mobile || '';
        const isActive = staff.isActive ?? staff.IsActive ?? (staff.status ? staff.status.toLowerCase() === 'active' : true);
        const permissions = Array.isArray(staff.permissions) ? staff.permissions : [];

        return {
          ...staff,
          id: actualId,
          name: nameVal,
          firstName: staff.firstName || staff.FirstName || nameVal.split(' ')[0] || '',
          lastName: staff.lastName || staff.LastName || nameVal.split(' ').slice(1).join(' ') || '',
          email: staff.email || staff.Email || '',
          employeeId: empIdVal,
          role: staff.role || staff.Role || 'staff',
          department: staff.department || staff.Department || '',
          mobile: phoneVal,
          status: isActive ? 'Active' : 'Inactive',
          isActive,
          permissions,
        };
      });

      setStaffList(mappedList);
      setFetchError('');
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was intentionally aborted due to new search/filter; ignore
        return;
      }
      console.error('Staff fetch error:', err.message);
      setFetchError(err.message || 'Unable to connect to Staff backend API.');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedRole, selectedStatus]);

  // Initial load
  useEffect(() => {
    loadRoles();
    loadStats();
  }, [loadRoles, loadStats]);

  // Refetch staff data whenever debounced search or filters change
  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleOpenDeleteModal = (staff) => {
    setStaffToDelete(staff);
  };

  // 5. DELETE /api/Staff/{id}
  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    const { id, name } = staffToDelete;

    try {
      await deleteStaff(id);
      setStaffList(prev => prev.filter(item => String(item.id ?? item.employeeId) !== String(id)));
      setToastMessage(`Staff "${name}" removed successfully.`);
      setToastType('success');
      loadStats();
    } catch (err) {
      console.error('API delete failed:', err);
      setToastMessage(`Failed to delete staff member: ${err.message}`);
      setToastType('error');
    }
    setStaffToDelete(null);
  };

  // 6. PATCH /api/Staff/{id}/status
  const handleToggleStatus = async (id, name) => {
    const item = staffList.find(s => String(s.id ?? s.employeeId) === String(id));
    if (!item) return;

    const newIsActive = !item.isActive;
    const nextStatus = newIsActive ? 'Active' : 'Inactive';

    try {
      await updateStaffStatus(id, {
        status: nextStatus,
        isActive: newIsActive,
      });

      setStaffList(prev => prev.map(s => {
        if (String(s.id ?? s.employeeId) === String(id)) {
          return { ...s, isActive: newIsActive, status: nextStatus };
        }
        return s;
      }));
      setToastMessage(`Staff "${name}" status updated to ${nextStatus}.`);
      setToastType('success');
      loadStats();
    } catch (err) {
      console.error('API status toggle failed:', err);
      setToastMessage(`Failed to update staff status: ${err.message}`);
      setToastType('error');
    }
  };

  // KPI Calculations using backend stats if available, or current live dataset
  const totalStaffCount = statsData?.totalStaff ?? statsData?.totalCount ?? staffList.length;
  const activeStaffCount = statsData?.activeStaff ?? statsData?.activeCount ?? staffList.filter(s => s.isActive).length;
  const inactiveStaffCount = statsData?.inactiveStaff ?? statsData?.inactiveCount ?? staffList.filter(s => !s.isActive).length;
  const adminRoleCount = statsData?.adminCount ?? statsData?.adminRoleCount ?? staffList.filter(s => (s.role || '').toLowerCase() === 'admin').length;

  // Client-side fallback filter for immediate UI responsiveness
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch = !q || (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.employeeId && s.employeeId.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.mobile && s.mobile.includes(q))
      );

      const matchRole = selectedRole === 'all' || (s.role || '').toLowerCase() === selectedRole.toLowerCase();
      const matchStatus = selectedStatus === 'all' || (
        selectedStatus === 'active' ? s.isActive : !s.isActive
      );

      return matchSearch && matchRole && matchStatus;
    });
  }, [staffList, debouncedSearch, selectedRole, selectedStatus]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedRole, selectedStatus]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
  const pagedStaff = useMemo(() => {
    return filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredStaff, currentPage]);

  return (
    <div className="staff-list-screen">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* ── Custom Delete Confirmation Modal ── */}
      {staffToDelete && createPortal(
        <div className="staff-modal-backdrop">
          <div className="staff-modal-card">
            <button
              className="staff-modal-close"
              onClick={() => setStaffToDelete(null)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                backgroundColor: '#fef2f2', border: '1px solid #fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Delete Staff Member
                </h3>
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700 }}>
                  Permanent Action
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: '#475569', margin: '0 0 22px 0', lineHeight: 1.6 }}>
              Are you sure you want to delete staff member <strong>"{staffToDelete.name}"</strong> (#{staffToDelete.employeeId})? This will permanently revoke their access credentials and permissions.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setStaffToDelete(null)}
                style={{
                  padding: '9px 18px', borderRadius: '8px',
                  border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                  color: '#475569', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStaff}
                style={{
                  padding: '9px 20px', borderRadius: '8px',
                  border: 'none', backgroundColor: '#dc2626',
                  color: '#ffffff', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                  gap: '8px', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  transition: 'background 0.15s ease'
                }}
              >
                <Trash2 size={15} /> Delete Staff
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Header Row Card ── */}
      <section className="staff-header-card">
        <div className="staff-header-left">
          <div className="staff-header-icon-wrap">
            <Users size={22} />
          </div>
          <div>
            <h1 className="staff-header-title">Staff Management Directory</h1>
            <p className="staff-header-desc">
              Manage enterprise roles, application permissions, and staff accounts.
            </p>
          </div>
        </div>

        <Link to="/admin/staff/add" className="staff-add-btn">
          <Plus size={16} />
          Add Staff Member
        </Link>
      </section>

      {/* ── KPI Stat Cards ── */}
      <div className="staff-kpi-grid">
        <div className="staff-kpi-card">
          <div className="staff-kpi-icon blue">
            <Users size={20} />
          </div>
          <div>
            <div className="staff-kpi-label">Total Staff</div>
            <div className="staff-kpi-value">{totalStaffCount}</div>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="staff-kpi-icon green">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="staff-kpi-label">Active Members</div>
            <div className="staff-kpi-value">{activeStaffCount}</div>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="staff-kpi-icon amber">
            <UserX size={20} />
          </div>
          <div>
            <div className="staff-kpi-label">Inactive / On Leave</div>
            <div className="staff-kpi-value">{inactiveStaffCount}</div>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="staff-kpi-icon purple">
            <Shield size={20} />
          </div>
          <div>
            <div className="staff-kpi-label">Admin Accounts</div>
            <div className="staff-kpi-value">{adminRoleCount}</div>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="staff-filter-card">
        <div className="staff-search-wrap">
          <Search size={16} className="staff-search-icon" />
          <input
            type="text"
            className="staff-search-input"
            placeholder="Search by name, employee ID, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="staff-filter-controls">
          <select
            className="staff-select-filter"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            {availableRoles.length > 0 ? (
              availableRoles.map((r) => {
                const code = r.code || r.id || r.name;
                const label = r.label || r.name || code;
                return (
                  <option key={code} value={code.toLowerCase()}>
                    {label}
                  </option>
                );
              })
            ) : (
              <>
                <option value="admin">Admin</option>
                <option value="advisory">Advisory</option>
                <option value="inventory">Inventory</option>
                <option value="manager">Manager</option>
                <option value="sales">Sales</option>
                <option value="staff">General Staff</option>
              </>
            )}
          </select>

          <select
            className="staff-select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="staff-refresh-btn"
            onClick={() => {
              fetchStaffData();
              loadStats();
              loadRoles();
            }}
            disabled={loading}
            title="Refresh staff directory"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Staff Ledger Table Card ── */}
      <section className="staff-table-card">
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Staff ID</th>
                <th>Staff Member</th>
                <th>Contact Details</th>
                <th>Assigned Role</th>
                <th>Application Access</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    <RefreshCw size={20} className="spin" style={{ display: 'block', margin: '0 auto 8px', color: '#1268a5' }} />
                    Loading staff directory from backend...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{
                      maxWidth: '520px',
                      margin: '0 auto',
                      padding: '20px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '10px',
                      color: '#991b1b',
                    }}>
                      <AlertTriangle size={28} style={{ color: '#ef4444', margin: '0 auto 10px', display: 'block' }} />
                      <strong style={{ display: 'block', fontSize: '15px', marginBottom: '6px' }}>
                        Failed to Load Staff Data from Backend
                      </strong>
                      <p style={{ fontSize: '13px', margin: '0 0 14px 0', color: '#7f1d1d', lineHeight: 1.5 }}>
                        {fetchError}
                      </p>
                      <button
                        type="button"
                        onClick={fetchStaffData}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 16px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : pagedStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#64748b' }}>
                    <Users size={32} style={{ margin: '0 auto 8px', color: '#94a3b8', display: 'block' }} />
                    <strong style={{ display: 'block', color: '#334155', fontSize: '15px', marginBottom: '4px' }}>
                      No staff members found
                    </strong>
                    <span style={{ fontSize: '13px' }}>
                      {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all'
                        ? 'Try adjusting your search or filters.'
                        : 'Click "Add Staff Member" above to create your first staff account.'}
                    </span>
                  </td>
                </tr>
              ) : (
                pagedStaff.map((staff) => {
                  const name = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A';
                  const staffId = staff.id ?? staff.Id ?? staff.employeeId ?? 'N/A';
                  const employeeCode = staff.employeeId || (staffId !== 'N/A' ? `EMP-${String(staffId).padStart(4, '0')}` : 'N/A');
                  const roleLower = (staff.role || staff.Role || 'staff').toLowerCase();
                  const roleName = String(staff.role || staff.Role || 'STAFF').toUpperCase();
                  const statusStr = staff.status || (staff.isActive ? 'Active' : 'Inactive');
                  const perms = Array.isArray(staff.permissions) ? staff.permissions : [];

                  return (
                    <tr key={staffId}>
                      <td>
                        <span className="staff-id-badge">
                          #{employeeCode}
                        </span>
                      </td>

                      <td>
                        <div className="staff-user-cell">
                          <div className="staff-avatar-bubble">
                            {getInitials(name)}
                          </div>
                          <div>
                            <div className="staff-user-name">{name}</div>
                            {staff.department && (
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                {staff.department}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="staff-contact-stack">
                          <span className="staff-contact-line">
                            <Mail size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span>{staff.email || '—'}</span>
                          </span>
                          {staff.mobile && (
                            <span className="staff-contact-line">
                              <Phone size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                              <span>{formatPhoneNumber(staff.mobile)}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className={`staff-role-pill ${roleLower}`}>
                          {roleName}
                        </span>
                      </td>

                      <td>
                        <div className="staff-perms-cluster">
                          {perms.slice(0, 4).map(p => (
                            <span key={p} className="staff-perm-pill">
                              {p}
                            </span>
                          ))}
                          {perms.length > 4 && (
                            <span className="staff-perm-pill" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                              +{perms.length - 4} more
                            </span>
                          )}
                          {perms.length === 0 && (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Basic Access
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`staff-status-toggle ${staff.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleStatus(staffId, name)}
                          title="Click to toggle active/inactive status"
                        >
                          <span className="staff-status-dot" />
                          {statusStr}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', width: '90px', minWidth: '90px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <Link
                            to={`/admin/staff/add?id=${staffId}`}
                            title="Edit Staff Member"
                            className="staff-action-btn edit"
                          >
                            <Edit2 size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(staff)}
                            title="Delete Staff Member"
                            className="staff-action-btn delete"
                          >
                            <Trash2 size={15} />
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

        <div className="staff-pagination-wrap">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredStaff.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </section>
    </div>
  );
};

export default StaffList;
