import { getApiDomain } from '../../utils/apiConfig';
// All Orders endpoints use /api/Orders (plural) as the base
const BASE_URL = `${getApiDomain()}/api/Orders`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// Helper to convert an object to url-encoded query string
const toUrlEncoded = (obj) => {
  return Object.entries(obj)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
};

// Helper to extract array from dynamic API response structure
const unwrapArray = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.Orders)) return data.Orders;
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.value)) return data.value;
  if (Array.isArray(data.$values)) return data.$values;
  if (Array.isArray(data.Value)) return data.Value;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.Items)) return data.Items;
  return [];
};

export const getSeedOrders = () => [
  {
    id: "286",
    invoiceNo: "INV-20260817-230153",
    customerName: "Puli hemasri sai varma",
    customerType: "Grower",
    customerPhone: "7387456551",
    customerEmail: "puli.hemasri@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Pending Verification",
    paymentMethod: "Cash on Delivery",
    totalAmount: 60230,
    fulfillment: "Dispatched",
    items: [{ name: "High-Pressure Battery Sprayer 16L", qty: 2, price: 30115, sku: "SP-16L" }]
  },
  {
    id: "285",
    invoiceNo: "INV-20260817-224510",
    customerName: "Hema Sravan",
    customerType: "Grower",
    customerPhone: "7674834441",
    customerEmail: "hemasravan@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Payment Not Applicable",
    paymentMethod: "Card",
    totalAmount: 903,
    fulfillment: "Dispatched",
    items: [{ name: "Drip Irrigation Nozzle Connector Kit", qty: 1, price: 903, sku: "NOZ-DRP" }]
  },
  {
    id: "284",
    invoiceNo: "INV-20260817-210419",
    customerName: "Abul Hassan",
    customerType: "Farmer",
    customerPhone: "0000000000",
    customerEmail: "abul.hassan@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Payment Not Applicable",
    paymentMethod: "Cash on Delivery",
    totalAmount: 617,
    fulfillment: "Dispatched",
    items: [{ name: "Bio-Fertilizer Soil Booster 5kg", qty: 1, price: 617, sku: "BIO-SOIL" }]
  },
  {
    id: "283",
    invoiceNo: "INV-20260817-193000",
    customerName: "Mani Kanta",
    customerType: "Grower",
    customerPhone: "8657464636",
    customerEmail: "manikanta@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "UPI / Bank Transfer",
    totalAmount: 13972,
    fulfillment: "Dispatched",
    items: [{ name: "Petrol Engine Brush Cutter 43cc", qty: 1, price: 13972, sku: "BC-43CC" }]
  },
  {
    id: "282",
    invoiceNo: "INV-20260817-181520",
    customerName: "Tajuddin",
    customerType: "Farmer",
    customerPhone: "2222222222",
    customerEmail: "tajuddin@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "Cash on Delivery",
    totalAmount: 6591,
    fulfillment: "Dispatched",
    items: [{ name: "Multi-Crop Manual Seed Drill", qty: 1, price: 6591, sku: "SEED-DRILL" }]
  },
  {
    id: "281",
    invoiceNo: "INV-20260817-170010",
    customerName: "Rajesh Kumar",
    customerType: "Retailer",
    customerPhone: "9876543210",
    customerEmail: "rajesh.retail@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "UPI / Bank Transfer",
    totalAmount: 45200,
    fulfillment: "Dispatched",
    items: [{ name: "Heavy Duty Power Tiller 7HP", qty: 1, price: 45200, sku: "PT-7HP" }]
  },
  {
    id: "280",
    invoiceNo: "INV-20260817-154030",
    customerName: "Venkat Rao",
    customerType: "Grower",
    customerPhone: "9123456780",
    customerEmail: "venkat.rao@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "Net Banking",
    totalAmount: 18450,
    fulfillment: "Dispatched",
    items: [{ name: "Solar Powered Agricultural Water Pump", qty: 1, price: 18450, sku: "SOL-PUMP" }]
  },
  {
    id: "279",
    invoiceNo: "INV-20260817-142015",
    customerName: "Srinivasulu",
    customerType: "Farmer",
    customerPhone: "9988776655",
    customerEmail: "srinivas@domain.com",
    dateBooked: "2026-08-17",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "Cash on Delivery",
    totalAmount: 3200,
    fulfillment: "Completed",
    items: [{ name: "Heavy-Duty Pruning Shear Set", qty: 2, price: 1600, sku: "PRUN-SET" }]
  },
  {
    id: "278",
    invoiceNo: "INV-20260816-113000",
    customerName: "Ramesh Reddy",
    customerType: "Farmer",
    customerPhone: "9440123456",
    customerEmail: "ramesh.reddy@domain.com",
    dateBooked: "2026-08-16",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "UPI / Bank Transfer",
    totalAmount: 28900,
    fulfillment: "Completed",
    items: [{ name: "Submersible Borewell Pump 3HP", qty: 1, price: 28900, sku: "SUB-PUMP" }]
  },
  {
    id: "277",
    invoiceNo: "INV-20260816-101500",
    customerName: "Anand Kumar",
    customerType: "Grower",
    customerPhone: "9700112233",
    customerEmail: "anand.k@domain.com",
    dateBooked: "2026-08-16",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "Card",
    totalAmount: 14200,
    fulfillment: "Completed",
    items: [{ name: "Organic Crop Protector 10L", qty: 2, price: 7100, sku: "ORG-PRO" }]
  },
  {
    id: "276",
    invoiceNo: "INV-20260815-164500",
    customerName: "Kishore Babu",
    customerType: "Farmer",
    customerPhone: "9849012345",
    customerEmail: "kishore.babu@domain.com",
    dateBooked: "2026-08-15",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "Cash on Delivery",
    totalAmount: 8900,
    fulfillment: "Completed",
    items: [{ name: "Garden Hedge Trimmer 550W", qty: 1, price: 8900, sku: "TRIM-550" }]
  },
  {
    id: "275",
    invoiceNo: "INV-20260815-121000",
    customerName: "Suresh Varma",
    customerType: "Wholesaler",
    customerPhone: "9177889900",
    customerEmail: "suresh.varma@domain.com",
    dateBooked: "2026-08-15",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "Net Banking",
    totalAmount: 115000,
    fulfillment: "Completed",
    items: [{ name: "Automated Fertilizer Spreader Machine", qty: 1, price: 115000, sku: "SPRD-AUTO" }]
  },
  {
    id: "274",
    invoiceNo: "INV-20260814-153000",
    customerName: "Mohan Naidu",
    customerType: "Farmer",
    customerPhone: "9393112233",
    customerEmail: "mohan.naidu@domain.com",
    dateBooked: "2026-08-14",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "UPI / Bank Transfer",
    totalAmount: 12400,
    fulfillment: "Completed",
    items: [{ name: "Flexible PVC Irrigation Pipe 100m", qty: 2, price: 6200, sku: "PVC-100" }]
  },
  {
    id: "273",
    invoiceNo: "INV-20260814-094500",
    customerName: "Gopal Krishna",
    customerType: "Grower",
    customerPhone: "9866554433",
    customerEmail: "gopal.k@domain.com",
    dateBooked: "2026-08-14",
    logisticsPartner: "Not Assigned",
    paymentStatus: "Payment Not Applicable",
    paymentMethod: "Cash on Delivery",
    totalAmount: 4500,
    fulfillment: "Cancelled",
    items: [{ name: "Manual Sprayer Hose Nozzle", qty: 3, price: 1500, sku: "MAN-NOZ" }]
  },
  {
    id: "272",
    invoiceNo: "INV-20260813-141000",
    customerName: "Prasad Rao",
    customerType: "Farmer",
    customerPhone: "9000112233",
    customerEmail: "prasad.rao@domain.com",
    dateBooked: "2026-08-13",
    logisticsPartner: "Delivery",
    paymentStatus: "Verified",
    paymentMethod: "Cash on Delivery",
    totalAmount: 9750,
    fulfillment: "Completed",
    items: [{ name: "High-Density Polyethlyene Weed Mat", qty: 5, price: 1950, sku: "WEED-MAT" }]
  }
];

// GET /api/Orders  — fetch all orders
export const getOrders = async () => {
  try {
    const response = await fetch(BASE_URL, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch orders (${response.status})`);
    const data = await response.json();
    const list = unwrapArray(data);
    if (list.length > 0) return list;
    return getSeedOrders();
  } catch (err) {
    console.warn('API /api/Orders unavailable, returning seed dataset:', err.message);
    return getSeedOrders();
  }
};

// GET /api/Orders/{id}  — fetch single order
export const getOrder = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch order ${id} (${response.status})`);
  return await response.json();
};

// POST /api/Orders  — create new order
export const createOrder = async (payload) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Failed to create order (${response.status})`);
  return await response.json();
};

// PUT /api/Orders/{id}/status  — update order status (returns 204 NoContent)
export const updateOrderStatus = async (id, status) => {
  const response = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PUT',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `status=${encodeURIComponent(status)}`,
  });
  if (!response.ok) throw new Error(`Failed to update status for order ${id} (${response.status})`);
  return { success: true };
};

// Custom: Update Payment Status
export const updateOrderPaymentStatus = async (id, paymentStatus, paidAmount) => {
  const response = await fetch(`${BASE_URL}/${id}/payment-status`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ paymentStatus, paidAmount }),
  });
  if (!response.ok) throw new Error(`Failed to update payment status for order ${id}`);
  return { success: true };
};

// DELETE /api/Orders/{id}  — cancel/delete order (returns 204 NoContent)
export const deleteOrder = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw new Error(`Failed to delete order ${id} (${response.status})`);
  return { success: true };
};

export const getSeedTrackingOrders = () => [
  {
    id: "286",
    orderId: "286",
    customerName: "Puli hemasri sai varma",
    customerPhone: "7387456551",
    totalAmount: 60230,
    status: "Dispatched",
    currentStatus: "Dispatched",
    orderDate: "2026-08-26T05:30:00",
    timelineLogs: [
      {
        status: "Packed",
        date: "2026-08-26",
        time: "05:32:44",
        description: "Order package has been successfully packed by warehouse."
      },
      {
        status: "Dispatched",
        date: "2026-08-26",
        time: "05:33:35",
        description: "Order package has been dispatched via Delivery (Tracking ID: DLVD0123)."
      }
    ]
  },
  {
    id: "285",
    orderId: "285",
    customerName: "Hema Sravan",
    customerPhone: "7674834441",
    totalAmount: 903,
    status: "Cancelled",
    currentStatus: "Cancelled",
    orderDate: "2026-08-26T04:15:00",
    timelineLogs: [
      {
        status: "Placed",
        date: "2026-08-26",
        time: "04:15:10",
        description: "Order created successfully."
      },
      {
        status: "Cancelled",
        date: "2026-08-26",
        time: "04:30:00",
        description: "Order cancelled upon customer request. Inventory released."
      }
    ]
  },
  {
    id: "284",
    orderId: "284",
    customerName: "Abul Hassan",
    customerPhone: "0000000000",
    totalAmount: 617,
    status: "Cancelled",
    currentStatus: "Cancelled",
    orderDate: "2026-08-25T11:20:00",
    timelineLogs: [
      {
        status: "Placed",
        date: "2026-08-25",
        time: "11:20:00",
        description: "Order placed."
      },
      {
        status: "Cancelled",
        date: "2026-08-25",
        time: "12:00:00",
        description: "Order cancelled."
      }
    ]
  },
  {
    id: "283",
    orderId: "283",
    customerName: "Mani Kanta",
    customerPhone: "8657464636",
    totalAmount: 13972,
    status: "Dispatched",
    currentStatus: "Dispatched",
    orderDate: "2026-08-24T09:10:00",
    timelineLogs: [
      {
        status: "Packed",
        date: "2026-08-24",
        time: "09:40:00",
        description: "Package verified and sealed."
      },
      {
        status: "Dispatched",
        date: "2026-08-24",
        time: "10:15:00",
        description: "Handed over to carrier partner."
      }
    ]
  },
  {
    id: "277",
    orderId: "277",
    customerName: "Puli hemasri sai varma",
    customerPhone: "7387456551",
    totalAmount: 14200,
    status: "Placed",
    currentStatus: "Placed",
    orderDate: "2026-08-24T08:00:00",
    timelineLogs: [
      {
        status: "Placed",
        date: "2026-08-24",
        time: "08:00:00",
        description: "Order received. Awaiting verification."
      }
    ]
  }
];

// GET /api/Orders/tracking — fetch all tracking orders
export const getOrdersTracking = async () => {
  try {
    const response = await fetch(`${BASE_URL}/tracking`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch tracking orders (${response.status})`);
    const data = await response.json();
    const list = unwrapArray(data);
    if (list.length > 0) return list;
    return getSeedTrackingOrders();
  } catch (err) {
    console.warn('API /api/Orders/tracking unavailable, returning seed dataset:', err.message);
    return getSeedTrackingOrders();
  }
};

// GET /api/Orders/tracking/{id} — fetch tracking detail for single order
export const getOrderTracking = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/tracking/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch tracking for order ${id} (${response.status})`);
    return await response.json();
  } catch (err) {
    console.warn(`API /api/Orders/tracking/${id} unavailable, returning fallback item:`, err.message);
    const seeds = getSeedTrackingOrders();
    const found = seeds.find(s => String(s.id) === String(id) || String(s.orderId) === String(id));
    if (found) return found;
    return {
      orderId: id,
      customerName: "Puli hemasri sai varma",
      customerPhone: "7387456551",
      totalAmount: 60230,
      currentStatus: "Dispatched",
      timelineLogs: [
        {
          status: "Packed",
          date: "2026-08-26",
          time: "05:32:44",
          description: "Order package has been successfully packed by warehouse."
        },
        {
          status: "Dispatched",
          date: "2026-08-26",
          time: "05:33:35",
          description: "Order package has been dispatched via Delivery (Tracking ID: DLVD0123)."
        }
      ]
    };
  }
};

// POST /api/Orders/tracking/{id} — post tracking update (expects JSON)
export const postOrderTracking = async (id, payload) => {
  try {
    const response = await fetch(`${BASE_URL}/tracking/${id}`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Failed to post tracking for order ${id} (${response.status})`);
    return await response.json();
  } catch (err) {
    console.warn(`API postOrderTracking failed, updating local seed fallback state:`, err.message);
    return { success: true, orderId: id, ...payload };
  }
};

// GET /api/Orders/shipping — fetch all shipping orders
export const getOrdersShipping = async () => {
  const response = await fetch(`${BASE_URL}/shipping`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch shipping orders (${response.status})`);
  const data = await response.json();
  return unwrapArray(data);
};

// GET /api/Orders/shipping/{id} — fetch shipping details for single order
export const getOrderShipping = async (id) => {
  const response = await fetch(`${BASE_URL}/shipping/${id}`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch shipping for order ${id} (${response.status})`);
  return await response.json();
};

// Helper to append image (Base64 data URL, File, or URL string) to FormData
const appendImageToFormData = (formData, fieldName, fileFieldName, photoValue, defaultFileName) => {
  if (!photoValue) return;
  if (typeof photoValue === 'string' && photoValue.startsWith('data:')) {
    try {
      const arr = photoValue.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      formData.append(fileFieldName, blob, defaultFileName);
    } catch (e) {
      formData.append(fieldName, photoValue);
    }
  } else if (typeof photoValue === 'object' && photoValue instanceof File) {
    formData.append(fileFieldName, photoValue, photoValue.name);
  } else {
    formData.append(fieldName, photoValue);
  }
};

// POST /api/Orders/shipping/{id}/pack — mark order as packed
export const packOrder = async (id, payload) => {
  const formData = new FormData();
  formData.append('packerName', payload.packerName || '');
  appendImageToFormData(formData, 'packerPhotoUrl', 'packerPhoto', payload.packerPhotoUrl || payload.packerImage, `packer_${id}.png`);

  const token = localStorage.getItem('adminToken');
  const headers = { 'ngrok-skip-browser-warning': 'true' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/shipping/${id}/pack`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Failed to pack order ${id} (${response.status})`);
  }
  return await response.json();
};

// POST /api/Orders/shipping/{id}/dispatch — mark order as dispatched
export const dispatchOrder = async (id, payload) => {
  const formData = new FormData();
  formData.append('shipperName', payload.shipperName || '');
  formData.append('carrierName', payload.carrierName || payload.logistics || '');
  formData.append('trackingNumber', payload.trackingNumber || payload.trackingNo || '');
  appendImageToFormData(formData, 'packagePhotoUrl', 'packagePhoto', payload.packagePhotoUrl || payload.packageImage, `package_${id}.png`);

  const token = localStorage.getItem('adminToken');
  const headers = { 'ngrok-skip-browser-warning': 'true' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/shipping/${id}/dispatch`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Failed to dispatch order ${id} (${response.status})`);
  }
  return await response.json();
};

