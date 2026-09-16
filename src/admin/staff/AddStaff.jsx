import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Shield, User, Key, Plus, Trash2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { getStaffById, createStaff, updateStaff } from '../../services/staffApi';
import { Toast } from "../components/Toast";
import { getApiDomain } from '../../utils/apiConfig';
import './AddStaff.css';

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

const DEFAULT_MODULES = [
  "dashboard",
  "catalog",
  "customers",
  "orders",
  "stockupdates",
  "marketing",
  "brands",
  "blogs",
  "settings",
  "suppliers",
  "coins converter",
  "call history",
  "invoices"
];

function AddStaff() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('id');
  const isEditing = Boolean(staffId);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    employeeId: "",
    role: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [dbModules, setDbModules] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [newModuleName, setNewModuleName] = useState("");
  const [existingStaffRecord, setExistingStaffRecord] = useState(null);

  // Load modules from database
  const loadModules = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Module`, { headers: getHeaders() });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const json = await safeParseJson(response);
      let list = unwrapList(json);
      
      if (list.length === 0) {
        await Promise.all(DEFAULT_MODULES.map(async (name, index) => {
          try {
            await fetch(`${BASE_URL}/Module`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ moduleName: name, description: `Core ${name} module`, displayOrder: index })
            });
          } catch (e) {}
        }));
        const response2 = await fetch(`${BASE_URL}/Module`, { headers: getHeaders() });
        const json2 = await safeParseJson(response2);
        list = unwrapList(json2);
      }
      setDbModules(list);
      return list;
    } catch (err) {
      const fallbackList = DEFAULT_MODULES.map((name, index) => ({
        id: index + 1,
        moduleName: name,
        displayOrder: index
      }));
      setDbModules(fallbackList);
      return fallbackList;
    }
  };

  // Initialize modules and permissions
  useEffect(() => {
    const init = async () => {
      const loadedModules = await loadModules();
      const initialPerms = {};
      loadedModules.forEach(mod => {
        const key = mod.moduleName || mod.ModuleName;
        if (key) {
          initialPerms[key] = false;
        }
      });
      setPermissions(initialPerms);

      if (isEditing) {
        try {
          const target = await getStaffById(staffId);
          setExistingStaffRecord(target);

          const fullName = target.name || target.Name || "";
          const parts = fullName.trim().split(" ");
          const fName = parts[0] || "";
          const lName = parts.slice(1).join(" ") || "";

          const actualId = target.id ?? target.Id;
          const empIdVal = target.employeeId || target.EmployeeId || (actualId ? `EMP-${String(actualId).padStart(4, '0')}` : "");

          setFormData({
            firstName: target.firstName || target.FirstName || fName,
            lastName: target.lastName || target.LastName || lName,
            email: target.email || target.Email || "",
            mobile: target.phone || target.Phone || target.mobileNumber || target.MobileNumber || target.mobile || target.Mobile || "",
            employeeId: empIdVal,
            role: (target.role || target.Role || "").toLowerCase(),
            password: "",
            confirmPassword: ""
          });

          // Fetch permissions from backend Permissions API
          const permsResponse = await fetch(`${BASE_URL}/Permission/${staffId}`, { headers: getHeaders() });
          let targetPerms = [];
          if (permsResponse.ok) {
            const permsJson = await safeParseJson(permsResponse);
            targetPerms = unwrapList(permsJson);
          }
          const ROLE_DEFAULTS = {
            advisory: ['dashboard', 'customers', 'call history', 'reports'],
            sales: ['dashboard', 'catalog', 'orders', 'invoices', 'customers', 'marketing'],
            inventory: ['dashboard', 'catalog', 'stockupdates', 'suppliers'],
            admin: ['dashboard', 'catalog', 'customers', 'orders', 'stockupdates', 'marketing', 'brands', 'blogs', 'settings', 'suppliers', 'coins converter', 'call history', 'invoices', 'reports'],
            staff: ['dashboard'],
          };

          const permsState = { ...initialPerms };
          if (targetPerms.length > 0) {
            targetPerms.forEach(p => {
              const name = p.moduleName || p.ModuleName || (p.module && (p.module.moduleName || p.module.ModuleName));
              const isAllowed = p.isAllowed ?? p.IsAllowed ?? false;
              if (name) {
                permsState[name] = isAllowed;
              }
            });
          } else {
            const roleKey = (target.role || target.Role || "staff").toLowerCase();
            const fallbackPerms = ROLE_DEFAULTS[roleKey] || ROLE_DEFAULTS.staff;
            fallbackPerms.forEach(p => {
              if (p in permsState) {
                permsState[p] = true;
              }
            });
          }
          setPermissions(permsState);

        } catch (err) {
          console.warn("Error loading staff from API:", err);
          setToastMessage('Error loading staff details from server.');
          setToastType('error');
        }
      }
    };

    init();
  }, [isEditing, staffId]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "mobile") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    setErrors(prev => ({ ...prev, permissions: "" }));
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    const cleanName = newModuleName.trim().toLowerCase();
    if (!cleanName) return;

    const exists = dbModules.some(m => String(m.moduleName || m.ModuleName || '').toLowerCase() === cleanName);
    if (exists) {
      setToastMessage("Module already exists.");
      setToastType("warning");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/Module`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          moduleName: cleanName,
          description: `Custom ${cleanName} module`,
          displayOrder: dbModules.length
        })
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const response2 = await fetch(`${BASE_URL}/Module`, { headers: getHeaders() });
      const json2 = await safeParseJson(response2);
      const updatedList = unwrapList(json2);
      setDbModules(updatedList);
      setPermissions(prev => ({ ...prev, [cleanName]: true }));
      setNewModuleName("");
      setToastMessage(`Module "${cleanName}" added successfully.`);
      setToastType("success");
    } catch (err) {
      const fallbackList = [...dbModules, { id: Date.now(), moduleName: cleanName }];
      setDbModules(fallbackList);
      setPermissions(prev => ({ ...prev, [cleanName]: true }));
      setNewModuleName("");
      setToastMessage(`Module "${cleanName}" added.`);
      setToastType("success");
    }
  };

  const handleDeleteModule = async (modToDelete) => {
    if (DEFAULT_MODULES.includes(modToDelete)) {
      setToastMessage("Cannot delete default core modules.");
      setToastType("warning");
      return;
    }

    const mod = dbModules.find(m => (m.moduleName || m.ModuleName) === modToDelete);
    try {
      const actualModId = mod?.id ?? mod?.Id;
      if (actualModId) {
        await fetch(`${BASE_URL}/Module/${actualModId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
      }
      const updatedList = dbModules.filter(m => (m.moduleName || m.ModuleName) !== modToDelete);
      setDbModules(updatedList);

      setPermissions(prev => {
        const copy = { ...prev };
        delete copy[modToDelete];
        return copy;
      });
      setToastMessage(`Module "${modToDelete}" removed.`);
      setToastType("info");
    } catch (err) {
      console.error("Failed to delete module:", err);
      setToastMessage("Failed to delete module.");
      setToastType("error");
    }
  };

  const validateForm = () => {
    let newErrors = {};

    const requiredKeys = ["firstName", "lastName", "email", "mobile", "employeeId", "role"];
    requiredKeys.forEach((key) => {
      if (!formData[key] || formData[key].toString().trim() === "") {
        newErrors[key] = "Required field";
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.mobile) {
      const cleanMobile = formData.mobile.replace(/\D/g, "");
      if (cleanMobile.length !== 10) {
        newErrors.mobile = "Mobile number must be exactly 10 digits";
      } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        newErrors.mobile = "Must start with 6, 7, 8, or 9 (e.g. 9876543210)";
      } else if (/^(\d)\1{9}$/.test(cleanMobile)) {
        newErrors.mobile = "Mobile number cannot be repetitive digits";
      }
    }

    const passwordRequired = !isEditing || formData.password !== "" || formData.confirmPassword !== "";
    if (passwordRequired) {
      if (!formData.password) {
        newErrors.password = "Required field";
      } else {
        const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;
        if (!passRegex.test(formData.password)) {
          newErrors.password = "Min 7 chars, 1 uppercase, 1 digit, 1 symbol";
        }
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    const hasPermission = Object.values(permissions).some((p) => p === true);
    if (!hasPermission) {
      newErrors.permissions = "Please enable at least one permission module";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setToastMessage('Please fix the validation errors.');
      setToastType('warning');
      return;
    }

    setIsSaving(true);
    setToastMessage('');

    const enabledPermissions = Object.keys(permissions).filter(k => permissions[k]);

    const apiStaffPayload = {
      employeeId: formData.employeeId.trim().toUpperCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim().toLowerCase(),
      mobileNumber: formData.mobile.trim(),
      phone: formData.mobile.trim(),
      role: formData.role,
      password: formData.password || "StaffPass@2026!",
      isActive: true
    };

    try {
      let targetId = staffId;

      if (isEditing) {
        const activeStatus = existingStaffRecord?.isActive ?? existingStaffRecord?.IsActive ?? true;
        await updateStaff(staffId, {
          ...apiStaffPayload,
          staffId: parseInt(staffId, 10),
          password: formData.password || existingStaffRecord?.password || existingStaffRecord?.Password || "StaffPass@2026!",
          isActive: activeStatus
        });
        targetId = staffId;
      } else {
        const newStaff = await createStaff(apiStaffPayload);
        targetId = newStaff?.id ?? newStaff?.Id ?? newStaff?.staffId ?? newStaff?.StaffId;
      }

      // Sync Permissions to backend
      if (targetId && dbModules.length > 0) {
        const permissionDtoList = dbModules.map(mod => {
          const modName = mod.moduleName || mod.ModuleName;
          const isAllowed = permissions[modName] || false;
          return {
            moduleId: mod.id ?? mod.Id,
            canView: isAllowed,
            canAdd: isAllowed,
            canEdit: isAllowed,
            canDelete: isAllowed,
            isAllowed: isAllowed
          };
        });
        await fetch(`${BASE_URL}/Permission`, {
          method: isEditing ? 'PUT' : 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            staffId: parseInt(targetId, 10) || targetId,
            staffPermissions: permissionDtoList
          })
        }).catch(pErr => console.warn('Permissions sync warning:', pErr));
      }

      setToastMessage(`Staff member ${isEditing ? 'updated' : 'created'} successfully.`);
      setToastType('success');
      
      setTimeout(() => {
        navigate('/admin/staff/list');
      }, 1200);

    } catch (err) {
      console.error('API Error saving staff:', err);
      setToastMessage(err?.message || `Failed to ${isEditing ? 'update' : 'create'} staff member. Server or API error.`);
      setToastType('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-staff-screen">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Card */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/admin/staff/list"
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              background: '#ffffff',
              transition: 'all 0.15s ease',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 700, letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
              STAFF DIRECTORY
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {isEditing ? 'Edit Staff Profile' : 'Add Staff Member'}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <Link
            to="/admin/staff/list"
            style={{
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              height: '38px',
              padding: '0 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              height: '38px',
              padding: '0 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              opacity: isSaving ? 0.7 : 1,
              transition: 'background 0.15s ease'
            }}
          >
            <Save size={15} />
            <span>{isSaving ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Profile' : 'Save Profile')}</span>
          </button>
        </div>
      </section>

      {/* Form Fields Card Layout */}
      <div className="staff-content-grid">
        {/* Left Card: Basic Info & Access Password */}
        <div className="staff-form-card">
          {/* Basic Credentials Section */}
          <h3 className="card-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
            <User size={18} style={{ color: '#064e3b' }} /> BASIC CREDENTIALS
          </h3>
          
          <div className="fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: '28px' }}>
            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>FIRST NAME</label>
              <input
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
              {errors.firstName && <span className="field-error-msg">{errors.firstName}</span>}
            </div>

            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>LAST NAME</label>
              <input
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
              {errors.lastName && <span className="field-error-msg">{errors.lastName}</span>}
            </div>

            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@gmail.com"
                value={formData.email}
                onChange={handleChange}
                style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
              {errors.email && <span className="field-error-msg">{errors.email}</span>}
            </div>

            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>MOBILE NUMBER</label>
              <div className="phone-input-container" style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                <span className="phone-prefix" style={{ backgroundColor: '#f8fafc', padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: '#334155', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>+91</span>
                <input
                  name="mobile"
                  value={formData.mobile}
                  placeholder="10 digit number"
                  onChange={handleChange}
                  style={{ border: 'none', padding: '10px 14px', fontSize: '13px', width: '100%', outline: 'none' }}
                />
              </div>
              {errors.mobile && <span className="field-error-msg">{errors.mobile}</span>}
            </div>

            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>EMPLOYEE ID</label>
              <input
                name="employeeId"
                placeholder="staff@honeywell.local"
                value={formData.employeeId}
                onChange={handleChange}
                style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #dbeafe', outline: 'none', backgroundColor: '#eff6ff', color: '#1e293b', fontWeight: 500 }}
              />
              {errors.employeeId && <span className="field-error-msg">{errors.employeeId}</span>}
            </div>

            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>ROLE</label>
              <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#ffffff' }}>
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="advisory">Advisory</option>
                <option value="inventory">Inventory</option>
                <option value="manager">Manager</option>
                <option value="sales">Sales</option>
                <option value="staff">Staff</option>
              </select>
              {errors.role && <span className="field-error-msg">{errors.role}</span>}
            </div>
          </div>

          {/* Access Password Section */}
          <h3 className="card-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
            <Key size={18} style={{ color: '#064e3b' }} /> ACCESS PASSWORD
          </h3>
          
          <div className="fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            {/* Password Field */}
            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>PASSWORD</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid #dbeafe',
                    backgroundColor: formData.password ? '#eff6ff' : '#ffffff',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="field-error-msg">{errors.password}</span>}
            </div>

            {/* Confirm Password Field */}
            <div className="staff-field">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="field-error-msg">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        {/* Right Card: Permissions Checklist */}
        <div className="staff-form-card">
          <h3 className="card-section-title">
            <Shield size={16} /> System Permissions &amp; Modules
          </h3>
          <p className="permission-intro">
            Check the administrative console modules this staff member is authorized to access:
          </p>

          <div className="permissions-grid-wrap">
            {dbModules.map((mod) => {
              const key = mod.moduleName || mod.ModuleName;
              const isDefault = DEFAULT_MODULES.includes(key);
              return (
                <div
                  className="permission-switch-item"
                  key={key}
                >
                  <div className="switch-info">
                    <span className="switch-title">{key}</span>
                    {!isDefault && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteModule(key)} 
                        className="delete-custom-mod-btn"
                        title="Delete module"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePermission(key)}
                    className={`switch-bg ${permissions[key] ? 'active' : ''}`}
                  >
                    <span className={`switch-toggle-knob ${permissions[key] ? 'active' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
          {errors.permissions && <span className="field-error-msg block mt-2">{errors.permissions}</span>}

          {/* Dynamic Module Input */}
          <div className="add-custom-module-box">
            <h4>Add Future Module / Screen</h4>
            <div className="inline-add-form">
              <input
                type="text"
                placeholder="Enter module name (e.g. invoices)"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
              />
              <button type="button" onClick={handleAddModule}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddStaff;
