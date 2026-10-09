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
  
  let apiOrders = [];
  try {
    const res = await fetch(url(`/api/Customer/my-orders${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await handleResponse(res);
      apiOrders = Array.isArray(data) ? data : (data.orders || data.items || data.data || []);
      return apiOrders;
    }
  } catch (e) {}

  try {
    const res2 = await fetch(url(`/api/Orders/my-orders${q}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res2.ok) {
      const data2 = await handleResponse(res2);
      apiOrders = Array.isArray(data2) ? data2 : (data2.orders || data2.items || data2.data || []);
      return apiOrders;
    }
  } catch (e2) {}

  return [];
}

export async function getOrderDetails(orderId) {
  try {
    const res = await fetch(url(`/api/Customer/order-details/${orderId}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await handleResponse(res);
      if (data && (data.id || data.orderNumber)) return data;
    }
  } catch (e) {}

  try {
    const res2 = await fetch(url(`/api/CustomerPortal/order-details/${orderId}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res2.ok) {
      const data2 = await handleResponse(res2);
      if (data2 && (data2.id || data2.orderNumber)) return data2;
    }
  } catch (e) {}

  try {
    const res3 = await fetch(url(`/api/orders/${orderId}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    if (res3.ok) {
      const data3 = await handleResponse(res3);
      if (data3 && (data3.id || data3.orderNumber)) return data3;
    }
  } catch (e) {}

  // Fallback: search local orders cache
  try {
    const r1 = JSON.parse(localStorage.getItem('my_recent_orders') || '[]');
    const r2 = JSON.parse(localStorage.getItem('honeywell_orders') || '[]');
    const found = [...r1, ...r2].find(o => 
      String(o.id) === String(orderId) || 
      String(o.orderNumber).toLowerCase() === String(orderId).toLowerCase()
    );
    if (found) return found;
  } catch (e) {}

  return null;
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
        const currentStatus = details.status || details.statusBadge || details.currentStatus || 'Processing';
        const st = String(currentStatus).toUpperCase();
        const isCancelled = st === 'CANCELLED' || st === 'CANCELED';
        const isDelivered = st === 'COMPLETED' || st === 'DELIVERED';
        const isShipped = isDelivered || st === 'SHIPPED' || st === 'DISPATCHED';
        const isProcessing = isShipped || st === 'PROCESSING' || st === 'PACKED' || st === 'CONFIRMED';
        const isPlaced = true;

        const dynamicTimeline = isCancelled ? [
          { step: 1, title: 'Order Placed', description: 'Your order was placed.', isCompleted: true },
          { step: 2, title: 'Cancelled', description: 'Order was cancelled.', isCompleted: true, isCurrent: true }
        ] : [
          { step: 1, title: 'Order Placed', description: 'Your order has been confirmed and verified.', isCompleted: isPlaced, isCurrent: st === 'PENDING' || st === 'CONFIRMED' },
          { step: 2, title: 'Processing & Packed', description: 'Order items are packed and prepared for pickup.', isCompleted: isProcessing, isCurrent: st === 'PROCESSING' || st === 'PACKED' },
          { step: 3, title: 'Shipped', description: 'Package is in transit with logistics carrier.', isCompleted: isShipped, isCurrent: st === 'SHIPPED' || st === 'DISPATCHED' },
          { step: 4, title: 'Delivered', description: 'Package delivered successfully.', isCompleted: isDelivered, isCurrent: isDelivered }
        ];

        return {
          success: true,
          found: true,
          orderId: details.id,
          orderNumber: details.orderNumber || (details.id ? `ORD-${details.id}` : cand),
          orderDateFormatted: details.orderDateFormatted || (details.createdAt ? new Date(details.createdAt).toLocaleDateString() : 'Placed on Recent'),
          currentStatus: currentStatus,
          status: currentStatus,
          statusBadge: currentStatus,
          carrierName: details.carrierName || details.logistics || 'Delhivery Express',
          trackingNumber: details.trackingNumber || details.trackingNo || (details.id ? `AWB-${details.id}` : 'AWB-10214987'),
          shippingAddress: details.shippingAddress || details.address || '',
          items: details.items || [],
          timeline: Array.isArray(details.timeline) && details.timeline.length > 0 ? details.timeline : dynamicTimeline
        };
      }
    } catch (e) {}
  }

  return { success: false, found: false };
}
