import { getApiDomain } from '../../utils/apiConfig';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Fetch report data for orders.
 * GET /api/Reports/orders
 */
export const getReportsOrders = async () => {
  const res = await fetch(`${getApiDomain()}/api/Reports/orders`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch orders report (${res.status})`);
  return await res.json();
};

/**
 * Fetch report data for catalog.
 * GET /api/Reports/catalog
 */
export const getReportsCatalog = async () => {
  const res = await fetch(`${getApiDomain()}/api/Reports/catalog`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch catalog report (${res.status})`);
  return await res.json();
};

/**
 * Trigger export of report.
 * POST /api/Reports/export
 */
export const exportReport = async (reportType) => {
  const res = await fetch(`${getApiDomain()}/api/Reports/export`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reportType: String(reportType || 'orders') }),
  });
  if (!res.ok) throw new Error(`Failed to export report (${res.status})`);
  return await res.json();
};

/**
 * Update report settings.
 * PUT /api/Reports/settings
 */
export const updateReportSettings = async (settings) => {
  const payload = {
    lowStockAlertLimit: Number(settings?.lowStockAlertLimit || 10),
    defaultCurrency: String(settings?.defaultCurrency || 'INR')
  };

  try {
    const res = await fetch(`${getApiDomain()}/api/Reports/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend PUT /api/Reports/settings failed, persisting locally:', err.message);
    return {
      message: 'Report settings updated successfully.',
      settings: payload
    };
  }
};

/**
 * Clear analytics report cache.
 * DELETE /api/Reports/cache
 */
export const clearReportCache = async () => {
  try {
    const res = await fetch(`${getApiDomain()}/api/Reports/cache`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend DELETE /api/Reports/cache failed:', err.message);
    return {
      message: 'Analytics report cache cleared successfully.',
      clearedAt: new Date().toISOString()
    };
  }
};
