import { getApiDomain, DEFAULT_BACKEND_URL } from '../utils/apiConfig';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return domain ? `${domain}/api/GrowthJourney` : '/api/GrowthJourney';
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

/**
 * GET /api/GrowthJourney
 * Retrieves full Growth Journey section data (eyebrow, title, description, metrics, growthData)
 */
export async function getGrowthJourney() {
  const url = getBaseUrl();
  const res = await fetch(url, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Growth Journey section data: ${res.status}`);
  }
  return res.json();
}

/**
 * GET /api/GrowthJourney/data
 * Retrieves raw array of Growth Journey records
 */
export async function getGrowthJourneyData() {
  const url = `${getBaseUrl()}/data`;
  const res = await fetch(url, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Growth Journey records: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * POST /api/GrowthJourney
 * Creates a new Growth Journey entry
 * Payload DTO: { year, business, products, customers, sales }
 */
export async function createGrowthJourney(payload) {
  const url = getBaseUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let parsedErr = '';
    try {
      const jsonErr = JSON.parse(errText);
      parsedErr = jsonErr.message || jsonErr.title || errText;
    } catch {
      parsedErr = errText;
    }
    throw new Error(parsedErr || `Failed to create Growth Journey record (${res.status})`);
  }

  return res.json();
}

/**
 * PUT /api/GrowthJourney/bulk
 * Bulk updates multiple Growth Journey entries
 * Payload DTO: array of { year, business, products, customers, sales }
 */
export async function bulkUpdateGrowthJourney(payloadArray) {
  const url = `${getBaseUrl()}/bulk`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payloadArray),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let parsedErr = '';
    try {
      const jsonErr = JSON.parse(errText);
      parsedErr = jsonErr.message || jsonErr.title || errText;
    } catch {
      parsedErr = errText;
    }
    throw new Error(parsedErr || `Failed to bulk update Growth Journey records (${res.status})`);
  }

  return res.json();
}

/**
 * DELETE /api/GrowthJourney/{idOrYear}
 * Deletes a Growth Journey entry by ID or Year
 */
export async function deleteGrowthJourney(idOrYear) {
  const url = `${getBaseUrl()}/${encodeURIComponent(idOrYear)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok && res.status !== 204) {
    const errText = await res.text().catch(() => '');
    let parsedErr = '';
    try {
      const jsonErr = JSON.parse(errText);
      parsedErr = jsonErr.message || jsonErr.title || errText;
    } catch {
      parsedErr = errText;
    }
    throw new Error(parsedErr || `Failed to delete Growth Journey record (${res.status})`);
  }

  return true;
}

export const growthJourneyService = {
  getGrowthJourney,
  getGrowthJourneyData,
  createGrowthJourney,
  bulkUpdateGrowthJourney,
  deleteGrowthJourney,
};

export default growthJourneyService;
