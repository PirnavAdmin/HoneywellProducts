/**
 * Cashfree Payments JavaScript SDK v3 Wrapper (Sandbox Mode)
 *
 * Secure client-side loader for the official Cashfree v3 Web Checkout SDK.
 * Note: Never store Cashfree App ID or Secret Key here. All order sessions are generated
 * strictly by the ASP.NET Core backend.
 */

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

let cashfreeSdkPromise = null;

/**
 * Dynamically loads the official Cashfree JS SDK script if not already present on window.
 * @returns {Promise<Function>} Resolves to window.Cashfree constructor
 */
export function loadCashfreeSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Cashfree SDK can only be loaded in a browser environment.'));
  }

  if (window.Cashfree && typeof window.Cashfree === 'function') {
    return Promise.resolve(window.Cashfree);
  }

  if (cashfreeSdkPromise) {
    return cashfreeSdkPromise;
  }

  cashfreeSdkPromise = new Promise((resolve, reject) => {
    // Check if script tag is already in DOM
    const existingScript = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`);
    if (existingScript) {
      if (window.Cashfree) {
        return resolve(window.Cashfree);
      }
      existingScript.addEventListener('load', () => resolve(window.Cashfree));
      existingScript.addEventListener('error', () => {
        cashfreeSdkPromise = null;
        reject(new Error('Failed to load Cashfree checkout SDK from CDN.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
      } else {
        cashfreeSdkPromise = null;
        reject(new Error('Cashfree SDK loaded but window.Cashfree constructor was not found.'));
      }
    };

    script.onerror = () => {
      cashfreeSdkPromise = null;
      reject(new Error('Failed to load Cashfree checkout SDK. Please verify your internet connection.'));
    };

    document.head.appendChild(script);
  });

  return cashfreeSdkPromise;
}

/**
 * Initializes a Cashfree SDK instance configured for Sandbox mode.
 * @param {string} [mode='sandbox'] - 'sandbox' or 'production'
 * @returns {Promise<object>} Cashfree instance
 */
export async function getCashfreeInstance(mode = 'sandbox') {
  const Cashfree = await loadCashfreeSdk();
  return Cashfree({ mode });
}

/**
 * Triggers Cashfree Checkout modal or redirect using the backend-generated paymentSessionId.
 *
 * @param {object} options
 * @param {string} options.paymentSessionId - Ephemeral session ID returned by POST /api/Payment/cashfree/create-order
 * @param {'_modal'|'_self'} [options.redirectTarget='_modal'] - Modal popup or full-page redirect
 * @param {string} [options.returnUrl] - Optional fallback return URL for 3DS or full redirects
 * @returns {Promise<{
 *   status: 'SUCCESS' | 'CANCELLED' | 'ERROR' | 'REDIRECTED' | 'PENDING',
 *   paymentDetails?: object,
 *   error?: object,
 *   message?: string
 * }>}
 */
export async function launchCashfreeCheckout({
  paymentSessionId,
  redirectTarget = '_modal',
  returnUrl
}) {
  if (!paymentSessionId) {
    throw new Error('paymentSessionId is required to launch Cashfree checkout.');
  }

  const cashfree = await getCashfreeInstance('sandbox');

  return new Promise((resolve) => {
    try {
      const checkoutOptions = {
        paymentSessionId,
        redirectTarget,
      };

      if (returnUrl) {
        checkoutOptions.returnUrl = returnUrl;
      }

      cashfree.checkout(checkoutOptions)
        .then((result) => {
          if (!result) {
            resolve({
              status: 'PENDING',
              message: 'Checkout closed or result pending backend verification.'
            });
            return;
          }

          if (result.error) {
            // User closed popup or checkout encountered an error
            const isDismissed = result.error.code === 'MODAL_CLOSED' ||
                                (result.error.message && result.error.message.toLowerCase().includes('closed'));
            resolve({
              status: isDismissed ? 'CANCELLED' : 'ERROR',
              error: result.error,
              message: result.error.message || (isDismissed ? 'Payment checkout was cancelled.' : 'Cashfree payment error.')
            });
            return;
          }

          if (result.redirect) {
            resolve({
              status: 'REDIRECTED',
              message: 'Redirecting to payment authentication page...'
            });
            return;
          }

          if (result.paymentDetails) {
            resolve({
              status: 'SUCCESS',
              paymentDetails: result.paymentDetails,
              message: 'Payment completed on Cashfree.'
            });
            return;
          }

          resolve({
            status: 'PENDING',
            message: 'Payment submitted. Awaiting verification.'
          });
        })
        .catch((err) => {
          resolve({
            status: 'ERROR',
            error: err,
            message: err?.message || 'Error occurred during Cashfree checkout.'
          });
        });
    } catch (err) {
      resolve({
        status: 'ERROR',
        error: err,
        message: err?.message || 'Failed to initialize Cashfree checkout window.'
      });
    }
  });
}
