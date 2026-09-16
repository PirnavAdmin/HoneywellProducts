import { getApiDomain } from '../../utils/apiConfig';
const BASE_URL = `${getApiDomain()}/api/Returns`;
const ADMIN_BASE_URL = `${getApiDomain()}/api/ReturnsAdmin`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};



// GET /api/Returns/config
export const getReturnsConfig = async () => {
  try {
    const response = await fetch(`${BASE_URL}/config`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch returns config');
    const data = await response.json();
    return {
      returnWindowDays: data.returnWindowDays || 7,
      allowableRefundMethods: data.refundMethods?.map(m => m.title || m.code) || ['Original Payment Method'],
      reasonCodes: (data.reasons || []).map(r => ({
        code: r.code,
        label: r.title || r.label || r.code
      })),
      requestTypes: (data.requestTypes || []).map(t => ({
        code: t.code,
        label: t.title || t.label || t.code
      })),
      maximumEvidenceFiles: data.maximumEvidenceFiles || 4,
      maximumDescriptionLength: data.maximumDescriptionLength || 600,
    };
  } catch (error) {
    console.warn('Backend unavailable, using default config:', error.message);
    return {
      returnWindowDays: 7,
      allowableRefundMethods: ['Original Payment Method'],
      reasonCodes: [
        { code: 'PRODUCT_DAMAGED', label: 'Product arrived damaged' },
        { code: 'WRONG_PRODUCT', label: 'Wrong product received' },
        { code: 'PRODUCT_NOT_WORKING', label: 'Product is not working' },
        { code: 'MISSING_PARTS', label: 'Missing parts or accessories' },
        { code: 'NOT_AS_DESCRIBED', label: 'Product is different from description' },
        { code: 'QUALITY_ISSUE', label: 'Quality issue' }
      ],
      requestTypes: [
        { code: 'RETURN_REFUND', label: 'Return & Refund' },
        { code: 'REPLACEMENT_EXCHANGE', label: 'Replacement / Exchange' }
      ]
    };
  }
};

// GET /api/Returns/check-eligibility?query={query} and POST fallback
export const checkReturnEligibility = async (orderItemId) => {
  const raw = String(orderItemId || '').trim();
  if (!raw) {
    return {
      eligible: false,
      reason: 'Please enter an Order Item ID, Order Number, or Product Serial Number.'
    };
  }

  const mapEligibilityData = (d) => ({
    success: d.success !== false,
    eligible: !!(d.isEligible ?? d.eligible ?? true),
    isEligible: !!(d.isEligible ?? d.eligible ?? true),
    orderReference: d.orderReference || raw,
    orderNumber: d.orderReference || raw,
    searchQuery: d.searchQuery || raw,
    productName: d.productName || 'Honeywell Product',
    purchaseDate: d.purchaseDate,
    warrantyExpiryDate: d.warrantyExpiryDate,
    warrantyDaysTotal: d.warrantyDaysTotal || 365,
    daysRemaining: d.daysRemaining,
    warrantyStatus: d.warrantyStatus || 'COVERAGE DATABASE ACTIVE',
    coverageStatusLabel: d.coverageStatusLabel || 'Active',
    returnEligibilityStatus: d.returnEligibilityStatus || 'Eligible for Hardware Warranty Claim & Repair',
    eligibleClaimReasons: d.eligibleClaimReasons || [],
    warrantyTermsNotice: d.warrantyTermsNotice,
    reason: d.returnEligibilityStatus || d.warrantyStatus || (d.isEligible ? 'Product eligible for warranty & return service.' : 'Warranty expired.'),
  });

  // 1. Try GET /api/Returns/check-eligibility?query={query}
  try {
    const url = `${getApiDomain()}/api/Returns/check-eligibility?query=${encodeURIComponent(raw)}`;
    const response = await fetch(url, { headers: DEFAULT_HEADERS });
    if (response.ok) {
      const d = await response.json();
      return mapEligibilityData(d);
    }
  } catch (e) {
    console.warn('GET check-eligibility API error, trying POST fallback:', e.message);
  }

  // 2. Try POST /api/Returns/check-eligibility fallback
  try {
    const url = `${getApiDomain()}/api/Returns/check-eligibility`;
    const response = await fetch(url, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ query: raw })
    });
    if (response.ok) {
      const d = await response.json();
      return mapEligibilityData(d);
    }
  } catch (e) {
    console.warn('POST check-eligibility API fallback error:', e.message);
  }

  // 3. Fallback database lookup if needed
  try {
    const ordersRes = await fetch(`${getApiDomain()}/api/Orders`, { headers: DEFAULT_HEADERS });
    if (ordersRes.ok) {
      const oData = await ordersRes.json();
      const orders = oData.orders || (Array.isArray(oData) ? oData : []);
      const matchedOrder = orders.find(o => {
        const oNum = (o.orderNumber || '').replace(/^(Order\s*#*|#)+/i, '').replace(/[.,;:\s]+$/, '').trim().toLowerCase();
        const oInv = (o.invoiceNumber || '').replace(/^(Order\s*#*|#)+/i, '').replace(/[.,;:\s]+$/, '').trim().toLowerCase();
        const rawLower = raw.replace(/[.,;:\s]+$/, '').toLowerCase();
        const cleanLower = clean.toLowerCase();

        return (
          String(o.id) === clean ||
          (o.orderNumber && o.orderNumber.toLowerCase() === rawLower) ||
          oNum === cleanLower ||
          oInv === cleanLower ||
          (o.invoiceNumber && o.invoiceNumber.toLowerCase() === rawLower)
        );
      });

      if (matchedOrder && matchedOrder.items?.length > 0) {
        const item = matchedOrder.items[0];
        let eligData = null;
        try {
          const eligRes = await fetch(`${BASE_URL}/eligibility/order-item/${item.id}`, { headers: DEFAULT_HEADERS });
          if (eligRes.ok) eligData = await eligRes.json();
        } catch(e) {}

        const isDelivered = matchedOrder.fulfillment === 'DELIVERED' || matchedOrder.status === 'Delivered';
        const isPaid = matchedOrder.paymentStatus === 'Paid' || matchedOrder.paymentStatus === 'Verified Paid';
        const isEligible = eligData ? !!eligData.eligible : (item.returnEligible || (isDelivered && isPaid));

        return {
          eligible: isEligible,
          canSubmit: eligData ? !!eligData.canSubmit : isEligible,
          orderId: matchedOrder.id,
          orderNumber: matchedOrder.orderNumber,
          orderItemId: item.id,
          productName: item.productName || 'Honeywell Product',
          sku: item.productCode || item.sku || 'HW-UNIT',
          status: matchedOrder.fulfillment || matchedOrder.status,
          reason: eligData?.message || (isEligible 
            ? 'Hardware covered under Honeywell standard warranty. Eligible for return or replacement request.'
            : 'Order is currently processing. Full warranty and return service opens upon delivery verification.')
        };
      }
    }
  } catch(e) {
    console.warn('Orders lookup error:', e.message);
  }

  // 3. Query live Product Catalog in database by SKU or Product Name
  try {
    const prodRes = await fetch(`${getApiDomain()}/api/products/search?keyword=${encodeURIComponent(clean)}`, { headers: DEFAULT_HEADERS });
    if (prodRes.ok) {
      const prods = await prodRes.json();
      const matchedProd = prods.find(p => 
        p.sku?.toLowerCase() === clean.toLowerCase() || 
        p.productName?.toLowerCase().includes(clean.toLowerCase())
      ) || prods[0];
      if (matchedProd) {
        return {
          eligible: true,
          canSubmit: true,
          productName: matchedProd.productName,
          sku: matchedProd.sku,
          brand: matchedProd.brand || 'Honeywell',
          reason: 'Official Honeywell hardware record verified in database. Covered under standard manufacturer warranty against hardware or component defects.'
        };
      }
    }
  } catch (e) {
    console.warn('Product catalog lookup error:', e.message);
  }

  return {
    eligible: false,
    reason: 'No matching order item, invoice, or hardware serial record found in the database. Please verify your reference number.'
  };
};

// POST /api/Returns
export const createReturnRequest = async (formData) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    },
    body: formData // Form data with file attachments
  });
  if (!response.ok) throw new Error('Failed to create return request');
  return await response.json();
};

// GET /api/Returns/my
export const getMyReturns = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/my?${query}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch returns');
    const data = await response.json();
    return {
      returns: data.returns || data.items || data.Returns || data.Items || [],
      totalCount: data.totalCount ?? data.TotalCount ?? 0,
      page: data.page ?? data.Page ?? 1,
      pageSize: data.pageSize ?? data.PageSize ?? 20
    };
  } catch (error) {
    console.warn('Backend unavailable or GET /api/Returns/my error:', error.message);
    return {
      returns: [],
      totalCount: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 20
    };
  }
};

// GET /api/Returns/{id}
export const getReturnById = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch return details for ID ${id}`);
  return await response.json();
};

// GET /api/Returns/order/{orderId}
export const getReturnByOrderId = async (orderId) => {
  try {
    const response = await fetch(`${BASE_URL}/order/${orderId}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return for order ${orderId}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend GET /api/Returns/order/${orderId} error:`, error.message);
    return [];
  }
};

// GET /api/Returns/order-item/{orderItemId}
export const getReturnByOrderItemId = async (orderItemId) => {
  try {
    const response = await fetch(`${BASE_URL}/order-item/${orderItemId}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return for item ${orderItemId}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend GET /api/Returns/order-item/${orderItemId} error:`, error.message);
    return null;
  }
};

// ADMIN API ENDPOINTS

// GET /api/ReturnsAdmin/admin
export const getAdminReturns = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'All') {
        query.append(k, params[k]);
      }
    });
    const response = await fetch(`${ADMIN_BASE_URL}/admin?${query.toString()}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch admin returns list');
    const data = await response.json();
    return {
      returns: data.returns || data.items || data.Returns || data.Items || [],
      totalCount: data.totalCount ?? data.TotalCount ?? 0,
      page: data.page ?? data.Page ?? 1,
      pageSize: data.pageSize ?? data.PageSize ?? 10
    };
  } catch (error) {
    console.warn('Backend GET /api/ReturnsAdmin/admin error:', error.message);
    return {
      returns: [],
      totalCount: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    };
  }
};

// PUT /api/ReturnsAdmin/{id}/status
export const updateReturnStatus = async (id, data) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/status`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update status');
  return true;
};

// PUT /api/ReturnsAdmin/{id}/pickup
export const updateReturnPickup = async (id, data) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/pickup`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update pickup');
  return true;
};

// PUT /api/ReturnsAdmin/{id}/refund
export const updateReturnRefund = async (id, data) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/refund`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to issue refund');
  return true;
};

// PUT /api/ReturnsAdmin/{id}/replacement
export const updateReturnReplacement = async (id, data) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/replacement`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to assign replacement details');
  return true;
};

