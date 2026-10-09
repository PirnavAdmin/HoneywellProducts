import { getApiDomain } from '../utils/apiConfig';
import { apiCache } from '../utils/apiCache';

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

// ── Contact Card API ──
export async function getContactCard() {
  const res = await fetch(`${getApiDomain()}/api/Settings/contact-card`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch contact card: ${res.status}`);
  return res.json();
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
  return await apiCache.fetchWithCache('settings_footer', async () => {
    const res = await fetch(`${getApiDomain()}/api/Settings/footer`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch footer config: ${res.status}`);
    return res.json();
  }, 10 * 60 * 1000);
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
  apiCache.invalidate('settings_footer');
  return res.json().catch(() => ({ success: true }));
}

// ── Product Price Visibility API ──
export async function getPriceVisibility() {
  return await apiCache.fetchWithCache('settings_price_visibility', async () => {
    // 1. Try Settings/price-visibility
    try {
      const res = await fetch(`${getApiDomain()}/api/Settings/price-visibility`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const enabled = typeof data.priceVisibility === 'boolean' ? data.priceVisibility : (typeof data.enabled === 'boolean' ? data.enabled : true);
        try { localStorage.setItem('honeywell_product_price_visibility', JSON.stringify({ enabled, priceVisibility: enabled })); } catch {}
        return data;
      }
    } catch (e) {
      console.warn('Settings/price-visibility fetch failed, trying SystemConfigs fallback:', e);
    }

    // 2. Fallback to SystemConfigs?key=product_price_visibility
    try {
      const res2 = await fetch(`${getApiDomain()}/api/SystemConfigs?key=product_price_visibility`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const val = data2.value ?? data2.Value ?? data2.data ?? data2;
        const enabled = typeof val?.priceVisibility === 'boolean' ? val.priceVisibility : (typeof val?.enabled === 'boolean' ? val.enabled : true);
        try { localStorage.setItem('honeywell_product_price_visibility', JSON.stringify({ enabled, priceVisibility: enabled })); } catch {}
        return { enabled, priceVisibility: enabled, success: true };
      }
    } catch (e) {
      console.warn('SystemConfigs fallback failed:', e);
    }

    // 3. Fallback to localStorage
    try {
      const cached = localStorage.getItem('honeywell_product_price_visibility');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    return { enabled: true, priceVisibility: true, success: true };
  }, 10 * 1000); // 10s cache
}

export async function updatePriceVisibility(data) {
  const isEnabled = typeof data === 'boolean' ? data : (typeof data?.enabled === 'boolean' ? data.enabled : (typeof data?.priceVisibility === 'boolean' ? data.priceVisibility : true));
  const payload = {
    enabled: isEnabled,
    priceVisibility: isEnabled,
    key: 'product_price_visibility',
    value: { enabled: isEnabled, priceVisibility: isEnabled }
  };

  // Always sync immediately to localStorage
  try {
    localStorage.setItem('honeywell_product_price_visibility', JSON.stringify(payload));
  } catch {}
  apiCache.invalidate('settings_price_visibility');

  // 1. Try PUT /api/Settings/price-visibility
  try {
    const res = await fetch(`${getApiDomain()}/api/Settings/price-visibility`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ enabled: isEnabled }),
    });
    if (res.ok) {
      return res.json().catch(() => ({ success: true, enabled: isEnabled }));
    }
  } catch (err) {
    console.warn('PUT /api/Settings/price-visibility failed:', err);
  }

  // 2. Try POST /api/Settings/price-visibility
  try {
    const resPost = await fetch(`${getApiDomain()}/api/Settings/price-visibility`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ enabled: isEnabled }),
    });
    if (resPost.ok) {
      return resPost.json().catch(() => ({ success: true, enabled: isEnabled }));
    }
  } catch (err) {
    console.warn('POST /api/Settings/price-visibility failed:', err);
  }

  // 3. Fallback to PUT /api/SystemConfigs?key=product_price_visibility
  try {
    const resSys = await fetch(`${getApiDomain()}/api/SystemConfigs?key=product_price_visibility`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ key: 'product_price_visibility', value: { enabled: isEnabled, priceVisibility: isEnabled } }),
    });
    if (resSys.ok) {
      return resSys.json().catch(() => ({ success: true, enabled: isEnabled }));
    }
  } catch (err) {
    console.warn('PUT /api/SystemConfigs fallback failed:', err);
  }

  // 4. Fallback to POST /api/SystemConfigs
  try {
    const resSysPost = await fetch(`${getApiDomain()}/api/SystemConfigs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ key: 'product_price_visibility', value: { enabled: isEnabled, priceVisibility: isEnabled } }),
    });
    if (resSysPost.ok) {
      return resSysPost.json().catch(() => ({ success: true, enabled: isEnabled }));
    }
  } catch (err) {
    console.warn('POST /api/SystemConfigs fallback failed:', err);
  }

  // 5. Fallback to POST /api/SystemConfig
  try {
    const resSysAlt = await fetch(`${getApiDomain()}/api/SystemConfig`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ key: 'product_price_visibility', value: { enabled: isEnabled, priceVisibility: isEnabled } }),
    });
    if (resSysAlt.ok) {
      return resSysAlt.json().catch(() => ({ success: true, enabled: isEnabled }));
    }
  } catch (err) {
    console.warn('POST /api/SystemConfig fallback failed:', err);
  }

  return { success: true, enabled: isEnabled };
}


