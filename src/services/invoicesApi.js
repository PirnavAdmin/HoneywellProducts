import { getApiDomain } from '../utils/apiConfig';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return domain ? `${domain}/api/Invoices` : 'https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Invoices';
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
 * GET /api/Invoices (optional ?search=...)
 * Fetch list of invoices and summary metrics
 */
export async function getInvoices(search = '') {
  const baseUrl = getBaseUrl();
  const url = search ? `${baseUrl}?search=${encodeURIComponent(search)}` : baseUrl;
  
  const res = await fetch(url, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    if (res.status === 404) {
      return {
        invoices: [],
        totalRevenue: 'Rs. 0',
        paidInvoices: 0,
        unpaidInvoices: 0,
        cancelledInvoices: 0,
      };
    }
    throw new Error(`Failed to fetch invoices: ${res.status}`);
  }
  const data = await res.json();
  return {
    invoices: Array.isArray(data.invoices) ? data.invoices : (Array.isArray(data) ? data : []),
    totalRevenue: data.totalRevenue || 'Rs. 0',
    paidInvoices: data.paidInvoices || 0,
    unpaidInvoices: data.unpaidInvoices || 0,
    cancelledInvoices: data.cancelledInvoices || 0,
  };
}

/**
 * GET /api/Invoices/{id}
 * Fetch single invoice by ID
 */
export async function getInvoiceById(id) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice ${id}: ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/Invoices
 * Create a new invoice
 */
export async function createInvoice(invoiceData) {
  const res = await fetch(getBaseUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(invoiceData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create invoice: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}

/**
 * PUT /api/Invoices/{id}
 * Update an existing invoice (e.g. status update)
 */
export async function updateInvoice(id, invoiceData) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(invoiceData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update invoice ${id}: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}

/**
 * DELETE /api/Invoices/{id}
 * Cancel or delete an invoice by ID
 */
export async function deleteInvoice(id) {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to delete invoice ${id}: ${res.status}`);
  }
  return true;
}
