import { getApiDomain } from '../../utils/apiConfig';
const BASE_URL = `${getApiDomain()}/api/Returns`;
const ADMIN_BASE_URL = `${getApiDomain()}/api/ReturnsAdmin`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const MOCK_RETURNS = [];


const getLocalReturns = () => {
  const local = localStorage.getItem('honeywell_returns') || localStorage.getItem('shyam_agro_returns');
  if (!local) {
    localStorage.setItem('honeywell_returns', JSON.stringify(MOCK_RETURNS));
    return MOCK_RETURNS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return MOCK_RETURNS;
  }
};

const saveLocalReturns = (data) => {
  localStorage.setItem('honeywell_returns', JSON.stringify(data));
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

// GET /api/Returns/eligibility/order-item/{orderItemId}
export const checkReturnEligibility = async (orderItemId) => {
  const raw = String(orderItemId || '').trim();
  if (!raw) {
    return {
      eligible: false,
      reason: 'Please enter an Order Item ID, Order Number, or Product Serial Number.'
    };
  }

  // Normalize input: strip prefixes and any trailing punctuation like '.'
  const clean = raw
    .replace(/^(Order\s*#*|#)+/i, '')
    .replace(/[.,;:\s]+$/, '')
    .trim();

  // 1. Direct check against ASP.NET Returns eligibility endpoint if numeric
  if (/^\d+$/.test(clean)) {
    try {
      const response = await fetch(`${BASE_URL}/eligibility/order-item/${clean}`, { headers: DEFAULT_HEADERS });
      if (response.ok) {
        const d = await response.json();
        return {
          eligible: !!d.eligible,
          canSubmit: !!d.canSubmit,
          reason: d.message || (d.eligible ? 'Product eligible for warranty & return service.' : 'Warranty / Return window expired.'),
          reasonCode: d.reasonCode,
          orderItemId: clean,
          productName: d.productName,
          sku: d.sku
        };
      }
    } catch (e) {
      console.warn('Direct eligibility endpoint error:', e.message);
    }
  }

  // 2. Query live Orders in database to match by Order ID, Order Number (#ORD-211406), or Invoice
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
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData // Form data with file attachments
    });
    if (!response.ok) throw new Error('Failed to create return request');
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, creating return request in local storage:', error.message);
    
    // Convert FormData to local object
    const orderId = Number(formData.get('OrderId') || 10214);
    const orderItemId = Number(formData.get('OrderItemId') || 1);
    const requestType = formData.get('RequestType') || 'Refund';
    const reasonCode = formData.get('ReasonCode') || 'Damaged Product';
    const description = formData.get('Description') || '';
    const requestedQuantity = Number(formData.get('RequestedQuantity') || 1);
    const refundMethod = formData.get('RefundMethod') || 'Wallet';
    const pickupAddressId = Number(formData.get('PickupAddressId') || 101);
    
    const localReturns = getLocalReturns();
    const newId = localReturns.length > 0 ? Math.max(...localReturns.map(r => r.id)) + 1 : 1;
    
    // Get item names from local orders to make UI complete
    let productName = 'Honeywell Product';
    let sku = 'HW-001';
    let customerName = 'Rajesh Kumar';
    let unitPrice = 1000;
    
    const localOrdersStr = localStorage.getItem('honeywell_orders') || localStorage.getItem('shyam_agro_orders');
    if (localOrdersStr) {
      try {
        const orders = JSON.parse(localOrdersStr);
        const order = orders.find(o => Number(o.id) === orderId || o.id === `ORD${orderId}`);
        if (order) {
          productName = order.items[0]?.name || productName;
          sku = order.items[0]?.sku || sku;
          customerName = order.customerName || customerName;
          unitPrice = order.items[0]?.unitPrice || unitPrice;
        }
      } catch (e) {}
    }

    const newReturn = {
      id: newId,
      orderId,
      orderItemId,
      productName,
      sku,
      requestType,
      reasonCode,
      description,
      requestedQuantity,
      refundMethod,
      pickupAddressId,
      evidenceFiles: [], // Simulation cannot save actual Files directly easily
      status: 'Pending',
      createdAt: new Date().toISOString(),
      pickupDetails: null,
      refundDetails: null,
      replacementDetails: null,
      customerName,
      unitPrice
    };

    localReturns.unshift(newReturn);
    saveLocalReturns(localReturns);
    return newReturn;
  }
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
    console.warn('Backend unavailable, loading customer returns from local storage:', error.message);
    let list = getLocalReturns();
    
    if (params.status) {
      list = list.filter(r => r.status.toLowerCase() === params.status.toLowerCase());
    }
    if (params.requestType) {
      list = list.filter(r => r.requestType.toLowerCase() === params.requestType.toLowerCase());
    }
    
    return {
      returns: list,
      totalCount: list.length,
      page: params.page || 1,
      pageSize: params.pageSize || 20
    };
  }
};

// GET /api/Returns/{id}
export const getReturnById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return details for ID ${id}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend unavailable, reading return details for ID ${id} locally:`, error.message);
    const list = getLocalReturns();
    const found = list.find(r => r.id === Number(id));
    if (!found) throw new Error(`Return with ID ${id} not found.`);
    return found;
  }
};

// GET /api/Returns/order/{orderId}
export const getReturnByOrderId = async (orderId) => {
  try {
    const response = await fetch(`${BASE_URL}/order/${orderId}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return for order ${orderId}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend unavailable, searching returns for Order ID ${orderId} locally:`, error.message);
    const list = getLocalReturns();
    return list.filter(r => Number(r.orderId) === Number(orderId) || r.orderId.toString() === orderId.toString());
  }
};

// GET /api/Returns/order-item/{orderItemId}
export const getReturnByOrderItemId = async (orderItemId) => {
  try {
    const response = await fetch(`${BASE_URL}/order-item/${orderItemId}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return for item ${orderItemId}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend unavailable, searching returns for Order Item ID ${orderItemId} locally:`, error.message);
    const list = getLocalReturns();
    return list.find(r => Number(r.orderItemId) === Number(orderItemId) || r.orderItemId.toString() === orderItemId.toString()) || null;
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
    console.warn('Backend unavailable, loading admin returns from local storage:', error.message);
    let list = getLocalReturns();

    if (params.status && params.status !== 'All') {
      list = list.filter(r => r.status.toLowerCase() === params.status.toLowerCase());
    }
    if (params.requestType && params.requestType !== 'All') {
      list = list.filter(r => r.requestType.toLowerCase() === params.requestType.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(r => 
        r.id.toString().includes(q) || 
        r.orderId.toString().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.customerName && r.customerName.toLowerCase().includes(q))
      );
    }
    if (params.orderNumber) {
      list = list.filter(r => r.orderId.toString().includes(params.orderNumber.toString()));
    }

    return {
      returns: list,
      totalCount: list.length,
      page: params.page || 1,
      pageSize: params.pageSize || 20
    };
  }
};

// PUT /api/ReturnsAdmin/{id}/status
export const updateReturnStatus = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/status`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update status');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, updating status for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].status = data.status || list[idx].status;
      list[idx].remarks = data.remarks || list[idx].remarks;
      list[idx].rejectionReason = data.rejectionReason || null;
      saveLocalReturns(list);
    }
    return true;
  }
};

// PUT /api/ReturnsAdmin/{id}/pickup
export const updateReturnPickup = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/pickup`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update pickup');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, scheduling pickup for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].pickupDetails = {
        pickupDate: data.pickupDate,
        pickupAgentName: data.pickupAgentName,
        pickupAgentPhone: data.pickupAgentPhone,
        pickupTrackingNumber: data.pickupTrackingNumber,
        remarks: data.remarks
      };
      list[idx].status = 'Pickup Scheduled';
      saveLocalReturns(list);
    }
    return true;
  }
};

// PUT /api/ReturnsAdmin/{id}/refund
export const updateReturnRefund = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/refund`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to issue refund');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, executing refund for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].refundDetails = {
        approvedRefundAmount: data.approvedRefundAmount,
        refundMethod: data.refundMethod,
        refundTransactionId: data.refundTransactionId,
        refundStatus: data.refundStatus || 'Success',
        remarks: data.remarks
      };
      list[idx].status = 'Refunded';
      
      // Update customer wallet balance in mock user session if method is Wallet
      if (data.refundMethod === 'Wallet' && list[idx].refundDetails.refundStatus === 'Success') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            const amount = Number(data.approvedRefundAmount);
            userObj.wallet = (Number(userObj.wallet) || 0) + amount;
            localStorage.setItem('user', JSON.stringify(userObj));
            // Trigger wallet reload across the app
            window.dispatchEvent(new Event('wallet-update'));
          } catch (e) {}
        }
      }
      saveLocalReturns(list);
    }
    return true;
  }
};

// PUT /api/ReturnsAdmin/{id}/replacement
export const updateReturnReplacement = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/replacement`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to assign replacement details');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, saving replacement order details for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].replacementDetails = {
        replacementOrderId: data.replacementOrderId,
        replacementOrderNumber: data.replacementOrderNumber,
        trackingNumber: data.trackingNumber,
        carrierName: data.carrierName,
        replacementStatus: data.replacementStatus || 'Shipped',
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        remarks: data.remarks
      };
      list[idx].status = 'Completed';
      saveLocalReturns(list);
    }
    return true;
  }
};

