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

/**
 * 1. POST /api/Payment/initiate
 * Initiate a payment transaction.
 */
export async function initiatePayment(payload) {
  const response = await fetch(`${getBaseUrl()}/initiate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Initiate payment failed (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 2. POST /api/Payment/netbanking/login
 * Initiate/login to netbanking payment flow.
 */
export async function netbankingLogin(payload) {
  const bodyData = {
    transactionId: payload.transactionId || `TXN-NB-${Date.now()}`,
    bankName: payload.bankName,
    username: payload.username,
    password: payload.password,
    orderId: payload.orderId,
    amount: payload.amount
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
      message: data.message || data.Message || `Netbanking login failed (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 3. POST /api/Payment/netbanking/verify-otp
 * Verify netbanking OTP.
 */
export async function netbankingVerifyOtp(payload) {
  const response = await fetch(`${getBaseUrl()}/netbanking/verify-otp`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `OTP verification failed (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 4. GET /api/Payment/status/{transactionId}
 * Check transaction status.
 */
export async function getPaymentStatus(transactionId) {
  if (!transactionId || transactionId === 'string') {
    return { success: false, message: 'Invalid transaction ID provided.' };
  }
  const response = await fetch(`${getBaseUrl()}/status/${encodeURIComponent(transactionId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Status check failed (${response.status})`,
      status: response.status,
    };
  }
  return data;
}


/**
 * 5. POST /api/Payment/complete
 * Complete a payment transaction.
 */
export async function completePayment(transactionId) {
  if (!transactionId || transactionId === 'string') {
    return { success: false, message: 'Transaction not found.' };
  }
  const response = await fetch(`${getBaseUrl()}/complete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ transactionId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Payment completion failed (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 6. GET /api/Payment/qr-code
 * Fetch global default QR code details.
 */
export async function getQrCode() {
  const response = await fetch(`${getBaseUrl()}/qr-code`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to fetch QR code (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 7. GET /api/Payment/qr/{orderId}
 * Fetch QR payload for specific orderId.
 */
export async function getQrByOrderId(orderId) {
  if (!orderId) return { success: false, message: 'Order ID is required.' };
  const response = await fetch(`${getBaseUrl()}/qr/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to fetch QR for order (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 8. GET /api/Payment/qr-code/{orderId}
 * Fetch QR Code image / configuration for specific orderId.
 */
export async function getQrCodeByOrderId(orderId) {
  if (!orderId) return { success: false, message: 'Order ID is required.' };
  const response = await fetch(`${getBaseUrl()}/qr-code/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to fetch QR code for order (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 9. GET /api/Payment/bank-details
 * Fetch merchant bank details.
 */
export async function getBankDetails() {
  const response = await fetch(`${getBaseUrl()}/bank-details`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to fetch bank details (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 10. PUT /api/Payment/bank-details
 * Update merchant bank details.
 */
export async function updateBankDetails(details) {
  const response = await fetch(`${getBaseUrl()}/bank-details`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(details),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to update bank details (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 11. GET /api/Payment/upi-details
 * Fetch merchant UPI details.
 */
export async function getUpiDetails() {
  const response = await fetch(`${getBaseUrl()}/upi-details`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to fetch UPI details (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 12. PUT /api/Payment/upi-details
 * Update merchant UPI details.
 */
export async function updateUpiDetails(details) {
  const response = await fetch(`${getBaseUrl()}/upi-details`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(details),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to update UPI details (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 13. GET /api/Payment/qr-config
 * Fetch QR configuration.
 */
export async function getQrConfig() {
  const response = await fetch(`${getBaseUrl()}/qr-config`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to fetch QR config (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 14. PUT /api/Payment/qr-config
 * Update QR configuration (supports FormData or JSON).
 */
export async function updateQrConfig(dataOrFormData) {
  const isFormData = dataOrFormData instanceof FormData;
  const response = await fetch(`${getBaseUrl()}/qr-config`, {
    method: 'PUT',
    headers: getHeaders(isFormData),
    body: isFormData ? dataOrFormData : JSON.stringify(dataOrFormData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to update QR config (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 15. GET /api/Payment/manual-verifications
 * Fetch manual verification list.
 */
export async function getManualVerifications(search = '') {
  const url = search
    ? `${getBaseUrl()}/manual-verifications?search=${encodeURIComponent(search)}`
    : `${getBaseUrl()}/manual-verifications`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ([]));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to fetch manual verifications (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 16. PUT /api/Payment/verify-manual/{id}/status
 * Update manual verification status (Approved, Rejected, Pending).
 */
export async function updateManualVerificationStatus(id, status) {
  if (!id) return { success: false, message: 'Verification ID is required.' };
  const response = await fetch(`${getBaseUrl()}/verify-manual/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to update verification status (${response.status})`,
      status: response.status,
      utrNumber: data.utrNumber || data.UtrNumber || '',
    };
  }
  return data;
}

/**
 * 17. DELETE /api/Payment/verify-manual/{id}
 * Delete manual verification record.
 */
export async function deleteManualVerification(id) {
  if (!id) return { success: false, message: 'Verification ID is required.' };
  const response = await fetch(`${getBaseUrl()}/verify-manual/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Failed to delete manual verification (${response.status})`,
      status: response.status,
    };
  }
  return data;
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

  const response = await fetch(`${getBaseUrl()}/verify-manual`, {
    method: 'POST',
    headers: getHeaders(isMultipart),
    body: bodyData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || `Manual verification failed (${response.status})`,
      status: response.status,
    };
  }
  return data;
}

/**
 * 19. POST /api/Payment/reconcile-sms
 * Reconcile SMS payload for UTR & amount extraction.
 */
export async function reconcileSms(smsPayload) {
  const payloadStr = typeof smsPayload === 'object' ? smsPayload.smsPayload : smsPayload;
  const response = await fetch(`${getBaseUrl()}/reconcile-sms`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ smsPayload: payloadStr }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.Message || 'Could not parse UTR or Amount from the SMS payload.',
      status: response.status,
    };
  }
  return data;
}
