import { getApiDomain } from '../utils/apiConfig';
import { getAdminToken } from '../utils/rbac';

const getBaseUrl = () => {
  const domain = getApiDomain();
  return `${domain}/api/Invoices`;
};

const getHeaders = () => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const token = getAdminToken();
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
 * GET /api/Invoices/next-number
 * Fetch upcoming auto-generated sequential invoice number (e.g. INV-001)
 * Includes resilient client-side sequence computation if endpoint is temporarily unreachable.
 */
export async function getNextInvoiceNumber() {
  try {
    const res = await fetch(`${getBaseUrl()}/next-number`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const num = data?.nextInvoiceNumber || data?.NextInvoiceNumber;
      if (num) {
        return { nextInvoiceNumber: num };
      }
    }
  } catch (err) {
    console.warn('Backend /next-number unavailable, computing client-side:', err);
  }

  // Resilient fallback: Scan existing invoices to compute the next serial number
  try {
    const listData = await getInvoices();
    const invoices = listData?.invoices || [];
    let maxSeq = 0;
    for (const inv of invoices) {
      const raw = inv.invoiceId || inv.InvoiceId || inv.orderNumber || inv.OrderNumber || inv.invoiceNo || '';
      const clean = String(raw).replace(/^(INV-|ORD-|INV|ORD)/i, '').replace(/[^0-9]/g, '');
      const val = parseInt(clean, 10);
      // Only consider serial numbers below 10000 (ignoring random 6-digit legacy IDs and timestamps)
      if (!isNaN(val) && val >= 1 && val < 10000) {
        if (val > maxSeq) {
          maxSeq = val;
        }
      }
    }
    const nextNum = `INV-${String(maxSeq + 1).padStart(3, '0')}`;
    return { nextInvoiceNumber: nextNum };
  } catch (fallbackErr) {
    console.warn('Fallback sequence computation failed:', fallbackErr);
    return { nextInvoiceNumber: 'INV-001' };
  }
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
