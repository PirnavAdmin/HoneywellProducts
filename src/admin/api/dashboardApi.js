import { getApiDomain } from '../../utils/apiConfig';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/** === Products Dashboard Metrics === GET /api/products/dashboard */
export const fetchProductsDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/products/dashboard`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Revenue & Orders Analytics Dashboard === GET /api/Reports/orders */
export const fetchReportsOrders = async () => {
  const res = await fetch(`${getApiDomain()}/api/Reports/orders`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Catalog & Inventory Analytics Dashboard === GET /api/Reports/catalog */
export const fetchReportsCatalog = async () => {
  const res = await fetch(`${getApiDomain()}/api/Reports/catalog`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Main Orders Dashboard List & Summary Metrics === GET /api/Orders */
export const fetchMainOrdersDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/Orders`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Stock Ledger & Inventory Dashboard === GET /api/Stock/ledger */
export const fetchStockLedgerDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/Stock/ledger`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === UTR Manual Payment Verifications Dashboard === GET /api/Payment/manual-verifications */
export const fetchPaymentVerificationsDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/Payment/manual-verifications`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Returns & Refunds Admin Dashboard === GET /api/ReturnsAdmin/admin */
export const fetchReturnsAdminDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/ReturnsAdmin/admin`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Support Desk & Tickets Dashboard === GET /api/Tickets */
export const fetchTicketsDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/Tickets`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Customers CRM & Agrarian Dashboard === GET /api/Customers */
export const fetchCustomersDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/Customers`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};

/** === Admin Profile & Dashboard Settings === GET /api/AdminProfile */
export const fetchAdminProfileDashboard = async () => {
  const res = await fetch(`${getApiDomain()}/api/AdminProfile`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return await res.json();
};
