import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Shield, 
  User, 
  Key, 
  Eye, 
  EyeOff,
  Home,
  Box,
  Users,
  BarChart2,
  TrendingUp,
  Ticket,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  Building2,
  ShoppingCart,
  Boxes,
  Target,
  FolderOpen,
  CreditCard,
  Settings,
  FileText,
  PhoneCall,
  Search,
  Check,
  RotateCcw,
  RefreshCw
} from "lucide-react";
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

// Excluded modules that do not exist in the active admin console sidebar
const EXCLUDED_MODULE_NAMES = ['coins converter', 'coin converter', 'coins'];

// Dynamic Fallback in case backend API is temporarily offline
const FALLBACK_MODULES = [
  { id: 1, moduleName: "dashboard", description: "Analytics overview, metrics & live sales summaries" },
  { id: 2, moduleName: "catalog", description: "Categories, subcategories, products & inventory items" },
  { id: 3, moduleName: "customers", description: "Customer accounts, profiles, addresses & CRM logs" },
  { id: 4, moduleName: "staff", description: "Staff accounts, role assignments & system access" },
  { id: 5, moduleName: "reports", description: "Business performance, sales reports & data exports" },
  { id: 6, moduleName: "growth journey", description: "Milestones, progress tracking & performance metrics" },
  { id: 7, moduleName: "tickets", description: "Customer support tickets & customer dispute queue" },
  { id: 8, moduleName: "enquiries", description: "Inbound product enquiries & commercial leads" },
  { id: 9, moduleName: "contact form", description: "Submissions from the public contact us page" },
  { id: 10, moduleName: "bulk quotes", description: "Commercial bulk purchase quote inquiries & pricing" },
  { id: 11, moduleName: "partner applications", description: "Channel partner & distributor application reviews" },
  { id: 12, moduleName: "dealers & distributors", description: "Dealer network, branches & distribution partners" },
  { id: 14, moduleName: "orders & sales", description: "Customer orders, tracking, fulfillment & returns" },
  { id: 15, moduleName: "invoices", description: "Tax invoices, billing documents & payment receipts" },
  { id: 16, moduleName: "stockupdates", description: "Inventory levels, stock adjustments & ledger logs" },
  { id: 17, moduleName: "marketing", description: "Hero banners, promotional offers, deals & coupons" },
  { id: 18, moduleName: "brands", description: "Authorized brands, logos & manufacturer profiles" },
  { id: 19, moduleName: "blogs", description: "Industry articles, company news & blog publications" },
  { id: 20, moduleName: "testimonials", description: "Customer feedback, reviews & social ratings" },
  { id: 21, moduleName: "settings", description: "Site configuration, footer, about us & policy pages" },
  { id: 22, moduleName: "suppliers", description: "Vendor profiles, sourcing & supplier directory" },
  { id: 23, moduleName: "payment settings", description: "Gateways, payment accounts & banking configurations" },
  { id: 25, moduleName: "call history", description: "CRM telephone interactions, call logs & transcripts" }
];

// Map module names to relevant Lucide icons
const getModuleIcon = (key) => {
  const norm = (key || '').toLowerCase().trim();
  switch (norm) {
    case 'dashboard':
      return <Home size={17} />;
    case 'catalog':
      return <Box size={17} />;
    case 'customers':
      return <Users size={17} />;
    case 'staff':
      return <Shield size={17} />;
    case 'reports':
      return <BarChart2 size={17} />;
    case 'growth journey':
      return <TrendingUp size={17} />;
    case 'tickets':
      return <Ticket size={17} />;
    case 'enquiries':
      return <MessageSquare size={17} />;
    case 'contact form':
      return <Mail size={17} />;
    case 'bulk quotes':
      return <FileSpreadsheet size={17} />;
    case 'partner applications':
      return <Shield size={17} />;
    case 'dealers & distributors':
      return <Building2 size={17} />;
    case 'orders':
    case 'orders & sales':
      return <ShoppingCart size={17} />;
    case 'invoices':
      return <FileSpreadsheet size={17} />;
    case 'stockupdates':
    case 'stock updates':
      return <Boxes size={17} />;
    case 'marketing':
      return <Target size={17} />;
    case 'brands':
      return <Box size={17} />;
    case 'blogs':
      return <FileText size={17} />;
    case 'testimonials':
      return <MessageSquare size={17} />;
    case 'settings':
      return <Settings size={17} />;
    case 'suppliers':
      return <FolderOpen size={17} />;
    case 'payment settings':
      return <CreditCard size={17} />;
    case 'call history':
      return <PhoneCall size={17} />;
    default:
      return <Shield size={17} />;
  }
};

// Clean formatted module title
const formatModuleTitle = (key) => {
  if (!key) return '';
  const norm = key.toLowerCase().trim();
  const titleMap = {
    'dashboard': 'Dashboard',
    'catalog': 'Catalog',
    'customers': 'Customers',
    'staff': 'Staff Directory',
    'reports': 'Reports & Analytics',
    'growth journey': 'Growth Journey',
    'tickets': 'Tickets',
    'enquiries': 'Enquiries',
    'contact form': 'Contact Form',
    'bulk quotes': 'Bulk Quotes',
    'partner applications': 'Partner Applications',
    'dealers & distributors': 'Dealers & Distributors',
    'orders': 'Orders & Sales',
    'orders & sales': 'Orders & Sales',
    'invoices': 'Invoices',
    'stockupdates': 'Stock Updates',
    'stock updates': 'Stock Updates',
    'marketing': 'Marketing',
    'brands': 'Brands',
    'blogs': 'Blogs',
    'testimonials': 'Testimonials',
    'settings': 'Settings',
    'suppliers': 'Suppliers',
    'payment settings': 'Payment Settings',
    'call history': 'CRM & Call History'
  };

  if (titleMap[norm]) return titleMap[norm];

  return key
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helpful descriptions explaining console module operations
const formatModuleDescription = (key, customDesc) => {
  if (customDesc && !customDesc.startsWith('Core ') && customDesc.length > 10) {
    return customDesc;
  }
  const norm = (key || '').toLowerCase().trim();
  const descMap = {
    'dashboard': 'Analytics overview, metrics & live sales summaries',
    'catalog': 'Categories, subcategories, products & inventory items',
    'customers': 'Customer accounts, profiles, addresses & CRM logs',
    'staff': 'Staff accounts, role assignments & system access',
    'reports': 'Business performance, sales reports & data exports',
    'growth journey': 'Milestones, progress tracking & performance metrics',
    'tickets': 'Customer support tickets & customer dispute queue',
    'enquiries': 'Inbound product enquiries & commercial leads',
    'contact form': 'Submissions from the public contact us page',
    'bulk quotes': 'Commercial bulk purchase quote inquiries & pricing',
    'partner applications': 'Channel partner & distributor application reviews',
    'dealers & distributors': 'Dealer network, branches & distribution partners',
    'orders': 'Customer orders, tracking, fulfillment & returns',
    'orders & sales': 'Customer orders, tracking, fulfillment & returns',
    'invoices': 'Tax invoices, billing documents & payment receipts',
    'stockupdates': 'Inventory levels, stock adjustments & ledger logs',
    'marketing': 'Hero banners, promotional offers, deals & coupons',
    'brands': 'Authorized brands, logos & manufacturer profiles',
    'blogs': 'Industry articles, company news & blog publications',
    'testimonials': 'Customer feedback, reviews & social ratings',
    'settings': 'Site configuration, footer, about us & policy pages',
    'suppliers': 'Vendor profiles, sourcing & supplier directory',
    'payment settings': 'Gateways, payment accounts & banking configurations',
    'call history': 'CRM telephone interactions, call logs & transcripts'
  };

  return descMap[norm] || customDesc || 'Access to this console module';
};

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
  const [permissionSearch, setPermissionSearch] = useState('');

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
      const rawList = Array.isArray(list) && list.length > 0 ? list : FALLBACK_MODULES;

      // Filter out modules that are not in the active admin console sidebar (specifically coins converter)
      const validModules = rawList.filter(mod => {
        const name = (mod.moduleName || mod.ModuleName || '').toLowerCase().trim();
        return name && !EXCLUDED_MODULE_NAMES.includes(name);
      });

      // Deduplicate 'orders' vs 'orders & sales' to display a single unified module matching sidebar
      const hasOrdersAndSales = validModules.some(m => (m.moduleName || m.ModuleName || '').toLowerCase().trim() === 'orders & sales');
      const rectifiedModules = validModules.filter(m => {
        const name = (m.moduleName || m.ModuleName || '').toLowerCase().trim();
        if (hasOrdersAndSales && name === 'orders') {
          return false;
        }
        return true;
      });

      setDbModules(rectifiedModules);
      return rectifiedModules;
    } catch (err) {
      console.warn("Failed to load permission modules from backend, using dynamic fallback:", err.message);
      setDbModules(FALLBACK_MODULES);
      return FALLBACK_MODULES;
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
      // Ensure 'orders' key is tracked alongside 'orders & sales'
      initialPerms['orders'] = false;

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

            // Sync 'orders' and 'orders & sales'
            if (permsState['orders'] || permsState['orders & sales']) {
              permsState['orders'] = true;
              permsState['orders & sales'] = true;
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
          if (next['orders & sales'] || next['orders']) {
            next['orders & sales'] = true;
            next['orders'] = true;
          }
          return next;
        });
      }
    }
  };

  const togglePermission = (key) => {
    setPermissions(prev => {
      const nextVal = !prev[key];
      const next = { ...prev, [key]: nextVal };
      // Keep 'orders' and 'orders & sales' aliases in sync
      if (key === 'orders & sales' || key === 'orders') {
        next['orders & sales'] = nextVal;
        next['orders'] = nextVal;
      }
      return next;
    });
    setErrors(prev => ({ ...prev, permissions: "" }));
  };

  const handleSelectAllPermissions = () => {
    setPermissions(prev => {
      const next = { ...prev };
      dbModules.forEach(mod => {
        const key = mod.moduleName || mod.ModuleName;
        if (key) next[key] = true;
      });
      next['orders'] = true;
      next['orders & sales'] = true;
      return next;
    });
    setErrors(prev => ({ ...prev, permissions: "" }));
  };

  const handleClearAllPermissions = () => {
    setPermissions(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = false;
      });
      return next;
    });
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
    if (permissions['orders & sales'] && !enabledPermissions.includes('orders')) {
      enabledPermissions.push('orders');
    }

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
          const isAllowed = Boolean(permissions[modName]);
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

  // Filter modules based on quick search
  const filteredDbModules = useMemo(() => {
    if (!permissionSearch.trim()) return dbModules;
    const q = permissionSearch.toLowerCase().trim();
    return dbModules.filter(mod => {
      const key = (mod.moduleName || mod.ModuleName || '').toLowerCase();
      const title = formatModuleTitle(key).toLowerCase();
      const desc = formatModuleDescription(key, mod.description).toLowerCase();
      return key.includes(q) || title.includes(q) || desc.includes(q);
    });
  }, [dbModules, permissionSearch]);

  // Count active permissions
  const activeCount = useMemo(() => {
    return dbModules.filter(mod => {
      const key = mod.moduleName || mod.ModuleName;
      return Boolean(permissions[key]);
    }).length;
  }, [dbModules, permissions]);

  return (
    <div className="add-staff-screen">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Top Header Card */}
      <header className="add-staff-header">
        <div className="staff-header-left">
          <Link
            to="/admin/staff/list"
            className="staff-back-btn"
            title="Return to Staff Directory"
            aria-label="Back to Staff Directory"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className="staff-kicker">STAFF DIRECTORY</span>
            <h1 className="header-title">
              {isEditing ? 'Edit Staff Profile' : 'Add Staff Member'}
            </h1>
          </div>
        </div>

        <div className="staff-header-actions">
          <Link
            to="/admin/staff/list"
            className="staff-cancel-btn"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || isLoadingDetails}
            className="staff-save-btn"
          >
            {isSaving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
            <span>
              {isSaving 
                ? (isEditing ? 'Updating...' : 'Saving...') 
                : (isEditing ? 'Update Profile' : 'Save Profile')}
            </span>
          </button>
        </div>
      </header>

      {/* Two-Column Content Grid */}
      <div className="staff-content-grid">
        {/* Left Card: Basic Credentials & Access Password */}
        <div className="staff-form-card">
          {/* Basic Credentials Section */}
          <h3 className="card-section-title">
            <User size={17} className="section-title-icon" />
            <span>Basic Credentials</span>
          </h3>
          
          <div className="fields-grid">
            <div className="staff-field">
              <label>
                First Name <span className="required-star">*</span>
              </label>
              <input
                name="firstName"
                placeholder="e.g. John"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? 'input-error' : ''}
              />
              {errors.firstName && <span className="field-error-msg">{errors.firstName}</span>}
            </div>

            <div className="staff-field">
              <label>
                Last Name <span className="required-star">*</span>
              </label>
              <input
                name="lastName"
                placeholder="e.g. Doe"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? 'input-error' : ''}
              />
              {errors.lastName && <span className="field-error-msg">{errors.lastName}</span>}
            </div>

            <div className="staff-field">
              <label>
                Email Address <span className="required-star">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="field-error-msg">{errors.email}</span>}
            </div>

            <div className="staff-field">
              <label>
                Mobile Number <span className="required-star">*</span>
              </label>
              <div className={`phone-input-container ${errors.mobile ? 'input-error' : ''}`}>
                <span className="phone-prefix">+91</span>
                <input
                  name="mobile"
                  value={formData.mobile}
                  placeholder="10 digit number"
                  onChange={handleChange}
                />
              </div>
              {errors.mobile && <span className="field-error-msg">{errors.mobile}</span>}
            </div>

            <div className="staff-field">
              <label>
                Employee ID <span className="required-star">*</span>
              </label>
              <input
                name="employeeId"
                placeholder="e.g. EMP-0042"
                value={formData.employeeId}
                onChange={handleChange}
                className={errors.employeeId ? 'input-error' : ''}
              />
              {errors.employeeId && <span className="field-error-msg">{errors.employeeId}</span>}
            </div>

            <div className="staff-field">
              <label>
                Assigned Role <span className="required-star">*</span>
              </label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className={errors.role ? 'input-error' : ''}
              >
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
                    <option value="manager">Manager</option>
                    <option value="advisory">Advisory</option>
                    <option value="inventory">Inventory</option>
                    <option value="sales">Sales</option>
                    <option value="staff">General Staff</option>
                  </>
                )}
              </select>
              {errors.role && <span className="field-error-msg">{errors.role}</span>}
            </div>

            <div className="staff-field" style={{ gridColumn: 'span 2' }}>
              <label>Department</label>
              <select 
                name="department" 
                value={formData.department} 
                onChange={handleChange}
              >
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
          <h3 className="card-section-title" style={{ marginTop: '30px' }}>
            <Key size={17} className="section-title-icon" />
            <span>Access Password</span>
          </h3>
          
          <div className="fields-grid">
            <div className="staff-field">
              <label>
                Password {!isEditing && <span className="required-star">*</span>}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={isEditing ? "Leave blank to keep unchanged" : "••••••••"}
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  style={{ paddingRight: '40px' }}
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <span className="field-error-msg">{errors.password}</span>}
            </div>

            <div className="staff-field">
              <label>
                Confirm Password {!isEditing && <span className="required-star">*</span>}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder={isEditing ? "Confirm if updating" : "Confirm password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  style={{ paddingRight: '40px' }}
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
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="field-error-msg">{errors.confirmPassword}</span>}
            </div>
          </div>
          <span className="field-hint">
            Must contain at least 7 characters including 1 uppercase letter, 1 digit, and 1 symbol.
          </span>
        </div>

        {/* Right Card: Dynamic Permissions Checklist */}
        <div className="staff-form-card">
          <div className="permissions-header-row">
            <h3 className="card-section-title">
              <Shield size={18} className="section-title-icon" />
              <span>System Permissions</span>
            </h3>
            <span className="perm-counter-pill">
              <Check size={13} />
              <span>{activeCount} of {dbModules.length} Enabled</span>
            </span>
          </div>

          <p className="permission-intro">
            Authorize administrative console modules for this staff member based on their operational duties:
          </p>

          {/* Quick Toolbar: Search & Bulk Actions */}
          <div className="permissions-toolbar">
            <div className="perm-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Filter modules..."
                className="perm-search-input"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
              />
            </div>

            <div className="perm-actions-group">
              <button
                type="button"
                className="perm-action-pill-btn primary"
                onClick={handleSelectAllPermissions}
                title="Enable all modules"
              >
                Select All
              </button>
              <button
                type="button"
                className="perm-action-pill-btn"
                onClick={handleClearAllPermissions}
                title="Disable all modules"
              >
                <RotateCcw size={12} />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="permissions-grid-wrap">
            {filteredDbModules.length > 0 ? (
              filteredDbModules.map((mod) => {
                const key = mod.moduleName || mod.ModuleName;
                const isChecked = Boolean(permissions[key]);
                const title = formatModuleTitle(key);
                const desc = formatModuleDescription(key, mod.description);

                return (
                  <div
                    key={key}
                    className={`permission-switch-item ${isChecked ? 'active' : ''}`}
                    onClick={() => togglePermission(key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        togglePermission(key);
                      }
                    }}
                    aria-label={`Toggle access for ${title}`}
                    aria-pressed={isChecked}
                  >
                    <div className="perm-card-left">
                      <div className="perm-icon-wrap">
                        {getModuleIcon(key)}
                      </div>
                      <div className="switch-info">
                        <span className="switch-title">{title}</span>
                        <p className="switch-desc">{desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`switch-bg ${isChecked ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePermission(key);
                      }}
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <span className={`switch-toggle-knob ${isChecked ? 'active' : ''}`} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="perm-empty-state">
                <p>No modules match "{permissionSearch}".</p>
                <button
                  type="button"
                  onClick={() => setPermissionSearch('')}
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {errors.permissions && (
            <div style={{ marginTop: '12px' }}>
              <span className="field-error-msg">{errors.permissions}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddStaff;
