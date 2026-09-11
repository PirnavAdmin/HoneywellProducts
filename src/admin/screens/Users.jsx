import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Trash2, RefreshCw, Shield, Check, X, Lock } from 'lucide-react';
import { getApiDomain } from '../../utils/apiConfig';

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

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  return (
    <div className="admin-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">User Management</h1>
          <p className="text-gray-500">View registered users and assign module permissions.</p>
        </div>
        <button 
          onClick={fetchUsers} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-[#5eaa28] transition-colors"
          disabled={isLoading}
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

      <div className="bg-white border border-border shadow-sm overflow-hidden rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-light border-b border-border text-xs font-bold uppercase tracking-wider text-slate-600">
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Phone / Email</th>
              <th className="px-6 py-4">Active Scope</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-gray-50 transition-colors text-sm">
                <td className="px-6 py-4 font-medium text-slate-800">#{user.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User size={16} />
                    </div>
                    <span className="font-bold text-dark">{user.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-dark">{user.phoneNumber}</div>
                  <div className="text-xs text-gray-400">{user.email || 'No Email'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-[#1268a5]">
                    {user.permissions ? `${user.permissions.length} modules granted` : 'Default Scope'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Active</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => openPermissionModal(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1268a5] text-white rounded text-xs font-semibold hover:bg-[#0e5486] transition-colors"
                      title="Manage User Module Permissions"
                    >
                      <Shield size={14} /> Manage Permissions
                    </button>
                    <button 
                      onClick={() => deleteUser(user.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1.5"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                  {isLoading ? 'Loading users...' : 'No users found in the system.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manage Permissions Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1268a5]/10 text-[#1268a5] flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Manage Module Permissions</h3>
                  <p className="text-xs text-slate-500">Configure feature access for <strong>{selectedUser.name || 'User'}</strong> (#{selectedUser.id})</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {ALL_PERMISSION_MODULES.map(mod => {
                const isEnabled = userPerms[mod.key] || false;
                return (
                  <div 
                    key={mod.key}
                    onClick={() => handleTogglePermission(mod.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isEnabled 
                        ? 'bg-blue-50/60 border-[#1268a5] text-[#1268a5]' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold capitalize">{mod.label}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isEnabled ? 'bg-[#1268a5] text-white' : 'bg-slate-200 text-transparent'
                    }`}>
                      <Check size={14} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={savePermissions}
                className="px-5 py-2 bg-[#1268a5] text-white rounded-lg text-xs font-bold hover:bg-[#0e5486] transition-colors"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
