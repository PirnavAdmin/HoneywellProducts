import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Shield, User, Key, Eye, EyeOff } from "lucide-react";
import { 
  getStaffById, 
  createStaff, 
  updateStaff, 
  getStaffRoles, 
  getStaffDepartments, 
  getPermissionsModules, 
  getStaffPermissions,
  updateStaffPermissions,
  assignStaffPermissions
} from '../../services/staffApi';
import { Toast } from "../components/Toast";
import './AddStaff.css';

function AddStaff() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('id');
  const isEditing = Boolean(staffId);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Dynamic Metadata from Backend
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [dbModules, setDbModules] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    employeeId: "",
    role: "",
    department: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [permissions, setPermissions] = useState({});
  const [existingStaffRecord, setExistingStaffRecord] = useState(null);

  // Load modules dynamically from backend (GET /api/Permissions/modules)
  const loadModules = useCallback(async () => {
    try {
      const list = await getPermissionsModules();
      if (Array.isArray(list) && list.length > 0) {
        setDbModules(list);
        return list;
      }
      return [];
    } catch (err) {
      console.warn("Failed to load permission modules from backend:", err.message);
      return [];
    }
  }, []);

  // Load roles dynamically from backend (GET /api/Staff/roles)
  const loadRoles = useCallback(async () => {
    try {
      const roles = await getStaffRoles();
      if (Array.isArray(roles) && roles.length > 0) {
        setAvailableRoles(roles);
      }
    } catch (err) {
      console.warn("Failed to load roles from backend:", err.message);
    }
  }, []);

  // Load departments dynamically from backend (GET /api/Staff/departments)
  const loadDepartments = useCallback(async () => {
    try {
      const depts = await getStaffDepartments();
      if (Array.isArray(depts) && depts.length > 0) {
        setAvailableDepartments(depts);
      }
    } catch (err) {
      console.warn("Failed to load departments from backend:", err.message);
    }
  }, []);

  // Initialize modules, roles, departments, and load staff details if editing
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsLoadingDetails(true);
      await Promise.all([loadRoles(), loadDepartments()]);
      const loadedModules = await loadModules();

      // Setup initial permissions state based on dynamic modules
      const initialPerms = {};
      loadedModules.forEach(mod => {
        const key = mod.moduleName || mod.ModuleName;
        if (key) {
          initialPerms[key] = false;
        }
      });

      if (!isMounted) return;
      setPermissions(initialPerms);

      // If in editing mode, fetch staff details from GET /api/Staff/{id}
      if (isEditing) {
        try {
          const target = await getStaffById(staffId);
          if (!isMounted) return;
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
            mobile: target.phone || target.Phone || target.mobileNumber || target.MobileNumber || target.mobile || "",
            employeeId: empIdVal,
            role: (target.role || target.Role || "").toLowerCase(),
            department: target.department || target.Department || "",
            password: "",
            confirmPassword: ""
          });

          // Fetch real staff permissions from GET /api/Staff/{id}/permissions
          try {
            const staffPerms = await getStaffPermissions(staffId);
            const permsState = { ...initialPerms };

            if (Array.isArray(staffPerms) && staffPerms.length > 0) {
              staffPerms.forEach(p => {
                const name = typeof p === 'string' ? p : (p.moduleName || p.ModuleName || (p.module && (p.module.moduleName || p.module.ModuleName)));
                const isAllowed = typeof p === 'string' ? true : (p.isAllowed ?? p.IsAllowed ?? p.canView ?? true);
                if (name) {
                  const normName = name.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ').trim();
                  const match = Object.keys(permsState).find(k => {
                    const normK = k.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ').trim();
                    return normK === normName;
                  });
                  if (match) {
                    permsState[match] = isAllowed;
                  } else {
                    permsState[name] = isAllowed;
                  }
                }
              });
            } else if (Array.isArray(target.permissions) && target.permissions.length > 0) {
              target.permissions.forEach(pName => {
                if (pName && typeof pName === 'string') {
                  const normP = pName.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ').trim();
                  const match = Object.keys(permsState).find(k => {
                    const normK = k.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ').trim();
                    return normK === normP;
                  });
                  if (match) permsState[match] = true;
                }
              });
            }

            if (isMounted) setPermissions(permsState);
          } catch (pErr) {
            console.warn("Could not fetch permissions for staff member:", pErr.message);
          }

        } catch (err) {
          if (!isMounted) return;
          console.error("Error loading staff from API:", err);
          setToastMessage(`Error loading staff details: ${err.message}`);
          setToastType('error');
        }
      }

      if (isMounted) setIsLoadingDetails(false);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [isEditing, staffId, loadRoles, loadDepartments, loadModules]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "mobile") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));

    // When role changes on create form, auto-apply that role's real backend default permissions
    if (name === "role" && !isEditing) {
      const selectedRoleObj = availableRoles.find(r => 
        (r.code || r.id || r.name || '').toLowerCase() === (value || '').toLowerCase()
      );

      const defaultRolePerms = selectedRoleObj?.defaultPermissions || selectedRoleObj?.permissions || [];
      if (Array.isArray(defaultRolePerms) && defaultRolePerms.length > 0) {
        setPermissions(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(k => {
            const normK = k.toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ').trim();
            next[k] = defaultRolePerms.some(p => {
              const normP = (typeof p === 'string' ? p : p.moduleName || '').toLowerCase().replace(/[-_&]/g, ' ').replace(/\s+/g, ' ').trim();
              return normP === normK;
            });
          });
          return next;
        });
      }
    }
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    setErrors(prev => ({ ...prev, permissions: "" }));
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
    if (isSaving) return; // Prevent duplicate form submission

    if (!validateForm()) {
      setToastMessage('Please fix the validation errors.');
      setToastType('warning');
      return;
    }

    setIsSaving(true);
    setToastMessage('');

    const enabledPermissions = Object.keys(permissions).filter(k => permissions[k]);

    const activeStatus = isEditing 
      ? (existingStaffRecord?.isActive ?? existingStaffRecord?.IsActive ?? (existingStaffRecord?.status ? existingStaffRecord.status.toLowerCase() === 'active' : true))
      : true;

    // Strict payload adhering to Honeywell.Models.Staff schema
    const apiStaffPayload = {
      employeeId: formData.employeeId.trim().toUpperCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
      email: formData.email.trim().toLowerCase(),
      mobileNumber: formData.mobile.trim(),
      phone: formData.mobile.trim(),
      role: formData.role,
      department: formData.department || null,
      password: formData.password || existingStaffRecord?.password || "StaffPass@2026!",
      status: activeStatus ? "Active" : "Inactive",
      isActive: activeStatus,
      permissions: enabledPermissions
    };

    try {
      let targetId = staffId;

      if (isEditing) {
        await updateStaff(staffId, {
          ...apiStaffPayload,
          id: parseInt(staffId, 10),
        });
        targetId = staffId;
      } else {
        const newStaff = await createStaff(apiStaffPayload);
        targetId = newStaff?.id ?? newStaff?.Id ?? newStaff?.staffId;
      }

      // Sync Permissions using Honeywell.Models.StaffPermissionsUpdateDto
      if (targetId && dbModules.length > 0) {
        const staffPermissionEntries = dbModules.map(mod => {
          const modName = mod.moduleName || mod.ModuleName;
          const isAllowed = permissions[modName] || false;
          return {
            moduleId: mod.id ?? mod.Id,
            moduleName: modName,
            canView: isAllowed,
            canAdd: isAllowed,
            canEdit: isAllowed,
            canDelete: isAllowed,
            isAllowed: isAllowed
          };
        });

        const permissionsDto = {
          permissions: enabledPermissions,
          modules: enabledPermissions,
          modulePermissions: permissions,
          staffPermissions: staffPermissionEntries
        };

        try {
          // Attempt assign/update permissions
          if (isEditing) {
            await updateStaffPermissions(targetId, permissionsDto);
          } else {
            await assignStaffPermissions(targetId, permissionsDto);
          }
        } catch (permErr) {
          console.warn('Permissions sync error:', permErr.message);
        }
      }

      setToastMessage(`Staff member ${isEditing ? 'updated' : 'created'} successfully.`);
      setToastType('success');
      
      setTimeout(() => {
        navigate('/admin/staff/list');
      }, 1000);

    } catch (err) {
      console.error('API Error saving staff:', err);
      setToastMessage(err?.message || `Failed to ${isEditing ? 'update' : 'create'} staff member.`);
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
            disabled={isSaving || isLoadingDetails}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              height: '38px',
              padding: '0 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: (isSaving || isLoadingDetails) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              opacity: (isSaving || isLoadingDetails) ? 0.7 : 1,
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
                {availableRoles.length > 0 ? (
                  availableRoles.map(r => {
                    const code = (r.code || r.id || r.name || '').toLowerCase();
                    const label = r.label || r.name || code;
                    return (
                      <option key={code} value={code}>
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
                    <option value="staff">Staff</option>
                  </>
                )}
              </select>
              {errors.role && <span className="field-error-msg">{errors.role}</span>}
            </div>

            <div className="staff-field" style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>DEPARTMENT</label>
              <select name="department" value={formData.department} onChange={handleChange} style={{ padding: '10px 14px', fontSize: '13px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#ffffff' }}>
                <option value="">Select Department (Optional)</option>
                {availableDepartments.map(d => {
                  const name = d.name || d.id || '';
                  return (
                    <option key={d.id || name} value={name}>
                      {name} {d.code ? `(${d.code})` : ''}
                    </option>
                  );
                })}
              </select>
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
            Authorize administrative console modules for this staff member based on their operational duties:
          </p>

          <div className="permissions-grid-wrap">
            {dbModules.map((mod) => {
              const key = mod.moduleName || mod.ModuleName;
              return (
                <div
                  className="permission-switch-item"
                  key={key}
                >
                  <div className="switch-info">
                    <span className="switch-title">{key}</span>
                    {mod.description && (
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>
                        {mod.description}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePermission(key)}
                    className={`switch-bg ${permissions[key] ? 'active' : ''}`}
                    aria-label={`Toggle ${key} access`}
                  >
                    <span className={`switch-toggle-knob ${permissions[key] ? 'active' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
          {errors.permissions && <span className="field-error-msg block mt-2">{errors.permissions}</span>}
        </div>
      </div>
    </div>
  );
}

export default AddStaff;
