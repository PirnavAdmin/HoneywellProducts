import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';
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
          name: u.name || u.Name || 'N/A',
          phoneNumber: u.phoneNumber || u.Phone || u.mobile || 'N/A',
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
    if (!window.confirm(`Are you sure you want to delete user ${user.name || identifier}?`)) return;
    
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
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        password: newUser.password || 'User@123',
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

  const filteredUsers = users.filter(user => {
    const query = searchTerm.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phoneNumber || '').toLowerCase();
    const id = String(user.id || '').toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query) || id.includes(query);
  });

  const fullAccessCount = users.filter(u => u.permissions && u.permissions.length === ALL_PERMISSION_MODULES.length).length;

  return (
    <div className="users-container">
      {/* Page Header */}
      <div className="users-header">
        <div className="users-title">
          <h1>User Management</h1>
          <p>View registered system users, register staff, and manage granular module access control.</p>
        </div>
        <div className="users-header-actions">
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="btn-users-primary"
          >
            <UserPlus size={18} />
            Add New User
          </button>
          <button 
            onClick={fetchUsers} 
            className="btn-users-secondary"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', marginBottom: '24px', border: '1px solid #fee2e2', fontWeight: 600, fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Analytics Stat Cards */}
      <div className="users-stats-grid">
        <div className="users-stat-card">
          <div className="users-stat-info">
            <label>Total Registered Users</label>
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
            <label>Custom Module Scopes</label>
            <span>{users.length - fullAccessCount}</span>
          </div>
          <div className="users-stat-icon amber">
            <Shield size={22} />
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-info">
            <label>Total Modules Scope</label>
            <span>{ALL_PERMISSION_MODULES.length}</span>
          </div>
          <div className="users-stat-icon purple">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="users-controls">
        <div className="users-search-wrap">
          <Search size={18} className="users-search-icon" />
          <input 
            type="text"
            placeholder="Search users by name, email, phone or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="users-search-input"
          />
        </div>
        <div className="users-filter-count">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table Card */}
      <div className="users-table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>User Details</th>
              <th>Contact Info</th>
              <th>Active Scope</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const initial = (user.name && user.name !== 'N/A') ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
                const permCount = user.permissions ? user.permissions.length : ALL_PERMISSION_MODULES.length;
                return (
                  <tr key={user.id}>
                    <td>
                      <span className="user-id-badge">#{String(user.id).slice(0, 14)}</span>
                    </td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-circle">
                          {initial}
                        </div>
                        <div>
                          <span className="user-name-text">{user.name || 'User'}</span>
                          <span className="user-contact-email">{user.email || 'No email attached'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="user-contact-phone">{user.phoneNumber || 'N/A'}</div>
                    </td>
                    <td>
                      <span className="user-scope-badge">
                        <Shield size={12} />
                        {permCount} / {ALL_PERMISSION_MODULES.length} Granted
                      </span>
                    </td>
                    <td>
                      <span className="user-status-active">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                        Active
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button 
                          onClick={() => openPermissionModal(user)}
                          className="btn-manage-perms"
                          title="Configure Module Access Permissions"
                        >
                          <Shield size={14} />
                          Manage Scope
                        </button>
                        <button 
                          onClick={() => deleteUser(user)}
                          className="btn-delete-user"
                          title="Delete User Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                  {isLoading ? 'Loading registered users...' : (searchTerm ? 'No users matching search query.' : 'No registered users found.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

