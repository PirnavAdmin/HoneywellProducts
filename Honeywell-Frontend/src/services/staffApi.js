import { getApiDomain } from '../utils/apiConfig';
import { getAdminToken } from '../utils/rbac';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return `${domain}/api/Staff`;
};

const getHeaders = (customHeaders = {}) => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  const token = getAdminToken();
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
  } catch {
    return { success: true, rawText: text };
  }
};

const parseErrorMessage = async (response, defaultMsg) => {
  try {
    const text = await response.text();
    if (!text) return defaultMsg;
    try {
      const parsed = JSON.parse(text);
      if (parsed.errors && typeof parsed.errors === 'object') {
        const fieldErrors = Object.entries(parsed.errors)
          .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join(' | ');
        return fieldErrors || parsed.title || defaultMsg;
      }
      return parsed.message || parsed.title || parsed.error || defaultMsg;
    } catch {
      return text.length < 300 ? text : defaultMsg;
    }
  } catch {
    return defaultMsg;
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

const unwrapItem = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data?.data ?? data?.value ?? data;
  }
  return data ?? {};
};

/**
 * 1. GET /api/Staff
 * Fetch staff list with supported backend query parameters (search, role, department, status).
 */
export async function getStaffList(params = {}, options = {}) {
  const query = new URLSearchParams();
  if (params.search && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.role && params.role !== 'all') {
    query.set('role', params.role);
  }
  if (params.department && params.department !== 'all') {
    query.set('department', params.department);
  }
  if (params.status && params.status !== 'all') {
    query.set('status', params.status);
  }

  const queryString = query.toString();
  const url = queryString ? `${getBaseUrl()}?${queryString}` : getBaseUrl();

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to fetch staff list (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapList(json);
}

/**
 * 2. POST /api/Staff
 * Create a new staff member.
 */
export async function createStaff(staffData, options = {}) {
  const res = await fetch(getBaseUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(staffData),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to create staff member (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * 3. GET /api/Staff/{id}
 * Fetch staff details by numeric or string ID.
 */
export async function getStaffById(id, options = {}) {
  if (!id) {
    throw new Error('Staff ID is required to fetch staff details');
  }

  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'GET',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to fetch staff member #${id} (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * 4. PUT /api/Staff/{id}
 * Update an existing staff member by ID.
 */
export async function updateStaff(id, staffData, options = {}) {
  if (!id) {
    throw new Error('Staff ID is required to update staff member');
  }

  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(staffData),
    signal: options.signal,
  });

  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to update staff member #${id} (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * 5. DELETE /api/Staff/{id}
 * Delete a staff member by ID.
 */
export async function deleteStaff(id, options = {}) {
  if (!id) {
    throw new Error('Staff ID is required to delete staff member');
  }

  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to delete staff member #${id} (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  return true;
}

/**
 * 6. PATCH /api/Staff/{id}/status
 * Update staff member status and active flag.
 */
export async function updateStaffStatus(id, { status, isActive }, options = {}) {
  if (!id) {
    throw new Error('Staff ID is required to update status');
  }

  const payload = {
    status: status || (isActive ? 'Active' : 'Inactive'),
    isActive: typeof isActive === 'boolean' ? isActive : (status?.toLowerCase() === 'active'),
  };

  const res = await fetch(`${getBaseUrl()}/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to update staff status for #${id} (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * 7. GET /api/Staff/stats
 * Fetch real aggregate staff statistics.
 */
export async function getStaffStats(options = {}) {
  const res = await fetch(`${getBaseUrl()}/stats`, {
    method: 'GET',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to fetch staff statistics (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * 8. GET /api/Staff/roles
 * Fetch enterprise roles dynamically from backend.
 */
export async function getStaffRoles(options = {}) {
  const res = await fetch(`${getBaseUrl()}/roles`, {
    method: 'GET',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to fetch staff roles (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapList(json);
}

/**
 * 9. GET /api/Staff/departments
 * Fetch corporate departments dynamically from backend.
 */
export async function getStaffDepartments(options = {}) {
  const res = await fetch(`${getBaseUrl()}/departments`, {
    method: 'GET',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to fetch staff departments (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapList(json);
}

/**
 * 10. POST /api/Staff/login
 * Staff authentication endpoint with email or employeeId and password.
 */
export async function staffLogin({ email, employeeId, password }, options = {}) {
  const payload = {
    email: email || '',
    employeeId: employeeId || '',
    password: password || '',
  };

  const res = await fetch(`${getBaseUrl()}/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Staff login failed (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * 11. GET /api/Staff/{id}/permissions
 * Fetch staff member permissions by staff ID.
 */
export async function getStaffPermissions(id, options = {}) {
  if (!id) {
    throw new Error('Staff ID is required to fetch staff permissions');
  }

  const res = await fetch(`${getBaseUrl()}/${id}/permissions`, {
    method: 'GET',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok) {
    // If backend returns 404 or fails, also check /api/Permission/{staffId}
    const domain = getApiDomain();
    const fallbackRes = await fetch(`${domain}/api/Permission/${id}`, {
      method: 'GET',
      headers: getHeaders(),
      signal: options.signal,
    });
    if (fallbackRes.ok) {
      const fbJson = await safeParseJson(fallbackRes);
      return unwrapList(fbJson);
    }

    const errorMsg = await parseErrorMessage(res, `Failed to fetch permissions for staff #${id} (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapList(json);
}

/**
 * 12. PUT /api/Staff/{id}/permissions
 * Update permissions for a staff member using Honeywell.Models.StaffPermissionsUpdateDto.
 */
export async function updateStaffPermissions(id, permissionsDto, options = {}) {
  if (!id) {
    throw new Error('Staff ID is required to update staff permissions');
  }

  const res = await fetch(`${getBaseUrl()}/${id}/permissions`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(permissionsDto),
    signal: options.signal,
  });

  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to update permissions for staff #${id} (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * 13. POST /api/Staff/{id}/permissions
 * Assign/create permissions for a staff member.
 * Note: The live backend route returns 405 Method Not Allowed for POST on /api/Staff/{id}/permissions.
 * If 405 is returned, this function delegates to PUT /api/Staff/{id}/permissions or POST /api/Permission.
 */
export async function assignStaffPermissions(id, permissionsDto, options = {}) {
  if (!id) {
    throw new Error('Staff ID is required to assign staff permissions');
  }

  // Attempt POST /api/Staff/{id}/permissions per API #13 specification
  const res = await fetch(`${getBaseUrl()}/${id}/permissions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(permissionsDto),
    signal: options.signal,
  });

  if (res.ok || res.status === 201 || res.status === 204) {
    const json = await safeParseJson(res);
    return unwrapItem(json);
  }

  // If 405 Method Not Allowed, fallback to the backend supported update/sync contracts
  if (res.status === 405) {
    console.warn(`[assignStaffPermissions] POST /api/Staff/${id}/permissions returned 405 Method Not Allowed. Delegating to PUT /api/Staff/${id}/permissions.`);
    return updateStaffPermissions(id, permissionsDto, options);
  }

  const errorMsg = await parseErrorMessage(res, `Failed to assign permissions for staff #${id} (HTTP ${res.status})`);
  throw new Error(errorMsg);
}

/**
 * Helper: GET /api/Permissions/modules
 * Fetch real system modules registered in the database.
 */
export async function getPermissionsModules(options = {}) {
  const domain = getApiDomain();
  const res = await fetch(`${domain}/api/Permissions/modules`, {
    method: 'GET',
    headers: getHeaders(),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to fetch permission modules (HTTP ${res.status})`);
    throw new Error(errorMsg);
  }

  const json = await safeParseJson(res);
  return unwrapList(json);
}

export default {
  getStaffList,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  getStaffStats,
  getStaffRoles,
  getStaffDepartments,
  staffLogin,
  getStaffPermissions,
  updateStaffPermissions,
  assignStaffPermissions,
  getPermissionsModules,
};
