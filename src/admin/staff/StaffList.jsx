import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Mail, Phone } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import { OutlookDeleteButton, AnimatedEditButton, Pagination } from '../components/ActionButtons';
import { Toast } from '../components/Toast';

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
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
  }
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStaffData = async () => {
    setLoading(true);
    const headers = getHeaders();
    console.log('[StaffList Diagnostic] Fetching staff list from:', `${BASE_URL}/Staff`);
    console.log('[StaffList Diagnostic] Headers sent:', headers);
    console.log('[StaffList Diagnostic] Token in localStorage:', localStorage.getItem('adminToken'));
    console.log('[StaffList Diagnostic] Auth version:', localStorage.getItem('authApiVersion'));

    // Validate the token against validate endpoint
    if (headers['Authorization']) {
      try {
        const valRes = await fetch(`${BASE_URL}/Auth/validate`, { headers });
        console.log('[StaffList Diagnostic] Auth validate status:', valRes.status);
        const valJson = await safeParseJson(valRes);
        console.log('[StaffList Diagnostic] Auth validate body:', valJson);
      } catch (valErr) {
        console.warn('[StaffList Diagnostic] Auth validate check failed:', valErr);
      }
    }

    try {
      const response = await fetch(`${BASE_URL}/Staff`, { headers });
      if (!response.ok) {
        console.error('[StaffList Diagnostic] Fetch staff returned non-ok status:', response.status);
        try {
          const errBody = await response.text();
          console.error('[StaffList Diagnostic] Fetch staff error body:', errBody);
        } catch (e) {}
        throw new Error(`Failed to fetch staff list (${response.status})`);
      }
      const json = await safeParseJson(response);
      const list = unwrapList(json);
      
      // Fetch permissions for each staff member in parallel
      const mappedList = await Promise.all(list.map(async (staff) => {
        let permissions = [];
        const actualId = staff.id ?? staff.Id;
        const role = (staff.role || staff.Role || 'staff').toLowerCase();

        // Role-based default permissions
        const ROLE_DEFAULTS = {
          advisory: ['dashboard', 'customers', 'call history', 'reports'],
          sales: ['dashboard', 'catalog', 'orders', 'invoices', 'customers', 'marketing'],
          inventory: ['dashboard', 'catalog', 'stockupdates', 'suppliers'],
          admin: ['dashboard', 'catalog', 'customers', 'orders', 'stockupdates', 'marketing', 'brands', 'blogs', 'settings', 'suppliers', 'coins converter', 'call history', 'invoices', 'reports'],
          staff: ['dashboard'],
        };

        const empIdVal = staff.employeeId || staff.EmployeeId || (actualId ? `EMP-${String(actualId).padStart(4, '0')}` : 'N/A');

        if (actualId) {
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
              const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
              const localStaff = localAccounts.find(s => String(s.employeeId) === String(empIdVal) || String(s.id ?? s.Id) === String(actualId) || (staff.email && String(s.email).toLowerCase() === String(staff.email || staff.Email).toLowerCase()));
              if (localStaff && Array.isArray(localStaff.permissions) && localStaff.permissions.length > 0) {
                permissions = localStaff.permissions;
              } else {
                permissions = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.staff;
              }
            }
          } catch (err) {
            console.warn(`Could not load permissions for staff #${actualId}`, err);
            const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
            const localStaff = localAccounts.find(s => String(s.employeeId) === String(empIdVal) || String(s.id ?? s.Id) === String(actualId) || (staff.email && String(s.email).toLowerCase() === String(staff.email || staff.Email).toLowerCase()));
            if (localStaff && Array.isArray(localStaff.permissions) && localStaff.permissions.length > 0) {
              permissions = localStaff.permissions;
            } else {
              permissions = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.staff;
            }
          }
        } else {
          const localAccounts = JSON.parse(localStorage.getItem('added_staff_accounts') || '[]');
          const localStaff = localAccounts.find(s => String(s.employeeId) === String(empIdVal) || (staff.email && String(s.email).toLowerCase() === String(staff.email || staff.Email).toLowerCase()));
          if (localStaff && Array.isArray(localStaff.permissions) && localStaff.permissions.length > 0) {
            permissions = localStaff.permissions;
          } else {
            permissions = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.staff;
          }
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
      console.warn('Staff fetch failed:', err);
      setToastMessage(`Failed to load staff list: ${err.message}`);
      setToastType('error');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      const response = await fetch(`${BASE_URL}/Staff/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      setStaffList(prev => prev.filter(item => item.id !== id));
      setToastMessage(`Staff "${name}" removed successfully.`);
      setToastType('success');
    } catch (err) {
      console.error('Delete failed:', err);
      // Fallback local delete for mock/local items
      setStaffList(prev => prev.filter(item => item.id !== id));
      setToastMessage(`Removed staff member "${name}"`);
      setToastType('success');
    }
  };

  const handleToggleStatus = async (id, name) => {
    const item = staffList.find(s => s.id === id);
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
      password: item.password || "DummyPassword123!",
      isActive: newIsActive
    };

    try {
      const response = await fetch(`${BASE_URL}/Staff/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(putPayload)
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      setStaffList(prev => prev.map(s => {
        if (s.id === id) {
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
    } catch (err) {
      console.error('Status toggle failed:', err);
      setToastMessage(`Could not change status for "${name}".`);
      setToastType('error');
    }
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

      {/* Header Row Card matching media_1788153202155.png */}
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
                  <td colSpan="7" className="catalog-center-cell" style={{ padding: '36px 0', color: '#94a3b8', fontSize: '13px' }}>
                    Loading staff directory...
                  </td>
                </tr>
              ) : pagedStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="catalog-center-cell" style={{ padding: '36px 0', color: '#94a3b8', fontSize: '13px' }}>
                    No staff members found.
                  </td>
                </tr>
              ) : pagedStaff.map((staff) => {
                const name = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A';
                const staffId = staff.id ?? staff.Id ?? 'N/A';
                const employeeCode = staff.employeeId || (staffId !== 'N/A' ? `EMP-${String(staffId).padStart(4, '0')}` : 'N/A');
                const roleName = staff.role || staff.Role ? String(staff.role || staff.Role).toUpperCase() : 'STAFF';
                const statusStr = staff.status || 'Active';
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
                        <OutlookDeleteButton onClick={() => handleDelete(staffId, name)} title="Remove Staff" />
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

