import { getApiDomain } from '../utils/apiConfig';

const getBaseUrl = () => `${getApiDomain()}/api/Payment`;

/**
 * Builds HTTP headers for Payment API calls, injecting authentication tokens
 * and ngrok bypass headers automatically.
 */
const getHeaders = (isMultipart = false) => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (typeof window !== 'undefined') {
    const adminToken =
      sessionStorage.getItem('adminToken') ||
      localStorage.getItem('adminToken');
    const customerToken =
      localStorage.getItem('customerToken') ||
      localStorage.getItem('token');

    const activeToken = adminToken || customerToken;
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const guestToken = sessionStorage.getItem('guestCheckoutToken');
    if (guestToken) {
      headers['x-guest-token'] = guestToken;
    }
  }

  return headers;
};

/**
 * Extracts a clear, user-friendly error message from API responses without exposing
 * sensitive technical traces or credentials.
 */
const extractErrorMessage = (data, response, fallbackMsg = 'Payment request failed') => {
  if (data) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.Message === 'string' && data.Message.trim()) return data.Message.trim();
    if (typeof data.title === 'string' && data.title.trim()) return data.title.trim();
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim();
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
    if (data.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat().filter(Boolean);
      if (messages.length > 0) return messages.join(' | ');
    }
  }

  switch (response?.status) {
    case 400:
      return 'Bad Request (400): Please check the payment and order details.';
    case 401:
      return 'Authentication required. Please log in to complete payment.';
    case 403:
      return 'Access denied: You are not authorized to process payment for this order.';
    case 404:
      return 'Order or payment record not found on the server.';
    case 409:
      return 'Duplicate payment attempt detected. Please verify transaction status.';
    case 422:
      return 'Validation failed on the payment server.';
    case 503:
      return 'Payment gateway service is temporarily unavailable. Please try again shortly.';
    case 500:
      return 'Payment service encountered a temporary error. Please retry.';
    default:
      return `${fallbackMsg} (${response?.status || 'Network error'})`;
  }
};

// ============================================================================
// CASHFREE PAYMENT GATEWAY APIS (PHASE 2 & 4)
// ============================================================================

/**
 * POST /api/Payment/cashfree/create-order
 * Creates a Cashfree Sandbox payment order session for an existing application order.
 *
 * @param {object} payload
 * @param {string|number} payload.orderId - Application Order ID or Order Number
 * @param {string} [payload.returnUrl] - Optional client return URL (defaults to /order-success?order_id={order_id})
 * @param {string} [payload.notifyUrl] - Optional webhook notification URL
 * @param {string} [payload.customerEmail] - Customer email for guest verification
 * @param {string} [payload.customerPhone] - Customer phone for guest verification
 * @param {string} [payload.idempotencyKey] - Optional idempotency key to prevent double charging
 * @returns {Promise<{
 *   success: boolean,
 *   message: string,
 *   orderId: number,
 *   orderNumber: string,
 *   cfOrderId: string,
 *   paymentSessionId: string,
 *   amount: number,
 *   currency: string,
 *   environment: string,
 *   status: string,
 *   errorCode?: string
 * }>}
 */
export async function createCashfreeOrder(payload) {
  if (!payload || !payload.orderId) {
    return {
      success: false,
      message: 'Order ID is required to create a Cashfree payment session.',
      status: 400,
    };
  }

  const body = {
    orderId: String(payload.orderId).trim(),
    returnUrl: payload.returnUrl || undefined,
    notifyUrl: payload.notifyUrl || undefined,
    customerEmail: payload.customerEmail || undefined,
    customerPhone: payload.customerPhone || undefined,
    guestToken: payload.guestToken || undefined,
    idempotencyKey: payload.idempotencyKey || undefined,
  };

  try {
    const response = await fetch(`${getBaseUrl()}/cashfree/create-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to create Cashfree payment order'),
        status: response.status,
        errorCode: data.errorCode || null,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error connecting to Cashfree payment gateway: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * GET /api/Payment/cashfree/order/{orderRef}
 * Retrieves the latest Cashfree payment transaction status for an order from the database.
 *
 * @param {string|number} orderRef - Application order ID, Order Number, or Cashfree order ID
 * @returns {Promise<{
 *   success: boolean,
 *   orderId?: number,
 *   orderNumber?: string,
 *   cfOrderId?: string,
 *   paymentSessionId?: string,
 *   amount?: number,
 *   currency?: string,
 *   status?: string,
 *   gateway?: string,
 *   createdAt?: string,
 *   updatedAt?: string,
 *   message?: string
 * }>}
 */
export async function getCashfreeOrderDetails(orderRef) {
  if (!orderRef || String(orderRef).trim() === '') {
    return { success: false, message: 'Order reference is required.' };
  }

  const cleanRef = encodeURIComponent(String(orderRef).trim());

  try {
    const response = await fetch(`${getBaseUrl()}/cashfree/order/${cleanRef}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch Cashfree order details'),
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error checking Cashfree transaction: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * GET /api/Payment/cashfree/verify/{orderRef}
 * Authoritatively verifies and reconciles Cashfree Sandbox payment status
 * against Cashfree PG APIs and reconciles application order status.
 *
 * @param {string|number} orderRef - Application Order ID, Order Number, or Cashfree Order ID
 * @param {object} [params]
 * @param {string} [params.customerEmail] - Customer email for guest verification
 * @param {string} [params.customerPhone] - Customer phone for guest verification
 * @returns {Promise<{
 *   success: boolean,
 *   isPaid: boolean,
 *   status: string,
 *   message: string,
 *   orderId?: number,
 *   orderNumber?: string,
 *   cfOrderId?: string,
 *   cfPaymentId?: string,
 *   amount?: number,
 *   currency?: string,
 *   paymentMethod?: string,
 *   bankReference?: string,
 *   verifiedAt?: string
 * }>}
 */
export async function verifyCashfreePayment(orderRef, params = {}) {
  if (!orderRef || String(orderRef).trim() === '') {
    return { success: false, isPaid: false, message: 'Order reference is required.' };
  }

  const cleanRef = encodeURIComponent(String(orderRef).trim());
  const queryParams = new URLSearchParams();
  if (params.customerEmail) queryParams.set('customerEmail', params.customerEmail.trim());
  if (params.customerPhone) queryParams.set('customerPhone', params.customerPhone.trim());
  if (params.guestToken) queryParams.set('guestToken', params.guestToken.trim());
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const headers = getHeaders();
  if (params.guestToken) {
    headers['x-guest-token'] = params.guestToken.trim();
  }

  try {
    const response = await fetch(`${getBaseUrl()}/cashfree/verify/${cleanRef}${queryString}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        isPaid: false,
        message: extractErrorMessage(data, response, 'Failed to verify Cashfree payment status'),
        status: data.status || 'Failed',
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      isPaid: false,
      message: `Network error verifying payment with gateway: ${err.message}`,
      status: 'NetworkError',
    };
  }
}

// ============================================================================
// PAYMENT INITIATION, STATUS & COMPLETION APIS
// ============================================================================

/**
 * POST /api/Payment/initiate
 * Initiates a payment transaction using real order information.
 * Supports: UPI, DebitCard, CreditCard, NetBanking, QRPayment, COD
 */
export async function initiatePayment(payload) {
  if (!payload || !payload.paymentMethod) {
    return { success: false, message: 'PaymentMethod is required.' };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/initiate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Initiate payment failed'),
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error initiating payment: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * GET /api/Payment/status/{transactionId}
 * Checks transaction status by transaction ID or UTR.
 */
export async function getPaymentStatus(transactionId) {
  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
    return { success: false, message: 'Invalid transaction ID provided.' };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/status/${encodeURIComponent(transactionId.trim())}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 404) {
      return { success: false, message: 'Transaction record not found.', status: 404 };
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Payment status check failed'),
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error checking payment status: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * POST /api/Payment/complete
 * Completes a pending payment transaction using authorized transaction ID.
 */
export async function completePayment(transactionId) {
  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
    return { success: false, message: 'Transaction ID is required to complete payment.' };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transactionId: transactionId.trim() }),
    });

    if (response.status === 404) {
      return { success: false, message: 'Transaction record not found.', status: 404 };
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Payment completion failed'),
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error completing payment: ${err.message}`,
      status: 0,
    };
  }
}

// ============================================================================
// NETBANKING & CARD OTP APIS
// ============================================================================

/**
 * POST /api/Payment/netbanking/login
 * Simulates netbanking login authentication.
 */
export async function netbankingLogin(payload) {
  try {
    const bodyData = {
      transactionId: payload.transactionId,
      username: payload.username,
      password: payload.password,
    };

    const response = await fetch(`${getBaseUrl()}/netbanking/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bodyData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Netbanking login failed'),
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error during netbanking login: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * POST /api/Payment/netbanking/verify-otp
 * Verifies netbanking OTP code.
 */
export async function netbankingVerifyOtp(payload) {
  try {
    const bodyData = {
      transactionId: payload.transactionId,
      otp: payload.otp,
    };

    const response = await fetch(`${getBaseUrl()}/netbanking/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bodyData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Netbanking OTP verification failed'),
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error verifying netbanking OTP: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * POST /api/Payment/card/verify-otp
 * Verifies 3DS card OTP code.
 */
export async function cardVerifyOtp(payload) {
  try {
    const bodyData = {
      transactionId: payload.transactionId,
      otp: payload.otp,
    };

    const response = await fetch(`${getBaseUrl()}/card/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bodyData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Card OTP verification failed'),
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error verifying card OTP: ${err.message}`,
      status: 0,
    };
  }
}

// ============================================================================
// QR CODE & UPI INTEGRATION APIS
// ============================================================================

/**
 * GET /api/Payment/qr-code
 * Fetches default static / global QR code configuration.
 */
export async function getQrCode() {
  try {
    const response = await fetch(`${getBaseUrl()}/qr-code`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch global QR code'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error fetching global QR code: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * GET /api/Payment/qr/{orderId}
 * Fetches UPI deep link and QR payload for a specific order.
 */
export async function getQrByOrderId(orderId, amount) {
  if (!orderId) return { success: false, message: 'Order ID is required.' };

  const query = amount ? `?amount=${encodeURIComponent(amount)}` : '';

  try {
    const response = await fetch(`${getBaseUrl()}/qr/${encodeURIComponent(orderId)}${query}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch QR payload for order'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error fetching order QR payload: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * GET /api/Payment/qr-code/{orderId}
 * Fetches QR code image URL and UPI payload for a specific order.
 */
export async function getQrCodeByOrderId(orderId, amount) {
  if (!orderId) return { success: false, message: 'Order ID is required.' };

  const query = amount ? `?amount=${encodeURIComponent(amount)}` : '';

  try {
    const response = await fetch(`${getBaseUrl()}/qr-code/${encodeURIComponent(orderId)}${query}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch QR code image for order'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error fetching order QR image: ${err.message}`,
      status: 0,
    };
  }
}

// ============================================================================
// BANK & UPI DETAILS (ADMIN & CHECKOUT)
// ============================================================================

/**
 * GET /api/Payment/bank-details
 * Fetches merchant corporate bank details from server.
 */
export async function getBankDetails() {
  try {
    const response = await fetch(`${getBaseUrl()}/bank-details`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch bank details'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error fetching bank details: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * PUT/POST /api/Payment/bank-details
 * Updates merchant corporate bank details on server.
 */
export async function updateBankDetails(details, usePost = false) {
  try {
    const response = await fetch(`${getBaseUrl()}/bank-details`, {
      method: usePost ? 'POST' : 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(details),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to update bank details'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error updating bank details: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * GET /api/Payment/upi-details
 * Fetches merchant UPI details from server.
 */
export async function getUpiDetails() {
  try {
    const response = await fetch(`${getBaseUrl()}/upi-details`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch UPI details'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error fetching UPI details: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * PUT/POST /api/Payment/upi-details
 * Updates merchant UPI details on server.
 */
export async function updateUpiDetails(details, usePost = false) {
  try {
    const response = await fetch(`${getBaseUrl()}/upi-details`, {
      method: usePost ? 'POST' : 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(details),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to update UPI details'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error updating UPI details: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * GET /api/Payment/qr-config
 * Fetches QR configuration image URL.
 */
export async function getQrConfig() {
  try {
    const response = await fetch(`${getBaseUrl()}/qr-config`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch QR config'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error fetching QR config: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * PUT /api/Payment/qr-config
 * Updates QR configuration on server (supports FormData with File or JSON).
 */
export async function updateQrConfig(dataOrFormData) {
  const isFormData = dataOrFormData instanceof FormData;
  try {
    const response = await fetch(`${getBaseUrl()}/qr-config`, {
      method: 'PUT',
      headers: getHeaders(isFormData),
      body: isFormData ? dataOrFormData : JSON.stringify(dataOrFormData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to update QR config'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error updating QR config: ${err.message}`,
      status: 0,
    };
  }
}

// ============================================================================
// MANUAL VERIFICATION & RECONCILIATION
// ============================================================================

/**
 * GET /api/Payment/manual-verifications
 * Fetches manual bank transfer verifications list with search and status filtering.
 */
export async function getManualVerifications(search = '', status = 'All') {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (status && status !== 'All') params.append('status', status.trim());

  const queryString = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetch(`${getBaseUrl()}/manual-verifications${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ([]));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch manual verifications'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error fetching manual verifications: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * PUT /api/Payment/verify-manual/{id}/status
 * Updates manual verification status (Approved/Verified, Rejected, Pending).
 */
export async function updateManualVerificationStatus(id, status) {
  if (!id) return { success: false, message: 'Verification ID is required.' };

  try {
    const response = await fetch(`${getBaseUrl()}/verify-manual/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to update verification status'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error updating verification status: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * DELETE /api/Payment/verify-manual/{id}
 * Deletes a manual verification record.
 */
export async function deleteManualVerification(id) {
  if (!id) return { success: false, message: 'Verification ID is required.' };

  try {
    const response = await fetch(`${getBaseUrl()}/verify-manual/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to delete verification record'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error deleting verification record: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * POST /api/Payment/verify-manual
 * Submits customer manual bank transfer verification details with receipt screenshot.
 */
export async function submitManualVerification(formData) {
  const amountVal = formData instanceof FormData
    ? Number(formData.get('AmountPaid'))
    : Number(formData?.AmountPaid);

  if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
    return {
      success: false,
      message: 'Amount Paid must be greater than zero.',
      status: 400,
    };
  }

  const isMultipart = formData instanceof FormData;
  const bodyData = isMultipart ? formData : JSON.stringify(formData);

  try {
    const response = await fetch(`${getBaseUrl()}/verify-manual`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: bodyData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Manual verification submission failed'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error submitting manual verification: ${err.message}`,
      status: 0,
    };
  }
}

/**
 * POST /api/Payment/reconcile-sms
 * Reconciles bank SMS credit text to automatically verify pending manual payments.
 */
export async function reconcileSms(smsPayload) {
  const payloadStr = typeof smsPayload === 'object' ? smsPayload?.smsPayload : smsPayload;

  if (!payloadStr || typeof payloadStr !== 'string' || !payloadStr.trim()) {
    return {
      success: false,
      message: 'Bank credit SMS payload text is required.',
      status: 400,
    };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/reconcile-sms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ smsPayload: payloadStr.trim() }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to reconcile bank SMS'),
        status: response.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error reconciling SMS: ${err.message}`,
      status: 0,
    };
  }
}

// ============================================================================
// LEGACY COMPATIBILITY HELPERS
// ============================================================================

/**
 * @deprecated Use Cashfree Sandbox hosted checkout instead.
 */
export async function createRazorpayOrder(amount, currency = 'INR', orderId = '') {
  return createCashfreeOrder({ orderId, customerEmail: '', customerPhone: '' });
}

/**
 * @deprecated Use Cashfree Sandbox payment verification instead.
 */
export async function verifyRazorpayPayment(payload) {
  return getCashfreeOrderDetails(payload?.orderId || '');
}
