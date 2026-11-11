/**
 * apiError.js - Centralized API & Server Error Sanitization
 * Translates low-level errors (ngrok tunnel, 502 Bad Gateway, connection refused)
 * into clean, professional, enterprise-grade user feedback without exposing internal infrastructure.
 */

import { getApiDomain } from './apiConfig';

/**
 * Checks if an error is caused by the backend server being offline or unreachable.
 */
export function isServerOfflineError(err) {
  if (!err) return false;

  // HTTP status checks
  const status = err.status || err.response?.status;
  if ([502, 503, 504].includes(status)) {
    return true;
  }

  // Axios or network code checks
  const code = err.code || err.response?.data?.code;
  if (['ECONNREFUSED', 'ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND'].includes(code)) {
    return true;
  }

  // String check across message, response text, and data
  const raw = [
    err.message,
    typeof err.response?.data === 'string' ? err.response?.data : '',
    err.response?.data?.message,
    err.response?.data?.title,
    err.response?.data?.error,
    err.rawText
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    raw.includes('err_ngrok') ||
    raw.includes('ngrok') ||
    raw.includes('failed to establish a connection') ||
    raw.includes('upstream web service') ||
    raw.includes('localhost:5119') ||
    raw.includes('connection refused') ||
    raw.includes('failed to fetch') ||
    raw.includes('network error') ||
    raw.includes('networkerror') ||
    raw.includes('bad gateway') ||
    raw.includes('service unavailable') ||
    raw.includes('gateway timeout')
  );
}

/**
 * Extracts any developer diagnostic code (e.g. ERR_NGROK_8012, 502, ECONNREFUSED)
 * to be shown strictly in collapsible/diagnostic view, NEVER in the primary user message.
 */
export function extractDiagnosticCode(err) {
  if (!err) return null;

  const raw = [
    err.message,
    typeof err.response?.data === 'string' ? err.response?.data : '',
    err.response?.data?.message,
    err.response?.data?.error
  ]
    .filter(Boolean)
    .join(' ');

  const ngrokMatch = raw.match(/ERR_NGROK_\d+/i);
  if (ngrokMatch) return ngrokMatch[0].toUpperCase();

  const status = err.status || err.response?.status;
  if (status) return `HTTP ${status}`;

  if (err.code) return err.code;

  return null;
}

/**
 * Formats any caught error into a clean, professional, enterprise-grade error object.
 */
export function formatApiError(err, fallback = 'Unable to complete request. Please try again.') {
  if (!err) {
    return {
      isOffline: false,
      title: 'Request Failed',
      message: fallback,
      diagnostic: null
    };
  }

  if (isServerOfflineError(err)) {
    const diagnostic = extractDiagnosticCode(err);
    return {
      isOffline: true,
      title: 'Server Temporarily Offline',
      message:
        'The backend server is currently offline or unreachable. Please verify that the server service is started and try again.',
      diagnostic: diagnostic ? `${diagnostic} • Upstream service unreachable` : null
    };
  }

  // Handle known HTTP status errors
  const status = err.status || err.response?.status;
  if (status === 401) {
    return {
      isOffline: false,
      title: 'Authentication Failed',
      message:
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Invalid credentials. Please verify your email/ID and password.',
      diagnostic: null
    };
  }

  if (status === 403) {
    return {
      isOffline: false,
      title: 'Access Denied',
      message:
        err.response?.data?.message ||
        'You do not have administrative authorization to access this portal.',
      diagnostic: null
    };
  }

  if (status === 404) {
    return {
      isOffline: false,
      title: 'Account Not Found',
      message:
        err.response?.data?.message ||
        'Account not found. Please verify your registered email or employee ID.',
      diagnostic: null
    };
  }

  // Generic message extraction, guaranteed to filter out raw ngrok/infrastructure leaks
  let cleanMsg =
    err.response?.data?.message ||
    err.response?.data?.title ||
    err.response?.data?.error ||
    err.message ||
    fallback;

  if (typeof cleanMsg !== 'string') {
    cleanMsg = fallback;
  }

  // Safety filter in case raw tunnel text is embedded
  if (
    cleanMsg.toLowerCase().includes('ngrok') ||
    cleanMsg.toLowerCase().includes('upstream web service') ||
    cleanMsg.toLowerCase().includes('localhost:5119')
  ) {
    return {
      isOffline: true,
      title: 'Server Temporarily Offline',
      message:
        'The backend server is currently offline or unreachable. Please verify that the server service is started and try again.',
      diagnostic: extractDiagnosticCode(err)
    };
  }

  return {
    isOffline: false,
    title: 'Request Failed',
    message: cleanMsg,
    diagnostic: null
  };
}

/**
 * Pings the server to test if it's back online.
 */
export async function pingServer() {
  const domain = getApiDomain();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${domain}/api/Staff/roles`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    // If it returns a standard HTTP status < 500, the backend server is UP and responding
    if (res.status < 500) {
      return { online: true };
    }
    return { online: false, status: res.status };
  } catch (err) {
    return { online: false, error: err.message };
  }
}
