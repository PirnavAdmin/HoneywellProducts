import { getApiDomain } from '../utils/apiConfig';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return `${domain}/api/Staff`;
};

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

const parseErrorMessage = async (response, defaultMsg) => {
  try {
    const text = await response.text();
    if (!text) return defaultMsg;
    try {
      const parsed = JSON.parse(text);
      return parsed.message || parsed.title || parsed.error || defaultMsg;
    } catch {
      return text.length < 200 ? text : defaultMsg;
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
 * GET /api/Staff
 * Fetch list of all staff members from ASP.NET Web API database
 */
export async function getStaffList() {
  try {
    const res = await fetch(getBaseUrl(), {
      headers: getHeaders(),
    });
    if (!res.ok) {
      console.warn(`[getStaffList] HTTP ${res.status}`);
      return [];
    }
    const json = await safeParseJson(res);
    return unwrapList(json);
  } catch (err) {
    console.warn('[getStaffList] Network error:', err.message);
    return [];
  }
}

/**
 * GET /api/Staff/{id}
 * Fetch single staff member details by ID from ASP.NET Web API
 */
export async function getStaffById(id) {
  try {
    const res = await fetch(`${getBaseUrl()}/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      console.warn(`[getStaffById] HTTP ${res.status}`);
      return {};
    }
    const json = await safeParseJson(res);
    return unwrapItem(json);
  } catch (err) {
    console.warn('[getStaffById] Network error:', err.message);
    return {};
  }
}

/**
 * POST /api/Staff
 * Create a new staff member in central ASP.NET Web API database
 */
export async function createStaff(staffData) {
  const res = await fetch(getBaseUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(staffData),
  });
  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to create staff member: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * PUT /api/Staff/{id}
 * Update an existing staff member by ID in ASP.NET Web API database
 */
export async function updateStaff(id, staffData) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(staffData),
  });
  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to update staff member ${id}: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * DELETE /api/Staff/{id}
 * Delete a staff member by ID in ASP.NET Web API database
 */
export async function deleteStaff(id) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to delete staff member ${id}: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return true;
}

/**
 * PATCH /api/Staff/{id}/status
 * Update or toggle a staff member's active status
 */
export async function patchStaffStatus(id, statusPayload = {}) {
  const res = await fetch(`${getBaseUrl()}/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(statusPayload),
  });
  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to update status for staff ${id}: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  const json = await safeParseJson(res);
  return unwrapItem(json);
}

/**
 * GET /api/Staff/stats
 * Fetch KPI summary statistics for staff directory
 */
export async function getStaffStats() {
  try {
    const res = await fetch(`${getBaseUrl()}/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const json = await safeParseJson(res);
    return unwrapItem(json);
  } catch (err) {
    console.warn('[getStaffStats] Network error:', err.message);
    return null;
  }
}

/**
 * GET /api/Staff/roles
 * Fetch available staff roles and default permissions
 */
export async function getStaffRoles() {
  try {
    const res = await fetch(`${getBaseUrl()}/roles`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const json = await safeParseJson(res);
    return unwrapList(json);
  } catch (err) {
    console.warn('[getStaffRoles] Network error:', err.message);
    return [];
  }
}

/**
 * GET /api/Staff/departments
 * Fetch available enterprise departments
 */
export async function getStaffDepartments() {
  try {
    const res = await fetch(`${getBaseUrl()}/departments`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const json = await safeParseJson(res);
    return unwrapList(json);
  } catch (err) {
    console.warn('[getStaffDepartments] Network error:', err.message);
    return [];
  }
}

/**
 * POST /api/Staff/login
 * Authenticate a staff member by email/employeeId and password
 */
export async function staffLogin(credentials) {
  const res = await fetch(`${getBaseUrl()}/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Staff login failed: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return await safeParseJson(res);
}

/**
 * 1. GET /api/Permissions/modules
 * Get all available application modules
 */
export async function getPermissionModules() {
  try {
    const res = await fetch(`${getApiDomain()}/api/Permissions/modules`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const json = await safeParseJson(res);
    return unwrapList(json);
  } catch (err) {
    console.warn('[getPermissionModules] Network error:', err.message);
    return [];
  }
}

/**
 * 2. GET /api/Staff/{id}/permissions
 * Get permissions assigned to a staff member
 */
export async function getStaffPermissions(id) {
  try {
    const res = await fetch(`${getBaseUrl()}/${id}/permissions`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return await safeParseJson(res);
  } catch (err) {
    console.warn('[getStaffPermissions] Network error:', err.message);
    return null;
  }
}

/**
 * 3. PUT /api/Staff/{id}/permissions
 * Save or update staff module permissions
 */
export async function updateStaffPermissions(id, payload) {
  const res = await fetch(`${getBaseUrl()}/${id}/permissions`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to update permissions for staff ${id}: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return await safeParseJson(res);
}

/**
 * 4. GET /api/Auth/me/permissions
 * Get the logged-in user's effective permissions
 */
export async function getMyEffectivePermissions(email = '') {
  try {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`${getApiDomain()}/api/Auth/me/permissions${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return await safeParseJson(res);
  } catch (err) {
    console.warn('[getMyEffectivePermissions] Network error:', err.message);
    return null;
  }
}

/**
 * 5. GET /api/Roles/{id}/permissions
 * Get permissions for a role
 */
export async function getRolePermissions(roleId) {
  try {
    const res = await fetch(`${getApiDomain()}/api/Roles/${encodeURIComponent(roleId)}/permissions`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return await safeParseJson(res);
  } catch (err) {
    console.warn('[getRolePermissions] Network error:', err.message);
    return null;
  }
}

/**
 * 6. PUT /api/Roles/{id}/permissions
 * Assign or update role permissions
 */
export async function updateRolePermissions(roleId, payload) {
  const res = await fetch(`${getApiDomain()}/api/Roles/${encodeURIComponent(roleId)}/permissions`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to update permissions for role ${roleId}: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return await safeParseJson(res);
}

/**
 * 7. POST /api/Roles
 * Create a role
 */
export async function createRole(roleData) {
  const res = await fetch(`${getApiDomain()}/api/Roles`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(roleData),
  });
  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to create role: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return await safeParseJson(res);
}

/**
 * 8. PUT /api/Roles/{id}
 * Update a role
 */
export async function updateRole(roleId, roleData) {
  const res = await fetch(`${getApiDomain()}/api/Roles/${encodeURIComponent(roleId)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(roleData),
  });
  if (!res.ok) {
    const errorMsg = await parseErrorMessage(res, `Failed to update role ${roleId}: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return await safeParseJson(res);
}

/**
 * 9. DELETE /api/Roles/{id}
 * Delete a role
 */
export async function deleteRole(roleId) {
  const res = await fetch(`${getApiDomain()}/api/Roles/${encodeURIComponent(roleId)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const errorMsg = await parseErrorMessage(res, `Failed to delete role ${roleId}: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return true;
}


