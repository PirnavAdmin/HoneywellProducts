/**
 * Role-Based Access Control (RBAC) & Dynamic Permissions Engine
 * 
 * Enforces dynamic permissions for Honeywell Admin & Staff modules.
 * Strictly avoids hardcoded role overrides or static fallback grants.
 */

export const normalizePermissionName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[-_&/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/s$/, ''); // singularize (e.g. orders -> order, categories -> categorie)
};

// Aliases mapping for cross-matching module names from DB, Swagger, and frontend routes
export const MODULE_ALIASES = {
  'dashboard': ['dashboard'],
  'catalog': [
    'catalog', 'category', 'categorie', 'product', 'description', 
    'image categorizer', 'subcategory', 'subcategorie'
  ],
  'customer': ['customer', 'call history'],
  'call history': ['call history', 'customer'],
  'staff': ['staff', 'employee', 'user'],
  'report': ['report', 'analytic'],
  'growth journey': ['growth journey'],
  'ticket': ['ticket', 'support ticket'],
  'enquiry': ['enquiry', 'inquiry'],
  'contact form': ['contact form', 'contact submission', 'contact'],
  'contact submission': ['contact form', 'contact submission', 'contact'],
  'bulk quote': ['bulk quote', 'quote'],
  'quote': ['bulk quote', 'quote'],
  'partner application': ['partner application'],
  'dealer distributor': ['dealer distributor', 'dealers distributor', 'distributor', 'dealer'],
  'distributor': ['dealer distributor', 'dealers distributor', 'distributor', 'dealer'],
  'order sale': [
    'order sale', 'orders sale', 'order', 'sale', 
    'purchase indent', 'purchase order', 'return', 'sales return'
  ],
  'order': [
    'order sale', 'orders sale', 'order', 'sale', 
    'purchase indent', 'purchase order', 'return', 'sales return'
  ],
  'invoice': ['invoice'],
  'stock update': ['stock update', 'stockupdate', 'stock'],
  'stockupdate': ['stock update', 'stockupdate', 'stock'],
  'marketing': ['marketing', 'banner', 'solution', 'offer', 'coupon'],
  'brand': ['brand'],
  'blog': ['blog'],
  'testimonial': ['testimonial'],
  'setting': ['setting', 'contact card', 'footer', 'about', 'toc', 'table of content'],
  'supplier': ['supplier'],
  'coin converter': ['coin converter', 'coins converter', 'coin'],
  'payment setting': ['payment setting', 'payment'],
};

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
  'contact-submissions': '/admin/contact-submissions',
  'bulk quotes': '/admin/quotes',
  'quotes': '/admin/quotes',
  'partner applications': '/admin/partner-applications',
  'dealers & distributors': '/admin/distributors',
  'distributors': '/admin/distributors',
  'orders & sales': '/admin/orders/list',
  'orders': '/admin/orders/list',
  'invoices': '/admin/invoice',
  'stock updates': '/admin/stock-updates',
  'stockupdates': '/admin/stock-updates',
  'marketing': '/admin/marketing/banners',
  'brands': '/admin/brands/list',
  'blogs': '/admin/blogs/list',
  'testimonials': '/admin/testimonials/list',
  'settings': '/admin/settings/form',
  'suppliers': '/admin/suppliers/list',
  'coins converter': '/admin/coins',
  'payment settings': '/admin/payments',
};

// Given an admin route pathname, determine which logical module it belongs to
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

  if (['customers', 'customer', 'call-history'].includes(segment)) {
    return 'customers';
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

  if (['contact-submissions', 'contact-card'].includes(segment)) {
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

  if (['settings', 'footer', 'about', 'about-us', 'toc'].includes(segment)) {
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

  return segment;
};

/**
 * Check if the current user has access to a specific module.
 * Admin users with verified admin authType have administrative access.
 * Staff users (including Manager, Advisory, Sales, etc.) ONLY have access to explicitly granted permissions.
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

  const normTarget = normalizePermissionName(moduleName);
  const targets = MODULE_ALIASES[normTarget] || [normTarget];

  return userPermissions.some(perm => {
    const normPerm = normalizePermissionName(perm);
    return targets.some(target => normPerm === target || normPerm.includes(target) || target.includes(normPerm));
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
    const norm = normalizePermissionName(perm);
    for (const [modKey, route] of Object.entries(MODULE_PRIMARY_ROUTES)) {
      if (hasModuleAccess(modKey, [norm], userRole, authType)) {
        return route;
      }
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
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Clear all authentication and permission state from localStorage to ensure strict session isolation.
 */
export const clearUserSession = () => {
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminEmail');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminRole');
  localStorage.removeItem('adminPermissions');
  localStorage.removeItem('authType');
  localStorage.removeItem('authApiVersion');
};

