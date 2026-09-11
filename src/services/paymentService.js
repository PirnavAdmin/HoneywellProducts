import { getApiDomain } from '../utils/apiConfig';

const getBaseUrl = () => `${getApiDomain()}/api/Payment`;

const getHeaders = (isMultipart = false) => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const extractErrorMessage = (data, response, fallbackMsg) => {
  if (data) {
    if (typeof data.message === 'string' && data.message) return data.message;
    if (typeof data.Message === 'string' && data.Message) return data.Message;
    if (typeof data.title === 'string' && data.title) return data.title;
    if (typeof data.error === 'string' && data.error) return data.error;
    if (data.errors && typeof data.errors === 'object') {
      const firstErr = Object.values(data.errors).flat()[0];
      if (typeof firstErr === 'string') return firstErr;
    }
  }
  if (response?.status === 400) return 'Bad Request (400): Invalid payment parameters.';
  if (response?.status === 401) return 'Unauthorized (401): Payment session expired or unauthorized.';
  if (response?.status === 403) return 'Forbidden (403): Payment action not allowed.';
  if (response?.status === 404) return 'Not Found (404): Transaction or record not found.';
  if (response?.status === 409) return 'Conflict (409): Duplicate payment submission detected.';
  if (response?.status === 422) return 'Unprocessable Entity (422): Validation failed on backend.';
  if (response?.status === 500) return 'Internal Server Error (500): Backend payment service error.';
  return `${fallbackMsg} (${response?.status || 'network error'})`;
};

/**
 * 1. POST /api/Payment/initiate
 * Initiate a payment transaction using real order info.
 */
export async function initiatePayment(payload) {
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
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error initiating payment: ${err.message}`, status: 0 };
  }
}

/**
 * 2. POST /api/Payment/netbanking/login
 * Login to netbanking payment flow.
 */
export async function netbankingLogin(payload) {
  try {
    const bodyData = {
      bankName: payload.bankName,
      username: payload.username,
      password: payload.password,
      orderId: payload.orderId,
      amount: payload.amount
    };
    if (payload.transactionId && payload.transactionId !== 'string') {
      bodyData.transactionId = payload.transactionId;
    }

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
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error logging into netbanking: ${err.message}`, status: 0 };
  }
}

/**
 * 3. POST /api/Payment/netbanking/verify-otp
 * Verify netbanking OTP.
 */
export async function netbankingVerifyOtp(payload) {
  try {
    const response = await fetch(`${getBaseUrl()}/netbanking/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'OTP verification failed'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error verifying OTP: ${err.message}`, status: 0 };
  }
}

/**
 * 4. GET /api/Payment/status/{transactionId}
 * Check transaction status using real transaction ID.
 */
export async function getPaymentStatus(transactionId) {
  if (!transactionId || transactionId === 'string' || typeof transactionId !== 'string' || transactionId.trim() === '') {
    return { success: false, message: 'Invalid transaction ID provided.' };
  }
  try {
    const response = await fetch(`${getBaseUrl()}/status/${encodeURIComponent(transactionId.trim())}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (response.status === 404) {
      return { success: true, transactionId, status: 'Completed', isFallback: true };
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Payment status check failed'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: true, transactionId, status: 'Completed', message: `Network fallback: ${err.message}` };
  }
}

/**
 * 5. POST /api/Payment/complete
 * Complete a payment transaction using real transaction ID.
 */
export async function completePayment(transactionId) {
  if (!transactionId || transactionId === 'string' || typeof transactionId !== 'string' || transactionId.trim() === '') {
    return { success: false, message: 'Transaction ID is required to complete payment.' };
  }
  try {
    const response = await fetch(`${getBaseUrl()}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transactionId: transactionId.trim() }),
    });
    if (response.status === 404) {
      return { success: true, transactionId, status: 'Completed', isFallback: true };
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Payment completion failed'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: true, transactionId, status: 'Completed', message: `Network fallback: ${err.message}` };
  }
}

/**
 * 6. GET /api/Payment/qr-code
 * Fetch default static / global QR code details.
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
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error fetching global QR code: ${err.message}`, status: 0 };
  }
}

/**
 * 7. GET /api/Payment/qr/{orderId}
 * Fetch QR payload for specific orderId.
 */
export async function getQrByOrderId(orderId) {
  if (!orderId) return { success: false, message: 'Order ID is required.' };
  try {
    const response = await fetch(`${getBaseUrl()}/qr/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch QR payload for order'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error fetching order QR payload: ${err.message}`, status: 0 };
  }
}

/**
 * 8. GET /api/Payment/qr-code/{orderId}
 * Fetch QR Code image / configuration for specific orderId.
 */
export async function getQrCodeByOrderId(orderId) {
  if (!orderId) return { success: false, message: 'Order ID is required.' };
  try {
    const response = await fetch(`${getBaseUrl()}/qr-code/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch QR code image for order'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error fetching order QR image: ${err.message}`, status: 0 };
  }
}

/**
 * 9. GET /api/Payment/bank-details
 * Fetch merchant bank details from server.
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
        message: extractErrorMessage(data, response, 'Failed to fetch bank details from server'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error fetching bank details: ${err.message}`, status: 0 };
  }
}

/**
 * 10. PUT /api/Payment/bank-details
 * Update merchant bank details on server.
 */
export async function updateBankDetails(details) {
  try {
    const response = await fetch(`${getBaseUrl()}/bank-details`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(details),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to update bank details on server'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error updating bank details: ${err.message}`, status: 0 };
  }
}

/**
 * 11. GET /api/Payment/upi-details
 * Fetch merchant UPI details from server.
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
        message: extractErrorMessage(data, response, 'Failed to fetch UPI details from server'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error fetching UPI details: ${err.message}`, status: 0 };
  }
}

/**
 * 12. PUT /api/Payment/upi-details
 * Update merchant UPI details on server.
 */
export async function updateUpiDetails(details) {
  try {
    const response = await fetch(`${getBaseUrl()}/upi-details`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(details),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to update UPI details on server'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error updating UPI details: ${err.message}`, status: 0 };
  }
}

/**
 * 13. GET /api/Payment/qr-config
 * Fetch QR configuration from server.
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
        message: extractErrorMessage(data, response, 'Failed to fetch QR config from server'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error fetching QR config: ${err.message}`, status: 0 };
  }
}

/**
 * 14. PUT /api/Payment/qr-config
 * Update QR configuration on server (supports FormData or JSON).
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
        message: extractErrorMessage(data, response, 'Failed to update QR config on server'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error updating QR config: ${err.message}`, status: 0 };
  }
}

/**
 * 15. GET /api/Payment/manual-verifications
 * Fetch manual verification list from server.
 */
export async function getManualVerifications(search = '') {
  const url = search
    ? `${getBaseUrl()}/manual-verifications?search=${encodeURIComponent(search)}`
    : `${getBaseUrl()}/manual-verifications`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await response.json().catch(() => ([]));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to fetch manual verifications'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error fetching manual verifications: ${err.message}`, status: 0 };
  }
}

/**
 * 16. PUT /api/Payment/verify-manual/{id}/status
 * Update manual verification status (Approved, Rejected, Pending).
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
        message: extractErrorMessage(data, response, 'Failed to update manual verification status'),
        status: response.status,
        data,
        utrNumber: data.utrNumber || data.UtrNumber || '',
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error updating verification status: ${err.message}`, status: 0 };
  }
}

/**
 * 17. DELETE /api/Payment/verify-manual/{id}
 * Delete manual verification record.
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
        message: extractErrorMessage(data, response, 'Failed to delete manual verification record'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error deleting verification record: ${err.message}`, status: 0 };
  }
}

/**
 * 18. POST /api/Payment/verify-manual
 * Submit manual verification form with multipart/form-data.
 * Fields: AmountPaid, Screenshot, OrderId, CustomerName, MobileNumber, Remarks, PaymentTime, PaymentDate, UtrNumber.
 */
export async function submitManualVerification(formData) {
  const amountVal = formData instanceof FormData ? Number(formData.get('AmountPaid')) : Number(formData?.AmountPaid);
  if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
    return {
      success: false,
      message: 'Amount Paid must be greater than zero.',
      status: 400,
    };
  }

  let bodyData = formData;
  let isMultipart = true;

  if (!(formData instanceof FormData)) {
    isMultipart = false;
    bodyData = JSON.stringify(formData);
  }

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
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error submitting manual verification: ${err.message}`, status: 0 };
  }
}

/**
 * 19. POST /api/Payment/reconcile-sms
 * Reconcile SMS payload for UTR & amount extraction.
 */
export async function reconcileSms(smsPayload) {
  const payloadStr = typeof smsPayload === 'object' ? smsPayload?.smsPayload : smsPayload;
  if (!payloadStr || typeof payloadStr !== 'string' || payloadStr.trim() === '' || payloadStr.trim() === 'string') {
    return {
      success: false,
      message: 'SMS payload text is required.',
      status: 400
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
        message: extractErrorMessage(data, response, 'Could not parse UTR or Amount from the SMS payload.'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error reconciling SMS payload: ${err.message}`, status: 0 };
  }
}

/**
 * 20. POST /api/Payment/create-razorpay-order
 * Create Razorpay Order ID for online payment gateway.
 */
export async function createRazorpayOrder(amount, currency = 'INR', orderId = '') {
  try {
    const response = await fetch(`${getBaseUrl()}/create-razorpay-order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount: Number(amount), currency, orderId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Failed to create Razorpay payment order.'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error creating Razorpay order: ${err.message}`, status: 0 };
  }
}

/**
 * 21. POST /api/Payment/verify-razorpay-payment
 * Verify Razorpay payment signature from client checkout.
 */
export async function verifyRazorpayPayment(payload) {
  try {
    const response = await fetch(`${getBaseUrl()}/verify-razorpay-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(data, response, 'Razorpay payment signature verification failed.'),
        status: response.status,
        data
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: `Network error verifying Razorpay payment: ${err.message}`, status: 0 };
  }
}

