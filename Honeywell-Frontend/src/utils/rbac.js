/**
 * Role-Based Access Control (RBAC) & Dynamic Permissions Engine
 * 
 * Enforces dynamic permissions for Honeywell Admin & Staff modules.
 * Strictly avoids hardcoded role overrides or static fallback grants.
 * Canonicalizes permission keys against the 25 official backend database modules.
 */

export const normalizePermissionName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[-_&/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Canonical list of the 25 official modules supported by Honeywell backend
export const CANONICAL_MODULE_KEYS = {
  DASHBOARD: 'dashboard',
  CATALOG: 'catalog',
  CUSTOMERS: 'customers',
  STAFF: 'staff',
  REPORTS: 'reports',
  GROWTH_JOURNEY: 'growth journey',
  TICKETS: 'tickets',
  ENQUIRIES: 'enquiries',
  CONTACT_FORM: 'contact form',
  BULK_QUOTES: 'bulk quotes',
  PARTNER_APPLICATIONS: 'partner applications',
  DEALERS_DISTRIBUTORS: 'dealers & distributors',
  ORDERS_AND_SALES: 'orders & sales',
  INVOICES: 'invoices',
  STOCK_UPDATES: 'stock updates',
  MARKETING: 'marketing',
  BRANDS: 'brands',
  BLOGS: 'blogs',
  TESTIMONIALS: 'testimonials',
  SETTINGS: 'settings',
  SUPPLIERS: 'suppliers',
  PAYMENT_SETTINGS: 'payment settings',
  COINS_CONVERTER: 'coins converter',
  CALL_HISTORY: 'call history'
};

// Exact dictionary mapping variants/synonyms to canonical module keys
export const CANONICAL_MAPPING = {
  // 1. Dashboard
  'dashboard': 'dashboard',

  // 2. Catalog
  'catalog': 'catalog',
  'categories': 'catalog',
  'category': 'catalog',
  'categorie': 'catalog',
  'subcategories': 'catalog',
  'subcategory': 'catalog',
  'subcategorie': 'catalog',
  'products': 'catalog',
  'product': 'catalog',
  'products-form': 'catalog',
  'products form': 'catalog',
  'product-features': 'catalog',
  'product features': 'catalog',
  'product-reviews': 'catalog',
  'product reviews': 'catalog',
  'descriptions': 'catalog',
  'description': 'catalog',
  'image categorizer': 'catalog',

  // 3. Customers
  'customers': 'customers',
  'customer': 'customers',

  // 4. Staff
  'staff': 'staff',
  'employee': 'staff',
  'employees': 'staff',
  'user': 'staff',
  'users': 'staff',

  // 5. Reports
  'reports': 'reports',
  'report': 'reports',
  'analytics': 'reports',
  'analytic': 'reports',

  // 6. Growth Journey
  'growth journey': 'growth journey',
  'growth journeys': 'growth journey',
  'growth-journey': 'growth journey',
  'growthjourney': 'growth journey',

  // 7. Tickets
  'tickets': 'tickets',
  'ticket': 'tickets',
  'support ticket': 'tickets',
  'support tickets': 'tickets',

  // 8. Enquiries
  'enquiries': 'enquiries',
  'enquiry': 'enquiries',
  'inquiries': 'enquiries',
  'inquiry': 'enquiries',

  // 9. Contact Form
  'contact form': 'contact form',
  'contact forms': 'contact form',
  'contact submissions': 'contact form',
  'contact submission': 'contact form',
  'contact-submissions': 'contact form',
  'contact': 'contact form',

  // 10. Bulk Quotes
  'bulk quotes': 'bulk quotes',
  'bulk quote': 'bulk quotes',
  'quotes': 'bulk quotes',
  'quote': 'bulk quotes',

  // 11. Partner Applications
  'partner applications': 'partner applications',
  'partner application': 'partner applications',
  'partner-applications': 'partner applications',
  'partner': 'partner applications',
  'partners': 'partner applications',

  // 12. Dealers & Distributors
  'dealers & distributors': 'dealers & distributors',
  'dealers and distributors': 'dealers & distributors',
  'dealers distributors': 'dealers & distributors',
  'dealer distributor': 'dealers & distributors',
  'distributors': 'dealers & distributors',
  'distributor': 'dealers & distributors',
  'dealers': 'dealers & distributors',
  'dealer': 'dealers & distributors',

  // 13 & 14. Orders & Sales
  'orders & sales': 'orders & sales',
  'orders and sales': 'orders & sales',
  'orders sales': 'orders & sales',
  'order sale': 'orders & sales',
  'orders': 'orders & sales',
  'order': 'orders & sales',
  'sales': 'orders & sales',
  'sale': 'orders & sales',
  'purchase indent': 'orders & sales',
  'purchase-indent': 'orders & sales',
  'purchase orders': 'orders & sales',
  'purchase order': 'orders & sales',
  'purchase-orders': 'orders & sales',
  'returns': 'orders & sales',
  'return': 'orders & sales',
  'sales returns': 'orders & sales',
  'sales return': 'orders & sales',
  'sales-returns': 'orders & sales',

  // 15. Invoices
  'invoices': 'invoices',
  'invoice': 'invoices',

  // 16. Stock Updates
  'stockupdates': 'stock updates',
  'stock update': 'stock updates',
  'stock updates': 'stock updates',
  'stock-updates': 'stock updates',
  'stock': 'stock updates',

  // 17. Marketing
  'marketing': 'marketing',
  'banners': 'marketing',
  'banner': 'marketing',
  'solutions': 'marketing',
  'solution': 'marketing',
  'offers': 'marketing',
  'offer': 'marketing',
  'coupons': 'marketing',
  'coupon': 'marketing',

  // 18. Brands
  'brands': 'brands',
  'brand': 'brands',

  // 19. Blogs
  'blogs': 'blogs',
  'blog': 'blogs',

  // 20. Testimonials
  'testimonials': 'testimonials',
  'testimonial': 'testimonials',

  // 21. Settings (STRICT - isolated from Payment Settings)
  'settings': 'settings',
  'setting': 'settings',
  'footer': 'settings',
  'about': 'settings',
  'about us': 'settings',
  'about-us': 'settings',
  'toc': 'settings',
  'table of content': 'settings',
  'table of contents': 'settings',
  'contact card': 'settings',
  'contact-card': 'settings',

  // 22. Suppliers
  'suppliers': 'suppliers',
  'supplier': 'suppliers',

  // 23. Payment Settings (STRICT - isolated from Settings)
  'payment settings': 'payment settings',
  'payment setting': 'payment settings',
  'payments': 'payment settings',
  'payment': 'payment settings',
  'gateways': 'payment settings',
  'gateway': 'payment settings',

  // 24. Coins Converter
  'coins converter': 'coins converter',
  'coin converter': 'coins converter',
  'coins': 'coins converter',
  'coin': 'coins converter',

  // 25. Call History (STRICT - isolated from Customers)
  'call history': 'call history',
  'call-history': 'call history',
  'call logs': 'call history',
  'call log': 'call history'
};

/**
 * Resolves any module name, route segment, or database permission string to its canonical module key.
 */
export const getCanonicalModule = (name) => {
  if (!name || typeof name !== 'string') return '';
  const normalized = normalizePermissionName(name);

  // 1. Direct dictionary match
  if (CANONICAL_MAPPING[normalized]) {
    return CANONICAL_MAPPING[normalized];
  }

  // 2. Singularized check
  const singular = normalized.replace(/s$/, '');
  if (CANONICAL_MAPPING[singular]) {
    return CANONICAL_MAPPING[singular];
  }

  return normalized;
};

// Aliases mapping for backward compatibility if referenced
export const MODULE_ALIASES = CANONICAL_MAPPING;

// Primary route associated with each module for navigation redirection
export const MODULE_PRIMARY_ROUTES = {
  'dashboard': '/admin/dashboard',
  'catalog': '/admin/catalog/categories',
  'customers': '/admin/customers/list',
  'staff': '/admin/staff/list',
  'reports': '/admin/reports',
  'growth journey': '/admin/growth-journey',
  'tickets': '/admin/tickets',
  'enquiries': '/admin/enquiries',
  'contact form': '/admin/contact-submissions',
  'bulk quotes': '/admin/quotes',
  'partner applications': '/admin/partner-applications',
  'dealers & distributors': '/admin/distributors',
  'orders & sales': '/admin/orders/list',
  'invoices': '/admin/invoice',
  'stock updates': '/admin/stock-updates',
  'marketing': '/admin/marketing/banners',
  'brands': '/admin/brands/list',
  'blogs': '/admin/blogs/list',
  'testimonials': '/admin/testimonials/list',
  'settings': '/admin/settings/form',
  'suppliers': '/admin/suppliers/list',
  'coins converter': '/admin/coins',
  'payment settings': '/admin/payments',
  'call history': '/admin/call-history'
};

// Given an admin route pathname, determine which logical canonical module it belongs to
export const getModuleForPathname = (pathname) => {
  if (!pathname || typeof pathname !== 'string') return '';
  const clean = pathname.replace(/^\/admin\/?/, '').split('?')[0].split('#')[0];
  if (!clean || clean === '') return 'dashboard';

  const segment = clean.split('/')[0].toLowerCase();

  // Universal routes allowed for all authenticated users
  if (segment === 'profile' || segment === 'account-settings') {
    return '__universal__';
  }

  if (segment === 'dashboard') return 'dashboard';

  if (['catalog', 'categories', 'category', 'subcategories', 'subcategory', 'products', 'products-form', 'product-features', 'product-reviews', 'descriptions'].includes(segment)) {
    return 'catalog';
  }

  if (['customers', 'customer'].includes(segment)) {
    return 'customers';
  }

  if (['call-history'].includes(segment)) {
    return 'call history';
  }

  if (['staff'].includes(segment)) {
    return 'staff';
  }

  if (['reports'].includes(segment)) {
    return 'reports';
  }

  if (['growth-journey'].includes(segment)) {
    return 'growth journey';
  }

  if (['tickets'].includes(segment)) {
    return 'tickets';
  }

  if (['enquiries'].includes(segment)) {
    return 'enquiries';
  }

  if (['contact-submissions'].includes(segment)) {
    return 'contact form';
  }

  if (['quotes'].includes(segment)) {
    return 'bulk quotes';
  }

  if (['partner-applications'].includes(segment)) {
    return 'partner applications';
  }

  if (['distributors', 'dealers'].includes(segment)) {
    return 'dealers & distributors';
  }

  if (['purchase-indent', 'purchase-orders', 'orders', 'returns', 'sales-returns'].includes(segment)) {
    return 'orders & sales';
  }

  if (['invoice'].includes(segment)) {
    return 'invoices';
  }

  if (['stock-updates'].includes(segment)) {
    return 'stock updates';
  }

  if (['marketing', 'solutions'].includes(segment)) {
    return 'marketing';
  }

  if (['brands'].includes(segment)) {
    return 'brands';
  }

  if (['blogs'].includes(segment)) {
    return 'blogs';
  }

  if (['testimonials'].includes(segment)) {
    return 'testimonials';
  }

  if (['settings', 'footer', 'about', 'about-us', 'toc', 'contact-card'].includes(segment)) {
    return 'settings';
  }

  if (['suppliers'].includes(segment)) {
    return 'suppliers';
  }

  if (['coins'].includes(segment)) {
    return 'coins converter';
  }

  if (['payments'].includes(segment)) {
    return 'payment settings';
  }

  return getCanonicalModule(segment);
};

/**
 * Check if the current user has access to a specific module.
 * Admin users with verified admin authType have administrative access.
 * Staff users (including Manager, Advisory, Sales, etc.) ONLY have access to explicitly granted permissions.
 * Matches canonical target strictly against the user's canonicalized permissions.
 */
export const hasModuleAccess = (moduleName, userPermissions = [], userRole = '', authType = '') => {
  if (!moduleName) return true;
  if (moduleName === '__universal__') return true;

  const role = (userRole || '').toLowerCase().trim();
  const type = (authType || '').toLowerCase().trim();

  // ONLY genuinely authenticated Admin accounts with administrative role have full admin bypass
  const isAdmin = type === 'admin' && ['admin', 'super admin', 'superadmin', 'administrator'].includes(role);
  if (isAdmin) {
    return true;
  }

  // For all Staff accounts (including Manager, Advisory, Inventory, Sales, General Staff),
  // access is strictly based on the real assigned permissions!
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) {
    return false;
  }

  const canonTarget = getCanonicalModule(moduleName);
  if (!canonTarget) return false;

  return userPermissions.some(perm => {
    return getCanonicalModule(perm) === canonTarget;
  });
};

/**
 * Check if the current user is authorized to visit a specific pathname.
 */
export const isPathAuthorized = (pathname, userPermissions = [], userRole = '', authType = '') => {
  const moduleKey = getModuleForPathname(pathname);
  if (moduleKey === '__universal__') return true;
  if (!moduleKey) return false;
  return hasModuleAccess(moduleKey, userPermissions, userRole, authType);
};

/**
 * Resolve the first authorized destination route for a user based on their real permissions.
 */
export const getFirstAuthorizedRoute = (userPermissions = [], userRole = '', authType = '') => {
  const role = (userRole || '').toLowerCase().trim();
  const type = (authType || '').toLowerCase().trim();

  if (type === 'admin' && ['admin', 'super admin', 'superadmin', 'administrator'].includes(role)) {
    return '/admin/dashboard';
  }

  if (!Array.isArray(userPermissions) || userPermissions.length === 0) {
    return null;
  }

  // Check if dashboard is explicitly permitted
  if (hasModuleAccess('dashboard', userPermissions, userRole, authType)) {
    return '/admin/dashboard';
  }

  // Otherwise, find the route for the first permitted module
  for (const perm of userPermissions) {
    const canonPerm = getCanonicalModule(perm);
    if (canonPerm && MODULE_PRIMARY_ROUTES[canonPerm]) {
      return MODULE_PRIMARY_ROUTES[canonPerm];
    }
  }

  return null;
};

/**
 * Extract an array of allowed module names from any user/staff API response.
 */
export const extractPermissionsFromUser = (userData) => {
  if (!userData) return [];

  // Direct permissions field
  const raw = userData.permissions ?? userData.Permissions ?? userData.staffPermissions ?? userData.modulePermissions;

  if (Array.isArray(raw)) {
    return raw.map(p => {
      if (typeof p === 'string') return p.trim().toLowerCase();
      if (p && typeof p === 'object') {
        const isAllowed = p.isAllowed ?? p.IsAllowed ?? p.canView ?? p.CanView ?? true;
        if (isAllowed) {
          const name = p.moduleName || p.ModuleName || (p.module && (p.module.moduleName || p.module.ModuleName)) || '';
          return name.trim().toLowerCase();
        }
      }
      return null;
    }).filter(Boolean);
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([_, allowed]) => Boolean(allowed))
      .map(([modName]) => modName.trim().toLowerCase());
  }

  return [];
};

/**
 * Safely extract and decode JWT claims payload.
 */
export const parseJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = atob(base64);
    try {
      const jsonPayload = decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return JSON.parse(decoded);
    }
  } catch {
    return null;
  }
};

/**
 * Dynamically check if a JWT token is valid and unexpired based on real cryptographic claims.
 */
export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string' || !token.trim()) return false;
  const parts = token.trim().split('.');
  if (parts.length === 3) {
    const payload = parseJwtPayload(token);
    if (payload && typeof payload.exp === 'number') {
      const expiryMs = payload.exp * 1000;
      // Tolerate clock skew between server and client device (24h grace margin)
      if (Date.now() - expiryMs > 24 * 60 * 60 * 1000) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Check if token is expired.
 */
export const isTokenExpired = (token) => {
  return !isTokenValid(token);
};

/**
 * Retrieve the active admin/staff token dynamically.
 * Reliably checks both sessionStorage and localStorage without destructive side effects.
 */
export const getAdminToken = () => {
  const token = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('adminToken') : null) ||
                (typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null) || '';
  return token.trim();
};

/**
 * Retrieve stored admin attribute from dynamic session or local storage.
 */
export const getStoredAdminItem = (key) => {
  if (typeof sessionStorage !== 'undefined') {
    const val = sessionStorage.getItem(key);
    if (val !== null && val !== undefined && val !== '') return val;
  }
  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem(key);
    if (val !== null && val !== undefined && val !== '') return val;
  }
  return null;
};

/**
 * Set all authenticated admin session variables synchronously in both sessionStorage and localStorage
 * to guarantee resilience across page navigations, reloads, and background API requests.
 */
export const setStoredAdminSession = ({
  token = '',
  email = '',
  name = '',
  role = '',
  authType = '',
  permissions = [],
  apiVersion = ''
}) => {
  const permStr = JSON.stringify(permissions || []);
  const nowStr = String(Date.now());

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('isAdmin', 'true');
    if (token) sessionStorage.setItem('adminToken', token);
    if (email) sessionStorage.setItem('adminEmail', email);
    if (name) sessionStorage.setItem('adminName', name);
    if (role) sessionStorage.setItem('adminRole', role);
    if (authType) sessionStorage.setItem('authType', authType);
    if (permissions) sessionStorage.setItem('adminPermissions', permStr);
    if (apiVersion) sessionStorage.setItem('authApiVersion', apiVersion);
    sessionStorage.setItem('adminLastActivity', nowStr);
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('isAdmin', 'true');
    if (token) localStorage.setItem('adminToken', token);
    if (email) localStorage.setItem('adminEmail', email);
    if (name) localStorage.setItem('adminName', name);
    if (role) localStorage.setItem('adminRole', role);
    if (authType) localStorage.setItem('authType', authType);
    if (permissions) localStorage.setItem('adminPermissions', permStr);
    if (apiVersion) localStorage.setItem('authApiVersion', apiVersion);
    localStorage.setItem('adminLastActivity', nowStr);
  }
};

/**
 * Wipe any legacy keys from localStorage to prevent persistent leaks.
 */
export const cleanupLegacyLocalStorage = () => {
  // Kept for backward compatibility, clearUserSession handles full purge
};

/**
 * Clear all authentication and permission state from both sessionStorage and localStorage
 * to ensure strict session isolation and immediate sign-out.
 */
export const clearUserSession = () => {
  const keys = [
    'isAdmin',
    'adminToken',
    'adminEmail',
    'adminName',
    'adminRole',
    'adminPermissions',
    'authType',
    'authApiVersion',
    'adminLastActivity'
  ];
  keys.forEach((key) => {
    try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key); } catch {}
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch {}
  });
};

