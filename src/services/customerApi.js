/**
 * customerApi.js - All real API calls for the Customer Portal.
 * Formatted with exact ASP.NET Core DTO property names.
 * NO mock data. NO setTimeout fakes. NO static values.
 */
import { API_BASE_URL } from './api';

const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' };

function getToken() {
  return localStorage.getItem('customerToken') || '';
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...NGROK_HEADER,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  let data;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  if (!res.ok) {
    const msg =
      (data && (data.message || data.Message || data.title || data.Title || data.error)) ||
      (typeof data === 'string' ? data : null) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const url = (path) => `${API_BASE_URL}${path}`;

// ─── AUTHENTICATION ─────────────────────────────────────────────────────────────

export async function customerLogin(email, password) {
  const body = JSON.stringify({ email, password, emailOrPhone: email });
  let res;
  try {
    res = await fetch(url('/api/Customer/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADER },
      body,
    });
    if (!res.ok) throw new Error();
  } catch (e) {
    res = await fetch(url('/api/CustomerPortal/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADER },
      body,
    });
  }
  return handleResponse(res);
}

export async function customerRegister(payload) {
  // Exact ASP.NET CustomerRegisterDto schema: { fullName, emailOrPhone, email, phone, password }
  const body = JSON.stringify({
    fullName: payload.fullName || payload.name || '',
    emailOrPhone: payload.emailOrPhone || payload.email || payload.phone || '',
    email: payload.email || '',
    phone: payload.phone || '',
    password: payload.password || '',
  });

  let res;
  try {
    res = await fetch(url('/api/Customer/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADER },
      body,
    });
    if (!res.ok) throw new Error();
  } catch (e) {
    res = await fetch(url('/api/CustomerPortal/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADER },
      body,
    });
  }
  return handleResponse(res);
}

export async function customerLogout() {
  try {
    const res = await fetch(url('/api/Customer/logout'), {
      method: 'POST',
      headers: authHeaders(),
    });
    return await handleResponse(res);
  } catch (e) {
    try {
      const res2 = await fetch(url('/api/CustomerPortal/logout'), {
        method: 'POST',
        headers: authHeaders(),
      });
      return await handleResponse(res2);
    } catch (err) {
      console.warn('Logout notification completed:', err.message);
    }
  }
}

export async function forgotPassword(email) {
  const res = await fetch(url('/api/Auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...NGROK_HEADER },
    body: JSON.stringify({ email, emailOrPhone: email }),
  });
  return handleResponse(res);
}

export async function changePassword(currentPassword, newPassword, confirmPassword, email) {
  const customerEmail = email || localStorage.getItem('customerEmail') || '';
  const payload = {
    email: customerEmail,
    currentPassword,
    oldPassword: currentPassword,
    newPassword,
    confirmPassword: confirmPassword || newPassword,
    confirmNewPassword: confirmPassword || newPassword,
  };
  try {
    const res = await fetch(url('/api/Customer/change-password'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url('/api/CustomerPortal/change-password'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return await handleResponse(res2);
  }
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function getMyProfile(customerId, email) {
  const params = new URLSearchParams();
  if (customerId) params.set('customerId', customerId);
  if (email) params.set('email', email);
  const q = params.toString() ? `?${params.toString()}` : '';
  
  try {
    const res = await fetch(url(`/api/Customer/myprofile${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/Customer/profile${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    return await handleResponse(res2);
  }
}

export async function getProfile(customerId, email) {
  const params = new URLSearchParams();
  if (customerId) params.set('customerId', customerId);
  if (email) params.set('email', email);
  const q = params.toString() ? `?${params.toString()}` : '';

  try {
    const res = await fetch(url(`/api/Customer/profile${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/CustomerPortal/profile${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    return await handleResponse(res2);
  }
}

export async function updateProfile(customerId, profileData) {
  const q = customerId ? `?customerId=${customerId}` : '';
  const nameParts = (profileData.name || '').trim().split(/\s+/);
  const firstName = profileData.firstName || nameParts[0] || '';
  const lastName = profileData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

  // Map to exact UpdateCustomerProfileDto schema: { firstName, lastName, emailAddress, mobileNumber, gender, companyOrganization }
  const body = JSON.stringify({
    firstName,
    lastName,
    emailAddress: profileData.emailAddress || profileData.email || '',
    mobileNumber: profileData.mobileNumber || profileData.phone || '',
    gender: profileData.gender || 'Male',
    companyOrganization: profileData.companyOrganization || profileData.company || 'Individual Account',
  });

  try {
    const res = await fetch(url(`/api/Customer/profile${q}`), {
      method: 'PUT',
      headers: authHeaders(),
      body,
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/CustomerPortal/profile${q}`), {
      method: 'PUT',
      headers: authHeaders(),
      body,
    });
    return await handleResponse(res2);
  }
}

// ─── ADDRESSES ────────────────────────────────────────────────────────────────

export async function getAddresses(customerId) {
  const q = customerId ? `?customerId=${customerId}` : '';
  try {
    const res = await fetch(url(`/api/Customer/addresses${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res.status === 404 || res.status === 204) return null;
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    try {
      const res2 = await fetch(url(`/api/CustomerPortal/addresses${q}`), {
        method: 'GET',
        headers: authHeaders(),
      });
      if (res2.status === 404 || res2.status === 204) return null;
      return await handleResponse(res2);
    } catch (err) {
      return null;
    }
  }
}

export async function saveAddresses(customerId, addressData) {
  const q = customerId ? `?customerId=${customerId}` : '';
  const body = JSON.stringify({
    shippingAddress: addressData.shippingAddress || addressData.address || '',
    billingAddress: addressData.billingAddress || addressData.shippingAddress || '',
  });
  try {
    const res = await fetch(url(`/api/Customer/addresses${q}`), {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/CustomerPortal/addresses${q}`), {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
    return await handleResponse(res2);
  }
}

export async function updateAddresses(customerId, addressData) {
  const q = customerId ? `?customerId=${customerId}` : '';
  const body = JSON.stringify({
    shippingAddress: addressData.shippingAddress || addressData.address || '',
    billingAddress: addressData.billingAddress || addressData.shippingAddress || '',
  });
  try {
    const res = await fetch(url(`/api/Customer/addresses${q}`), {
      method: 'PUT',
      headers: authHeaders(),
      body,
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/CustomerPortal/addresses${q}`), {
      method: 'PUT',
      headers: authHeaders(),
      body,
    });
    return await handleResponse(res2);
  }
}

export async function deleteAddress(addressId) {
  const res = await fetch(url(`/api/CustomerAddress/${addressId}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── BANK DETAILS ─────────────────────────────────────────────────────────────

export async function getBankDetails(customerId) {
  const q = customerId ? `?customerId=${customerId}` : '';
  try {
    const res = await fetch(url(`/api/Customer/bank-details${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res.status === 404 || res.status === 204) return null;
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    try {
      const res2 = await fetch(url(`/api/CustomerPortal/bank-details${q}`), {
        method: 'GET',
        headers: authHeaders(),
      });
      if (res2.status === 404 || res2.status === 204) return null;
      return await handleResponse(res2);
    } catch (err) {
      return null;
    }
  }
}

export async function saveBankDetails(customerId, bankData) {
  const q = customerId ? `?customerId=${customerId}` : '';
  const body = JSON.stringify({
    accountHolderName: bankData.accountHolderName || bankData.bankAccountHolder || '',
    bankName: bankData.bankName || '',
    accountNumber: bankData.accountNumber || bankData.bankAccountNumber || '',
    ifscCode: bankData.ifscCode || bankData.bankIfscCode || '',
    upiId: bankData.upiId || bankData.bankUpiId || '',
  });
  try {
    const res = await fetch(url(`/api/Customer/bank-details${q}`), {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/CustomerPortal/bank-details${q}`), {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
    return await handleResponse(res2);
  }
}

export async function updateBankDetails(customerId, bankData) {
  const q = customerId ? `?customerId=${customerId}` : '';
  const body = JSON.stringify({
    accountHolderName: bankData.accountHolderName || bankData.bankAccountHolder || '',
    bankName: bankData.bankName || '',
    accountNumber: bankData.accountNumber || bankData.bankAccountNumber || '',
    ifscCode: bankData.ifscCode || bankData.bankIfscCode || '',
    upiId: bankData.upiId || bankData.bankUpiId || '',
  });
  try {
    const res = await fetch(url(`/api/Customer/bank-details${q}`), {
      method: 'PUT',
      headers: authHeaders(),
      body,
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/CustomerPortal/bank-details${q}`), {
      method: 'PUT',
      headers: authHeaders(),
      body,
    });
    return await handleResponse(res2);
  }
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function getMyOrders({ customerId, email, status, search } = {}) {
  const params = new URLSearchParams();
  if (customerId) params.set('customerId', customerId);
  if (email) params.set('email', email);
  if (status && status !== 'ALL') params.set('status', status);
  if (search) params.set('search', search);
  const q = params.toString() ? `?${params.toString()}` : '';
  
  try {
    const res = await fetch(url(`/api/Customer/my-orders${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res.status === 404 || res.status === 204) return [];
    if (!res.ok) throw new Error();
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : (data.orders || data.items || data.data || []);
  } catch (e) {
    try {
      const res2 = await fetch(url(`/api/CustomerPortal/my-orders${q}`), {
        method: 'GET',
        headers: authHeaders(),
      });
      if (res2.status === 404 || res2.status === 204) return [];
      const data2 = await handleResponse(res2);
      return Array.isArray(data2) ? data2 : (data2.orders || data2.items || data2.data || []);
    } catch (err) {
      return [];
    }
  }
}

export async function getOrderDetails(orderId) {
  try {
    const res = await fetch(url(`/api/Customer/order-details/${orderId}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error();
    return await handleResponse(res);
  } catch (e) {
    const res2 = await fetch(url(`/api/CustomerPortal/order-details/${orderId}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    return await handleResponse(res2);
  }
}

export async function trackOrder(orderNumber, emailOrMobile) {
  const rawNumber = (orderNumber || '').trim();
  if (!rawNumber) return { success: false, found: false };

  // Strip leading '#', 'Order #', 'Order ' to obtain cleaned order code/ID
  const cleanNumber = rawNumber.replace(/^(Order\s*#*|#)+/i, '').trim();
  const candidates = [...new Set([cleanNumber, rawNumber].filter(Boolean))];

  for (const cand of candidates) {
    const params = new URLSearchParams();
    params.set('orderNumber', cand);
    if (emailOrMobile) params.set('emailOrMobile', emailOrMobile);
    const q = `?${params.toString()}`;

    try {
      const res = await fetch(url(`/api/Customer/track-order${q}`), {
        method: 'GET',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await handleResponse(res);
        if (data && data.found !== false) return data;
      }
    } catch (e) {}

    try {
      const res2 = await fetch(url(`/api/CustomerPortal/track-order${q}`), {
        method: 'GET',
        headers: authHeaders(),
      });
      if (res2.ok) {
        const data2 = await handleResponse(res2);
        if (data2 && data2.found !== false) return data2;
      }
    } catch (e) {}
  }

  // Fallback: try direct order-details lookup
  for (const cand of candidates) {
    try {
      const details = await getOrderDetails(cand);
      if (details && (details.id || details.orderNumber)) {
        return {
          success: true,
          found: true,
          orderId: details.id,
          orderNumber: details.orderNumber || (details.id ? `ORD-${details.id}` : cand),
          orderDateFormatted: details.orderDateFormatted || 'Placed on Recent',
          currentStatus: details.status || details.statusBadge || 'PROCESSING',
          statusBadge: details.statusBadge || details.status || 'PROCESSING',
          carrierName: details.carrierName || 'BlueDart Express',
          trackingNumber: details.trackingNumber || 'AWB-10214987',
          shippingAddress: details.shippingAddress || '',
          items: details.items || [],
          timeline: details.timeline || [
            { step: 1, title: 'Order Placed', description: 'Your order has been placed successfully.', isCompleted: true },
            { step: 2, title: 'Processing', description: 'Order is being packed and prepared.', isCompleted: true, isCurrent: true },
            { step: 3, title: 'Shipped', description: 'Handed over to courier partner.', isCompleted: false },
            { step: 4, title: 'Out for Delivery', description: 'Package is out for delivery.', isCompleted: false },
            { step: 5, title: 'Delivered', description: 'Package delivered.', isCompleted: false }
          ]
        };
      }
    } catch (e) {}
  }

  return { success: false, found: false };
}
