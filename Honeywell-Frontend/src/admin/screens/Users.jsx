import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
  User, 
  Trash2, 
  RefreshCw, 
  Shield, 
  Check, 
  X, 
  Lock, 
  Search, 
  UserPlus, 
  Users as UsersIcon, 
  ShieldCheck, 
  Layers,
  Phone,
  Mail,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
import { Pagination } from '../components/ActionButtons';
import './Users.css';

const API_BASE = `${getApiDomain()}/api/Auth`;

const ALL_PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'catalog', label: 'Catalog' },
  { key: 'customers', label: 'Customers' },
  { key: 'purchase indent', label: 'Purchase Indent' },
  { key: 'purchase order', label: 'Purchase Order' },
  { key: 'invoices', label: 'Sales Invoice' },
  { key: 'sales return', label: 'Sales Return / Warranty' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'reports', label: 'Reports' },
  { key: 'orders', label: 'Orders' },
  { key: 'stockupdates', label: 'Stock Updates' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'brands', label: 'Brands' },
  { key: 'blogs', label: 'Blogs' },
  { key: 'settings', label: 'Settings' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'coins converter', label: 'Coins Converter' },
  { key: 'call history', label: 'Call History' },
  { key: 'staff', label: 'Staff' }
];

const DEFAULT_USER_PERMISSIONS = ALL_PERMISSION_MODULES.map((m) => m.key);

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all', 'full', 'custom'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Permission management modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPerms, setUserPerms] = useState({});

  // Add user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phoneNumber: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/users`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      const rawData = Array.isArray(response.data) ? response.data : (response.data?.users || response.data?.data || []);

      const userList = await Promise.all(rawData.map(async (u) => {
        let perms = u.permissions || u.Permissions || [];
        const userEmail = u.email || u.Email;
        if ((!perms || perms.length === 0) && userEmail) {
          try {
            const permRes = await axios.get(`${API_BASE}/users/${encodeURIComponent(userEmail)}/permissions`, {
              headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            const fetchedPerms = permRes.data?.permissions || permRes.data || [];
            if (Array.isArray(fetchedPerms) && fetchedPerms.length > 0) {
              perms = fetchedPerms;
            }
          } catch (e) {
            // Keep default/empty permissions
          }
        }
        return {
          ...u,
          id: u.id || u.Id || u.email,
          email: userEmail || '',
          name: u.fullName || u.name || u.Name || 'N/A',
          phoneNumber: u.mobileNumber || u.phoneNumber || u.Phone || u.mobile || 'N/A',
          permissions: Array.isArray(perms) && perms.length > 0 ? perms : DEFAULT_USER_PERMISSIONS
        };
      }));

      setUsers(userList);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError("Failed to fetch users list.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (user) => {
    const identifier = user.email || user.id;
    if (!identifier) return;
    if (!window.confirm(`Are you sure you want to delete user "${user.name || identifier}"?`)) return;
    
    try {
      await axios.delete(`${API_BASE}/users/${encodeURIComponent(identifier)}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setUsers(users.filter(u => u.id !== user.id && u.email !== user.email));
      alert("User deleted successfully.");
    } catch (err) {
      console.error("Delete User Error:", err);
      alert("Failed to delete user.");
    }
  };

  const openPermissionModal = (user) => {
    setSelectedUser(user);
    const activePerms = user.permissions || DEFAULT_USER_PERMISSIONS;
    const permObj = {};
    ALL_PERMISSION_MODULES.forEach(mod => {
      permObj[mod.key] = activePerms.includes(mod.key);
    });
    setUserPerms(permObj);
  };

  const handleTogglePermission = (modKey) => {
    setUserPerms(prev => ({
      ...prev,
      [modKey]: !prev[modKey]
    }));
  };

  const handleSelectAllPermissions = (select) => {
    const permObj = {};
    ALL_PERMISSION_MODULES.forEach(mod => {
      permObj[mod.key] = select;
    });
    setUserPerms(permObj);
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    const enabledList = Object.keys(userPerms).filter(k => userPerms[k]);
    const userEmail = selectedUser.email || selectedUser.id;

    try {
      await axios.put(`${API_BASE}/users/${encodeURIComponent(userEmail)}/permissions`, enabledList, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }
      });

      const updatedUsers = users.map(u => {
        if (u.id === selectedUser.id || u.email === selectedUser.email) {
          return { ...u, permissions: enabledList };
        }
        return u;
      });
      setUsers(updatedUsers);
      alert(`Permissions for ${selectedUser.name || 'User'} updated successfully!`);
      setSelectedUser(null);
    } catch (err) {
      console.error("Save Permissions Error:", err);
      alert("Failed to save permissions to backend API.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      alert("Please fill in Name and Email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newUser.name,
        fullName: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        mobileNumber: newUser.phoneNumber,
        password: newUser.password || 'User@123',
        role: 'Admin',
        permissions: DEFAULT_USER_PERMISSIONS
      };
      await axios.post(`${API_BASE}/users`, payload, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }
      });
      alert("Admin user created successfully!");
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', phoneNumber: '', password: '' });
      fetchUsers();
    } catch (err) {
      console.error("Create User Error:", err);
      alert(err.response?.data?.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const query = searchTerm.toLowerCase().trim();
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phoneNumber || '').toLowerCase();
      const id = String(user.id || '').toLowerCase();
      
      const matchesSearch = !query || name.includes(query) || email.includes(query) || phone.includes(query) || id.includes(query);
      if (!matchesSearch) return false;

      const permCount = user.permissions ? user.permissions.length : ALL_PERMISSION_MODULES.length;
      const isFullAccess = permCount === ALL_PERMISSION_MODULES.length;

      if (scopeFilter === 'full') return isFullAccess;
      if (scopeFilter === 'custom') return !isFullAccess;
      return true;
    });
  }, [users, searchTerm, scopeFilter]);

  // Pagination logic
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, scopeFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const fullAccessCount = users.filter(u => u.permissions && u.permissions.length === ALL_PERMISSION_MODULES.length).length;

  return (
    <div className="users-container">
      {/* Page Header */}
      <div className="users-header">
        <div className="users-title">
          <div className="users-title-badge">ADMINISTRATION & CUSTOMERS</div>
          <h1>User Management</h1>
          <p>View registered system users, register admin/staff members, and manage granular module access controls.</p>
        </div>
        <div className="users-header-actions">
          <button 
            onClick={fetchUsers} 
            className="btn-users-secondary"
            disabled={isLoading}
            type="button"
            title="Refresh users list"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="btn-users-primary"
            type="button"
            title="Add new admin or staff user"
          >
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="users-error-alert">
          <span>{error}</span>
          <button onClick={fetchUsers} className="btn-error-retry">Retry</button>
        </div>
      )}

      {/* Analytics Stat Cards */}
      <div className="users-stats-grid">
        <div className="users-stat-card">
          <div className="users-stat-info">
            <label>Total Users</label>
            <span>{users.length}</span>
          </div>
          <div className="users-stat-icon blue">
            <UsersIcon size={22} />
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-info">
            <label>Full Admin Access</label>
            <span>{fullAccessCount}</span>
          </div>
          <div className="users-stat-icon green">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-info">
            <label>Custom Scopes</label>
            <span>{users.length - fullAccessCount}</span>
          </div>
          <div className="users-stat-icon amber">
            <Shield size={22} />
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-info">
            <label>Total Modules</label>
            <span>{ALL_PERMISSION_MODULES.length}</span>
          </div>
          <div className="users-stat-icon purple">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="users-controls">
        <div className="users-controls-left">
          <div className="users-search-wrap">
            <Search size={18} className="users-search-icon" />
            <input 
              type="text"
              placeholder="Search by name, email, phone or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="users-search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="users-search-clear"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="users-filter-dropdown-wrap">
            <Filter size={15} className="users-filter-icon" />
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="users-filter-select"
            >
              <option value="all">All Access Scopes</option>
              <option value="full">Full Access Only</option>
              <option value="custom">Custom Scopes Only</option>
            </select>
          </div>
        </div>

        <div className="users-filter-count">
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
        </div>
      </div>

      {/* Users Table Card with Responsive Scroll Wrapper */}
      <div className="users-table-card">
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th className="th-id">User ID</th>
                <th className="th-user">User Details</th>
                <th className="th-contact">Contact Info</th>
                <th className="th-scope">Active Scope</th>
                <th className="th-status">Status</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const initial = (user.name && user.name !== 'N/A') ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
                  const permCount = user.permissions ? user.permissions.length : ALL_PERMISSION_MODULES.length;
                  const isFullAccess = permCount === ALL_PERMISSION_MODULES.length;
                  const rawId = String(user.id || user.email || 'N/A');
                  const displayId = rawId.length > 18 ? `${rawId.slice(0, 16)}…` : rawId;

                  return (
                    <tr key={user.id || user.email}>
                      <td>
                        <span className="user-id-badge" title={`Full ID: ${rawId}`}>
                          #{displayId}
                        </span>
                      </td>
                      <td>
                        <div className="user-info-cell">
                          <div className="user-avatar-circle">
                            {initial}
                          </div>
                          <div className="user-info-text">
                            <span className="user-name-text" title={user.name || 'User'}>
                              {user.name || 'User'}
                            </span>
                            <span className="user-contact-email" title={user.email || 'No email attached'}>
                              <Mail size={12} className="user-inline-icon" />
                              {user.email || 'No email attached'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="user-contact-phone">
                          <Phone size={13} className="user-inline-icon" />
                          <span>{user.phoneNumber && user.phoneNumber !== 'N/A' ? user.phoneNumber : 'Not provided'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`user-scope-badge ${isFullAccess ? 'scope-full' : 'scope-custom'}`}>
                          <Shield size={13} />
                          {isFullAccess ? (
                            `Full Access (${permCount}/${ALL_PERMISSION_MODULES.length})`
                          ) : (
                            `${permCount} of ${ALL_PERMISSION_MODULES.length} Granted`
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="user-status-active">
                          <span className="user-status-dot"></span>
                          Active
                        </span>
                      </td>
                      <td>
                        <div className="user-actions">
                          <button 
                            type="button"
                            onClick={() => openPermissionModal(user)}
                            className="btn-manage-perms"
                            title="Configure Module Access Permissions"
                          >
                            <Shield size={14} />
                            <span>Manage Scope</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteUser(user)}
                            className="btn-delete-user"
                            title="Delete User Account"
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
                  <td colSpan="6" className="users-empty-cell">
                    {isLoading ? (
                      <div className="users-loading-state">
                        <RefreshCw size={24} className="animate-spin" />
                        <span>Loading registered users...</span>
                      </div>
                    ) : (
                      <div className="users-empty-state">
                        <UsersIcon size={40} className="users-empty-icon" />
                        <p className="users-empty-title">
                          {searchTerm || scopeFilter !== 'all' ? 'No users matching your filters' : 'No registered users found'}
                        </p>
                        <p className="users-empty-sub">
                          {searchTerm || scopeFilter !== 'all' ? 'Try adjusting your search term or access scope filter.' : 'Click "Add New User" to register a staff or administrator.'}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredUsers.length > 0 && (
          <div className="users-pagination-bar">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && createPortal(
        <div className="users-modal-overlay">
          <div className="users-modal-card add-user-modal-card">
            <div className="users-modal-header">
              <div className="users-modal-header-info">
                <div className="users-modal-header-icon">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3>Add New Admin / Staff</h3>
                  <p>Create a user account with default system privileges</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddUserModal(false)} 
                className="users-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="add-user-form">
              <div className="form-group-users">
                <label>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-input-users"
                />
              </div>

              <div className="form-group-users">
                <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. admin@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input-users"
                />
              </div>

              <div className="form-group-users">
                <label>Phone Number</label>
                <input 
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  className="form-input-users"
                />
              </div>

              <div className="form-group-users">
                <label>Initial Password</label>
                <input 
                  type="password"
                  placeholder="Default: User@123"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input-users"
                />
              </div>

              <div className="users-modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)} 
                  className="btn-users-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-users-primary"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Manage Permissions Modal */}
      {selectedUser && createPortal(
        <div className="users-modal-overlay">
          <div className="users-modal-card" style={{ maxWidth: 720 }}>
            <div className="users-modal-header">
              <div className="users-modal-header-info">
                <div className="users-modal-header-icon">
                  <Lock size={22} />
                </div>
                <div>
                  <h3>Configure Scope & Permissions</h3>
                  <p>Modifying permissions for <strong>{selectedUser.name || selectedUser.email || 'User'}</strong></p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedUser(null)}
                className="users-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="perms-quick-actions">
              <span>Select Active Modules</span>
              <div className="perms-quick-btn-group">
                <button type="button" onClick={() => handleSelectAllPermissions(true)} className="btn-quick-toggle">
                  Select All
                </button>
                <button type="button" onClick={() => handleSelectAllPermissions(false)} className="btn-quick-toggle">
                  Clear All
                </button>
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="perms-grid">
              {ALL_PERMISSION_MODULES.map(mod => {
                const isEnabled = userPerms[mod.key] || false;
                return (
                  <div 
                    key={mod.key}
                    onClick={() => handleTogglePermission(mod.key)}
                    className={`perm-item-card ${isEnabled ? 'enabled' : ''}`}
                  >
                    <span className="perm-label">{mod.label}</span>
                    <div className="perm-checkbox">
                      {isEnabled && <Check size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="users-modal-footer">
              <button 
                type="button"
                onClick={() => setSelectedUser(null)}
                className="btn-users-secondary"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={savePermissions}
                className="btn-users-primary"
              >
                Save Scope Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Users;

