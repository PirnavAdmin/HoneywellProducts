import { getApiDomain } from '../utils/apiConfig';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ── Bank Details API ──
export async function getBankDetails() {
  const res = await fetch(`${getApiDomain()}/api/Payment/bank-details`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch bank details: ${res.status}`);
  return res.json();
}

export async function updateBankDetails(data) {
  const res = await fetch(`${getApiDomain()}/api/Payment/bank-details`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.Message || `Failed to update bank details: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}

// ── UPI Details API ──
export async function getUpiDetails() {
  const res = await fetch(`${getApiDomain()}/api/Payment/upi-details`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch UPI details: ${res.status}`);
  return res.json();
}

export async function updateUpiDetails(data) {
  const res = await fetch(`${getApiDomain()}/api/Payment/upi-details`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.Message || `Failed to update UPI details: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}

// ── QR Config API ──
export async function getQrConfig() {
  const res = await fetch(`${getApiDomain()}/api/Payment/qr-config`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch QR config: ${res.status}`);
  return res.json();
}

export async function updateQrConfig(data) {
  const res = await fetch(`${getApiDomain()}/api/Payment/qr-config`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.Message || `Failed to update QR config: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}

// ── Support Config API ──
export async function getSupportConfig() {
  const res = await fetch(`${getApiDomain()}/api/Support/config`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch support config: ${res.status}`);
  return res.json();
}

export async function updateSupportConfig(data) {
  const res = await fetch(`${getApiDomain()}/api/Support/config`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.Message || `Failed to update support config: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}

// ── Returns Policy Window API ──
export async function getReturnsConfig() {
  const res = await fetch(`${getApiDomain()}/api/Returns/config`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch returns config: ${res.status}`);
  return res.json();
}

// ── Description Manager API ──
export async function getDescriptionManager() {
  const res = await fetch(`${getApiDomain()}/api/Settings/description-manager`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch description manager: ${res.status}`);
  return res.json();
}

export async function updateDescriptionManager(data) {
  const res = await fetch(`${getApiDomain()}/api/Settings/description-manager`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.Message || `Failed to update description templates: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}

// ── Footer Config API ──
export async function getFooterConfig() {
  const res = await fetch(`${getApiDomain()}/api/Settings/footer`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch footer config: ${res.status}`);
  return res.json();
}

export async function updateFooterConfig(data) {
  const res = await fetch(`${getApiDomain()}/api/Settings/footer`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.Message || `Failed to update footer config: ${res.status}`);
  }
  return res.json().catch(() => ({ success: true }));
}


