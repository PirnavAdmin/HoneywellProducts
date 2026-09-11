import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Mail, Phone, AlertTriangle, Trash2, X } from 'lucide-react';
import { getStaffList, updateStaff, deleteStaff } from '../../services/staffApi';
import { getApiDomain } from '../../utils/apiConfig';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';
import '../catalog/adminModule.css';

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

const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const apiList = await getStaffList();
      const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');

      // Merge API staff with locally created staff
      const combined = [...apiList];
      localAccounts.forEach(local => {
        const empId = String(local.employeeId || '').toLowerCase();
        const email = String(local.email || '').toLowerCase();
        const exists = combined.some(item => {
          const itemEmpId = String(item.employeeId || item.EmployeeId || '').toLowerCase();
          const itemEmail = String(item.email || item.Email || '').toLowerCase();
          return (empId && itemEmpId === empId) || (email && itemEmail === email);
        });
        if (!exists) {
          combined.push(local);
        }
      });

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
      console.warn('Staff fetch error handled:', err);
      const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
      setStaffList(localAccounts);
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

    // Remove from localStorage
    const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
    const filteredLocal = localAccounts.filter(acc => String(acc.id ?? acc.employeeId) !== String(id));
    localStorage.setItem('added_staff_accounts', JSON.stringify(filteredLocal));

    try {
      await deleteStaff(id);
    } catch (err) {
      console.warn('API delete failed, removed locally:', err);
    }

    setStaffList(prev => prev.filter(item => String(item.id ?? item.employeeId) !== String(id)));
    setToastMessage(`Staff "${name}" removed successfully.`);
    setToastType('success');
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

    // Update in localStorage
    const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
    const updatedLocal = localAccounts.map(acc => {
      if (String(acc.id ?? acc.employeeId) === String(id)) {
        return { ...acc, isActive: newIsActive, status: newIsActive ? 'Active' : 'Inactive' };
      }
      return acc;
    });
    localStorage.setItem('added_staff_accounts', JSON.stringify(updatedLocal));

    try {
      await updateStaff(id, putPayload);
    } catch (err) {
      console.warn('API status toggle failed, updated locally:', err);
    }

    setStaffList(prev => prev.map(s => {
      if (String(s.id ?? s.employeeId) === String(id)) {
        return {
          ...s,
          status: newIsActive ? 'Active' : 'Inactive',
          isActive: newIsActive
        };
      }
      return s;
    }));
    setToastMessage(`Updated status for "${name}".`);
    setToastType('success');
  };

  // Pagination calculations
  const totalPages = Math.ceil(staffList.length / itemsPerPage);
  const pagedStaff = useMemo(() => {
    return staffList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [staffList, currentPage]);

  return (
    <div className="admin-screen" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Custom Delete Confirmation Modal */}
      {staffToDelete && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            <button
              onClick={() => setStaffToDelete(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', padding: '4px', borderRadius: '6px'
              }}
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

            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              Are you sure you want to delete staff member <strong>"{staffToDelete.name}"</strong> (#{staffToDelete.employeeId})? This action will remove their access credentials and system permissions.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setStaffToDelete(null)}
                style={{
                  padding: '10px 18px', borderRadius: '10px',
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
                  padding: '10px 20px', borderRadius: '10px',
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
        </div>
      )}

      {/* Header Row Card */}
      <section style={{
        backgroundColor: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          }}>
            <Users style={{ color: '#10b981' }} size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Staff Management
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
              View, edit, and manage system roles and application permissions.
            </p>
          </div>
        </div>

        <Link 
          to="/admin/staff/add" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={16} />
          Add Staff
        </Link>
      </section>

      {/* Staff Ledger Card */}
      <section style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        margin: 0
      }}>
        <div className="catalog-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="catalog-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Staff ID</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Full Name</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Contact Details</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Assigned Role</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Application Access</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                    Loading staff directory...
                  </td>
                </tr>
              ) : pagedStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                    No staff members found.
                  </td>
                </tr>
              ) : pagedStaff.map((staff) => {
                const name = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A';
                const staffId = staff.id ?? staff.Id ?? staff.employeeId ?? 'N/A';
                const employeeCode = staff.employeeId || (staffId !== 'N/A' ? `EMP-${String(staffId).padStart(4, '0')}` : 'N/A');
                const roleName = staff.role || staff.Role ? String(staff.role || staff.Role).toUpperCase() : 'STAFF';
                const statusStr = staff.status || (staff.isActive ? 'Active' : 'Inactive');
                const perms = Array.isArray(staff.permissions) ? staff.permissions : [];

                return (
                  <tr key={staffId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      #{employeeCode}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      {name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '12px' }}>
                          <Mail size={13} style={{ color: '#94a3b8' }} /> {staff.email || '—'}
                        </span>
                        {staff.mobile && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '12px' }}>
                            <Phone size={13} style={{ color: '#94a3b8' }} /> {formatPhoneNumber(staff.mobile)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        {roleName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                        {perms.map(p => (
                          <span 
                            key={p} 
                            style={{ 
                              fontSize: '11px', 
                              backgroundColor: '#f3e8ff', 
                              color: '#7e22ce', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontWeight: 600, 
                              textTransform: 'capitalize',
                              lineHeight: '1.4'
                            }}
                          >
                            {p}
                          </span>
                        ))}
                        {perms.length === 0 && <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No permissions</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span 
                        onClick={() => handleToggleStatus(staffId, name)}
                        style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          fontWeight: 700,
                          backgroundColor: statusStr === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: statusStr === 'Active' ? '#16a34a' : '#dc2626',
                          cursor: 'pointer',
                          transition: 'opacity 0.15s ease'
                        }}
                        title="Click to toggle status"
                      >
                        {statusStr}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                        <AnimatedEditButton to={`/admin/staff/add?id=${staffId}`} title="Edit Staff" />
                        <OutlookDeleteButton onClick={() => handleOpenDeleteModal(staff)} title="Delete Staff" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '16px' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={staffList.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </section>
    </div>
  );
};

export default StaffList;
