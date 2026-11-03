/**
 * Cashfree Payments JavaScript SDK Wrapper (Sandbox Mode)
 * Uses official @cashfreepayments/cashfree-js package.
 *
 * Secure client-side wrapper for the official Cashfree Hosted Checkout SDK.
 * Note: Never store Cashfree App ID or Secret Key here. All order sessions are generated
 * strictly by the ASP.NET Core backend.
 */

import { load } from '@cashfreepayments/cashfree-js';

const CASHFREE_SDK_CDN_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

let cashfreeInstancePromise = null;

/**
 * Initializes and caches a Cashfree SDK instance in sandbox mode.
 * @returns {Promise<object>} Cashfree SDK instance
 */
export async function getCashfreeInstance() {
  if (typeof window === 'undefined') {
    throw new Error('Cashfree SDK can only be loaded in a browser environment.');
  }

  if (cashfreeInstancePromise) {
    return cashfreeInstancePromise;
  }

  cashfreeInstancePromise = (async () => {
    try {
      // 1. Primary: load using official @cashfreepayments/cashfree-js package
      const instance = await load({ mode: 'sandbox' });
      if (instance && typeof instance.checkout === 'function') {
        return instance;
      }
    } catch (err) {
      console.warn('Official @cashfreepayments/cashfree-js package load failed, attempting fallback to CDN:', err);
    }

    // 2. Fallback: load directly via CDN script tag
    if (window.Cashfree && typeof window.Cashfree === 'function') {
      return window.Cashfree({ mode: 'sandbox' });
    }

    await new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${CASHFREE_SDK_CDN_URL}"]`);
      if (existingScript) {
        if (window.Cashfree) return resolve();
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK from CDN.')));
        return;
      }

      const script = document.createElement('script');
      script.src = CASHFREE_SDK_CDN_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Cashfree checkout SDK from CDN.'));
      document.head.appendChild(script);
    });

    if (window.Cashfree && typeof window.Cashfree === 'function') {
      return window.Cashfree({ mode: 'sandbox' });
    }

    throw new Error('Cashfree SDK could not be initialized.');
  })();

  return cashfreeInstancePromise;
}

/**
 * Launches Cashfree Hosted Checkout using the backend-generated paymentSessionId.
 * Prefers redirect checkout ('_self') for initial integration as specified.
 *
 * @param {object} options
 * @param {string} options.paymentSessionId - Backend-generated ephemeral session ID
 * @param {'_self'|'_modal'} [options.redirectTarget='_self'] - Hosted checkout mode ('_self' for full-page redirect)
 * @param {string} [options.returnUrl] - Fallback return URL for Cashfree redirect
 * @returns {Promise<{
 *   status: 'SUCCESS' | 'CANCELLED' | 'ERROR' | 'REDIRECTED' | 'PENDING',
 *   paymentDetails?: object,
 *   error?: object,
 *   message?: string
 * }>}
 */
export async function launchCashfreeCheckout({
  paymentSessionId,
  redirectTarget = '_self',
  returnUrl
}) {
  if (!paymentSessionId) {
    throw new Error('paymentSessionId is required to launch Cashfree checkout.');
  }

  const cashfree = await getCashfreeInstance();

  const checkoutOptions = {
    paymentSessionId,
    redirectTarget: redirectTarget === '_modal' ? '_modal' : '_self',
  };

  if (returnUrl) {
    checkoutOptions.returnUrl = returnUrl;
  }

  // In redirect mode ('_self'), the SDK navigates the browser window directly to Cashfree.
  // In modal mode ('_modal'), it returns a Promise.
  if (checkoutOptions.redirectTarget === '_self') {
    return new Promise((resolve) => {
      try {
        const result = cashfree.checkout(checkoutOptions);
        if (result && typeof result.then === 'function') {
          result.then(() => {
            resolve({
              status: 'REDIRECTED',
              message: 'Redirecting to Cashfree Hosted Checkout...'
            });
          }).catch((err) => {
            resolve({
              status: 'ERROR',
              error: err,
              message: err?.message || 'Failed to redirect to Cashfree checkout.'
            });
          });
        } else {
          resolve({
            status: 'REDIRECTED',
            message: 'Redirecting to Cashfree Hosted Checkout...'
          });
        }
      } catch (err) {
        resolve({
          status: 'ERROR',
          error: err,
          message: err?.message || 'Failed to launch Cashfree checkout redirect.'
        });
      }
    });
  }

  // Modal mode fallback
  return new Promise((resolve) => {
    try {
      cashfree.checkout(checkoutOptions)
        .then((result) => {
          if (!result) {
            resolve({ status: 'PENDING', message: 'Checkout closed or awaiting verification.' });
            return;
          }
          if (result.error) {
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
            resolve({ status: 'REDIRECTED', message: 'Redirecting to payment authentication page...' });
            return;
          }
          if (result.paymentDetails) {
            resolve({ status: 'SUCCESS', paymentDetails: result.paymentDetails, message: 'Payment completed on Cashfree.' });
            return;
          }
          resolve({ status: 'PENDING', message: 'Payment submitted. Awaiting verification.' });
        })
        .catch((err) => {
          resolve({ status: 'ERROR', error: err, message: err?.message || 'Error occurred during Cashfree checkout.' });
        });
    } catch (err) {
      resolve({ status: 'ERROR', error: err, message: err?.message || 'Failed to initialize Cashfree checkout window.' });
    }
  });
}
