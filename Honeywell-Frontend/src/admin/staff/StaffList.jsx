import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  Users, Plus, Mail, Phone, AlertTriangle, Trash2, Edit2, X, 
  Search, RefreshCw, UserCheck, UserX, Shield, Briefcase, Filter
} from 'lucide-react';
import { getStaffList, updateStaff, deleteStaff } from '../../services/staffApi';
import { getApiDomain } from '../../utils/apiConfig';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import './StaffList.css';

const BASE_URL = `${getApiDomain()}/api`;

const getHeaders = () => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('adminToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const safeParseJson = async (response) => {
  const text = await response.text();
  if (!text || text.trim() === '') return { success: true };
  try {
    return JSON.parse(text);
  } catch (err) {
    return { success: true, rawText: text };
  }
};

const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.Value)) return data.Value;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

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
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const apiList = await getStaffList();
      const combined = [...apiList];

      const ROLE_DEFAULTS = {
        advisory: ['dashboard', 'customers', 'call history', 'reports'],
        sales: ['dashboard', 'catalog', 'orders', 'invoices', 'customers', 'marketing'],
        inventory: ['dashboard', 'catalog', 'stockupdates', 'suppliers'],
        admin: ['dashboard', 'catalog', 'customers', 'orders', 'stockupdates', 'marketing', 'brands', 'blogs', 'settings', 'suppliers', 'coins converter', 'call history', 'invoices', 'reports'],
        staff: ['dashboard'],
      };

      // Map permissions and properties
      const mappedList = await Promise.all(combined.map(async (staff) => {
        let permissions = Array.isArray(staff.permissions) ? staff.permissions : [];
        const actualId = staff.id ?? staff.Id ?? staff.employeeId;
        const role = (staff.role || staff.Role || 'staff').toLowerCase();
        const empIdVal = staff.employeeId || staff.EmployeeId || (actualId ? `EMP-${String(actualId).padStart(4, '0')}` : 'N/A');

        if (permissions.length === 0 && actualId) {
          try {
            const permsResponse = await fetch(`${BASE_URL}/Permission/${actualId}`, { headers: getHeaders() });
            if (permsResponse.ok) {
              const permsJson = await safeParseJson(permsResponse);
              const permsData = unwrapList(permsJson);
              const allowed = permsData
                .filter(p => p.isAllowed ?? p.IsAllowed ?? false)
                .map(p => p.moduleName || p.ModuleName || (p.module && (p.module.moduleName || p.module.ModuleName)) || '');
              permissions = allowed.length > 0 ? allowed : (ROLE_DEFAULTS[role] || ROLE_DEFAULTS.staff);
            } else {
              permissions = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.staff;
            }
          } catch (err) {
            permissions = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.staff;
          }
        } else if (permissions.length === 0) {
          permissions = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.staff;
        }

        const isActive = staff.isActive ?? staff.IsActive ?? (staff.status ? staff.status.toLowerCase() === 'active' : true);
        const nameVal = staff.name || staff.Name || `${staff.firstName || staff.FirstName || ''} ${staff.lastName || staff.LastName || ''}`.trim() || 'N/A';
        const phoneVal = staff.phone || staff.Phone || staff.mobileNumber || staff.MobileNumber || staff.mobile || staff.Mobile || '';

        return {
          ...staff,
          id: actualId,
          name: nameVal,
          firstName: staff.firstName || staff.FirstName || nameVal.split(' ')[0] || '',
          lastName: staff.lastName || staff.LastName || nameVal.split(' ').slice(1).join(' ') || '',
          email: staff.email || staff.Email || '',
          employeeId: empIdVal,
          role: staff.role || staff.Role || 'staff',
          mobile: phoneVal,
          status: isActive ? 'Active' : 'Inactive',
          isActive,
          permissions
        };
      }));

      setStaffList(mappedList);
    } catch (err) {
      console.warn('Staff fetch error:', err);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleOpenDeleteModal = (staff) => {
    setStaffToDelete(staff);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    const { id, name } = staffToDelete;

    try {
      await deleteStaff(id);
      setStaffList(prev => prev.filter(item => String(item.id ?? item.employeeId) !== String(id)));
      setToastMessage(`Staff "${name}" removed successfully.`);
      setToastType('success');
    } catch (err) {
      console.error('API delete failed:', err);
      setToastMessage(`Failed to delete staff member "${name}". Server or API error.`);
      setToastType('error');
    }
    setStaffToDelete(null);
  };

  const handleToggleStatus = async (id, name) => {
    const item = staffList.find(s => String(s.id ?? s.employeeId) === String(id));
    if (!item) return;

    const newIsActive = !item.isActive;
    const putPayload = {
      staffId: id,
      employeeId: item.employeeId || item.EmployeeId || "",
      firstName: item.firstName || item.FirstName || "",
      lastName: item.lastName || item.LastName || "",
      email: item.email || item.Email || "",
      mobileNumber: item.mobile || item.Mobile || item.mobileNumber || item.MobileNumber || "",
      role: item.role || item.Role || "staff",
      password: item.password || item.Password || "",
      isActive: newIsActive
    };

    try {
      await updateStaff(id, putPayload);
      setStaffList(prev => prev.map(s => {
        if (String(s.id ?? s.employeeId) === String(id)) {
          return { ...s, isActive: newIsActive, status: newIsActive ? 'Active' : 'Inactive' };
        }
        return s;
      }));
      setToastMessage(`Staff status updated to ${newIsActive ? 'Active' : 'Inactive'}.`);
      setToastType('success');
    } catch (err) {
      console.error('API status toggle failed:', err);
      setToastMessage(`Failed to update staff status. Server or API error.`);
      setToastType('error');
    }
  };

  // KPI Calculations
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter(s => s.isActive).length;
  const inactiveStaffCount = staffList.filter(s => !s.isActive).length;
  const adminRoleCount = staffList.filter(s => (s.role || '').toLowerCase() === 'admin').length;

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
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
  }, [staffList, searchTerm, selectedRole, selectedStatus]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedStatus]);

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
            <option value="admin">Admin</option>
            <option value="sales">Sales</option>
            <option value="inventory">Inventory</option>
            <option value="advisory">Advisory</option>
            <option value="staff">General Staff</option>
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
            onClick={fetchStaffData}
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
                    Loading staff directory...
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
