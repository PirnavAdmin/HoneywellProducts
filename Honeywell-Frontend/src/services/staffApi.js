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
